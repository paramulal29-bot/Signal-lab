import { ShieldAlert } from 'lucide-react'
import { Panel } from '../instrument/Panel'

const POINTS = [
  'SignalLab is a training simulator. All trading here uses virtual capital that cannot be deposited to, withdrawn from, or converted into anything real.',
  'No exchange, broker, or wallet is connected. SignalLab has read-only access to public market data and cannot place an order, hold funds, or move money.',
  'Signals come from a simple, deterministic moving-average strategy. It does not predict the future, and it produces losing signals regularly — those are recorded and displayed like any other.',
  '"Signal Strength" measures how clearly defined the current setup is. It is not a probability of profit, not a confidence-of-winning score, and not a guarantee of any outcome.',
  'Paper-trading and backtest results describe simulated practice only. Real execution differs — fills can be worse, spreads widen, and real money carries emotional pressure a simulator cannot reproduce.',
  'Nothing here is financial, investment, or trading advice. Cryptocurrency trading carries substantial risk of loss.',
  'Do your own research and consult a licensed financial advisor before risking real money.',
]

export function RiskDisclosure() {
  return (
    <Panel
      title="Risk disclosure"
      id="disclosure"
      className="border-short/30"
      action={<ShieldAlert className="h-4 w-4 text-short" aria-hidden />}
    >
      <ul className="space-y-2 text-xs leading-relaxed text-ink-dim">
        {POINTS.map((point) => (
          <li key={point} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 bg-rule-bright" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
