type Swatch = {
  label: string
  value?: string
  tone?: 'dark'
  note?: string
}

type ColorComparison = {
  title: string
  description: string
  legacy: Swatch[]
  updated: Swatch[]
}

type SpacingToken = {
  token: string
  legacy: string
  rem: number
}

type BreakpointToken = {
  token: string
  rem: number
  usage: string
}

const colorComparisons: ColorComparison[] = [
  {
    title: 'Primær palette',
    description:
      'Den tidligere palette bestod af tre værdier. Den nye palette dækker både lys accent, standard og kontrast for at understøtte lys/mørk tekstkombinationer.',
    legacy: [
      { label: '--color-primary', value: '#0a7d55' },
      { label: '--color-primary-weak', value: '#c1e7da' },
      { label: '--color-primary-strong', value: '#064f37', tone: 'dark' }
    ],
    updated: [
      { label: '--color-primary-400', value: 'var(--color-primary-400)' },
      { label: '--color-primary-600', value: 'var(--color-primary-600)', tone: 'dark' },
      { label: '--color-primary-800', value: 'var(--color-primary-800)', tone: 'dark' }
    ]
  },
  {
    title: 'Sekundær palette',
    description:
      'Sekundær farve blev tidligere lånt fra neutrale toner. Vi introducerer et dedikeret blåt spektrum til grafiske elementer og informationspaneler.',
    legacy: [{ label: 'Ingen dedikeret token', note: 'Genbrugte neutrale værdier' }],
    updated: [
      { label: '--color-secondary-400', value: 'var(--color-secondary-400)' },
      { label: '--color-secondary-500', value: 'var(--color-secondary-500)', tone: 'dark' },
      { label: '--color-secondary-700', value: 'var(--color-secondary-700)', tone: 'dark' }
    ]
  },
  {
    title: 'Neutrale lag',
    description:
      'Overflader er udvidet fra én grundtone til canvas, muted og soft, så kort og paneler kan bruge hierarki uden custom farver.',
    legacy: [
      { label: '--color-surface', value: '#ffffff' },
      { label: '--color-surface-muted', value: '#f4f7f6' },
      { label: '--color-surface-strong', value: '#e9f2ee' }
    ],
    updated: [
      { label: '--surface-canvas', value: 'var(--surface-canvas)' },
      { label: '--surface-muted', value: 'var(--surface-muted)' },
      { label: '--surface-soft', value: 'var(--surface-soft)' }
    ]
  }
]

const statusComparisons: ColorComparison[] = [
  {
    title: 'Success',
    description: 'De nye tokens adskiller kant, baggrund og tekst for semantiske badges og alerts.',
    legacy: [{ label: 'Custom grøn', value: '#0a7d55' }],
    updated: [
      { label: '--status-success-surface', value: 'var(--status-success-surface)' },
      { label: '--status-success-border', value: 'var(--status-success-border)' },
      { label: '--status-success-text', value: 'var(--status-success-text)', tone: 'dark' }
    ]
  },
  {
    title: 'Advarsel',
    description: 'Advarsler havde ikke en officiel farve. Tokens dækker overflade, kant og tekst.',
    legacy: [{ label: 'Ingen token', note: 'Blev løst via custom CSS' }],
    updated: [
      { label: '--status-warning-surface', value: 'var(--status-warning-surface)' },
      { label: '--status-warning-border', value: 'var(--status-warning-border)' },
      { label: '--status-warning-text', value: 'var(--status-warning-text)', tone: 'dark' }
    ]
  },
  {
    title: 'Fejl',
    description: 'Fejltilstande brugte rød hex direkte. Vi centraliserer værdierne.',
    legacy: [{ label: 'Hex', value: '#cf3728' }],
    updated: [
      { label: '--status-danger-surface', value: 'var(--status-danger-surface)' },
      { label: '--status-danger-border', value: 'var(--status-danger-border)' },
      { label: '--status-danger-text', value: 'var(--status-danger-text)', tone: 'dark' }
    ]
  },
  {
    title: 'Info',
    description: 'Informationsbokse får blå accent der matcher sekundær palette.',
    legacy: [{ label: 'Hex', value: '#1f73d2', tone: 'dark' }],
    updated: [
      { label: '--status-info-surface', value: 'var(--status-info-surface)' },
      { label: '--status-info-border', value: 'var(--status-info-border)' },
      { label: '--status-info-text', value: 'var(--status-info-text)', tone: 'dark' }
    ]
  }
]

const spacingTokens: SpacingToken[] = [
  { token: '--space-2xs', legacy: '--space-1', rem: 0.25 },
  { token: '--space-xs', legacy: '--space-2', rem: 0.5 },
  { token: '--space-sm', legacy: '--space-3', rem: 0.75 },
  { token: '--space-md', legacy: '--space-4', rem: 1 },
  { token: '--space-lg', legacy: '--space-5', rem: 1.5 },
  { token: '--space-xl', legacy: '--space-6', rem: 2 },
  { token: '--space-2xl', legacy: '--space-7', rem: 3 }
]

