import { useEffect, useRef, useState } from 'react'

/**
 * Eases a displayed number toward a target when the underlying value
 * genuinely changes. Used for XP and balance transitions — never to
 * animate a value that did not actually move.
 */
export function useAnimatedNumber(target: number, durationMs = 600): number {
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      fromRef.current = target
      setDisplay(target)
      return
    }

    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      // easeOutCubic
      const eased = 1 - (1 - t) ** 3
      setDisplay(from + (target - from) * eased)
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = target
      }
    }

    frameRef.current = requestAnimationFrame(step)
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current)
      fromRef.current = target
    }
  }, [target, durationMs])

  return display
}

/**
 * Reports the direction of the most recent change to a value, so a
 * readout can flash green/red on a real tick. Returns undefined until
 * the value actually moves.
 */
export function useTickDirection(value: number | undefined): 'up' | 'down' | undefined {
  const [direction, setDirection] = useState<'up' | 'down' | undefined>(undefined)
  const previous = useRef<number | undefined>(value)

  useEffect(() => {
    if (value === undefined) return
    const prior = previous.current
    previous.current = value
    if (prior === undefined || prior === value) return

    setDirection(value > prior ? 'up' : 'down')
    const id = setTimeout(() => setDirection(undefined), 900)
    return () => clearTimeout(id)
  }, [value])

  return direction
}
