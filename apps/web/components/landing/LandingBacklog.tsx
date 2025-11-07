import styles from './LandingBacklog.module.css'

type BacklogItem = {
  title: string
  description: string
  checkpoints: string[]
}

type LandingBacklogProps = {
  items: BacklogItem[]
}

export function LandingBacklog({ items }: LandingBacklogProps): JSX.Element {
  return (
    <section className={styles['section']} aria-labelledby="landing-backlog-heading">
      <header className={styles['sectionHeader']}>
        <p className="ds-text-subtle">Sprint backlog</p>
        <h2 id="landing-backlog-heading">Prioriterede leverancer</h2>
        <p>
          Vi ruller redesignet ud i tre iterationer for at sikre stabile A/B-tests. Tokens giver et konsistent lag, layoutet sikrer
          responsive breakpoints, og flows leverer de konkrete forbedringer for brugerne.
        </p>
      </header>
      <div className={styles['grid']}>
        {items.map((item, index) => (
          <article key={item.title} className={styles['card']}>
            <div className={styles['cardHeader']}>
              <span className={styles['indexBadge']} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3>{item.title}</h3>
            </div>
            <p>{item.description}</p>
            <ul className={styles['metaList']}>
              {item.checkpoints.map((checkpoint) => (
                <li key={checkpoint}>{checkpoint}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
