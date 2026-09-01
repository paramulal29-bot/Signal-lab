# SignalLab (v2)

SignalLab is a demo crypto market-analysis prototype. It generates BUY /
SELL / WAIT signals from a simple SMA crossover strategy run over
**simulated (mock) historical price data**, records both winning and
losing signals in a local signal-history store, and shows performance
statistics computed from that history.

> **This is an educational demo.** No live market data, no real exchange,
> broker, or wallet connection, no order execution, no real money, and no
> guaranteed-profit claims. "Signal Strength" is a setup-clarity score,
> **not** a win probability. See the in-app Risk Disclosure section for
> details.

## Architecture

The signal engine (`src/core/`) is plain TypeScript with no React in it,
built as a pipeline of swappable, interface-bound pieces:

```
MarketDataProvider (interface)              core/data/MarketDataProvider.ts
   └─ MockMarketDataProvider                 core/data/MockMarketDataProvider.ts
        │  Candle[]
        ▼
Strategy (interface)                        core/strategies/Strategy.ts
   └─ smaCrossoverStrategy                   core/strategies/smaCrossoverStrategy.ts
        │  Signal[]
        ▼
SignalEngine                                core/signals/SignalEngine.ts
        │
        ▼
SignalStore (interface)          PerformanceCalculator
   └─ LocalSignalStore                core/performance/PerformanceCalculator.ts
      (localStorage)
        │                                     │
        └──────────────┬──────────────────────┘
                        ▼
                 React UI (src/App.tsx, src/components/)
```

**Why it's split this way:** `MarketDataProvider` and `SignalStore` are
the two seams meant for later phases. Swapping mock data for a real
crypto market-data API means writing one new class that implements
`MarketDataProvider` — nothing else in the pipeline changes. Swapping
local storage for a real backend means writing one new class that
implements `SignalStore`. `core/engine.ts` is the only file that wires
concrete implementations together (`new MockMarketDataProvider()`,
`new LocalSignalStore()`) — that's the one line phase 3 will change.

```
src/core/
  types.ts                  Signal, SignalRecord, EntryZone, Timeframe, PerformanceSummary...
  config.ts                 DATA_MODE ('SIMULATED' today), supported timeframes
  assets.ts                 The 4 supported assets (BTC, ETH, SOL, BNB)
  indicators.ts              SMA + rolling volatility helpers

  data/
    MarketDataProvider.ts     Interface: getCandles(asset, timeframe)
    MockMarketDataProvider.ts Mock implementation (random-walk candle generator)

  strategies/
    Strategy.ts                Interface: findSignals() + currentSignal()
    smaCrossoverStrategy.ts    The SMA(10/30) crossover strategy

  signals/
    SignalEngine.ts             Runs a Strategy over candles, records results
    SignalStore.ts              Interface: record() / resolve() / list() / clear()
    LocalSignalStore.ts         localStorage-backed implementation (in-memory fallback)

  performance/
    PerformanceCalculator.ts   Win rate, avg win/loss, profit factor, max drawdown

  engine.ts                  Wires the above together: buildMarketData()

src/components/    React UI, grouped by section (layout/market/signals/chart/stats/watchlist/pricing/common)
src/utils/format.ts  Currency/percentage/date formatting helpers
src/App.tsx          Loads market data (async) and composes the dashboard page
```

### The `Signal` and `SignalRecord` types

A `Signal` is what a strategy produces: asset, timeframe, action
(BUY/SELL/WAIT), an entry zone (not a single tick), target, stop,
risk level, a 0-100 signal strength, the strategy's name, a timestamp,
and reasoning text. A `SignalRecord` is a `Signal` that has been written
to a `SignalStore`, with its outcome (`OPEN` / `WIN` / `LOSS`) — both
wins and losses are always recorded, never filtered out of history.

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Other scripts:

```bash
npm run build    # type-check + production build (outputs to dist/)
npm run preview  # preview the production build locally
npm run lint      # run oxlint
```

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Recharts (price chart + sparklines)
- lucide-react (icons)

## What's next

- A `LiveMarketDataProvider` implementing `MarketDataProvider` against a
  real crypto market-data API (the architecture is ready for this; it
  is intentionally not built yet)
- A second strategy (RSI, MACD, ...) implementing `Strategy`
- An API-backed `SignalStore` implementation
- Pro plan / payments (intentionally not built yet)
