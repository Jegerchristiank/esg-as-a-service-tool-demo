import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type IconButtonSize = 'sm' | 'md'

type IconButtonTone = 'neutral' | 'danger'

type IconButtonProps = {
  icon: ReactNode
  label: string
  size?: IconButtonSize
  tone?: IconButtonTone
  className?: string
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className' | 'type' | 'aria-label'>

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, size = 'md', tone = 'neutral', className, type = 'button', ...rest },
  ref,
) {
  const classes = ['ds-icon-button', `ds-icon-button--${size}`, className].filter(Boolean).join(' ')

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={classes}
      data-tone={tone === 'danger' ? 'danger' : undefined}
      aria-label={label}
    >
      <span aria-hidden="true" className="ds-icon-button__icon">
        {icon}
      </span>
    </button>
  )
})
