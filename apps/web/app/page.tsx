/**
 * Landing page der leder brugeren ind i beregningsflowet.
 */
'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { LandingBacklog, LandingFlows, LandingHero } from '../components/landing'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { ProfileSwitcher } from '../features/wizard/ProfileSwitcher'
import { WizardProvider, useWizardContext } from '../features/wizard/useWizard'
import { useFeatureFlag } from '../lib/feature-flags/FeatureFlagProvider'

type BacklogDefinition = Parameters<typeof LandingBacklog>[0]['items']

type FlowDefinition = Parameters<typeof LandingFlows>[0]['flows']

const BACKLOG_ITEMS: BacklogDefinition = [
  {
    title: 'Design tokens',
    description: 'Udrul opdaterede farver, typografi og elevationer i hele appen uden at ændre modulernes logik.',
    checkpoints: [
      'Kortlæg gamle tokens og aliaser',
      'Udsend migration-guide til teams',
      'Monitorer visuelle regressioner i UI-tests',
    ],
  },
  {
    title: 'Layoutsystem',
    description:
      'Introducér responsive grids for landing page, wizard-shell og review-sider. Giver bedre fokus på primær handling.',
    checkpoints: [
      'Implementér container queries for navigationen',
      'Fjern unødvendige wrappers i wizard-shell',
      'Dokumentér layout patterns i Storybook',
    ],
  },
  {
    title: 'Flows',
    description:
      'Aktivér forbedrede trin-for-trin flows med tydelig progressionsfeedback og genveje til relevante moduler.',
    checkpoints: [
      'A/B-test mod eksisterende baseline',
      'Flet profil- og moduldata i anbefalinger',
      'Log hændelser til produktanalyse',
    ],
  },
]

const FLOW_ITEMS: FlowDefinition = [
  {
    title: 'Profileringsflow',
    description: 'Skab en virksomhedsprofil på få minutter med autosave og statusindikatorer per kategori.',
    checklist: ['Autosave for hver sektion', 'Progressiv afdækning af scope-relevans', 'Klargjort til multi-profil'],
  },
  {
    title: 'Scope-navigation',
    description: 'Prioritér anbefalede moduler og spring irrelevante trin over med klare anbefalinger.',
    checklist: ['Anbefalet startmodul', 'Tilstand for modulrelevans', 'Tilpassede hjælpetekster'],
  },
  {
    title: 'Review & eksport',
    description: 'Afslut med en samlet review-side hvor PDF og datastrømme kan eksporteres parallelt.',
    checklist: ['Live-resultater fra alle moduler', 'Eksportlog med tidsstempler', 'Klar CTA til rapportdeling'],
  },
]

export default function HomePage(): JSX.Element {
  return (
    <WizardProvider>
      <LandingContent />
    </WizardProvider>
  )
}

function LandingContent(): JSX.Element {
  const router = useRouter()
  const { createProfile, switchProfile, profiles, activeProfileId } = useWizardContext()
  const wizardRedesignEnabled = useFeatureFlag('wizardRedesign')

  const latestProfile = useMemo(() => {
    const entries = Object.values(profiles)
    if (entries.length === 0) {
      return undefined
    }
    return entries.reduce((latest, entry) => (entry.updatedAt > latest.updatedAt ? entry : latest))
  }, [profiles])

  const handleCreateProfile = () => {
    createProfile()
    router.push('/wizard')
  }

  const handleOpenLatestProfile = () => {
    if (!latestProfile) {
      return
    }
    if (latestProfile.id !== activeProfileId) {
      switchProfile(latestProfile.id)
    }
    router.push('/wizard')
  }

  if (!wizardRedesignEnabled) {
    return (
      <LegacyLanding
        latestProfileName={latestProfile?.name}
        canResume={Boolean(latestProfile)}
        onCreateProfile={handleCreateProfile}
        onResumeProfile={handleOpenLatestProfile}
      />
    )
  }

  return (
    <main
      className="ds-stack"
      style={{ gap: 'var(--space-3xl)', paddingBottom: 'calc(var(--space-3xl) + var(--space-xl))' }}
    >
      <div className="ds-constrain" style={{ width: '100%', maxWidth: '76rem', marginTop: 'var(--space-3xl)' }}>
        <LandingHero
          latestProfileName={latestProfile?.name}
          canResumeProfile={Boolean(latestProfile)}
          onCreateProfile={handleCreateProfile}
          onResumeProfile={handleOpenLatestProfile}
        />
      </div>

      <div className="ds-constrain" style={{ width: '100%', maxWidth: '76rem' }}>
        <LandingBacklog items={BACKLOG_ITEMS} />
      </div>

      <div className="ds-constrain" style={{ width: '100%', maxWidth: '80rem' }}>
        <LandingFlows flows={FLOW_ITEMS} />
      </div>

      <div className="ds-constrain" style={{ width: '100%', maxWidth: '76rem', padding: '0 var(--space-xl)' }}>
        <ProfileSwitcher
          heading="Administrer profiler"
          description="Få overblik over gemte profiler, dupliker opsætninger eller skift aktiv profil."
          showCreateButton={false}
        />
      </div>
    </main>
  )
}

type LegacyLandingProps = {
  latestProfileName?: string | undefined
  canResume: boolean
  onCreateProfile: () => void
  onResumeProfile: () => void
}

function LegacyLanding({ latestProfileName, canResume, onCreateProfile, onResumeProfile }: LegacyLandingProps): JSX.Element {
  return (
    <main className="ds-hero">
      <div className="ds-stack ds-constrain">
        <section className="ds-stack-sm">
          <p className="ds-text-subtle">Version 3 · Klassisk UI</p>
          <h1 className="ds-heading-lg">ESG-rapportering</h1>
          <p className="ds-text-muted">
            Opret eller genåbn en virksomhedsprofil for at afgrænse Scope 1-, Scope 2- og Scope 3-modulerne samt governance flowet.
            Dine valg gemmes automatisk og kan altid justeres i wizardens venstre kolonne.
          </p>
          <div className="ds-cluster">
            <PrimaryButton size="lg" onClick={onCreateProfile}>
              Ny profil
            </PrimaryButton>
            <PrimaryButton size="lg" variant="secondary" onClick={onResumeProfile} disabled={!canResume}>
              Åbn seneste profil
            </PrimaryButton>
          </div>
          <p className="ds-text-subtle">{latestProfileName ? `Seneste profil: ${latestProfileName}` : 'Ingen profiler oprettet endnu.'}</p>
        </section>

        <section className="ds-card ds-stack">
          <h2 className="ds-heading-sm">Sådan fungerer det</h2>
          <ol className="ds-list">
            <li>Start med at udfylde virksomhedsprofilen for at aktivere relevante scope-moduler.</li>
            <li>Gå trin-for-trin gennem modulerne og udfyld datafelter med jeres tal og beskrivelser.</li>
            <li>Afslut med review-siden, hvor du kan downloade rapporten eller justere profilvalg.</li>
          </ol>
        </section>

        <ProfileSwitcher
          heading="Administrer profiler"
          description="Få overblik over gemte profiler, dupliker opsætninger eller skift aktiv profil."
          showCreateButton={false}
        />
      </div>
    </main>
  )
}
