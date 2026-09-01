import { useEffect, useState } from 'react'
import { Bell, BellOff, Volume2 } from 'lucide-react'
import {
  alertService,
  type AlertSettings,
  type AlertVolume,
  type SignalLabAlert,
} from '../../core/alerts/AlertService'

const SEVERITY_STYLE: Record<SignalLabAlert['severity'], string> = {
  INFO: 'border-instrument/50 text-instrument',
  WARNING: 'border-hold/50 text-hold',
  CRITICAL: 'border-short/50 text-short',
}

/** The stack of recent alerts, rendered as compact instrument notices. */
export function AlertFeed({ alerts }: { alerts: SignalLabAlert[] }) {
  if (alerts.length === 0) return null

  return (
    <ul aria-live="polite" className="space-y-2">
      {alerts.slice(0, 3).map((alert) => (
        <li
          key={alert.id}
          className={`flex items-start gap-2 rounded-sm border bg-panel-1 px-3 py-2 text-[11px] ${SEVERITY_STYLE[alert.severity]}`}
        >
          <span className="font-bold tracking-[0.12em]">{alert.title}</span>
          <span className="text-ink-dim">{alert.body}</span>
          <span className="tabular ml-auto shrink-0 text-ink-faint">
            {new Date(alert.timestamp).toISOString().slice(11, 19)}
          </span>
        </li>
      ))}
    </ul>
  )
}

const VOLUMES: AlertVolume[] = ['LOW', 'MEDIUM', 'HIGH']

/** User controls for sound and browser notifications. Off by default. */
export function AlertSettingsPanel() {
  const [settings, setSettings] = useState<AlertSettings>(() => alertService.getSettings())

  useEffect(() => {
    alertService.updateSettings(settings)
  }, [settings])

  async function toggleBrowser() {
    if (!settings.browserNotificationsEnabled) {
      const granted = await alertService.requestBrowserPermission()
      if (!granted) return
    }
    setSettings((s) => ({ ...s, browserNotificationsEnabled: !s.browserNotificationsEnabled }))
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
        aria-pressed={settings.soundEnabled}
        className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.12em] transition-colors ${
          settings.soundEnabled
            ? 'border-instrument/50 text-instrument'
            : 'border-rule-bright text-ink-faint hover:text-ink-dim'
        }`}
      >
        <Volume2 className="h-3 w-3" aria-hidden />
        SOUND {settings.soundEnabled ? 'ON' : 'OFF'}
      </button>

      <button
        type="button"
        onClick={toggleBrowser}
        aria-pressed={settings.browserNotificationsEnabled}
        className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.12em] transition-colors ${
          settings.browserNotificationsEnabled
            ? 'border-instrument/50 text-instrument'
            : 'border-rule-bright text-ink-faint hover:text-ink-dim'
        }`}
      >
        {settings.browserNotificationsEnabled ? (
          <Bell className="h-3 w-3" aria-hidden />
        ) : (
          <BellOff className="h-3 w-3" aria-hidden />
        )}
        BROWSER ALERTS {settings.browserNotificationsEnabled ? 'ON' : 'OFF'}
      </button>

      <div className="flex items-center gap-1">
        <span className="label">Volume</span>
        {VOLUMES.map((volume) => (
          <button
            key={volume}
            type="button"
            onClick={() => setSettings((s) => ({ ...s, volume }))}
            className={`rounded-sm border px-2 py-1 text-[10px] font-semibold transition-colors ${
              settings.volume === volume
                ? 'border-instrument/50 text-instrument'
                : 'border-rule-bright text-ink-faint hover:text-ink-dim'
            }`}
          >
            {volume}
          </button>
        ))}
      </div>
    </div>
  )
}
