/**
 * Wrapper-komponent for wizard-flowet med forbedret navigation og sidebar.
 */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

import { PrimaryButton } from '../../components/ui/PrimaryButton'
import { useFeatureFlag } from '../../lib/feature-flags/FeatureFlagProvider'
import {
  ProfileProgressStepper,
  type StepIdentifier,
} from '../../src/modules/wizard/ProfileProgressStepper'
import { PreWizardQuestionnaire } from '../../src/modules/wizard/PreWizardQuestionnaire'
import { WizardOverview } from '../../src/modules/wizard/WizardOverview'
import {
  ALL_PROFILE_KEYS,
  countAnsweredQuestions,
  countPositiveAnswers,
  findFirstRelevantStepIndex,
  isModuleRelevant,
  isProfileComplete,
  type WizardProfile,
} from '../../src/modules/wizard/profile'
import { ProfileSwitcher } from './ProfileSwitcher'
import { NextRelevantButton } from './NextRelevantButton'
import { wizardSteps, type WizardScope } from './steps'
import { WizardProvider, useWizardContext } from './useWizard'
import { WizardOfflineIndicator } from './components/WizardOfflineIndicator'
import { WizardNavigationIconButton } from './components/WizardNavigationIconButton'

const scopeOrder: WizardScope[] = ['Scope 1', 'Scope 2', 'Scope 3', 'Environment', 'Social', 'Governance']

/**
 * Breakpoint der aktiverer desktop-layoutet. Matcher design-tokenen `--breakpoint-lg` (60rem).
 */
const NAVIGATION_MEDIA_QUERY = '(min-width: 60rem)'

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQueryList = window.matchMedia(query)
    const updateMatch = () => setMatches(mediaQueryList.matches)

    updateMatch()
    mediaQueryList.addEventListener('change', updateMatch)
    return () => mediaQueryList.removeEventListener('change', updateMatch)
  }, [query])

  return matches
}

type RelevantModuleGroup = {
  scope: WizardScope
  modules: {
    id: string
    label: string
    isActive: boolean
    isRecommended: boolean
  }[]
}

function buildRelevantModuleGroups(
  profile: WizardProfile,
  activeModuleId: string | null,
  recommendedModuleId: string | null
): RelevantModuleGroup[] {
  return scopeOrder
    .map((scope) => {
      const modules = wizardSteps
        .filter((step) => step.scope === scope && step.status === 'ready')
        .filter((step) => isModuleRelevant(profile, step.id))
        .map((step) => ({
          id: step.id,
          label: step.label,
          isActive: step.id === activeModuleId,
          isRecommended: step.id === recommendedModuleId,
        }))

      return { scope, modules }
    })
    .filter((group) => group.modules.length > 0)
}

function resolveRecommendedStepIndex(profile: WizardProfile): number {
  const readyRelevantIndex = wizardSteps.findIndex(
    (step) => step.status === 'ready' && isModuleRelevant(profile, step.id)
  )
  if (readyRelevantIndex !== -1) {
    return readyRelevantIndex
  }

  const firstRelevantIndex = findFirstRelevantStepIndex(wizardSteps, profile)
  if (wizardSteps[firstRelevantIndex]?.status === 'ready') {
    return firstRelevantIndex
  }

  const firstReadyIndex = wizardSteps.findIndex((step) => step.status === 'ready')
  return firstReadyIndex === -1 ? 0 : firstReadyIndex
}

export function WizardShell(): JSX.Element {
  return (
    <WizardProvider>
      <WizardShellContent />
    </WizardProvider>
  )
}

