import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  FlaskConical,
  LineChart,
  Radar,
  Shield,
  Zap,
} from 'lucide-react'
import { PASSING_SCORE, QUIZ, type Lesson } from '../core/academy/lessons'
import {
  estimatedMinutes,
  lessonsFor,
  moduleProgress,
  MODULES,
  type AcademyModule,
} from '../core/academy/modules'
import {
  LEVEL_NAMES,
  loadProgress,
  markLessonComplete,
  recordQuizResult,
  saveProgress,
  type AcademyProgress,
} from '../core/academy/progress'
import { LESSONS } from '../core/academy/lessons'
import { useArena } from '../hooks/useArena'

const ICONS = {
  markets: LineChart,
  discipline: Shield,
  signals: Radar,
  simulation: FlaskConical,
} as const

const TIER_STYLE: Record<AcademyModule['tier'], string> = {
  BEGINNER: 'border-long/40 text-long',
  INTERMEDIATE: 'border-instrument/40 text-instrument',
  ADVANCED: 'border-hold/40 text-hold',
}

export function AcademyPage() {
  const { grantXp } = useArena()
  const [progress, setProgress] = useState<AcademyProgress>(() => loadProgress())
  const [openModuleId, setOpenModuleId] = useState<string | undefined>()
  const [activeLesson, setActiveLesson] = useState<Lesson | undefined>()
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  const openModule = MODULES.find((m) => m.id === openModuleId)
  const completedCount = progress.completedLessonIds.length

  function update(next: AcademyProgress) {
    setProgress(next)
    saveProgress(next)
  }

  function completeLesson(lesson: Lesson) {
    update(markLessonComplete(progress, lesson.id))
    grantXp('LESSON_COMPLETED', `lesson-${lesson.id}`)
    setActiveLesson(undefined)
  }

  const quizScore = QUIZ.reduce((s, q) => s + (quizAnswers[q.id] === q.correctIndex ? 1 : 0), 0)

  function submitQuiz() {
    setQuizSubmitted(true)
    update(recordQuizResult(progress, quizScore))
    if (quizScore >= PASSING_SCORE) grantXp('KNOWLEDGE_CHECK_PASSED', 'knowledge-check')
  }

  /* ---------------- lesson reader ---------------- */
  if (activeLesson) {
    const done = progress.completedLessonIds.includes(activeLesson.id)
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => setActiveLesson(undefined)}
          className="btn mb-6 flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-ink-faint hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> BACK TO MODULE
        </button>

        <article className="surface rise-in rounded-sm p-6">
          <p className="label">Lesson</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">{activeLesson.title}</h1>
          <p className="mt-2 text-sm text-ink-dim">{activeLesson.summary}</p>

          <div className="mt-6 space-y-4">
            {activeLesson.body.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-ink">
                {paragraph}
              </p>
            ))}
          </div>

          {activeLesson.example && (
            <p className="tabular mt-5 border border-rule-bright bg-panel-2 p-3 text-xs text-instrument">
              {activeLesson.example}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5">
            <p className="max-w-md text-xs text-ink-dim">
              <span className="label mr-2">Key takeaway</span>
              {activeLesson.keyTakeaway}
            </p>
            <button
              type="button"
              onClick={() => completeLesson(activeLesson)}
              className="btn flex items-center gap-1.5 border border-instrument/50 bg-instrument/15 px-4 py-2 text-[11px] font-bold tracking-[0.14em] text-instrument hover:bg-instrument/25"
            >
              {done ? 'DONE' : 'MARK COMPLETE +40 XP'}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </article>
      </div>
    )
  }

  /* ---------------- module detail ---------------- */
  if (openModule) {
    const lessons = lessonsFor(openModule)
    const stats = moduleProgress(openModule, progress.completedLessonIds)

    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => setOpenModuleId(undefined)}
          className="btn mb-6 flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-ink-faint hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> ALL MODULES
        </button>

        <header className="mb-6">
          <span
            className={`inline-block border px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] ${TIER_STYLE[openModule.tier]}`}
          >
            {openModule.tier}
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">{openModule.title}</h1>
          <p className="mt-2 text-sm text-ink-dim">{openModule.summary}</p>
          <p className="tabular mt-3 text-[11px] text-ink-faint">
            {stats.done} / {stats.total} lessons · ~{estimatedMinutes(openModule)} min
          </p>
        </header>

        <ol className="space-y-2">
          {lessons.map((lesson, index) => {
            const done = progress.completedLessonIds.includes(lesson.id)
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => setActiveLesson(lesson)}
                  className="btn flex w-full items-center gap-4 border border-rule bg-panel-1 p-4 text-left hover:border-rule-bright hover:bg-panel-2"
                >
                  <span className="tabular text-sm text-ink-faint">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-ink">{lesson.title}</span>
                    <span className="mt-0.5 block text-[11px] text-ink-dim">{lesson.summary}</span>
                  </span>
                  {done ? (
                    <Check className="h-4 w-4 shrink-0 text-long" aria-label="completed" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  /* ---------------- library ---------------- */
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="relative mb-8 overflow-hidden border-b border-rule pb-8">
        <div className="grid-backdrop absolute inset-0" aria-hidden />
        <div className="relative">
          <p className="label">Academy</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            BUILD YOUR TRADING FOUNDATION
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-dim">
            Learn at your own pace. Nothing here is required — you can practice in the Arena right
            now and come back when a concept trips you up.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-5">
            <div className="min-w-50">
              <div className="mb-1.5 flex items-baseline justify-between gap-6">
                <span className="label">Academy progress</span>
                <span className="tabular text-[11px] text-ink-dim">
                  {completedCount} / {LESSONS.length} lessons
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden bg-panel-3">
                <div
                  className="meter-fill h-full bg-instrument"
                  style={{ width: `${(completedCount / LESSONS.length) * 100}%` }}
                />
              </div>
            </div>
            <span className="tabular text-[11px] text-ink-faint">
              LEVEL {progress.level} · {LEVEL_NAMES[progress.level - 1]}
            </span>
            <Link
              to="/arena"
              className="btn flex items-center gap-2 border border-long/50 bg-long/15 px-4 py-2 text-[11px] font-bold tracking-[0.14em] text-long hover:bg-long/25"
            >
              <Zap className="h-3.5 w-3.5" aria-hidden />
              SKIP TO PRACTICE
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((module) => {
          const Icon = ICONS[module.icon]
          const stats = moduleProgress(module, progress.completedLessonIds)
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => setOpenModuleId(module.id)}
              className="btn surface group rounded-sm p-5 text-left hover:border-rule-bright"
            >
              <div className="flex items-start justify-between gap-4">
                <Icon className="h-6 w-6 text-instrument" aria-hidden />
                <span
                  className={`border px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] ${TIER_STYLE[module.tier]}`}
                >
                  {module.tier}
                </span>
              </div>

              <h2 className="mt-4 text-lg font-bold tracking-tight text-ink">{module.title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-dim">{module.summary}</p>

              <div className="mt-5">
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="tabular text-[11px] text-ink-faint">
                    {stats.done} / {stats.total} lessons
                  </span>
                  <span className="tabular text-[11px] text-ink-faint">
                    ~{estimatedMinutes(module)} min
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden bg-panel-3">
                  <div
                    className="meter-fill h-full bg-instrument"
                    style={{ width: `${stats.pct}%` }}
                  />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Knowledge check — optional, and clearly framed as such. */}
      <section className="surface mt-6 rounded-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-instrument" aria-hidden />
              <h2 className="text-sm font-bold tracking-[0.14em] text-ink">KNOWLEDGE CHECK</h2>
              {progress.quizPassed && (
                <span className="border border-long/40 px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] text-long">
                  PASSED
                </span>
              )}
            </div>
            <p className="mt-1.5 max-w-xl text-xs text-ink-dim">
              Six questions to check the fundamentals. Optional — it unlocks nothing and blocks
              nothing, but passing it is worth 150 XP and tells you what to revisit.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setQuizOpen((v) => !v)}
            className="btn border border-instrument/50 bg-instrument/15 px-4 py-2 text-[11px] font-bold tracking-[0.14em] text-instrument hover:bg-instrument/25"
          >
            {quizOpen ? 'HIDE' : progress.quizPassed ? 'RETAKE' : 'START CHECK'}
          </button>
        </div>

        {quizOpen && (
          <div className="rise-in mt-6 border-t border-rule pt-5">
            <ol className="space-y-5">
              {QUIZ.map((question, qIndex) => (
                <li key={question.id}>
                  <p className="mb-2 text-sm text-ink">
                    <span className="tabular mr-2 text-ink-faint">{qIndex + 1}.</span>
                    {question.question}
                  </p>
                  <div className="space-y-1.5">
                    {question.options.map((option, index) => {
                      const selected = quizAnswers[question.id] === index
                      const correct = index === question.correctIndex
                      let className = 'border-rule-bright text-ink-dim hover:text-ink'
                      if (quizSubmitted && correct) className = 'border-long/50 bg-long/10 text-long'
                      else if (quizSubmitted && selected) className = 'border-short/50 bg-short/10 text-short'
                      else if (selected) className = 'border-instrument/50 bg-instrument/10 text-instrument'

                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={quizSubmitted}
                          onClick={() =>
                            setQuizAnswers((prev) => ({ ...prev, [question.id]: index }))
                          }
                          className={`btn block w-full border px-3 py-2 text-left text-xs disabled:cursor-default ${className}`}
                        >
                          {String.fromCharCode(65 + index)}. {option}
                        </button>
                      )
                    })}
                  </div>
                  {quizSubmitted && (
                    <p className="mt-2 text-[11px] leading-relaxed text-ink-dim">
                      <span className="label mr-1.5">Why</span>
                      {question.explanation}
                    </p>
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-rule pt-4">
              {!quizSubmitted ? (
                <button
                  type="button"
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length < QUIZ.length}
                  className="btn border border-instrument/50 bg-instrument/15 px-4 py-2 text-[11px] font-bold tracking-[0.14em] text-instrument hover:bg-instrument/25 disabled:cursor-not-allowed disabled:border-rule disabled:bg-panel-2 disabled:text-ink-faint"
                >
                  SUBMIT ANSWERS
                </button>
              ) : (
                <>
                  <p className="tabular text-sm">
                    Score{' '}
                    <span className={quizScore >= PASSING_SCORE ? 'text-long' : 'text-short'}>
                      {quizScore} / {QUIZ.length}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuizAnswers({})
                      setQuizSubmitted(false)
                    }}
                    className="btn border border-rule-bright px-4 py-2 text-[11px] font-bold tracking-[0.14em] text-ink-dim hover:text-ink"
                  >
                    RETAKE
                  </button>
                  <Link
                    to="/arena"
                    className="btn border border-long/50 bg-long/15 px-4 py-2 text-[11px] font-bold tracking-[0.14em] text-long hover:bg-long/25"
                  >
                    GO PRACTICE
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
