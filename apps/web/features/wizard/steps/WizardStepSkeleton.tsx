'use client'

export function WizardStepSkeleton(): JSX.Element {
  return (
    <div className="ds-card ds-stack" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Modul indlæses…</span>
      <div className="ds-stack-sm">
        <div className="ds-skeleton ds-skeleton--title" />
        <div className="ds-skeleton ds-skeleton--text" />
      </div>
      <div className="ds-stack-sm">
        <div className="ds-skeleton ds-skeleton--field" />
        <div className="ds-skeleton ds-skeleton--field" />
        <div className="ds-cluster">
          <div className="ds-skeleton ds-skeleton--chip" />
          <div className="ds-skeleton ds-skeleton--chip" />
        </div>
      </div>
    </div>
  )
}
