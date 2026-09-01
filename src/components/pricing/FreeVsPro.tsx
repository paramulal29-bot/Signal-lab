import { Check, X } from 'lucide-react'
import { Card } from '../common/Card'

interface PlanFeature {
  label: string
  free: boolean
  pro: boolean
}

const FEATURES: PlanFeature[] = [
  { label: 'BTC, ETH, SOL, BNB market overview', free: true, pro: true },
  { label: 'SMA crossover BUY/SELL/WAIT signals', free: true, pro: true },
  { label: 'Entry, target & stop levels', free: true, pro: true },
  { label: 'Basic signal history (last 10)', free: true, pro: true },
  { label: 'Full signal history & backtest stats', free: false, pro: true },
  { label: 'Unlimited watchlist assets', free: false, pro: true },
  { label: 'Additional strategies (RSI, MACD, ...)', free: false, pro: true },
  { label: 'Priority signal refresh', free: false, pro: true },
]

function FeatureRow({ feature }: { feature: PlanFeature }) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="py-2.5 pr-3 text-sm text-gray-300">{feature.label}</td>
      <td className="py-2.5 text-center">
        {feature.free ? (
          <Check className="mx-auto h-4 w-4 text-buy" />
        ) : (
          <X className="mx-auto h-4 w-4 text-gray-600" />
        )}
      </td>
      <td className="py-2.5 text-center">
        {feature.pro ? (
          <Check className="mx-auto h-4 w-4 text-buy" />
        ) : (
          <X className="mx-auto h-4 w-4 text-gray-600" />
        )}
      </td>
    </tr>
  )
}

export function FreeVsPro() {
  return (
    <Card id="pricing" className="scroll-mt-20">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">Free vs Pro</h2>
        <p className="mt-1 text-xs text-gray-500">
          Payments are not enabled yet in this demo &mdash; Pro is a preview of what's planned next.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-125 text-left">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 pr-3 font-medium">Feature</th>
              <th className="py-2 text-center font-medium">Free</th>
              <th className="py-2 text-center font-medium">Pro</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f) => (
              <FeatureRow key={f.label} feature={f} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface-alt p-4">
          <p className="text-sm font-semibold text-white">Free</p>
          <p className="mt-1 text-2xl font-bold text-white">$0</p>
          <p className="mt-3 text-xs text-gray-500">You're using this plan right now.</p>
        </div>
        <div className="rounded-lg border border-purple-500/40 bg-purple-500/10 p-4">
          <p className="text-sm font-semibold text-white">Pro</p>
          <p className="mt-1 text-2xl font-bold text-white">Coming soon</p>
          <button
            type="button"
            disabled
            title="Payments are not implemented yet"
            className="mt-3 w-full cursor-not-allowed rounded-lg bg-purple-500/40 px-3 py-2 text-sm font-semibold text-white/70"
          >
            Notify me
          </button>
        </div>
      </div>
    </Card>
  )
}
