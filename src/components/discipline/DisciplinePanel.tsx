import type { DisciplineScore } from '../../core/types'
import { Panel } from '../instrument/Panel'

const VIOLATION_LABEL: Record<string, string> = {
  LATE_ENTRY: 'Late entry',
  OVERSIZED_RISK: 'Oversized risk',
  OVERTRADING: 'Overtrading',
  EARLY_CLOSE: 'Early close',
}

function Bar({ label, value }: { label: string; value: number }) {
  const tone = value >= 85 ? 'bg-long' : value >= 60 ? 'bg-hold' : 'bg-short'
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="label">{label}</span>
        <span className="tabular text-xs text-ink-dim">{value}</span>
      </div>
      <div className="h-1 w-full bg-panel-3">
        <div className={`h-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

/**
 * Discipline is scored on process, never on profit — a trainee can be
 * up on the session and still score badly here, which is the point.
 */
export function DisciplinePanel({ discipline }: { discipline: DisciplineScore }) {
  const tone =
    discipline.overall >= 85 ? 'text-long' : discipline.overall >= 60 ? 'text-hold' : 'text-short'

  return (
    <Panel title="Discipline Score">
      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="text-center md:text-left">
          <p className={`tabular text-4xl font-bold ${tone}`}>{discipline.overall}</p>
          <p className="label mt-1">out of 100</p>
          <p className="mt-2 max-w-45 text-[11px] text-ink-faint">
            Measured on rule-following, not on profit.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Bar label="Risk management" value={discipline.riskManagement} />
          <Bar label="Rule adherence" value={discipline.ruleAdherence} />
          <Bar label="Entry discipline" value={discipline.entryDiscipline} />
          <Bar label="Consistency" value={discipline.consistency} />
        </div>
      </div>

      <div className="mt-5 border-t border-rule pt-4">
        <p className="label mb-1.5">Coach note</p>
        <p className="text-xs leading-relaxed text-ink-dim">{discipline.coachNote}</p>
      </div>

      {discipline.violations.length > 0 && (
        <div className="mt-4 border-t border-rule pt-4">
          <p className="label mb-2">Recorded rule violations</p>
          <ul className="space-y-1.5">
            {discipline.violations.slice(0, 6).map((violation) => (
              <li key={violation.id} className="flex items-start gap-2 text-[11px] text-ink-dim">
                <span className="tabular shrink-0 text-ink-faint">
                  {new Date(violation.timestamp).toISOString().slice(11, 19)}
                </span>
                <span className="shrink-0 font-semibold text-hold">
                  {VIOLATION_LABEL[violation.type] ?? violation.type}
                </span>
                <span>{violation.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}
