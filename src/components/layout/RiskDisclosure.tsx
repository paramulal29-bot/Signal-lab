import { ShieldAlert } from 'lucide-react'
import { Card } from '../common/Card'

const POINTS = [
  'SignalLab is a demo project. All market data, prices, and signals shown are simulated / mock data, not live market feeds.',
  'The SMA crossover strategy is a simple educational example. It does not predict future price movement, and past backtest results never guarantee future performance.',
  'Nothing on this page is financial, investment, or trading advice. Cryptocurrency trading carries substantial risk of loss.',
  'SignalLab does not connect to any real exchange or broker and cannot place trades or move real funds.',
  'Always do your own research and consult a licensed financial advisor before making investment decisions.',
]

export function RiskDisclosure() {
  return (
    <Card className="border-sell/30">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-sell" />
        <h2 className="text-base font-semibold text-white">Risk Disclosure</h2>
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
