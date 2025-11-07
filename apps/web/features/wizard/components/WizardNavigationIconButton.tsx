import { forwardRef, type ComponentPropsWithoutRef } from 'react'

import { IconButton } from '../../../components/ui/IconButton'

type WizardNavigationIconButtonProps = ComponentPropsWithoutRef<typeof IconButton>

export const WizardNavigationIconButton = forwardRef<HTMLButtonElement, WizardNavigationIconButtonProps>(
  function WizardNavigationIconButton({ className, size = 'sm', ...rest }, ref) {
    const classes = ['wizard-navigation__icon-button', className]
      .filter(Boolean)
      .join(' ')

    return <IconButton {...rest} ref={ref} size={size} className={classes} />
  },
)
