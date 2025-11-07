'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  countAnsweredQuestions,
  isProfileComplete,
  type WizardProfile,
  type WizardProfileKey,
  type WizardProfileQuestion,
  wizardProfileSections,
} from './profile'
import { PrimaryButton } from '../../../components/ui/PrimaryButton'

type PreWizardQuestionnaireProps = {
  profile: WizardProfile
  onChange: (key: WizardProfileKey, value: boolean | null) => void
  onContinue: () => void
}

type WizardQuestionCardProps = {
  sectionId: string
  question: WizardProfileQuestion
  initialValue: boolean | null
  onSelect: (value: boolean) => void
  onReset: () => void
  registerFirstInput?: (node: HTMLInputElement | null) => void
}

function WizardQuestionCard({
  sectionId,
  question,
  initialValue,
  onSelect,
  onReset,
  registerFirstInput,
}: WizardQuestionCardProps): JSX.Element {
  const [selected, setSelected] = useState<boolean | null>(initialValue)

  useEffect(() => {
    setSelected(initialValue)
  }, [initialValue, question.id, sectionId])

  const handleValueChange = useCallback(
    (next: boolean | null) => {
      setSelected((prev) => {
        if (prev === next) {
          return prev
        }

        if (next === null) {
          onReset()
        } else {
          onSelect(next)
        }

        return next
      })
    },
    [onReset, onSelect],
  )

  const yesId = `${sectionId}-${question.id}-yes`
  const noId = `${sectionId}-${question.id}-no`

  return (
    <fieldset className="wizard-question">
      <legend className="wizard-question__legend">
        <span className="wizard-question__title">{question.label}</span>
        <button
          type="button"
          className="ds-icon-button wizard-question__reset"
          onClick={() => handleValueChange(null)}
          disabled={selected === null}
          aria-label={`Nulstil svaret for ${question.label}`}
          title="Nulstil svar"
        >
          <span aria-hidden>⟲</span>
          <span className="sr-only">Nulstil svar</span>
        </button>
      </legend>
      <p className="wizard-question__help">{question.helpText}</p>
      <div className="wizard-question__choices ds-choice-group">
        <label
          className="ds-choice"
          data-selected={selected === true ? 'true' : undefined}
          htmlFor={yesId}
          onClick={() => handleValueChange(true)}
        >
          <input
            type="radio"
            id={yesId}
            name={question.id}
            checked={selected === true}
            onChange={() => handleValueChange(true)}
            ref={(node) => {
              if (registerFirstInput) {
                registerFirstInput(node)
              }
            }}
          />
          <span>Ja</span>
        </label>
        <label
          className="ds-choice"
          data-selected={selected === false ? 'true' : undefined}
          htmlFor={noId}
          onClick={() => handleValueChange(false)}
        >
          <input
            type="radio"
            id={noId}
            name={question.id}
            checked={selected === false}
            onChange={() => handleValueChange(false)}
          />
          <span>Nej</span>
        </label>
      </div>
    </fieldset>
  )
}

type SectionStatus = 'not-started' | 'in-progress' | 'complete'

type SectionProgress = {
  id: string
  heading: string
  summaryHint: string
  total: number
  answered: number
  status: SectionStatus
}

type UnansweredPointer = {
  sectionId: string
  questionId: WizardProfileKey
  label: string
}

const statusLabels: Record<SectionStatus, string> = {
  'not-started': 'Ikke startet',
  'in-progress': 'I gang',
  complete: 'Færdig',
}

function resolveStatus(answered: number, total: number): SectionStatus {
  if (answered === 0) {
    return 'not-started'
  }
  if (answered >= total) {
    return 'complete'
  }
  return 'in-progress'
}

function findSection(sectionId: string | null) {
  if (!sectionId) {
    return undefined
  }
  return wizardProfileSections.find((section) => section.id === sectionId)
}

