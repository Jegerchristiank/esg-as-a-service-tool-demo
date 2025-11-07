import type { ReactNode } from 'react'

export type SegmentedControlOption = {
  id: string
  label: ReactNode
  active?: boolean | undefined
  disabled?: boolean | undefined
  title?: string | undefined
  ariaControls?: string | undefined
  ariaLabel?: string | undefined
}

type SegmentedControlSize = 'sm' | 'md'

type SegmentedControlProps = {
  options: SegmentedControlOption[]
  onSelect: (id: string) => void
  ariaLabel: string
  role?: 'tablist' | 'group'
  size?: SegmentedControlSize
  className?: string
}

export function SegmentedControl({
  options,
  onSelect,
  ariaLabel,
  role = 'group',
  size = 'sm',
  className,
}: SegmentedControlProps): JSX.Element {
  const itemRole = role === 'tablist' ? 'tab' : undefined
  const isToggleGroup = role !== 'tablist'
  const classes = ['ds-segmented', className].filter(Boolean).join(' ')

  return (
    <div className={classes} role={role} aria-label={ariaLabel} data-size={size}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className="ds-segmented__item"
          data-active={option.active ? 'true' : undefined}
          disabled={option.disabled}
          role={itemRole}
          aria-selected={itemRole === 'tab' ? option.active : undefined}
          aria-pressed={isToggleGroup ? option.active : undefined}
          aria-controls={option.ariaControls}
          aria-label={option.ariaLabel}
          title={option.title}
          onClick={() => {
            if (!option.disabled) {
              onSelect(option.id)
            }
          }}
        >
          <span className="ds-segmented__label">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
