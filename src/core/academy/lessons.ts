/**
 * Beginner Academy content. Short, plain-language lessons written for
 * someone who has never seen a candlestick chart. No lesson promises
 * profit, and several exist specifically to lower expectations.
 */

export interface Lesson {
  id: string
  level: number
  title: string
  /** One-line summary shown in the lesson list. */
  summary: string
  /** Short paragraphs — kept small on purpose, no walls of text. */
  body: string[]
  /** Optional concrete example rendered in a highlighted block. */
  example?: string
  keyTakeaway: string
}

export const LESSONS: Lesson[] = [
  {
    id: 'what-is-crypto',
    level: 1,
    title: 'What is cryptocurrency?',
    summary: 'Digital assets that trade 24/7 on public markets.',
    body: [
      'A cryptocurrency is a digital asset recorded on a public ledger rather than issued by a bank or government.',
      'Its price is whatever buyers and sellers currently agree on. Nobody sets it, and nothing guarantees it goes up.',
      'Crypto markets never close. That is convenient and dangerous: there is always a trade available, which is exactly why discipline matters.',
    ],
    keyTakeaway: 'Prices come from supply and demand, not from a promise.',
  },
  {
    id: 'what-is-bitcoin',
    level: 1,
    title: 'What is Bitcoin?',
    summary: 'The largest and most liquid crypto asset — the one we practice on.',
    body: [
      'Bitcoin (BTC) was the first cryptocurrency and is still the most traded.',
      'SignalLab practices on BTC/USDT: the price of one Bitcoin quoted in a US-dollar-pegged token.',
      'We use one market on purpose. Learning one market properly beats watching twenty badly.',
    ],
    keyTakeaway: 'BTC/USDT means "how many dollars for one Bitcoin".',
  },
  {
    id: 'spot-trading',
    level: 1,
    title: 'What is spot trading?',
    summary: 'Buying the asset itself, at today’s price, with no borrowing.',
    body: [
      'Spot trading means buying or selling the actual asset for immediate settlement.',
      'There is no borrowing and no leverage, so a position cannot lose more than it is worth.',
      'SignalLab only models spot practice. No leverage, no futures, no liquidations.',
    ],
    keyTakeaway: 'Spot is the simplest form of trading. Start here.',
  },
  {
    id: 'buy-sell',
    level: 2,
    title: 'What are BUY and SELL?',
    summary: 'The two directions a trade can take.',
    body: [
      'BUY means you expect the price to rise. You profit if you later sell higher than you bought.',
      'SELL means you expect the price to fall, or that you are closing a position you hold.',
      'Neither direction is safer than the other. Being wrong costs the same either way.',
    ],
    keyTakeaway: 'Direction is a decision, not a prediction you can be certain of.',
  },
  {
    id: 'orders',
    level: 2,
    title: 'What is an order?',
    summary: 'The instruction that actually places a trade.',
    body: [
      'An order is the instruction you send to a market: buy this much, at this price or better.',
      'A market order fills immediately at whatever price is available. A limit order waits for your price.',
      'In this simulator, entries fill at the current live price, adjusted slightly against you to reflect real trading costs.',
    ],
    keyTakeaway: 'Your fill price is rarely exactly the price you saw.',
  },
  {
    id: 'entry',
    level: 2,
    title: 'What is an entry?',
    summary: 'The price where a trade begins.',
    body: [
      'The entry is where your position starts. Everything after that is measured from it.',
      'SignalLab publishes an entry ZONE rather than one exact number, because real fills happen across a small range.',
      'If price has already run far past the zone, the setup is gone. Do not chase it.',
    ],
    keyTakeaway: 'A good setup entered at a bad price is a bad trade.',
  },
  {
    id: 'target',
    level: 3,
    title: 'What is a target?',
    summary: 'Where you plan to take profit.',
    body: [
      'The target is the price at which you would close the trade in profit.',
      'Deciding it BEFORE you enter is what stops you from inventing a new plan mid-trade.',
      'Hitting a target is not guaranteed. Most strategies miss their target regularly.',
    ],
    keyTakeaway: 'Decide where you get out before you get in.',
  },
  {
    id: 'invalidation',
    level: 3,
    title: 'What is an invalidation (stop)?',
    summary: 'The price that proves the idea wrong.',
    body: [
      'The invalidation — often called a stop — is the price at which your reason for the trade no longer holds.',
      'It is not a punishment. It is the point where staying in means hoping instead of reasoning.',
      'Moving your stop further away to avoid a loss is the most expensive habit in trading.',
    ],
    keyTakeaway: 'A stop protects your capital from your own optimism.',
  },
  {
    id: 'position-size',
    level: 4,
    title: 'What is position size?',
    summary: 'How much you buy — derived from risk, not from confidence.',
    body: [
      'Position size is how many units you hold. It is the variable you fully control.',
      'SignalLab sizes positions from risk: you choose what percentage of capital you are willing to lose, and the distance to your invalidation determines the quantity.',
      'A wider stop means a SMALLER position, not a bigger risk.',
    ],
    example: 'Equity $10,000 · risk 1% = $100 · stop is $500 away → size = $100 ÷ $500 = 0.2 BTC',
    keyTakeaway: 'Size is calculated, never guessed.',
  },
  {
    id: 'risk',
    level: 4,
    title: 'What is risk?',
    summary: 'The amount you accept losing when you are wrong.',
    body: [
      'Risk is what you lose if the invalidation is hit. You should know that number before entering.',
      'The training limit here is 2% of virtual capital per trade, and 1% is the sensible default.',
      'Small consistent risk is what keeps a run of losses survivable. Every trader gets a run of losses.',
    ],
    keyTakeaway: 'Survive first. Returns are only possible if you are still trading.',
  },
  {
    id: 'candlesticks',
    level: 5,
    title: 'What does a candlestick show?',
    summary: 'Four prices for one slice of time.',
    body: [
      'Each candle covers a fixed period — one hour, in our Practice Arena.',
      'The body spans the open and close. The thin wicks show the highest and lowest prices reached.',
      'A candle tells you the range, not the order events happened in. That ambiguity is why our simulator resolves unclear cases conservatively.',
    ],
    example: 'Open $104,200 · High $104,900 · Low $103,800 · Close $104,700',
    keyTakeaway: 'One candle = open, high, low, close.',
  },
  {
    id: 'volume',
    level: 5,
    title: 'What is volume?',
    summary: 'How much was actually traded.',
    body: [
      'Volume counts how much of the asset changed hands during the candle.',
      'Moves on high volume reflect broader participation; moves on thin volume are easier to reverse.',
      'Volume is context, not a signal by itself.',
    ],
    keyTakeaway: 'Price tells you what happened. Volume hints at how much conviction was behind it.',
  },
  {
    id: 'trend',
    level: 5,
    title: 'What is a trend?',
    summary: 'The market’s prevailing direction over time.',
    body: [
      'An uptrend makes higher highs and higher lows; a downtrend does the opposite.',
      'Much of the time there is no trend at all — the market moves sideways, and most strategies do badly there.',
      'When SignalLab says WAIT, it usually means exactly that: no clear trend to work with.',
    ],
    keyTakeaway: 'No trend is a valid market state. Waiting is also a decision.',
  },
  {
    id: 'how-signals-work',
    level: 6,
    title: 'How SignalLab generates a signal',
    summary: 'A deterministic moving-average rule you can verify yourself.',
    body: [
      'SignalLab compares a fast 10-period moving average against a slow 30-period one on the live 1H candles.',
      'Fast clearly above slow reads as bullish; clearly below reads as bearish; too close together produces WAIT.',
      'There is no AI guessing the future here. The same candles always produce the same signal, and every signal shows its reasoning.',
    ],
    keyTakeaway: 'The rule is fixed and explainable. You can check its work.',
  },
  {
    id: 'signal-strength',
    level: 6,
    title: 'What Signal Strength does NOT mean',
    summary: 'It measures setup clarity — never probability of profit.',
    body: [
      'Signal Strength scores how cleanly separated the moving averages are, scaled by recent volatility.',
      'A score of 90 does NOT mean a 90% chance of winning. No honest system can give you that number.',
      'It tells you how clear the setup is, not how the future will resolve.',
    ],
    keyTakeaway: 'Strength is clarity, not probability.',
  },
  {
    id: 'paper-trading',
    level: 7,
    title: 'How paper trading works here',
    summary: 'Virtual money, real market prices, permanent records.',
    body: [
      'You start with $10,000 of virtual capital. It cannot be deposited to, withdrawn from, or converted to anything real.',
      'Your entries and exits are priced against real market data, with assumed fees, spread, and slippage charged against you.',
      'Every trade is recorded — the losses too. Nothing is deleted to make results look better.',
    ],
    keyTakeaway: 'Virtual money, honest bookkeeping.',
  },
  {
    id: 'paper-vs-real',
    level: 7,
    title: 'Why paper results are not real results',
    summary: 'The most important lesson in this Academy.',
    body: [
      'Paper trading cannot simulate the two hardest parts of trading: your money genuinely being at risk, and the emotions that come with it.',
      'Real fills can be worse than modeled, especially in fast markets. Real spreads widen exactly when you most want out.',
      'Good paper results are a starting point for further study, not evidence that you are ready to risk real money.',
    ],
    keyTakeaway: 'Passing here does not mean you are ready to trade real money.',
  },
]

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export const QUIZ: QuizQuestion[] = [
  {
    id: 'q-expired',
    question: 'What should you do when a signal expires?',
    options: [
      'Enter immediately before the move runs away',
      'Increase your position size to catch up',
      'Wait for a new valid setup',
      'Enter but ignore the invalidation level',
    ],
    correctIndex: 2,
    explanation:
      'An expired setup is no longer valid. The conditions it was based on have moved on. Waiting for a fresh setup is the only correct answer — chasing is how beginners lose capital.',
  },
  {
    id: 'q-strength',
    question: 'A signal shows Signal Strength 88/100. What does that mean?',
    options: [
      'There is an 88% chance the trade wins',
      'The strategy’s setup is clearly defined right now',
      'You should risk 88% of your capital',
      'The trade is guaranteed by SignalLab',
    ],
    correctIndex: 1,
    explanation:
      'Signal Strength measures how clear the setup is — how separated the moving averages are relative to volatility. It is never a probability of profit, and no honest system can give you one.',
  },
  {
    id: 'q-size',
    question: 'Your stop is further away than usual. What happens to your position size?',
    options: [
      'It gets bigger, to make the same profit',
      'It stays the same regardless',
      'It gets smaller, to keep risk constant',
      'You should skip the stop entirely',
    ],
    correctIndex: 2,
    explanation:
      'Risk is held constant, so a wider stop means fewer units. Size is calculated from the distance to invalidation — never from how confident you feel.',
  },
  {
    id: 'q-risk',
    question: 'What is the training risk limit per trade in SignalLab?',
    options: ['2% of virtual capital', '20% of virtual capital', '50% of virtual capital', 'No limit'],
    correctIndex: 0,
    explanation:
      'The engine refuses trades above 2% risk. Small consistent risk is what makes an inevitable losing streak survivable.',
  },
  {
    id: 'q-wait',
    question: 'SignalLab shows "NO VALID SETUP". What is the correct action?',
    options: [
      'Trade anyway using your intuition',
      'Wait — no trade is required',
      'Switch to simulated data until a signal appears',
      'Double the next position to make up for lost time',
    ],
    correctIndex: 1,
    explanation:
      'Waiting is also a decision. The market does not owe you a trade, and forcing one is not a strategy.',
  },
  {
    id: 'q-paper',
    question: 'What do good paper-trading results prove?',
    options: [
      'That you will make money with real money',
      'That the strategy is guaranteed to work',
      'That you followed a process under simulated conditions',
      'That you can safely skip risk management',
    ],
    correctIndex: 2,
    explanation:
      'Paper trading cannot reproduce real financial risk or the emotions attached to it. It measures process, not readiness to risk real money.',
  },
]

/** Correct answers required to unlock the Practice Arena. */
export const PASSING_SCORE = 5
