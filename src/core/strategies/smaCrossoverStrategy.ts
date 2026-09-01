import { rollingVolatility, sma } from '../indicators'
import type { Candle, EntryZone, RiskLevel, Signal } from '../types'
import type { Strategy, StrategyContext } from './Strategy'

/**
 * The ONE strategy SignalLab implements: a classic SMA crossover.
 *
 *   - Fast SMA above Slow SMA, with enough separation -> BUY  (bullish trend)
 *   - Fast SMA below Slow SMA, with enough separation -> SELL (bearish trend)
 *   - Fast/Slow SMA too close together                -> WAIT (no clear edge)
 *
 * This is intentionally simple. It is a starting point for learning how
 * a signal pipeline fits together, not a strategy anyone should trade
 * real money on. The "strength" score below measures how clearly
 * separated the two averages are — it is a setup-clarity score, not a
 * probability of winning.
 */
export const STRATEGY_NAME = 'SMA Crossover (10/30)'
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
  // reads as strong, and scale into a 0-100 setup-clarity score. Near-zero
  // separation (the two averages sitting on top of each other) scores
  // low, since that's exactly the "no clear trend" case.
  const normalized = separationPct / Math.max(vol ?? 0.02, 0.005)
  const score = normalized * 170
  return Math.round(Math.min(96, Math.max(8, score)))
}

/** A realistic price range a trade would be entered in, rather than one exact tick. */
function buildEntryZone(price: number, vol: number | undefined): EntryZone {
  const buffer = price * Math.max(vol ?? 0.02, 0.004) * 0.3
  return { low: price - buffer, high: price + buffer }
}

function buildTargetAndStop(
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

/** Reasoning for a discrete crossover event (chart markers / signal history). */
function buildCrossoverReasoning(
  action: 'BUY' | 'SELL',
  fast: number,
  slow: number,
  risk: RiskLevel,
  strength: number,
): string {
  const verb = action === 'BUY' ? 'crossed above' : 'crossed below'
  const bias = action === 'BUY' ? 'bullish' : 'bearish'
  return `Fast SMA(${FAST_PERIOD}) ${verb} Slow SMA(${SLOW_PERIOD}) ($${fast.toFixed(2)} vs $${slow.toFixed(2)}), signaling ${bias} momentum. Signal strength ${strength}/100 with ${risk.toLowerCase()} volatility. Strength reflects setup clarity, not a win probability.`
}

/** Reasoning for the "right now" signal, which reflects the current trend state. */
function buildCurrentReasoning(
  action: 'BUY' | 'SELL' | 'WAIT',
  fast: number,
  slow: number,
  risk: RiskLevel,
  strength: number,
): string {
  const separationPct = (Math.abs(fast - slow) / slow) * 100
  if (action === 'BUY') {
    return `Fast SMA(${FAST_PERIOD}) is trading ${separationPct.toFixed(2)}% above Slow SMA(${SLOW_PERIOD}), a bullish trend. Signal strength ${strength}/100 with ${risk.toLowerCase()} volatility — a setup-clarity score, not a win probability.`
  }
  if (action === 'SELL') {
    return `Fast SMA(${FAST_PERIOD}) is trading ${separationPct.toFixed(2)}% below Slow SMA(${SLOW_PERIOD}), a bearish trend. Signal strength ${strength}/100 with ${risk.toLowerCase()} volatility — a setup-clarity score, not a win probability.`
  }
  return `Fast SMA(${FAST_PERIOD}) and Slow SMA(${SLOW_PERIOD}) are only ${separationPct.toFixed(2)}% apart — too close for a confident trend call. Standing by for a clearer setup.`
}

function findSignals(candles: Candle[], context: StrategyContext): Signal[] {
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
    const { target, stopLoss } = buildTargetAndStop(action, entry, vol[i])

    signals.push({
      id: `${context.asset.symbol}-${context.timeframe}-${i}`,
      asset: context.asset.symbol,
      timeframe: context.timeframe,
      action,
      candleIndex: i,
      timestamp: candles[i].timestamp,
      entryZone: buildEntryZone(entry, vol[i]),
      target,
      stopLoss,
      riskLevel: risk,
      strength,
      strategyName: STRATEGY_NAME,
      reasoning: buildCrossoverReasoning(action, fast, slow, risk, strength),
      isSimulated: context.isSimulated,
    })
  }

  return signals
}

function currentSignal(candles: Candle[], context: StrategyContext): Signal {
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
  const levels = action === 'WAIT' ? undefined : buildTargetAndStop(action, entry, vol[lastIndex])

  return {
    id: `${context.asset.symbol}-${context.timeframe}-current-${lastIndex}`,
    asset: context.asset.symbol,
    timeframe: context.timeframe,
    action,
    candleIndex: lastIndex,
    timestamp: candles[lastIndex].timestamp,
    entryZone: buildEntryZone(entry, vol[lastIndex]),
    target: levels?.target,
    stopLoss: levels?.stopLoss,
    riskLevel: risk,
    strength,
    strategyName: STRATEGY_NAME,
    reasoning: buildCurrentReasoning(action, fast, slow, risk, strength),
    isSimulated: context.isSimulated,
  }
}

export const smaCrossoverStrategy: Strategy = {
  name: STRATEGY_NAME,
  findSignals,
  currentSignal,
}
