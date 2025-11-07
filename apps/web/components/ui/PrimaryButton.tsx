/**
 * Simpel primærknap der kan rendere som link eller button.
 */
import type { ComponentProps, ElementType, ReactNode } from 'react'

type PrimaryVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'

type PrimarySize = 'sm' | 'md' | 'lg'

type PolymorphicProps<T extends ElementType> = {
  as?: T
  children: ReactNode
  className?: string
  variant?: PrimaryVariant
  size?: PrimarySize
  loading?: boolean
} & Omit<ComponentProps<T>, 'as' | 'children' | 'style'>

export function PrimaryButton<T extends ElementType = 'button'>(
  { as, children, className, variant = 'primary', size = 'md', loading = false, ...rest }: PolymorphicProps<T>
): JSX.Element {
  const Component = (as ?? 'button') as ElementType

  const componentProps = {
    ...rest,
    className: ['ds-button', className].filter(Boolean).join(' '),
    'data-variant': variant,
    'data-size': size,
  } as ComponentProps<T>

  const enrichedProps = componentProps as ComponentProps<T> & {
    'data-loading'?: string
    'aria-busy'?: boolean
    'aria-disabled'?: string
  }

  if (loading) {
    enrichedProps['data-loading'] = 'true'
    enrichedProps['aria-busy'] = true
    if (Component !== 'button') {
      enrichedProps['aria-disabled'] = 'true'
    }
  }

  if (Component === 'button' && !(componentProps as ComponentProps<'button'>).type) {
    (componentProps as ComponentProps<'button'>).type = 'button'
  }

  if (Component === 'button' && loading) {
    (componentProps as ComponentProps<'button'>).disabled = true
  }

  return <Component {...componentProps}>{children}</Component>
}