function WizardShellContent(): JSX.Element {
  const { currentStep, goToStep, state, updateField, profile, updateProfile, isOffline } =
    useWizardContext()
  const wizardRedesignEnabled = useFeatureFlag('wizardRedesign')
  const [isProfileOpen, setIsProfileOpen] = useState(() => !isProfileComplete(profile))
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const navigationRef = useRef<HTMLDivElement | null>(null)
  const StepComponent = wizardSteps[currentStep]?.component
  const currentStepMeta = wizardSteps[currentStep]

  const isDesktopNavigation = useMediaQuery(NAVIGATION_MEDIA_QUERY)
  const navigationVisible = isDesktopNavigation || isNavigationOpen

  const recommendedStepIndex = useMemo(() => resolveRecommendedStepIndex(profile), [profile])
  const recommendedStepId = wizardSteps[recommendedStepIndex]?.id ?? null

  const profileComplete = useMemo(() => isProfileComplete(profile), [profile])
  const activeModuleId = !isProfileOpen && currentStepMeta ? currentStepMeta.id : null
  const activeStepperStep: StepIdentifier = isProfileOpen
    ? 'profile'
    : currentStepMeta?.scope ?? 'profile'

  const totalQuestions = ALL_PROFILE_KEYS.length
  const positiveAnswers = useMemo(() => countPositiveAnswers(profile), [profile])
  const answeredQuestions = useMemo(() => countAnsweredQuestions(profile), [profile])
  const progressPercent = totalQuestions === 0 ? 0 : Math.round((positiveAnswers / totalQuestions) * 100)
  const relevantModuleGroups = useMemo(
    () => buildRelevantModuleGroups(profile, activeModuleId, recommendedStepId),
    [profile, activeModuleId, recommendedStepId]
  )

  useEffect(() => {
    const node = navigationRef.current
    if (!node) {
      return
    }

    const elementWithInert = node as HTMLElement & { inert?: boolean }

    if (!navigationVisible && !isDesktopNavigation) {
      elementWithInert.setAttribute('inert', '')
      elementWithInert.inert = true
    } else {
      elementWithInert.removeAttribute('inert')
      elementWithInert.inert = false
    }

    return () => {
      elementWithInert.removeAttribute('inert')
      elementWithInert.inert = false
    }
  }, [isDesktopNavigation, navigationVisible])

  const scopeSummaries = useMemo(
    () =>
      scopeOrder
        .map((scope) => {
          const readySteps = wizardSteps.filter((step) => step.scope === scope && step.status === 'ready')
          if (readySteps.length === 0) {
            return null
          }
          const relevantSteps = readySteps.filter((step) => isModuleRelevant(profile, step.id))
          const recommended = relevantSteps[0]
          const isActiveScope = readySteps.some((step) => step.id === activeModuleId)

          return {
            scope,
            total: readySteps.length,
            relevantCount: relevantSteps.length,
            recommendedLabel: recommended?.label ?? null,
            isActive: isActiveScope,
          }
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    [activeModuleId, profile]
  )

  const relevantModuleTotal = useMemo(
    () => relevantModuleGroups.reduce((count, group) => count + group.modules.length, 0),
    [relevantModuleGroups]
  )

  const recommendedModuleLabel = wizardSteps[recommendedStepIndex]?.label ?? null

  useEffect(() => {
    if (!isProfileComplete(profile)) {
      setIsProfileOpen(true)
    }
  }, [profile])

  useEffect(() => {
    if (isProfileOpen) {
      return
    }
    const current = wizardSteps[currentStep]
    if (!current) {
      return
    }
    const targetIndex = recommendedStepIndex
    if (current.status !== 'ready' && targetIndex !== currentStep) {
      goToStep(targetIndex)
      return
    }
    if (!isModuleRelevant(profile, current.id) && targetIndex !== currentStep) {
      goToStep(targetIndex)
    }
  }, [currentStep, goToStep, isProfileOpen, profile, recommendedStepIndex])

  useEffect(() => {
    if (isDesktopNavigation) {
      setIsNavigationOpen(false)
    }
  }, [isDesktopNavigation])

  useEffect(() => {
    if (isProfileOpen) {
      setIsNavigationOpen(false)
    }
  }, [isProfileOpen])

  const handleOpenProfile = useCallback(() => {
    // Keep profile drawer responsive even if navigation was open.
    setIsNavigationOpen(false)
    setIsProfileOpen(true)
  }, [])

  const handleToggleNavigation = useCallback(() => {
    if (!profileComplete) {
      // Surface profile completion requirement instead of silently failing.
      setIsProfileOpen(true)
      return
    }
    setIsProfileOpen(false)
    setIsNavigationOpen((previous) => !previous)
  }, [profileComplete])

  const handleCompleteProfile = () => {
    setIsProfileOpen(false)
    if (wizardSteps[recommendedStepIndex]) {
      goToStep(recommendedStepIndex)
    }
  }

  const handleSelectStep = useCallback(
    (index: number) => {
      if (!profileComplete) {
        setIsProfileOpen(true)
        return
      }
      setIsProfileOpen(false)
      goToStep(index)
      if (!isDesktopNavigation) {
        setIsNavigationOpen(false)
      }
    },
    [goToStep, isDesktopNavigation, profileComplete]
  )

  const handleSelectStepperStep = useCallback(
    (stepId: StepIdentifier) => {
      if (stepId === 'profile') {
        setIsProfileOpen(true)
        return
      }
      if (!profileComplete) {
        setIsProfileOpen(true)
        return
      }

      const scope = stepId as WizardScope
      const relevantIndex = wizardSteps.findIndex(
        (step) => step.scope === scope && step.status === 'ready' && isModuleRelevant(profile, step.id)
      )
      const fallbackIndex = wizardSteps.findIndex(
        (step) => step.scope === scope && step.status === 'ready'
      )
      const targetIndex = relevantIndex !== -1 ? relevantIndex : fallbackIndex

      if (targetIndex !== -1) {
        setIsProfileOpen(false)
        goToStep(targetIndex)
        if (!isDesktopNavigation) {
          setIsNavigationOpen(false)
        }
      }
    },
    [goToStep, isDesktopNavigation, profile, profileComplete]
  )

  return (
    <section className="wizard-shell" data-variant={wizardRedesignEnabled ? 'redesign' : 'classic'}>
      <header className="wizard-shell__top-nav" data-testid="wizard-top-nav">
        {/* Minimal sticky bar keeps navigation controls visible without covering content. */}
        <div className="wizard-shell__top-bar">
          <div className="wizard-shell__brand">
            <p className="wizard-shell__version ds-text-subtle">
              {wizardRedesignEnabled ? 'Version 4 · Opdateret wizard-oplevelse' : 'Version 3 · Klassisk wizard'}
            </p>
            <h1 className="wizard-shell__heading ds-heading-lg">
              {wizardRedesignEnabled ? 'ESG-beregninger' : 'ESG-rapportering'}
            </h1>
          </div>
          <div className="wizard-shell__top-actions">
            <button
              type="button"
              className="wizard-shell__nav-trigger"
              onClick={handleToggleNavigation}
              aria-controls={!isDesktopNavigation ? 'wizard-shell-navigation' : undefined}
              aria-expanded={!isDesktopNavigation ? navigationVisible : undefined}
            >
              Moduloversigt
            </button>
            <PrimaryButton
              as={Link}
              href="/"
              variant="ghost"
              size="sm"
              className="wizard-shell__home-link"
            >
              Til forsiden
            </PrimaryButton>
            <PrimaryButton variant="secondary" size="sm" onClick={handleOpenProfile}>
              Rediger profil
            </PrimaryButton>
          </div>
        </div>
      </header>

      {/* Rich context and progress sit below the sticky bar to avoid expanding header height. */}
      <div className="wizard-shell__top-support">
        {isOffline && <WizardOfflineIndicator />}
        <p className="wizard-shell__lede ds-text-muted">
          {wizardRedesignEnabled
            ? 'Navigér mellem modulerne for Scope 1, Scope 3 og governance. Dine indtastninger bliver gemt løbende, og hvert modul viser relevante hjælpetekster og validering.'
            : 'Navigér modul for modul i den velkendte oplevelse. Profilen skal fuldføres før modulnavigationen låses op, og data gemmes fortsat automatisk.'}
        </p>

        <div className="wizard-shell__stepper">
          <ProfileProgressStepper
            profile={profile}
            activeStep={activeStepperStep}
            onSelectStep={handleSelectStepperStep}
          />
        </div>

        {wizardRedesignEnabled ? (
          <div className="wizard-shell__top-meta">
            <span className="wizard-shell__meta-item">
              {answeredQuestions} / {totalQuestions} spørgsmål besvaret
            </span>
            <span className="wizard-shell__meta-item">{progressPercent}% positive aktiviteter</span>
            {recommendedModuleLabel && (
              <span className="wizard-shell__meta-item" data-variant="highlight">
                Anbefalet start: {recommendedModuleLabel}
              </span>
            )}
          </div>
        ) : (
          <div className="wizard-shell__top-meta" data-variant="legacy">
            <span className="wizard-shell__meta-item">
              {answeredQuestions} / {totalQuestions} svar fuldført ({progressPercent}% positive)
            </span>
            <span className="wizard-shell__meta-item">Skift variant via `wizardRedesign` feature-flag.</span>
          </div>
        )}
      </div>

      <div className="wizard-shell__body" data-profile-open={isProfileOpen ? 'true' : undefined}>
        <div className="wizard-shell__primary" data-profile-open={isProfileOpen ? 'true' : undefined}>
          {!isProfileOpen && (
            <div
              className="wizard-shell__navigation"
              id="wizard-shell-navigation"
              ref={navigationRef}
              data-open={navigationVisible ? 'true' : undefined}
              data-desktop={isDesktopNavigation ? 'true' : undefined}
              aria-hidden={navigationVisible ? undefined : 'true'}
            >
              <div className="wizard-shell__navigation-panel" data-testid="wizard-navigation">
                {!isDesktopNavigation && (
                  <div className="wizard-shell__navigation-header">
                    <h2 className="ds-heading-sm">Modulnavigation</h2>
                    <WizardNavigationIconButton
                      icon={<CloseIcon />}
                      label="Luk navigation"
                      onClick={() => setIsNavigationOpen(false)}
                      className="wizard-shell__navigation-close"
                    />
                  </div>
                )}
                <WizardOverview
                  steps={wizardSteps}
                  currentStep={currentStep}
                  onSelect={handleSelectStep}
                  profile={profile}
                  profileComplete={profileComplete}
                />
              </div>
            </div>
          )}

          <div className="wizard-shell__module">
            <section className="wizard-shell__module-content" aria-live="polite">
              {isProfileOpen ? (
                <PreWizardQuestionnaire
                  profile={profile}
                  onChange={updateProfile}
                  onContinue={handleCompleteProfile}
                />
              ) : StepComponent ? (
                <StepComponent state={state} onChange={updateField} />
              ) : (
                <p className="ds-text-muted">Ingen trin fundet.</p>
              )}
            </section>

            {!isProfileOpen && StepComponent && (
              <div className="wizard-shell__bottom-bar" data-testid="wizard-bottom-bar">
                <NextRelevantButton className="wizard-shell__bottom-primary" />
                <div className="wizard-shell__bottom-actions">
                  <PrimaryButton
                    onClick={() => goToStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    variant="secondary"
                    size="sm"
                  >
                    Forrige trin
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => goToStep(Math.min(wizardSteps.length - 1, currentStep + 1))}
                    disabled={currentStep === wizardSteps.length - 1}
                    size="sm"
                  >
                    Næste trin
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside
          className="wizard-shell__secondary"
          aria-label="Status for virksomhedsprofil"
          data-profile-open={isProfileOpen ? 'true' : undefined}
          hidden={isProfileOpen ? true : undefined}
          aria-hidden={isProfileOpen ? 'true' : undefined}
        >
          {wizardRedesignEnabled ? (
            <section className="wizard-summary-panel">
              <header className="wizard-summary-panel__header">
                <div>
                  <p className="ds-text-subtle">Virksomhedsprofil</p>
                  <h2 className="ds-heading-sm">Status og anbefalinger</h2>
                </div>
                <PrimaryButton
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenProfile}
                  disabled={isProfileOpen}
                >
                  Rediger profil
                </PrimaryButton>
              </header>

              {!profileComplete && (
                <div className="ds-alert" data-variant="info" role="status">
                  <p>Afslut spørgsmålene i profilen for at aktivere modulnavigationen og få anbefalinger.</p>
                </div>
              )}

              <dl className="wizard-summary-metrics">
                <div className="wizard-summary-chip">
                  <dt>Besvarelse</dt>
                  <dd>
                    {answeredQuestions} / {totalQuestions} spørgsmål
                  </dd>
                </div>
                <div className="wizard-summary-chip">
                  <dt>Relevante moduler</dt>
                  <dd>{relevantModuleTotal}</dd>
                </div>
                <div className="wizard-summary-chip" data-highlight="true">
                  <dt>Anbefalet start</dt>
                  <dd>{recommendedModuleLabel ?? 'Besvar flere spørgsmål'}</dd>
                </div>
              </dl>

              <table className="wizard-summary-table">
                <caption className="ds-text-subtle">Overblik over scopes og relevans</caption>
                <thead>
                  <tr>
                    <th scope="col">Scope</th>
                    <th scope="col">Relevante</th>
                    <th scope="col">Anbefalet modul</th>
                  </tr>
                </thead>
                <tbody>
                  {scopeSummaries.map((summary) => (
                    <tr key={summary.scope} data-active={summary.isActive ? 'true' : undefined}>
                      <th scope="row">{summary.scope}</th>
                      <td>
                        {summary.relevantCount} / {summary.total}
                      </td>
                      <td>{summary.recommendedLabel ?? '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="wizard-summary-switcher">
                <ProfileSwitcher
                  heading="Profiler"
                  description="Skift mellem gemte virksomhedsprofiler."
                  className="wizard-summary-switcher__card"
                />
              </div>
            </section>
          ) : (
            <LegacyWizardAside
              answeredQuestions={answeredQuestions}
              totalQuestions={totalQuestions}
              relevantModuleTotal={relevantModuleTotal}
              recommendedModuleLabel={recommendedModuleLabel}
              onOpenProfile={handleOpenProfile}
              isProfileOpen={isProfileOpen}
            />
          )}
        </aside>
      </div>
    </section>
  )
}

function CloseIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M5 5l10 10" />
      <path d="M15 5l-10 10" />
    </svg>
  )
}

type LegacyWizardAsideProps = {
  answeredQuestions: number
  totalQuestions: number
  relevantModuleTotal: number
  recommendedModuleLabel: string | null
  onOpenProfile: () => void
  isProfileOpen: boolean
}

function LegacyWizardAside({
  answeredQuestions,
  totalQuestions,
  relevantModuleTotal,
  recommendedModuleLabel,
  onOpenProfile,
  isProfileOpen,
}: LegacyWizardAsideProps): JSX.Element {
  return (
    <section className="ds-card ds-stack" data-variant="legacy">
      <header className="ds-stack-sm">
        <p className="ds-text-subtle">Klassisk overblik</p>
        <h2 className="ds-heading-sm">Profilstatus</h2>
      </header>
      <p className="ds-text-muted">
        Denne variant viser den tidligere statusoplevelse uden anbefalingschips. Fuldfør profilen for at aktivere modulnavigation.
      </p>
      <dl className="ds-stack-sm">
        <div>
          <dt className="ds-text-subtle">Besvarelse</dt>
          <dd>
            {answeredQuestions} / {totalQuestions} spørgsmål
          </dd>
        </div>
        <div>
          <dt className="ds-text-subtle">Relevante moduler</dt>
          <dd>{relevantModuleTotal}</dd>
        </div>
        <div>
          <dt className="ds-text-subtle">Anbefalet start</dt>
          <dd>{recommendedModuleLabel ?? 'Tilgængelig efter profil'}</dd>
        </div>
      </dl>
      <PrimaryButton variant="secondary" size="sm" onClick={onOpenProfile} disabled={isProfileOpen}>
        Rediger profil
      </PrimaryButton>
      <ProfileSwitcher
        heading="Profiler"
        description="Skift mellem gemte opsætninger i den klassiske visning."
        showCreateButton={false}
      />
    </section>
  )
}
