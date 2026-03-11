import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppPasswordGate from '../screens/AppPasswordGate'

beforeEach(() => { localStorage.clear() })
afterEach(() => { vi.unstubAllEnvs() })

describe('AppPasswordGate', () => {
  it('renders the password form', () => {
    vi.stubEnv('VITE_APP_PASSWORD', 'secret')
    render(<AppPasswordGate onUnlock={vi.fn()} />)
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enter/i })).toBeInTheDocument()
  })

  it('shows error and clears input on wrong password', async () => {
    vi.stubEnv('VITE_APP_PASSWORD', 'secret')
    const user = userEvent.setup()
    render(<AppPasswordGate onUnlock={vi.fn()} />)
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /enter/i }))
    expect(screen.getByText(/incorrect password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toHaveValue('')
    expect(screen.getByLabelText(/password/i)).toHaveFocus()
  })

  it('calls onUnlock on correct password', async () => {
    vi.stubEnv('VITE_APP_PASSWORD', 'secret')
    const onUnlock = vi.fn()
    const user = userEvent.setup()
    render(<AppPasswordGate onUnlock={onUnlock} />)
    await user.type(screen.getByLabelText(/password/i), 'secret')
    await user.click(screen.getByRole('button', { name: /enter/i }))
    expect(onUnlock).toHaveBeenCalledOnce()
  })
})
