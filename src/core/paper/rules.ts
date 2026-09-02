/**
 * PAPER TRADING EXECUTION MODEL
 * ============================
 *
 * These are the rules the paper engine applies. They are written down
 * here, in one place, because a simulator that hides its assumptions is
 * worthless for learning. Every number below is an ASSUMPTION, not a
 * promise about how a real exchange would fill an order.
 *
 * 1. VIRTUAL CAPITAL
 *    Every trainee starts with $10,000 of virtual money. There are no
 *    deposits, no withdrawals, and no path from this balance to a real
 *    account. It cannot be topped up by paying.
 *
 * 2. ENTRY FILLS
 *    A paper entry fills at the CURRENT LIVE MID PRICE at the moment the
 *    user clicks, adjusted against them by half the spread plus the
 *    slippage assumption. We never fill at the most favorable price in
 *    the entry zone, and we never backdate a fill to a better historical
 *    price. If live data is unavailable, no trade may be opened at all.
 *
 * 3. POSITION SIZING
 *    Size is derived from risk, not from account size:
 *      riskAmount = equity * riskPct
 *      quantity   = riskAmount / |entry - invalidation|
 *    So the distance to invalidation determines how much is bought. A
 *    wider stop means a smaller position, which is the entire point.
 *
 * 4. MAXIMUM RISK
 *    Training limit is 2% of equity per trade. Above that the engine
 *    refuses the trade and explains why. This is a teaching guardrail.
 *
 * 5. COSTS
 *    Taker fee 0.10% per side (entry AND exit), spread 0.02%, slippage
 *    0.05%. Costs are always charged against the trainee, never in their
 *    favor. Real costs vary by venue, size, and volatility.
 *
 * 6. TARGET AND STOP RESOLUTION
 *    Resolution is checked against closed candles after entry.
 *
 *    THE BOTH-TOUCHED RULE: when a single candle's range contains BOTH
 *    the target and the invalidation, the true order of events inside
 *    that candle is unknown from OHLC data alone. We always resolve it
 *    as the STOP being hit first. This is the conservative choice: it
 *    reports the worse outcome for the trainee, so the strategy can
 *    never look better than it was because of an ambiguity we resolved
 *    in our own favor.
 *
 * 7. SIGNAL EXPIRY
 *    A trade opened after its signal expired is still recorded and still
 *    affects the virtual balance — but it is flagged as a LATE_ENTRY
 *    rule violation, counted against the discipline score, and excluded
 *    from the strategy's own performance statistics, because it is not
 *    a trade the strategy told anyone to take.
 *
 * 8. EARLY CLOSE
 *    The user may close an open trade at any time at the current live
 *    price (again adjusted against them). The outcome is recorded as
 *    USER_CLOSED. Repeatedly closing winners early is surfaced by the
 *    discipline engine rather than blocked.
 *
 * 9. ONE POSITION AT A TIME
 *    A trainee may hold one open paper position. This keeps the
 *    accounting legible and discourages scattergun overtrading.
 *
 * 10. NO SHORTING BEYOND THE SIGNAL
 *     SELL signals are modeled as closing/short-side practice trades
 *     with the same arithmetic mirrored. There is no leverage anywhere
 *     in this system.
 */

export const STARTING_CAPITAL = 10_000

/** Taker fee charged per side, as a fraction. */
export const FEE_RATE = 0.001

/** Assumed bid/ask spread, as a fraction of price. Half is charged per side. */
export const SPREAD_RATE = 0.0002

/** Assumed slippage against the trainee, as a fraction of price. */
export const SLIPPAGE_RATE = 0.0005

/** Maximum risk per trade as a fraction of equity, enforced by the engine. */
export const MAX_RISK_PCT = 0.02

/** Default risk suggested to a beginner. */
export const DEFAULT_RISK_PCT = 0.01

/** More than this many trades in this window is flagged as overtrading. */
export const OVERTRADING_LIMIT = 5
export const OVERTRADING_WINDOW_MS = 60 * 60_000

/**
 * Applies spread + slippage against the trainee's side of the trade.
 * Buys fill higher than mid, sells fill lower than mid — never the
 * other way around.
 */
export function applyExecutionCosts(midPrice: number, side: 'BUY' | 'SELL'): number {
  const penalty = midPrice * (SPREAD_RATE / 2 + SLIPPAGE_RATE)
  return side === 'BUY' ? midPrice + penalty : midPrice - penalty
}

/** Fee charged on one side of a trade, in virtual USD. */
export function feeFor(price: number, quantity: number): number {
  return price * quantity * FEE_RATE
}