export function PreWizardQuestionnaire({ profile, onChange, onContinue }: PreWizardQuestionnaireProps): JSX.Element {
  const initialSectionId = wizardProfileSections[0]?.id ?? null
  const [activeSectionId, setActiveSectionId] = useState<string | null>(initialSectionId)
  const [statusMessage, setStatusMessage] = useState('')

  const firstInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const headingRefs = useRef<Record<string, HTMLHeadingElement | null>>({})

  const profileComplete = useMemo(() => isProfileComplete(profile), [profile])
  const totalQuestions = useMemo(() => {
    return wizardProfileSections.reduce((count, section) => count + section.questions.length, 0)
  }, [])
  const answeredQuestions = useMemo(() => countAnsweredQuestions(profile), [profile])
  const progressPercent = totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100)

  const activeSectionIndex = useMemo(() => {
    if (!activeSectionId) {
      return -1
    }
    return wizardProfileSections.findIndex((section) => section.id === activeSectionId)
  }, [activeSectionId])
  const activeSection = useMemo(() => findSection(activeSectionId) ?? null, [activeSectionId])

  const sectionProgress = useMemo<SectionProgress[]>(() => {
    return wizardProfileSections.map((section) => {
      const total = section.questions.length
      const answered = section.questions.reduce((count, question) => {
        return profile[question.id] !== null ? count + 1 : count
      }, 0)

      return {
        id: section.id,
        heading: section.heading,
        summaryHint: section.summaryHint,
        total,
        answered,
        status: resolveStatus(answered, total),
      }
    })
  }, [profile])

  const unansweredSummary = useMemo<UnansweredPointer[]>(() => {
    return wizardProfileSections.flatMap((section) => {
      return section.questions
        .filter((question) => profile[question.id] === null)
        .map((question) => ({
          sectionId: section.id,
          questionId: question.id,
          label: question.label,
        }))
    })
  }, [profile])

  useEffect(() => {
    if (!activeSectionId) {
      return
    }
    const targetInput = firstInputRefs.current[activeSectionId]
    if (targetInput) {
      targetInput.focus({ preventScroll: true })
      return
    }
    const heading = headingRefs.current[activeSectionId]
    heading?.focus({ preventScroll: true })
  }, [activeSectionId])

  const activateSection = useCallback((sectionId: string | null) => {
    if (!sectionId) {
      return
    }
    setActiveSectionId(sectionId)
    const section = findSection(sectionId)
    if (section) {
      setStatusMessage(`${section.heading} er nu aktivt.`)
    }
  }, [])

  const handleAnswer = useCallback(
    (sectionId: string, questionId: WizardProfileKey, label: string, value: boolean | null) => {
      onChange(questionId, value)
      if (value === null) {
        setStatusMessage(`${label} er nulstillet.`)
        return
      }
      const answerLabel = value ? 'Ja' : 'Nej'
      setStatusMessage(`${label} markeret som ${answerLabel}.`)
      activateSection(sectionId)
    },
    [activateSection, onChange]
  )

  const handlePrevious = useCallback(() => {
    if (activeSectionIndex === -1 && initialSectionId) {
      activateSection(initialSectionId)
      return
    }
    if (activeSectionIndex > 0) {
      const previousSection = wizardProfileSections[activeSectionIndex - 1]
      if (previousSection) {
        activateSection(previousSection.id)
      }
    }
  }, [activateSection, activeSectionIndex, initialSectionId])

  const handleNext = useCallback(() => {
    if (activeSectionIndex === -1 && initialSectionId) {
      activateSection(initialSectionId)
      return
    }

    if (activeSectionIndex < wizardProfileSections.length - 1) {
      const nextSection = wizardProfileSections[activeSectionIndex + 1]
      if (nextSection) {
        activateSection(nextSection.id)
      }
      return
    }

    if (!profileComplete) {
      const nextIncomplete = wizardProfileSections.find((section) =>
        section.questions.some((question) => profile[question.id] === null)
      )
      if (nextIncomplete) {
        activateSection(nextIncomplete.id)
        return
      }
    }

    setStatusMessage('Virksomhedsprofilen er udfyldt. Fortsætter til næste trin.')
    onContinue()
  }, [activateSection, activeSectionIndex, initialSectionId, onContinue, profile, profileComplete])

  const nextLabel = useMemo(() => {
    if (activeSectionIndex === -1) {
      return 'Start profil'
    }
    if (profileComplete) {
      return activeSectionIndex === wizardProfileSections.length - 1
        ? 'Fortsæt til moduler'
        : 'Næste sektion'
    }
    return activeSectionIndex === wizardProfileSections.length - 1
      ? 'Find næste ubesvarede'
      : 'Næste sektion'
  }, [activeSectionIndex, profileComplete])

  const activeSectionProgress = sectionProgress.find((section) => section.id === activeSection?.id)

  return (
    <section className="ds-questionnaire" aria-labelledby="wizard-profile-heading">
      <div
        className="ds-questionnaire__primary ds-stack-lg"
        role="region"
        aria-labelledby="wizard-profile-heading"
      >
        <header className="wizard-questionnaire__intro ds-stack-sm">
          <p className="ds-text-subtle">Trin 0 · Virksomhedsprofil</p>
          <h1 id="wizard-profile-heading" className="ds-heading-lg">
            Afgræns ESG-modulerne til din virksomheds aktiviteter
          </h1>
          <p className="ds-text-muted">
            Svar på spørgsmålene ét område ad gangen. Du kan altid ændre svarene senere under “Rediger profil”.
          </p>
          <div className="ds-stack-xs" aria-live="off">
            <div
              className="ds-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuenow={answeredQuestions}
              aria-valuemax={totalQuestions}
              aria-valuetext={`${progressPercent}% fuldført`}
            >
              <div className="ds-progress__bar" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="ds-text-subtle">
              {answeredQuestions}/{totalQuestions} spørgsmål besvaret
            </p>
          </div>
        </header>

        {activeSection ? (
          <article
            className="ds-stack"
            aria-labelledby={`${activeSection.id}-heading`}
            aria-describedby={`${activeSection.id}-hint`}
          >
            <header className="ds-stack-xs">
              <h2
                id={`${activeSection.id}-heading`}
                className="ds-heading-md"
                tabIndex={-1}
                ref={(node) => {
                  headingRefs.current[activeSection.id] = node
                }}
              >
                {activeSection.heading}
              </h2>
              <p id={`${activeSection.id}-hint`} className="ds-text-muted">
                {activeSection.description}
              </p>
              {activeSectionProgress && (
                <p className="ds-text-subtle">
                  {activeSectionProgress.answered}/{activeSectionProgress.total} besvaret i denne sektion
                </p>
              )}
            </header>

            <div
              className="wizard-questionnaire__questions ds-stack"
              role="group"
              aria-label="Spørgsmål i aktiv sektion"
            >
              {activeSection.questions.map((question, questionIndex) => {
                const registerFirstInput =
                  questionIndex === 0
                    ? (node: HTMLInputElement | null) => {
                        firstInputRefs.current[activeSection.id] = node
                      }
                    : undefined

                return (
                  <WizardQuestionCard
                    key={question.id}
                    sectionId={activeSection.id}
                    question={question}
                    initialValue={profile[question.id]}
                    onSelect={(value) =>
                      handleAnswer(activeSection.id, question.id, question.label, value)
                    }
                    onReset={() => handleAnswer(activeSection.id, question.id, question.label, null)}
                    {...(registerFirstInput
                      ? { registerFirstInput }
                      : {})}
                  />
                )
              })}
            </div>
          </article>
        ) : (
          <p className="ds-text-muted">Ingen sektioner tilgængelige.</p>
        )}

        <footer className="wizard-questionnaire__footer" aria-label="Navigationskontrol for virksomhedsprofilen">
          <div className="wizard-questionnaire__actions">
            <PrimaryButton
              variant="secondary"
              size="sm"
              onClick={handlePrevious}
              disabled={activeSectionIndex <= 0}
            >
              Tilbage
            </PrimaryButton>
            <PrimaryButton size="sm" onClick={handleNext}>
              {nextLabel}
            </PrimaryButton>
          </div>
          {!profileComplete && (
            <p className="ds-text-subtle" role="status">
              Besvar de resterende spørgsmål eller vælg et element i oversigten for at fortsætte.
            </p>
          )}
        </footer>

        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {statusMessage || 'Statusopdateringer vises her.'}
        </div>
      </div>

      <aside className="ds-questionnaire__summary" aria-label="Statuspanel for virksomhedsprofilen">
        <section className="ds-stack-sm">
          <h2 className="ds-heading-sm">Sektioner</h2>
          <p className="ds-text-subtle">Få overblik over fremskridt og hop direkte til en sektion.</p>
          <ol className="ds-stepper" role="list">
            {sectionProgress.map((section) => {
              const isActive = section.id === activeSectionId
              return (
                <li
                  key={section.id}
                  className="ds-stepper__step"
                  data-status={section.status}
                  data-active={isActive ? 'true' : undefined}
                >
                  <button
                    type="button"
                    className="ds-stepper__trigger"
                    onClick={() => activateSection(section.id)}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <div className="ds-stepper__header">
                      <span className="ds-stepper__label">{section.heading}</span>
                      <span className="ds-stepper__status">{statusLabels[section.status]}</span>
                    </div>
                    <p className="ds-stepper__meta">
                      {section.answered}/{section.total} besvaret · {section.summaryHint}
                    </p>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="ds-stack-sm">
          <h2 className="ds-heading-sm">Ubesvarede spørgsmål</h2>
          <p className="ds-text-subtle">Spring til det næste spørgsmål der mangler et svar.</p>
          {unansweredSummary.length === 0 ? (
            <p className="ds-text-muted">Alle spørgsmål er besvaret.</p>
          ) : (
            <ul className="wizard-unanswered-list">
              {unansweredSummary.map((item) => {
                const section = findSection(item.sectionId)
                const isActive = item.sectionId === activeSectionId
                return (
                  <li key={`${item.sectionId}-${item.questionId}`}>
                    <button
                      type="button"
                      className="wizard-unanswered-button"
                      data-active={isActive ? 'true' : undefined}
                      onClick={() => activateSection(item.sectionId)}
                    >
                      <span className="wizard-unanswered-label">{item.label}</span>
                      {section ? (
                        <span className="wizard-unanswered-meta">{section.heading}</span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </aside>
    </section>
  )
}
