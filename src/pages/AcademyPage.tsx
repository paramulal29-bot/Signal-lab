import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight, GraduationCap } from 'lucide-react'
import { LESSONS, PASSING_SCORE, QUIZ } from '../core/academy/lessons'
import {
  arenaUnlocked,
  LEVEL_NAMES,
  loadProgress,
  markLessonComplete,
  recordQuizResult,
  saveProgress,
  type AcademyProgress,
} from '../core/academy/progress'
import { Panel } from '../components/instrument/Panel'

export function AcademyPage() {
  const [progress, setProgress] = useState<AcademyProgress>(() => loadProgress())
  const [activeLessonId, setActiveLessonId] = useState(LESSONS[0].id)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  const activeLesson = LESSONS.find((l) => l.id === activeLessonId) ?? LESSONS[0]
  const completedCount = progress.completedLessonIds.length

  function update(next: AcademyProgress) {
    setProgress(next)
    saveProgress(next)
  }

  function completeLesson(id: string) {
    update(markLessonComplete(progress, id))
    const index = LESSONS.findIndex((l) => l.id === id)
    if (index >= 0 && index < LESSONS.length - 1) setActiveLessonId(LESSONS[index + 1].id)
  }

  const quizScore = QUIZ.reduce(
    (score, q) => score + (quizAnswers[q.id] === q.correctIndex ? 1 : 0),
    0,
  )

  function submitQuiz() {
    setQuizSubmitted(true)
    update(recordQuizResult(progress, quizScore))
  }

  function retakeQuiz() {
    setQuizAnswers({})
    setQuizSubmitted(false)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <Panel
        title="Beginner Academy — start here"
        action={
          <span className="tabular text-[11px] text-ink-dim">
            LEVEL {progress.level} · {LEVEL_NAMES[progress.level - 1]}
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-50">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="label">Lessons completed</span>
              <span className="tabular text-xs text-ink-dim">
                {completedCount} / {LESSONS.length}
              </span>
            </div>
            <div className="h-1 w-full bg-panel-3">
              <div
                className="h-full bg-instrument"
                style={{ width: `${(completedCount / LESSONS.length) * 100}%` }}
              />
            </div>
          </div>
          {arenaUnlocked(progress) && (
            <Link
              to="/arena"
              className="rounded-sm border border-long/50 bg-long/10 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-long transition-colors hover:bg-long/20"
            >
              ENTER PRACTICE ARENA
            </Link>
          )}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Panel title="Lessons" className="h-fit">
          <ol className="space-y-1">
            {LESSONS.map((lesson, index) => {
              const done = progress.completedLessonIds.includes(lesson.id)
              const active = lesson.id === activeLessonId
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => setActiveLessonId(lesson.id)}
                    className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors ${
                      active ? 'bg-panel-3 text-ink' : 'text-ink-dim hover:text-ink'
                    }`}
                  >
                    <span className="tabular w-5 shrink-0 text-ink-faint">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1">{lesson.title}</span>
                    {done && <Check className="h-3 w-3 shrink-0 text-long" aria-label="completed" />}
                  </button>
                </li>
              )
            })}
          </ol>
        </Panel>

        <div className="space-y-6">
          <Panel title={`Lesson — ${activeLesson.title}`}>
            <p className="mb-4 text-sm text-ink-dim">{activeLesson.summary}</p>
            <div className="space-y-3">
              {activeLesson.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-ink">
                  {paragraph}
                </p>
              ))}
            </div>

            {activeLesson.example && (
              <p className="tabular mt-4 rounded-sm border border-rule-bright bg-panel-2 p-3 text-xs text-instrument">
                {activeLesson.example}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
              <p className="text-xs text-ink-dim">
                <span className="label mr-2">Key takeaway</span>
                {activeLesson.keyTakeaway}
              </p>
              <button
                type="button"
                onClick={() => completeLesson(activeLesson.id)}
                className="flex items-center gap-1.5 rounded-sm border border-instrument/50 bg-instrument/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-instrument transition-colors hover:bg-instrument/20"
              >
                {progress.completedLessonIds.includes(activeLesson.id) ? 'NEXT LESSON' : 'MARK COMPLETE'}
                <ChevronRight className="h-3 w-3" aria-hidden />
              </button>
            </div>
          </Panel>

          <Panel
            title="Knowledge check"
            action={
              progress.quizPassed ? (
                <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-long">
                  <GraduationCap className="h-3 w-3" aria-hidden /> PASSED
                </span>
              ) : (
                <span className="label">{PASSING_SCORE} of {QUIZ.length} to pass</span>
              )
            }
          >
            <ol className="space-y-5">
              {QUIZ.map((question, qIndex) => {
                const answer = quizAnswers[question.id]
                return (
                  <li key={question.id}>
                    <p className="mb-2 text-sm text-ink">
                      <span className="tabular mr-2 text-ink-faint">{qIndex + 1}.</span>
                      {question.question}
                    </p>
                    <div className="space-y-1.5">
                      {question.options.map((option, index) => {
                        const selected = answer === index
                        const correct = index === question.correctIndex
                        const showResult = quizSubmitted

                        let className = 'border-rule-bright text-ink-dim hover:text-ink'
                        if (showResult && correct) className = 'border-long/50 bg-long/10 text-long'
                        else if (showResult && selected) className = 'border-short/50 bg-short/10 text-short'
                        else if (selected) className = 'border-instrument/50 bg-instrument/10 text-instrument'

                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() => setQuizAnswers((prev) => ({ ...prev, [question.id]: index }))}
                            className={`block w-full rounded-sm border px-3 py-2 text-left text-xs transition-colors disabled:cursor-default ${className}`}
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
                )
              })}
            </ol>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-rule pt-4">
              {!quizSubmitted ? (
                <button
                  type="button"
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length < QUIZ.length}
                  className="rounded-sm border border-instrument/50 bg-instrument/10 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-instrument transition-colors hover:bg-instrument/20 disabled:cursor-not-allowed disabled:border-rule disabled:bg-panel-2 disabled:text-ink-faint"
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
                  {quizScore >= PASSING_SCORE ? (
                    <Link
                      to="/arena"
                      className="rounded-sm border border-long/50 bg-long/10 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-long transition-colors hover:bg-long/20"
                    >
                      ENTER PRACTICE ARENA
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={retakeQuiz}
                      className="rounded-sm border border-rule-bright px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-ink-dim transition-colors hover:text-ink"
                    >
                      REVIEW AND RETAKE
                    </button>
                  )}
                </>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
