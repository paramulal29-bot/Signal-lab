const SETTINGS_KEY = 'signallab.alert_settings.v1'

export type AlertVolume = 'LOW' | 'MEDIUM' | 'HIGH'

export type AlertKind =
  | 'SIGNAL_ACTIVE'
  | 'SIGNAL_EXPIRING'
  | 'SIGNAL_EXPIRED'
  | 'TARGET_REACHED'
  | 'STOP_REACHED'
  | 'RULE_VIOLATION'
  | 'DATA_PROBLEM'

export interface AlertSettings {
  soundEnabled: boolean
  browserNotificationsEnabled: boolean
  volume: AlertVolume
}

export interface SignalLabAlert {
  id: string
  kind: AlertKind
  title: string
  body: string
  timestamp: number
  /** Whether this alert reports something the trainee must not act on. */
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  soundEnabled: false,
  browserNotificationsEnabled: false,
  volume: 'LOW',
}

const VOLUME_GAIN: Record<AlertVolume, number> = {
  LOW: 0.04,
  MEDIUM: 0.09,
  HIGH: 0.16,
}

export function loadAlertSettings(): AlertSettings {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_ALERT_SETTINGS
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_ALERT_SETTINGS
    return { ...DEFAULT_ALERT_SETTINGS, ...(JSON.parse(raw) as Partial<AlertSettings>) }
  } catch {
    return DEFAULT_ALERT_SETTINGS
  }
}

export function saveAlertSettings(settings: AlertSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Settings will not persist; the session still honors them.
  }
}

/**
 * Emits alerts as visual events, and optionally as a browser
 * notification and a short instrument-style tone.
 *
 * The tone is deliberately a soft two-note chime rather than an alarm:
 * this is a training instrument, not a casino floor. Nothing here is
 * designed to create urgency or push anyone into a trade.
 */
export class AlertService {
  private settings: AlertSettings = loadAlertSettings()
  private audioContext: AudioContext | undefined

  getSettings(): AlertSettings {
    return this.settings
  }

  updateSettings(next: AlertSettings): void {
    this.settings = next
    saveAlertSettings(next)
  }

  /** Asks the browser for notification permission, if the user enabled them. */
  async requestBrowserPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    try {
      return (await Notification.requestPermission()) === 'granted'
    } catch {
      return false
    }
  }

  /** Fires the out-of-page parts of an alert (sound + browser notification). */
  fire(alert: SignalLabAlert): void {
    if (this.settings.soundEnabled) this.playTone(alert.severity)
    if (this.settings.browserNotificationsEnabled) this.showNotification(alert)
  }

  private showNotification(alert: SignalLabAlert): void {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    try {
      new Notification(`SIGNALLAB — ${alert.title}`, { body: alert.body, tag: alert.id })
    } catch {
      // Notification construction can throw on some platforms; ignore.
    }
  }

  private playTone(severity: SignalLabAlert['severity']): void {
    if (typeof window === 'undefined') return
    try {
      this.audioContext ??= new AudioContext()
      const ctx = this.audioContext
      if (ctx.state === 'suspended') void ctx.resume()

      const gain = ctx.createGain()
      gain.gain.value = VOLUME_GAIN[this.settings.volume]
      gain.connect(ctx.destination)

      // Two short sine notes — a descending pair for warnings, ascending
      // for information. Quiet, brief, and non-alarming by design.
      const notes = severity === 'INFO' ? [660, 880] : [880, 620]
      notes.forEach((frequency, index) => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = frequency
        const start = ctx.currentTime + index * 0.14
        const noteGain = ctx.createGain()
        noteGain.gain.setValueAtTime(0.0001, start)
        noteGain.gain.exponentialRampToValueAtTime(1, start + 0.02)
        noteGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12)
        osc.connect(noteGain)
        noteGain.connect(gain)
        osc.start(start)
        osc.stop(start + 0.14)
      })
    } catch {
      // Audio unavailable (autoplay policy, no device) — stay silent.
    }
  }

  dispose(): void {
    void this.audioContext?.close()
    this.audioContext = undefined
  }
}

/** Standard alert copy — concise and professional, never hype. */
export function buildAlert(kind: AlertKind, symbol: string, detail?: string): SignalLabAlert {
  const id = `${kind}-${Date.now()}`
  const timestamp = Date.now()

  switch (kind) {
    case 'SIGNAL_ACTIVE':
      return { id, kind, timestamp, severity: 'INFO', title: 'SIGNAL ACTIVE', body: `${symbol} ${detail ?? ''} setup is active.`.trim() }
    case 'SIGNAL_EXPIRING':
      return { id, kind, timestamp, severity: 'WARNING', title: 'SIGNAL EXPIRING', body: `${symbol} setup expires in ${detail ?? 'under a minute'}.` }
    case 'SIGNAL_EXPIRED':
      return { id, kind, timestamp, severity: 'WARNING', title: 'SIGNAL EXPIRED', body: `${symbol} setup is no longer valid. Do not enter.` }
    case 'TARGET_REACHED':
      return { id, kind, timestamp, severity: 'INFO', title: 'TARGET REACHED', body: `${symbol} paper trade closed at target.` }
    case 'STOP_REACHED':
      return { id, kind, timestamp, severity: 'WARNING', title: 'STOP REACHED', body: `${symbol} paper trade closed at invalidation. Loss recorded.` }
    case 'RULE_VIOLATION':
      return { id, kind, timestamp, severity: 'CRITICAL', title: 'RULE VIOLATION', body: detail ?? 'A training rule was broken.' }
    case 'DATA_PROBLEM':
      return { id, kind, timestamp, severity: 'CRITICAL', title: 'MARKET DATA', body: detail ?? 'Live market data is unavailable.' }
  }
}

export const alertService = new AlertService()
