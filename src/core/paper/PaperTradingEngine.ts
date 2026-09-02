import type {
  Candle,
  DataMode,
  PaperTrade,
  PaperTradeOutcome,
  PublishedSignal,
} from '../types'
import {
  applyExecutionCosts,
  feeFor,
  MAX_RISK_PCT,
  STARTING_CAPITAL,
} from './rules'

export interface OpenTradeRequest {
  signal: PublishedSignal
  /** Live mid price at the moment of the click. */
  marketPrice: number
  /** Fraction of equity to risk, e.g. 0.01 for 1%. */
  riskPct: number
  equity: number
  dataMode: DataMode
  now?: number
}

export type OpenTradeResult =
  | { ok: true; trade: PaperTrade }
  | { ok: false; reason: string; code: OpenTradeErrorCode }

export type OpenTradeErrorCode =
  | 'NO_ACTIONABLE_SIGNAL'
  | 'RISK_LIMIT_EXCEEDED'
  | 'INVALID_LEVELS'
  | 'NO_MARKET_PRICE'
  | 'POSITION_ALREADY_OPEN'

/**
 * The paper-trading engine. Pure functions over explicit inputs — it
 * holds no state itself, so every outcome it produces is reproducible
 * and testable. See rules.ts for the documented execution model.
 */
export class PaperTradingEngine {
  /**
   * Opens a virtual position against a published signal. Refuses (rather
   * than silently adjusting) when the request breaks a training rule.
   */
  openTrade(request: OpenTradeRequest, hasOpenPosition: boolean): OpenTradeResult {
    const { signal, marketPrice, riskPct, equity, dataMode } = request
    const now = request.now ?? Date.now()

    if (hasOpenPosition) {
      return {
        ok: false,
        code: 'POSITION_ALREADY_OPEN',
        reason: 'You already have an open practice position. Close it before opening another.',
      }
    }

    if (signal.action === 'WAIT' || signal.target === undefined || signal.stopLoss === undefined) {
      return {
        ok: false,
        code: 'NO_ACTIONABLE_SIGNAL',
        reason: 'There is no actionable setup. Waiting is also a decision.',
      }
    }

    if (!Number.isFinite(marketPrice) || marketPrice <= 0) {
      return {
        ok: false,
        code: 'NO_MARKET_PRICE',
        reason: 'We can not verify the current market price, so no position was opened.',
      }
    }

    if (riskPct > MAX_RISK_PCT) {
      return {
        ok: false,
        code: 'RISK_LIMIT_EXCEEDED',
        reason: `Your selected risk is above the ${(MAX_RISK_PCT * 100).toFixed(0)}% training limit. Reduce your position size.`,
      }
    }

    const direction = signal.action
    const entryPrice = applyExecutionCosts(marketPrice, direction)
    const riskPerUnit = Math.abs(entryPrice - signal.stopLoss)

    if (riskPerUnit <= 0) {
      return {
        ok: false,
        code: 'INVALID_LEVELS',
        reason: 'The invalidation level is not usable at the current price, so no position was opened.',
      }
    }

    const riskAmount = equity * riskPct
    const quantity = riskAmount / riskPerUnit
    const entryFee = feeFor(entryPrice, quantity)

    const trade: PaperTrade = {
      id: `trade-${signal.id}-${now}`,
      signalId: signal.id,
      symbol: signal.asset,
      direction,
      status: 'OPEN',
      quantity,
      entryPrice,
      entryMidPrice: marketPrice,
      target: signal.target,
      invalidation: signal.stopLoss,
      openedAt: now,
      feesPaid: entryFee,
      maxFavorablePrice: marketPrice,
      maxAdversePrice: marketPrice,
      riskPctAtEntry: riskPct,
      enteredAfterExpiry: now > signal.expiresAt,
      dataMode,
    }

    return { ok: true, trade }
  }

