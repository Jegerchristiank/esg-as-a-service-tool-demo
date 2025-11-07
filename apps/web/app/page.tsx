const HIGHLIGHTS = [
  {
    title: 'ESG overblik',
    description:
      'Få et samlet billede af virksomhedens miljø-, sociale- og governance-initiativer på tværs af teams.',
  },
  {
    title: 'Opdateret status',
    description:
      'Se hvilke aktiviteter der er afsluttet, hvilke der er i gang, og hvor der mangler dataindsamling.',
  },
  {
    title: 'Delbare rapporter',
    description:
      'Eksportér et snapshot til kolleger eller ledelse direkte fra dashboardet.',
  },
] as const

const METRICS = [
  { label: 'Aktive initiativer', value: '12' },
  { label: 'Afsluttede opgaver', value: '34' },
  { label: 'Planlagte reviews', value: '4' },
] as const

export default function HomePage(): JSX.Element {
  return (
    <main className="page">
      <section className="hero">
        <div className="hero__badge">ESG status</div>
        <h1>Et enkelt sted til virksomhedens ESG-arbejde</h1>
        <p>
          Følg fremdrift, ansvarlige teams og næste skridt i rapporteringsprocessen. Alt er samlet i et
          enkelt overblik, så du kan handle hurtigt.
        </p>
        <div className="hero__actions">
          <a className="button" href="#oversigt">
            Gå til oversigten
          </a>
          <a className="button button--ghost" href="#del">
            Del status
          </a>
        </div>
      </section>

      <section id="oversigt" className="panel">
        <h2>Hvad kan du se her?</h2>
        <p className="panel__intro">
          Dashboardet giver et simpelt udsnit af de vigtigste områder. Fokus ligger på aktiviteter, som
          allerede er klar til at blive delt med organisationen.
        </p>
        <div className="grid">
          {HIGHLIGHTS.map((item) => (
            <article key={item.title} className="card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="del" className="panel panel--muted">
        <h2>Aktuel aktivitet</h2>
        <div className="metrics">
          {METRICS.map((metric) => (
            <div key={metric.label} className="metric">
              <span className="metric__value">{metric.value}</span>
              <span className="metric__label">{metric.label}</span>
            </div>
          ))}
        </div>
        <p>
          Tallene opdateres, når ansvarlige teams markerer en aktivitet som afsluttet. Brug dem til at
          fortælle, hvor langt I er i processen.
        </p>
      </section>
    </main>
  )
}
