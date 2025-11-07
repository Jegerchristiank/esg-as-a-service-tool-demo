# Design tokens – november 2025

Denne note dokumenterer opdateringen af designbiblioteket i `apps/web/styles/design-system.css` og referencevisningen på
`/styleguide`. Tabellen nedenfor opsummerer gamle variabler og de nye tokens, der erstatter dem.

## Farvepaletter

| Kategori | Før | Efter |
| --- | --- | --- |
| Primær | `--color-primary`, `--color-primary-weak`, `--color-primary-strong` | `--color-primary-400`, `--color-primary-600`, `--color-primary-800`, kontrast `--surface-contrast` |
| Sekundær | Genbrugte neutrale farver | `--color-secondary-400`, `--color-secondary-500`, `--color-secondary-700` |
| Neutrale overflader | `--color-surface`, `--color-surface-muted`, `--color-surface-strong` | `--surface-canvas`, `--surface-muted`, `--surface-soft`, `--surface-raised` |

## Semantiske tilstande

| Tilstand | Før | Efter |
| --- | --- | --- |
| Success | Hex `#0a7d55` + custom box-shadow | `--status-success-surface`, `--status-success-border`, `--status-success-text`, `--status-success-focus-ring` |
| Advarsel | Ingen standard | `--status-warning-surface`, `--status-warning-border`, `--status-warning-text`, `--status-warning-focus-ring` |
| Fejl | Hex `#cf3728` | `--status-danger-surface`, `--status-danger-border`, `--status-danger-text`, `--status-danger-focus-ring` |
| Info | Recycle af `#1f73d2` | `--status-info-surface`, `--status-info-border`, `--status-info-text`, `--status-info-focus-ring` |

Badges kan nu bruge `data-status="success|info|warning|danger"` og alerts understøtter samme varianter.

## Typografi

- Nye fontfamilier: `--font-family-sans` og `--font-family-mono` (Inter/JetBrains Mono stack).
- Tekstvægt tokens: `--font-weight-regular`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`.
- Overskrifts-skala: `--font-size-heading-xs` … `--font-size-heading-xl` med tilhørende `.ds-heading-*` klasser.
- Brødtekst: `--font-size-body-xs` … `--font-size-body-lg` og `.ds-text-{xs,sm,lg}` utilities.
- Line-height tokens: `--line-height-tight`, `--line-height-snug`, `--line-height-standard`, `--line-height-relaxed`.

## Spacing og breakpoints

| Tidligere | Ny token | Rem | Pixel |
| --- | --- | --- | --- |
| `--space-1` | `--space-2xs` | 0.25 | 4 |
| `--space-2` | `--space-xs` | 0.5 | 8 |
| `--space-3` | `--space-sm` | 0.75 | 12 |
| `--space-4` | `--space-md` | 1 | 16 |
| `--space-5` | `--space-lg` | 1.5 | 24 |
| `--space-6` | `--space-xl` | 2 | 32 |
| `--space-7` | `--space-2xl` | 3 | 48 |

Breakpoints udtrykkes i rem: `--breakpoint-sm (36rem)`, `--breakpoint-md (45rem)`, `--breakpoint-lg (60rem)` og `--breakpoint-xl (75rem)`.

## Lag og komponenter

- `.ds-card` og `.ds-panel` accepterer `data-tone="soft|muted|contrast"` for visuelle niveauer.
- `.ds-card--muted` er bevaret som alias til `data-tone="muted"`.
- Nye util-klasser: `.ds-token-swatch`, `.ds-token-table` og `.ds-space-token` bruges på `/styleguide`.

## Referencer

- Visuel sammenligning: `apps/web/app/styleguide/page.tsx` (Server Component).
- CSS tokens: `apps/web/styles/design-system.css`.
- Global font stack: `apps/web/app/globals.css`.
