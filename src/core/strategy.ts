import { rollingVolatility, sma } from './indicators'
import type { AssetSymbol, Candle, RiskLevel, Signal } from './types'

/**
 * The ONE strategy SignalLab v1 implements: a classic SMA crossover.
 *
 *   - Fast SMA above Slow SMA, with enough separation -> BUY  (bullish trend)
 *   - Fast SMA below Slow SMA, with enough separation -> SELL (bearish trend)
 *   - Fast/Slow SMA too close together                -> WAIT (no clear edge)
 *
 * This is intentionally simple. It is a starting point for learning how
 * a signal pipeline fits together, not a strategy anyone should trade
 * real money on.
 */
export const FAST_PERIOD = 10
export const SLOW_PERIOD = 30

/** Below this confidence score, a trend is considered too weak to act on. */
const WEAK_SIGNAL_THRESHOLD = 40

function riskFromVolatility(vol: number | undefined): RiskLevel {
  if (vol === undefined) return 'Medium'
  if (vol < 0.02) return 'Low'
  if (vol < 0.035) return 'Medium'
  return 'High'
}

function strengthFromSeparation(fast: number, slow: number, vol: number | undefined): number {
  const separationPct = Math.abs(fast - slow) / slow
  // Normalize against volatility so a "big" move on a calm asset still
  // reads as strong, and scale into a 0-100 confidence score. Near-zero
  // separation (the two averages sitting on top of each other) should
  // score low, since that's exactly the "no clear trend" case.
  const normalized = separationPct / Math.max(vol ?? 0.02, 0.005)
  const score = normalized * 170
  return Math.round(Math.min(96, Math.max(8, score)))
}

/** Reasoning for a discrete crossover event (used in signal history / chart markers). */
function buildCrossoverReasoning(
  action: 'BUY' | 'SELL',
  fast: number,
  slow: number,
  risk: RiskLevel,
  strength: number,
): string {
  const verb = action === 'BUY' ? 'crossed above' : 'crossed below'
  const bias = action === 'BUY' ? 'bullish' : 'bearish'
  return `Fast SMA(${FAST_PERIOD}) ${verb} Slow SMA(${SLOW_PERIOD}) ($${fast.toFixed(2)} vs $${slow.toFixed(2)}), signaling ${bias} momentum. Strength ${strength}/100 with ${risk.toLowerCase()} volatility.`
}

/** Reasoning for the dashboard's "right now" signal card, which reflects the current trend state. */
function buildCurrentReasoning(
  action: 'BUY' | 'SELL' | 'WAIT',
  fast: number,
  slow: number,
  risk: RiskLevel,
  strength: number,
): string {
  const separationPct = (Math.abs(fast - slow) / slow) * 100
  if (action === 'BUY') {
    return `Fast SMA(${FAST_PERIOD}) is trading ${separationPct.toFixed(2)}% above Slow SMA(${SLOW_PERIOD}), a bullish trend. Confidence ${strength}/100 with ${risk.toLowerCase()} volatility.`
  }
  if (action === 'SELL') {
    return `Fast SMA(${FAST_PERIOD}) is trading ${separationPct.toFixed(2)}% below Slow SMA(${SLOW_PERIOD}), a bearish trend. Confidence ${strength}/100 with ${risk.toLowerCase()} volatility.`
  }
  return `Fast SMA(${FAST_PERIOD}) and Slow SMA(${SLOW_PERIOD}) are only ${separationPct.toFixed(2)}% apart — too close for a confident trend call. Standing by for a clearer setup.`
}

function targetAndStop(
  action: 'BUY' | 'SELL',
  entry: number,
  vol: number | undefined,
): { target: number; stopLoss: number } {
  const v = vol ?? 0.02
  const movePct = Math.min(Math.max(v * 3, 0.03), 0.15)
  const stopPct = movePct * 0.55

  if (action === 'BUY') {
    return { target: entry * (1 + movePct), stopLoss: entry * (1 - stopPct) }
  }
  return { target: entry * (1 - movePct), stopLoss: entry * (1 + stopPct) }
}

/**
 * Runs the SMA crossover strategy over the full candle history and
 * returns every crossover event found, oldest first. Used both to draw
 * BUY/SELL markers on the chart and to feed the backtest engine.
 */
export function computeCrossoverSignals(asset: AssetSymbol, candles: Candle[]): Signal[] {
  const fastSma = sma(candles, FAST_PERIOD)
  const slowSma = sma(candles, SLOW_PERIOD)
  const vol = rollingVolatility(candles, FAST_PERIOD)
  const signals: Signal[] = []

  for (let i = 1; i < candles.length; i++) {
    const prevFast = fastSma[i - 1]
    const prevSlow = slowSma[i - 1]
    const fast = fastSma[i]
    const slow = slowSma[i]
    if (prevFast === undefined || prevSlow === undefined || fast === undefined || slow === undefined) {
      continue
    }

    const crossedUp = prevFast <= prevSlow && fast > slow
    const crossedDown = prevFast >= prevSlow && fast < slow
    if (!crossedUp && !crossedDown) continue

    const action: 'BUY' | 'SELL' = crossedUp ? 'BUY' : 'SELL'
    const entry = candles[i].close
    const risk = riskFromVolatility(vol[i])
    const strength = strengthFromSeparation(fast, slow, vol[i])
    const { target, stopLoss } = targetAndStop(action, entry, vol[i])

    signals.push({
      id: `${asset}-${i}`,
      asset,
      action,
      candleIndex: i,
      timestamp: candles[i].timestamp,
      entryPrice: entry,
      target,
      stopLoss,
      riskLevel: risk,
      strength,
      reasoning: buildCrossoverReasoning(action, fast, slow, risk, strength),
    })
  }

  return signals
}

/**
 * Determines the "current" signal shown on the dashboard. Unlike the
 * discrete crossover events above, this reflects the trend the asset is
 * in *right now*: BUY/SELL if the Fast SMA is clearly on one side of the
 * Slow SMA, or WAIT if the two are too close together to call a trend
 * with any confidence.
 */
export function computeLatestSignal(asset: AssetSymbol, candles: Candle[]): Signal {
  const lastIndex = candles.length - 1
  const fastSma = sma(candles, FAST_PERIOD)
  const slowSma = sma(candles, SLOW_PERIOD)
  const vol = rollingVolatility(candles, FAST_PERIOD)
  const fast = fastSma[lastIndex] ?? candles[lastIndex].close
  const slow = slowSma[lastIndex] ?? candles[lastIndex].close
  const risk = riskFromVolatility(vol[lastIndex])
  const strength = strengthFromSeparation(fast, slow, vol[lastIndex])
  const entry = candles[lastIndex].close

  const trend: 'BUY' | 'SELL' = fast >= slow ? 'BUY' : 'SELL'
  const action = strength < WEAK_SIGNAL_THRESHOLD ? 'WAIT' : trend

  const levels = action === 'WAIT' ? undefined : targetAndStop(action, entry, vol[lastIndex])

  return {
    id: `${asset}-current-${lastIndex}`,
    asset,
    action,
    candleIndex: lastIndex,
    timestamp: candles[lastIndex].timestamp,
    entryPrice: entry,
    target: levels?.target,
    stopLoss: levels?.stopLoss,
    riskLevel: risk,
    strength,
    reasoning: buildCurrentReasoning(action, fast, slow, risk, strength),
  }
}
