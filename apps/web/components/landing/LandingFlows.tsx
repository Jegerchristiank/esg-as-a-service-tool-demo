import styles from './LandingFlows.module.css'

type Flow = {
  title: string
  description: string
  checklist: string[]
}

type LandingFlowsProps = {
  flows: Flow[]
}

export function LandingFlows({ flows }: LandingFlowsProps): JSX.Element {
  return (
    <section className={styles['section']} aria-labelledby="landing-flows-heading">
      <header className="ds-stack-sm" style={{ marginBottom: 'var(--space-xl)' }}>
        <p className="ds-text-subtle">Kerneflows</p>
        <h2 id="landing-flows-heading" className="ds-heading-md">
          Wizard-oplevelser der måles i A/B-testen
        </h2>
        <p className="ds-text-muted">
          Hvert flow målretter konkrete KPIer: engagement i profilopsætningen, fuldførte scope-moduler og antal eksporterede
          rapporter.
        </p>
      </header>
      <div className={styles['grid']}>
        {flows.map((flow, index) => (
          <article key={flow.title} className={styles['card']}>
            <h3>
              <span className={styles['stepIndex']} aria-hidden="true">
                {index + 1}
              </span>
              {flow.title}
            </h3>
            <p>{flow.description}</p>
            <ul className={styles['checklist']}>
              {flow.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
