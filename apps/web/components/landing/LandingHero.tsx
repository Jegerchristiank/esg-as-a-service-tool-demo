import styles from './LandingHero.module.css'
import { PrimaryButton } from '../ui/PrimaryButton'

type LandingHeroProps = {
  latestProfileName?: string | undefined
  canResumeProfile: boolean
  onCreateProfile: () => void
  onResumeProfile: () => void
}

const BACKLOG_TIMELINE = [
  {
    title: 'Design tokens',
    description: 'Opdateret farve- og typografisæt der matches mod wizardens nye komponentbibliotek. Ruller ud i hele appen.'
  },
  {
    title: 'Layoutsystem',
    description: 'Modulære grids for landing page, wizard shell og review med fokus på adaptive breakpoints og kortere first input.'
  },
  {
    title: 'Flows',
    description: 'Guidede trin med tydelig progressionsfeedback og anbefalinger baseret på profilens modulvalg.'
  }
] as const

export function LandingHero({
  latestProfileName,
  canResumeProfile,
  onCreateProfile,
  onResumeProfile
}: LandingHeroProps): JSX.Element {
  return (
    <section className={styles['hero']} aria-labelledby="landing-hero-heading">
      <div className={styles['content']}>
        <div className={styles['meta']}>
          <span className={styles['eyebrow']}>Wizard 2.0 · Eksperiment</span>
          <span>Tokens → Layout → Flows</span>
        </div>
        <h1 id="landing-hero-heading" className={styles['title']}>
          Genstart jeres ESG-rapportering med en orkestreret wizard
        </h1>
        <p className={styles['description']}>
          Byg robuste Scope 1-3 leverancer og governance-moduler gennem et flow der prioriterer design tokens, layoutsystem og
          afsluttende beregninger. Gem, dupliker og A/B-test profiler før næste indberetning.
        </p>
        <div className={styles['actions']}>
          <PrimaryButton size="lg" onClick={onCreateProfile}>
            Opret ny profil
          </PrimaryButton>
          <PrimaryButton size="lg" variant="secondary" onClick={onResumeProfile} disabled={!canResumeProfile}>
            Fortsæt seneste profil
          </PrimaryButton>
          <span aria-live="polite">{latestProfileName ? `Senest aktiv: ${latestProfileName}` : 'Ingen profiler endnu'}</span>
        </div>
        <dl className={styles['stats']}>
          <div className={styles['statItem']}>
            <dt className={styles['statLabel']}>Moduler</dt>
            <dd className={styles['statValue']}>43 klar til brug</dd>
          </div>
          <div className={styles['statItem']}>
            <dt className={styles['statLabel']}>Profilopsætning</dt>
            <dd className={styles['statValue']}>⟨8 min⟩</dd>
          </div>
          <div className={styles['statItem']}>
            <dt className={styles['statLabel']}>Eksporter</dt>
            <dd className={styles['statValue']}>PDF & datafeed</dd>
          </div>
        </dl>
      </div>
      <div className={styles['visual']}>
        <h2 className={styles['visualHeading']}>Sprint backlog</h2>
        <div className={styles['timeline']}>
          {BACKLOG_TIMELINE.map((item) => (
            <article key={item.title} className={styles['timelineItem']}>
              <h3 className={styles['timelineTitle']}>{item.title}</h3>
              <p className={styles['timelineDescription']}>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
