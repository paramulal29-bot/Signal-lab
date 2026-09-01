import { Activity } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg text-gray-400">
      <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-blue-500">
        <Activity className="h-5 w-5 text-white" />
      </span>
      <p className="text-sm">Loading simulated market data&hellip;</p>
    </div>
  )
}