const breakpoints: BreakpointToken[] = [
  { token: '--breakpoint-sm', rem: 36, usage: 'Grid layouts starter to kolonner' },
  { token: '--breakpoint-md', rem: 45, usage: 'Wizard / design system to-kolonne' },
  { token: '--breakpoint-lg', rem: 60, usage: 'Sidebar + indhold (tidl. 960px)' },
  { token: '--breakpoint-xl', rem: 75, usage: 'Maks bredde på 1100px' }
]

const headingExamples = [
  { className: 'ds-heading-xxl', label: 'ds-heading-xxl', description: 'Hero 2.75rem / tight line-height' },
  { className: 'ds-heading-xl', label: 'ds-heading-xl', description: 'Sidehoved 2.25rem' },
  { className: 'ds-heading-lg', label: 'ds-heading-lg', description: 'Sektioner 1.875rem' },
  { className: 'ds-heading-md', label: 'ds-heading-md', description: 'Paneloverskrifter 1.5rem' },
  { className: 'ds-heading-sm', label: 'ds-heading-sm', description: 'Formsektioner 1.25rem' },
  { className: 'ds-heading-xs', label: 'ds-heading-xs', description: 'Meta og tab overskrifter 1.125rem' }
]

const bodyExamples = [
  { className: 'ds-text-lg', label: 'ds-text-lg', description: 'Intro/lede tekst 1.125rem' },
  { className: '', label: 'Standardtekst', description: 'Body på 1rem og relaxed line-height' },
  { className: 'ds-text-sm', label: 'ds-text-sm', description: 'Labels og sekundær tekst 0.875rem' },
  { className: 'ds-text-xs', label: 'ds-text-xs', description: 'Hint og badge-tekst 0.75rem' }
]

const surfaceVariants = [
  { tone: undefined, label: 'Standard', description: 'Default ds-card/ds-panel' },
  { tone: 'soft', label: 'data-tone="soft"', description: 'Brug til baggrundsniveau mellem canvas og kort' },
  { tone: 'muted', label: 'data-tone="muted"', description: 'Erstatter ds-card--muted' },
  { tone: 'contrast', label: 'data-tone="contrast"', description: 'Høj kontrast med lyse tekster' }
]

