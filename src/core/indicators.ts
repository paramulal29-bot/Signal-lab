import type { Candle } from './types'

/**
 * Simple Moving Average. Returns an array the same length as `candles`,
 * with `undefined` for indices before there's enough history to average.
 */
export function sma(candles: Candle[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = []
  let sum = 0

  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close
    if (i >= period) {
      sum -= candles[i - period].close
    }
    result.push(i >= period - 1 ? sum / period : undefined)
  }

  return result
}

/**
 * Rolling standard deviation of daily returns, used as a simple
 * volatility measure to derive a risk level for each signal.
 */
export function rollingVolatility(candles: Candle[], period: number): (number | undefined)[] {
  const returns: number[] = []
  for (let i = 1; i < candles.length; i++) {
    returns.push((candles[i].close - candles[i - 1].close) / candles[i - 1].close)
  }

  const result: (number | undefined)[] = [undefined]
  for (let i = 0; i < returns.length; i++) {
    if (i < period - 1) {
      result.push(undefined)
      continue
    }
    const window = returns.slice(i - period + 1, i + 1)
    const mean = window.reduce((a, b) => a + b, 0) / window.length
    const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length
    result.push(Math.sqrt(variance))
  }

  return result
}
