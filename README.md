# SignalLab (v4)

**Practice the market before you risk your money.**

SignalLab is a crypto trading *education and paper-trading* platform. It runs a
deterministic strategy over public BTC/USDT market data, publishes signals to a
permanent record, and lets you practice following them with virtual capital
while the real market decides the outcome.

> **Training simulator.** No exchange, broker, or wallet is connected. No real
> orders are placed and no real money is involved at any point. "Signal
> Strength" measures setup clarity, **never** probability of profit. Losing
> signals and losing trades are recorded and displayed exactly like winning
> ones.

## Architecture

```
MarketDataProvider                     core/data/
  ├─ LiveMarketDataProvider  ← Binance PUBLIC REST (no API key, read-only)
  └─ MockMarketDataProvider  ← fallback / Simulation Lab
        │  Candle[]
        ▼
MarketDataService            ← polling, backoff, CONNECTING/LIVE/DEGRADED/
        │                      STALE/SIMULATED/OFFLINE state machine
        ▼
Strategy (smaCrossoverStrategy)        core/strategies/
        │  Signal
        ▼
SignalPublisher              ← append-only permanent record; published
        │                      signals are frozen and never rewritten
        ▼
PaperTradingEngine           ← virtual fills, sizing, costs, resolution
        │
        ├─ PaperTradeStore   ← localStorage ledger
        ├─ PerformanceCalculator / PaperPerformance
        └─ DisciplineEngine  ← scores process, not profit
```

**The two seams built for later phases:** `MarketDataProvider` and the stores.
A different data source or a real backend means writing one new class against
an existing interface — nothing downstream changes.

### Routes

| Route | What it is |
|---|---|
| `/` | Home — live ticker, signal stage, market pulse, next move, progression |
| `/academy` | Academy — optional module library + knowledge check (gates nothing) |
| `/arena` | Practice Arena — live chart, signal lifecycle, timers, paper trading |
| `/performance` | Live paper-trading performance + virtual equity curve |
| `/records` | Public, immutable signal record |
| `/simulation` | The earlier multi-asset simulated dashboard, preserved |

## Experience model

Practice is never gated behind the Academy: `PRACTICE NOW` goes straight to the
Arena from anywhere. The signal moves through a visible lifecycle —
SCANNING → SETUP DETECTED → ACTIVE → EXPIRING → EXPIRED → RESULT — derived
entirely from real engine state. `SCANNING` ("no valid setup") is presented as
a legitimate outcome with its own panel and next-scan timer; no signal is ever
fabricated to keep the screen busy.

Progression (`src/core/progression`) awards XP only for **learning and
discipline** — lessons, the knowledge check, reviewing a closed trade, and
following the rules on a trade. There is deliberately no XP for number of
trades, virtual profit, or time on site, and the training streak is kept alive
by any training activity, so nobody is pushed to trade daily to protect a
number.

Motion is used only to report something real: a price flash fires on an actual
tick, the countdown reflects the true window, the scan bar reports the engine
cycling, and meters animate on genuine progress changes. Everything respects
`prefers-reduced-motion`.

## Paper trading rules

The full execution model is documented in `src/core/paper/rules.ts`. Summary:

- **$10,000 virtual capital.** No deposits, withdrawals, or conversion to anything real.
- **Sizing from risk:** `quantity = (equity × risk%) / |entry − invalidation|`. A wider stop means a *smaller* position.
- **Max 2% risk per trade** — the engine refuses anything larger and explains why.
- **Costs always run against you:** 0.10% fee per side, 0.02% spread, 0.05% slippage.
- **Both-touched rule:** if one candle contains both the target and the invalidation, the order of events inside it is unknowable, so it always resolves as the **stop**. The ambiguity is never resolved in the strategy's favor.
- **Late entries** (after signal expiry) still affect your virtual balance but are excluded from strategy statistics and recorded as a rule violation.

## Data integrity

Published signals are frozen at publication (`Object.freeze`), keyed by the
candle that produced them, and republishing the same id is a no-op — a re-run
can never restate a past signal. There is no delete or edit path for a signal
or a trade anywhere in the API or the UI. Every statistic in the app is
computed from stored records; none are hand-written.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm test         # vitest — core logic, incl. edge cases
npm run build    # typecheck + production build
npm run lint     # oxlint
```

## Known limitations

- **One market, one timeframe:** BTC/USDT on 1H, deliberately. The types and
  provider already accept other timeframes.
- **Polling, not streaming:** the feed polls every 20s. A WebSocket stream
  would be the natural upgrade.
- **Browser-local persistence:** signals, trades and progress live in
  `localStorage`, so they are per-browser and not shared between devices.
- **Paper trading is not real trading.** Real fills can be worse, spreads
  widen in fast markets, and no simulator reproduces the pressure of risking
  real money.

## Not implemented (deliberately)

Real-money trading, exchange/broker/wallet connections, deposits, withdrawals,
order execution, leverage, futures, copy trading, payments, subscriptions, and
affiliate links. The architecture leaves room for a live provider, more
strategies, and user accounts — none of which are built yet.
