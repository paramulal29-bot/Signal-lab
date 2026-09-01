import type { AssetMarketData } from '../../core/types'
import { formatUsd } from '../../utils/format'
import { Card } from '../common/Card'
import { RiskBadge } from '../common/RiskBadge'
import { SignalBadge } from '../common/SignalBadge'
import { StrengthMeter } from './StrengthMeter'

export function SignalCard({ data }: { data: AssetMarketData }) {
  const { asset, latestSignal } = data
  const isWait = latestSignal.action === 'WAIT'

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
        <SignalBadge action={latestSignal.action} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Entry</p>
          <p className="font-semibold text-white">{formatUsd(latestSignal.entryPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Target</p>
          <p className="font-semibold text-buy">
            {latestSignal.target ? formatUsd(latestSignal.target) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Stop / Invalidation</p>
          <p className="font-semibold text-sell">
            {latestSignal.stopLoss ? formatUsd(latestSignal.stopLoss) : '—'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <RiskBadge level={latestSignal.riskLevel} />
        <StrengthMeter value={latestSignal.strength} />
      </div>

      <p className={`text-xs leading-relaxed ${isWait ? 'text-gray-500' : 'text-gray-400'}`}>
        {latestSignal.reasoning}
      </p>
    </Card>
  )
}
