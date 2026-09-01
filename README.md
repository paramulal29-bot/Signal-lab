# SignalLab (v1)

SignalLab is a demo crypto trading-signals dashboard. It generates BUY /
SELL / WAIT signals from a simple SMA crossover strategy run over
**simulated (mock) historical price data** and shows them in a dashboard,
along with a basic backtest.

> **This is an educational demo.** No live market data, no real exchange
> connection, no real trades, no guaranteed profits, and not financial
> advice. See the in-app Risk Disclosure section for details.

## How it's organized

```
src/
  core/            Signal-generation engine (plain TypeScript, no React)
    types.ts       Shared types: Asset, Candle, Signal, BacktestResult...
    assets.ts      The 4 supported assets (BTC, ETH, SOL, BNB)
    mockData.ts    Generates a realistic-looking mock price history
    indicators.ts  SMA + rolling volatility helpers
    strategy.ts    The SMA crossover strategy -> BUY/SELL/WAIT signals
    backtest.ts    Walks the signal history and scores win/loss trades
    engine.ts      Wires the above into one buildMarketData() call

  components/      React UI, grouped by section
    layout/        Header, footer, disclosure banners
    market/        Market overview cards
    signals/       Signal cards, active-signals table, signal history
    chart/         Price chart with BUY/SELL markers
    stats/         Performance statistics
    watchlist/     Watchlist
    pricing/        Free vs Pro comparison
    common/         Small shared building blocks (Card, badges, ...)

  utils/format.ts  Currency/percentage formatting helpers
  App.tsx          Composes everything into the dashboard page
```

The rule of thumb: **`core/` has no React in it.** It's a small,
readable pipeline — `mock data -> indicators -> strategy -> signals ->
backtest` — that the UI just reads from. If you want to add a new
strategy or swap in real market data later, `core/` is where that goes.

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

- Real (or at least live-refreshed) market data
- More strategies (RSI, MACD, ...) selectable per asset
- Persisting the watchlist and signal history
- Pro plan / payments (intentionally not built yet)
