import { useEffect, useState } from 'react'

/**
 * Ticks once per second toward a target timestamp. One interval per
 * consumer, cleaned up on unmount — no stray timers left running.
 */
export function useCountdown(targetMs: number | undefined): number {
  const [remaining, setRemaining] = useState(() =>
    targetMs === undefined ? 0 : Math.max(0, targetMs - Date.now()),
  )

  useEffect(() => {
    if (targetMs === undefined) {
      setRemaining(0)
      return
    }

    setRemaining(Math.max(0, targetMs - Date.now()))
    const id = setInterval(() => {
      const next = Math.max(0, targetMs - Date.now())
      setRemaining(next)
      if (next === 0) clearInterval(id)
    }, 1000)

    return () => clearInterval(id)
  }, [targetMs])

  return remaining
}

/** Counts UP from a start timestamp — used for open-trade duration. */
export function useElapsed(startMs: number | undefined): number {
  const [elapsed, setElapsed] = useState(() =>
    startMs === undefined ? 0 : Math.max(0, Date.now() - startMs),
  )

  useEffect(() => {
    if (startMs === undefined) {
      setElapsed(0)
      return
    }

    setElapsed(Math.max(0, Date.now() - startMs))
    const id = setInterval(() => setElapsed(Math.max(0, Date.now() - startMs)), 1000)
    return () => clearInterval(id)
  }, [startMs])

  return elapsed
}

/** mm:ss for short spans, hh:mm:ss once it passes an hour. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}
