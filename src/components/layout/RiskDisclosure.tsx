import { ShieldAlert } from 'lucide-react'
import { DATA_MODE } from '../../core/config'
import { Card } from '../common/Card'

const POINTS = [
  'SignalLab is a demo project. All market data, prices, and signals shown are simulated / mock data, not live market feeds.',
  'The SMA crossover strategy is a simple educational example. It does not predict future price movement, and past backtest results never guarantee future or real-world performance.',
  '"Signal Strength" measures how clear the strategy’s current setup is. It is not a win probability, not a confidence-of-profit score, and not a guarantee of any outcome.',
  'Performance statistics (win rate, average win/loss, profit factor, drawdown) are computed on simulated/backtested history only, including both winning and losing signals. They describe the past, not the future.',
  'Nothing on this page is financial, investment, or trading advice. Cryptocurrency trading carries substantial risk of loss.',
  'SignalLab does not connect to any real exchange, broker, or wallet, and cannot place trades or move real funds.',
  'Always do your own research and consult a licensed financial advisor before making investment decisions.',
]

export function RiskDisclosure() {
  return (
    <Card className="border-sell/30" id="disclosure">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-sell" />
        <h2 className="text-base font-semibold text-white">Risk Disclosure</h2>
        <span className="ml-auto rounded-full border border-wait/40 bg-wait/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-wait">
          {DATA_MODE}
        </span>
      </div>
      <ul className="space-y-2 text-sm text-gray-400">
        {POINTS.map((point) => (
          <li key={point} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-600" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
