import type { AssetMarketData } from '../../core/types'
import { formatUsd } from '../../utils/format'
import { Card } from '../common/Card'
import { RiskBadge } from '../common/RiskBadge'
import { SignalBadge } from '../common/SignalBadge'
import { StrengthMeter } from './StrengthMeter'

export function ActiveSignalsTable({ markets }: { markets: AssetMarketData[] }) {
  return (
    <Card>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-white">Active Signals</h2>
        <p className="text-xs text-gray-500">Signal Strength reflects setup clarity, not a win probability</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-150 text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 pr-3 font-medium">Asset</th>
              <th className="py-2 pr-3 font-medium">Signal</th>
              <th className="py-2 pr-3 font-medium">Entry Zone</th>
              <th className="py-2 pr-3 font-medium">Target</th>
              <th className="py-2 pr-3 font-medium">Stop</th>
              <th className="py-2 pr-3 font-medium">Risk</th>
              <th className="py-2 pr-3 font-medium">Signal Strength</th>
            </tr>
          </thead>
          <tbody>
            {markets.map(({ asset, currentSignal }) => (
              <tr key={asset.symbol} className="border-b border-border/60 last:border-0">
                <td className="py-3 pr-3 font-semibold text-white">{asset.symbol}</td>
                <td className="py-3 pr-3">
                  <SignalBadge action={currentSignal.action} />
                </td>
                <td className="py-3 pr-3 text-gray-300">
                  {formatUsd(currentSignal.entryZone.low)}&ndash;{formatUsd(currentSignal.entryZone.high)}
                </td>
                <td className="py-3 pr-3 text-buy">
                  {currentSignal.target ? formatUsd(currentSignal.target) : '—'}
                </td>
                <td className="py-3 pr-3 text-sell">
                  {currentSignal.stopLoss ? formatUsd(currentSignal.stopLoss) : '—'}
                </td>
                <td className="py-3 pr-3">
                  <RiskBadge level={currentSignal.riskLevel} />
                </td>
                <td className="py-3 pr-3">
                  <StrengthMeter value={currentSignal.strength} label="" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
