import type { MarketSnapshot, PaperTrade, PublishedSignal } from '../types'

/**
 * The visible lifecycle of a signal. These phases are DERIVED from real
 * engine state — they never invent a signal to keep the screen busy.
 * SCANNING is a truthful state meaning "the strategy has found nothing",
 * and it is presented as a legitimate outcome, not dead air.
 */
export type SignalPhase =
  | 'OFFLINE'
  | 'SCANNING'
  | 'DETECTED'
  | 'ACTIVE'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'IN_TRADE'
  | 'RESULT'

/** A freshly published signal reads as DETECTED for this long. */
export const DETECTED_WINDOW_MS = 8_000

/** Below this remaining time, the window is closing. */
export const EXPIRING_THRESHOLD_MS = 60_000

export function derivePhase(input: {
  snapshot: MarketSnapshot
  signal: PublishedSignal | undefined
  openTrade: PaperTrade | undefined
  lastClosedTrade: PaperTrade | undefined
  now: number
}): SignalPhase {
  const { snapshot, signal, openTrade, lastClosedTrade, now } = input

  if (snapshot.status === 'OFFLINE') return 'OFFLINE'
  if (openTrade) return 'IN_TRADE'

  if (signal && signal.state === 'ACTIVE' && signal.expiresAt > now) {
    if (now - signal.publishedAt < DETECTED_WINDOW_MS) return 'DETECTED'
    if (signal.expiresAt - now <= EXPIRING_THRESHOLD_MS) return 'EXPIRING'
    return 'ACTIVE'
  }

  // A trade that closed recently takes the stage over a stale expiry.
  if (lastClosedTrade?.closedAt && now - lastClosedTrade.closedAt < 5 * 60_000) return 'RESULT'
  if (signal && (signal.state === 'EXPIRED' || signal.expiresAt <= now)) return 'EXPIRED'

  return 'SCANNING'
}

export interface PhasePresentation {
  /** Short status word shown in the signal header. */
  status: string
  /** One-line explanation of what the system is doing. */
  detail: string
  tone: 'instrument' | 'long' | 'short' | 'hold' | 'dim'
}

export const PHASE_PRESENTATION: Record<SignalPhase, PhasePresentation> = {
  OFFLINE: {
    status: 'SYSTEM OFFLINE',
    detail: 'Live market data unavailable. No signal can be calculated.',
    tone: 'short',
  },
  SCANNING: {
    status: 'MARKET SCANNING',
    detail: 'No valid setup right now. SignalLab is waiting for the next defined condition.',
    tone: 'dim',
  },
  DETECTED: {
    status: 'SETUP DETECTED',
    detail: 'A setup has just been published. Review the conditions before acting.',
    tone: 'instrument',
  },
  ACTIVE: {
    status: 'SIGNAL ACTIVE',
    detail: 'The setup is inside its validity window.',
    tone: 'instrument',
  },
  EXPIRING: {
    status: 'EXPIRING',
    detail: 'The signal window is closing. Do not rush a decision to beat the clock.',
    tone: 'hold',
  },
  EXPIRED: {
    status: 'SIGNAL WINDOW CLOSED',
    detail: 'Do not enter. Wait for a new setup.',
    tone: 'short',
  },
  IN_TRADE: {
    status: 'POSITION OPEN',
    detail: 'A practice position is running against live market prices.',
    tone: 'long',
  },
  RESULT: {
    status: 'TRADE COMPLETE',
    detail: 'Your last practice decision has been recorded.',
    tone: 'instrument',
  },
}

export type NextMoveKey =
  | 'WAIT_FOR_SETUP'
  | 'REVIEW_SIGNAL'
  | 'MANAGE_POSITION'
  | 'REVIEW_DECISION'
  | 'CONTINUE_LEARNING'
  | 'RESTORE_DATA'

export interface NextMove {
  key: NextMoveKey
  title: string
  detail: string
  actionLabel: string
  to: string
}

/**
 * "Your next move" — one unambiguous suggestion for the current state,
 * so the user is never staring at ten competing buttons.
 */
export function deriveNextMove(input: {
  phase: SignalPhase
  academyIncomplete: boolean
}): NextMove {
  switch (input.phase) {
    case 'OFFLINE':
      return {
        key: 'RESTORE_DATA',
        title: 'MARKET DATA UNAVAILABLE',
        detail: 'Practice is paused until a price can be verified. You can switch to simulation.',
        actionLabel: 'VIEW MARKET',
        to: '/arena',
      }
    case 'DETECTED':
    case 'ACTIVE':
    case 'EXPIRING':
      return {
        key: 'REVIEW_SIGNAL',
        title: 'REVIEW SIGNAL CONDITIONS',
        detail: 'A setup is live. Check the entry zone, target and invalidation before deciding.',
        actionLabel: 'VIEW SETUP',
        to: '/arena',
      }
    case 'IN_TRADE':
      return {
        key: 'MANAGE_POSITION',
        title: 'MANAGE POSITION',
        detail: 'A practice position is open. Let your levels do the work.',
        actionLabel: 'OPEN ARENA',
        to: '/arena',
      }
    case 'RESULT':
      return {
        key: 'REVIEW_DECISION',
        title: 'REVIEW DECISION',
        detail: 'Your trade closed. Reviewing it is where the training actually happens.',
        actionLabel: 'REVIEW TRADE',
        to: '/arena',
      }
    default:
      if (input.academyIncomplete) {
        return {
          key: 'CONTINUE_LEARNING',
          title: 'NO SETUP — GOOD TIME TO LEARN',
          detail: 'The strategy is scanning. Use the wait to build your foundation.',
          actionLabel: 'OPEN ACADEMY',
          to: '/academy',
        }
      }
      return {
        key: 'WAIT_FOR_SETUP',
        title: 'WAIT FOR SETUP',
        detail: 'No valid setup right now. Waiting is also a decision.',
        actionLabel: 'VIEW MARKET',
        to: '/arena',
      }
  }
}
