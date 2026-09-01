export function StrengthMeter({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-buy' : value >= 45 ? 'bg-wait' : 'bg-gray-500'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-400">{value}/100</span>
    </div>
  )
}
