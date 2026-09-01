import type { AssetMarketData } from '../../core/types'
import { formatUsd } from '../../utils/format'
import { Card } from '../common/Card'
import { RiskBadge } from '../common/RiskBadge'
import { SignalBadge } from '../common/SignalBadge'
import { StrengthMeter } from './StrengthMeter'

export function SignalCard({ data }: { data: AssetMarketData }) {
  const { asset, currentSignal } = data
  const isWait = currentSignal.action === 'WAIT'

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-black"
            style={{ backgroundColor: asset.color }}
          >
            {asset.symbol.slice(0, 3)}
          </span>
          <span className="font-semibold text-white">{asset.symbol}/USD</span>
        </div>
        <SignalBadge action={currentSignal.action} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Entry Zone</p>
          <p className="font-semibold text-white">
            {formatUsd(currentSignal.entryZone.low)}&ndash;{formatUsd(currentSignal.entryZone.high)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Target</p>
          <p className="font-semibold text-buy">
            {currentSignal.target ? formatUsd(currentSignal.target) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Stop / Invalidation</p>
          <p className="font-semibold text-sell">
            {currentSignal.stopLoss ? formatUsd(currentSignal.stopLoss) : '—'}
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">Risk Level</p>
          <RiskBadge level={currentSignal.riskLevel} />
        </div>
        <StrengthMeter value={currentSignal.strength} />
      </div>

      <p className={`text-xs leading-relaxed ${isWait ? 'text-gray-500' : 'text-gray-400'}`}>
        {currentSignal.reasoning}
      </p>

      <p className="text-[11px] text-gray-600">
        {currentSignal.strategyName} &middot; simulated data
      </p>
    </Card>
  )
}
