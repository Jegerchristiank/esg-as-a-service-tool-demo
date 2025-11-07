import { render, screen } from '@testing-library/react'
// eslint-disable-next-line import/no-unresolved
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PrimaryButton } from '../PrimaryButton'

describe('PrimaryButton', () => {
  it('does not invoke onClick when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(
      <PrimaryButton onClick={handleClick} disabled>
        Disabled
      </PrimaryButton>,
    )

    const button = screen.getByRole('button', { name: 'Disabled' })
    await user.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('receives focus with keyboard navigation', async () => {
    const user = userEvent.setup()

    render(
      <>
        <button type="button">Before</button>
        <PrimaryButton>Target</PrimaryButton>
      </>,
    )

    await user.tab()
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus()

    await user.tab()
    const target = screen.getByRole('button', { name: 'Target' })

    expect(target).toHaveFocus()
    expect(target).toHaveAttribute('data-size', 'md')
    expect(target).toHaveAttribute('data-variant', 'primary')
  })

  it('applies loading semantics', () => {
    render(<PrimaryButton loading>Processing</PrimaryButton>)

    const button = screen.getByRole('button', { name: 'Processing' })

    expect(button).toHaveAttribute('data-loading', 'true')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
  })
})
