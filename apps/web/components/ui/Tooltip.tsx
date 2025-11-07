import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

type TooltipChildProps = {
  onFocus?: EventHandler
  onBlur?: EventHandler
  onMouseEnter?: EventHandler
  onMouseLeave?: EventHandler
  'aria-describedby'?: string | undefined
} & Record<string, unknown>

type TooltipProps = {
  content: ReactNode
  children: ReactElement<TooltipChildProps>
  placement?: TooltipPlacement
  className?: string
}

type EventHandler = (event: FocusEvent<HTMLElement> | MouseEvent<HTMLElement>) => void

function mergeHandlers(existing: EventHandler | undefined, next: EventHandler): EventHandler {
  return (event) => {
    existing?.(event)
    if (event.defaultPrevented) {
      return
    }
    next(event)
  }
}

export function Tooltip({ content, children, placement = 'top', className }: TooltipProps): JSX.Element {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)

  if (!isValidElement(children)) {
    throw new Error('Tooltip kræver et gyldigt React-element som child')
  }

  const childProps: TooltipChildProps = {
    onFocus: mergeHandlers(children.props.onFocus, () => setOpen(true)),
    onBlur: mergeHandlers(children.props.onBlur, () => setOpen(false)),
    onMouseEnter: mergeHandlers(children.props.onMouseEnter, () => setOpen(true)),
    onMouseLeave: mergeHandlers(children.props.onMouseLeave, () => setOpen(false)),
    'aria-describedby': open ? tooltipId : undefined,
  }

  return (
    <span className={['ds-tooltip-wrapper', className].filter(Boolean).join(' ')}>
      {cloneElement(children, childProps)}
      <span
        id={tooltipId}
        role="tooltip"
        className={['ds-tooltip', `ds-tooltip--${placement}`].join(' ')}
        data-open={open ? 'true' : undefined}
      >
        {content}
      </span>
    </span>
  )
}