  /**
   * Updates the running MFE/MAE extremes of an open trade from the
   * latest price. Returns a new trade object; never mutates the input.
   */
  trackPrice(trade: PaperTrade, price: number): PaperTrade {
    if (trade.status !== 'OPEN' || !Number.isFinite(price)) return trade

    const isLong = trade.direction === 'BUY'
    const favorable = isLong
      ? Math.max(trade.maxFavorablePrice, price)
      : Math.min(trade.maxFavorablePrice, price)
    const adverse = isLong
      ? Math.min(trade.maxAdversePrice, price)
      : Math.max(trade.maxAdversePrice, price)

    if (favorable === trade.maxFavorablePrice && adverse === trade.maxAdversePrice) return trade
    return { ...trade, maxFavorablePrice: favorable, maxAdversePrice: adverse }
  }

  /**
   * Checks whether closed candles after entry resolved the trade.
   *
   * THE BOTH-TOUCHED RULE: if one candle contains both the target and
   * the invalidation, we resolve it as the STOP. The order inside a
   * candle is unknowable from OHLC, and we always take the outcome that
   * is worse for the trainee rather than the one that flatters the
   * strategy. See rules.ts §6.
   */
  resolveAgainstCandles(trade: PaperTrade, candles: Candle[]): PaperTrade {
    if (trade.status !== 'OPEN') return trade
    const isLong = trade.direction === 'BUY'

    for (const candle of candles) {
      if (candle.timestamp <= trade.openedAt) continue

      const hitTarget = isLong ? candle.high >= trade.target : candle.low <= trade.target
      const hitStop = isLong ? candle.low <= trade.invalidation : candle.high >= trade.invalidation

      if (hitStop) {
        return this.closeTrade(trade, trade.invalidation, 'STOP_HIT', candle.timestamp)
      }
      if (hitTarget) {
        return this.closeTrade(trade, trade.target, 'TARGET_HIT', candle.timestamp)
      }
    }

    return trade
  }

  /**
   * Closes a trade at `exitMidPrice`, applying exit costs against the
   * trainee. Used for user-initiated closes; target/stop resolution
   * closes at the exact level instead.
   */
  closeAtMarket(trade: PaperTrade, exitMidPrice: number, now = Date.now()): PaperTrade {
    const exitSide = trade.direction === 'BUY' ? 'SELL' : 'BUY'
    const exitPrice = applyExecutionCosts(exitMidPrice, exitSide)
    return this.closeTrade(trade, exitPrice, 'USER_CLOSED', now)
  }

  private closeTrade(
    trade: PaperTrade,
    exitPrice: number,
    outcome: PaperTradeOutcome,
    closedAt: number,
  ): PaperTrade {
    const exitFee = feeFor(exitPrice, trade.quantity)
    const feesPaid = trade.feesPaid + exitFee

    const gross =
      trade.direction === 'BUY'
        ? (exitPrice - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - exitPrice) * trade.quantity

    const realizedPnl = gross - exitFee
    const notional = trade.entryPrice * trade.quantity

    return {
      ...trade,
      status: 'CLOSED',
      exitPrice,
      outcome,
      closedAt,
      feesPaid,
      realizedPnl,
      realizedReturnPct: notional > 0 ? (realizedPnl / notional) * 100 : 0,
    }
  }

  /** Unrealized P/L of an open trade at the given price, net of the entry fee. */
  unrealizedPnl(trade: PaperTrade, price: number): number {
    if (trade.status !== 'OPEN' || !Number.isFinite(price)) return 0
    const gross =
      trade.direction === 'BUY'
        ? (price - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - price) * trade.quantity
    return gross
  }

  /** Balance = starting capital + every realized P/L recorded so far. */
  balanceFrom(trades: PaperTrade[]): number {
    return trades.reduce(
      (balance, trade) => balance + (trade.realizedPnl ?? 0),
      STARTING_CAPITAL,
    )
  }

  /** Maximum favorable / adverse excursion in percent, for the trade review. */
  excursions(trade: PaperTrade): { mfePct: number; maePct: number } {
    const isLong = trade.direction === 'BUY'
    const mfe = isLong
      ? (trade.maxFavorablePrice - trade.entryPrice) / trade.entryPrice
      : (trade.entryPrice - trade.maxFavorablePrice) / trade.entryPrice
    const mae = isLong
      ? (trade.maxAdversePrice - trade.entryPrice) / trade.entryPrice
      : (trade.entryPrice - trade.maxAdversePrice) / trade.entryPrice

    return { mfePct: mfe * 100, maePct: mae * 100 }
  }
}

export const paperTradingEngine = new PaperTradingEngine()