export default function StyleguidePage(): JSX.Element {
  return (
    <main className="ds-page ds-stack">
      <header className="ds-stack-sm">
        <p className="ds-text-subtle ds-text-sm">Designsystem tokens · før/efter</p>
        <h1 className="ds-heading-lg">Reference for de nye design tokens</h1>
        <p className="ds-text-muted">
          Denne side viser forskellen på de tidligere hardcodede værdier og de nye, navngivne tokens for farver, typografi,
          spacing og breakpoints. Brug den som visuel regressionstest og som dokumentation sammen med docs/quality-noterne.
        </p>
      </header>

      <section className="ds-stack">
        <h2 className="ds-heading-md">Paletter</h2>
        <p className="ds-text-subtle">Før/efter-sammenligningen viser hvordan paletten nu dækker flere lysstyrker.</p>
        <div className="ds-stack">
          {colorComparisons.map((group) => (
            <article key={group.title} className="ds-card ds-stack" data-tone="soft">
              <div className="ds-stack-xs">
                <h3 className="ds-heading-sm">{group.title}</h3>
                <p className="ds-text-subtle">{group.description}</p>
              </div>
              <div className="ds-grid-two">
                <div className="ds-stack-xs">
                  <span className="ds-text-subtle ds-text-sm">Før</span>
                  <div className="ds-token-grid">
                    {group.legacy.map((swatch) => (
                      <div key={swatch.label} className="ds-stack-xs">
                        {swatch.value ? (
                          <div className="ds-token-swatch" data-tone={swatch.tone} style={{ background: swatch.value }} />
                        ) : (
                          <div className="ds-stack-xs">
                            <div className="ds-token-swatch" style={{ background: 'var(--surface-muted)' }} />
                            <span className="ds-text-subtle ds-text-sm">{swatch.note}</span>
                          </div>
                        )}
                        <code className="ds-code">{swatch.value ?? swatch.note ?? swatch.label}</code>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ds-stack-xs">
                  <span className="ds-text-subtle ds-text-sm">Efter</span>
                  <div className="ds-token-grid">
                    {group.updated.map((swatch) => (
                      <div key={swatch.label} className="ds-stack-xs">
                        <div className="ds-token-swatch" data-tone={swatch.tone} style={{ background: swatch.value }} />
                        <code className="ds-code">{swatch.label}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ds-stack">
        <h2 className="ds-heading-md">Semantiske tilstande</h2>
        <p className="ds-text-subtle">
          De nye status-tokens erstatter løse hex-værdier og bruges i badges, alerts og validering.
        </p>
        <div className="ds-stack">
          {statusComparisons.map((group) => (
            <article key={group.title} className="ds-card ds-stack" data-tone="soft">
              <div className="ds-stack-xs">
                <h3 className="ds-heading-sm">{group.title}</h3>
                <p className="ds-text-subtle">{group.description}</p>
              </div>
              <div className="ds-grid-two">
                <div className="ds-stack-xs">
                  <span className="ds-text-subtle ds-text-sm">Før</span>
                  <div className="ds-token-grid">
                    {group.legacy.map((swatch) => (
                      <div key={swatch.label} className="ds-stack-xs">
                        {swatch.value ? (
                          <div className="ds-token-swatch" data-tone={swatch.tone} style={{ background: swatch.value }} />
                        ) : (
                          <div className="ds-token-swatch" style={{ background: 'var(--surface-muted)' }} />
                        )}
                        <code className="ds-code">{swatch.value ?? swatch.note ?? swatch.label}</code>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ds-stack-xs">
                  <span className="ds-text-subtle ds-text-sm">Efter</span>
                  <div className="ds-token-grid">
                    {group.updated.map((swatch) => (
                      <div key={swatch.label} className="ds-stack-xs">
                        <div className="ds-token-swatch" data-tone={swatch.tone} style={{ background: swatch.value }} />
                        <code className="ds-code">{swatch.label}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ds-stack">
        <h2 className="ds-heading-md">Typografi</h2>
        <div className="ds-grid-two">
          <div className="ds-card ds-stack" data-tone="soft">
            <h3 className="ds-heading-sm">Overskrifter</h3>
            <div className="ds-stack">
              {headingExamples.map((item) => (
                <div key={item.label} className="ds-stack-xs">
                  <span className="ds-text-subtle ds-text-sm">{item.label}</span>
                  <p className={['ds-text-muted', item.className].filter(Boolean).join(' ')}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="ds-card ds-stack" data-tone="soft">
            <h3 className="ds-heading-sm">Brødtekst</h3>
            <div className="ds-stack">
              {bodyExamples.map((item) => (
                <div key={item.label} className="ds-stack-xs">
                  <span className="ds-text-subtle ds-text-sm">{item.label}</span>
                  <p className={['ds-text-muted', item.className].filter(Boolean).join(' ')}>
                    Standard line-height: {item.className === 'ds-text-xs' ? '1.65' : '1.5'} – {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ds-stack">
        <h2 className="ds-heading-md">Spacing tokens</h2>
        <p className="ds-text-subtle">
          Nummererede tokens (--space-1 … --space-7) er erstattet af skalerede navne. Brug dem til margin/padding i stedet for magiske tal.
        </p>
        <div className="ds-card ds-stack" data-tone="soft">
          {spacingTokens.map((space) => {
            const widthRem = Math.min(space.rem * 10, 16)
            return (
              <div key={space.token} className="ds-space-token">
                <div className="ds-space-token__bar" style={{ width: `${widthRem}rem` }} />
                <div className="ds-stack-xs">
                  <code className="ds-code">{space.token}</code>
                  <span className="ds-text-subtle ds-text-sm">
                    Tidligere {space.legacy} · {space.rem.toFixed(2).replace(/\.00$/, '')}rem ({Math.round(space.rem * 16)}px)
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="ds-stack">
        <h2 className="ds-heading-md">Breakpoints</h2>
        <p className="ds-text-subtle">
          Media queries anvender rem-værdier i stedet for faste px for at følge brugerens basefont-størrelse.
        </p>
        <div className="ds-card ds-stack" data-tone="soft">
          <table className="ds-token-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Rem</th>
                <th>Pixel</th>
                <th>Anvendelse</th>
              </tr>
            </thead>
            <tbody>
              {breakpoints.map((bp) => (
                <tr key={bp.token}>
                  <td>
                    <code className="ds-code">{bp.token}</code>
                  </td>
                  <td>{bp.rem}rem</td>
                  <td>{Math.round(bp.rem * 16)}px</td>
                  <td>{bp.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ds-stack">
        <h2 className="ds-heading-md">Lag og paneler</h2>
        <p className="ds-text-subtle">Kort og paneler kan nu tones via data-attributter fremfor særskilte CSS-klasser.</p>
        <div className="ds-grid-two">
          {surfaceVariants.map((variant) => (
            <article
              key={variant.label}
              className="ds-panel ds-stack-sm"
              data-tone={variant.tone as 'soft' | 'muted' | 'contrast' | undefined}
            >
              <span className="ds-text-subtle ds-text-sm">{variant.label}</span>
              <p className="ds-text-muted">{variant.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
