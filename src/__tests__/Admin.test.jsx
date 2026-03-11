import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Admin from '../screens/Admin'

// Supabase mock — will be replaced in Task 3
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ not: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
        not: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}))

function renderAdmin() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </MemoryRouter>
  )
}

afterEach(() => { vi.unstubAllEnvs() })

describe('Admin — PIN gate', () => {
  it('shows "not configured" when VITE_ADMIN_PIN is not set', () => {
    vi.stubEnv('VITE_ADMIN_PIN', '')
    renderAdmin()
    expect(screen.getByText(/not configured/i)).toBeInTheDocument()
  })

  it('shows PIN form when VITE_ADMIN_PIN is set', () => {
    vi.stubEnv('VITE_ADMIN_PIN', '1234')
    renderAdmin()
    expect(screen.getByRole('button', { name: /unlock/i })).toBeInTheDocument()
  })

  it('shows error on wrong PIN', async () => {
    vi.stubEnv('VITE_ADMIN_PIN', '1234')
    const user = userEvent.setup()
    renderAdmin()
    await user.type(screen.getByRole('textbox'), '0000')
    await user.click(screen.getByRole('button', { name: /unlock/i }))
    expect(screen.getByText(/incorrect/i)).toBeInTheDocument()
  })

  it('reveals dashboard heading on correct PIN', async () => {
    vi.stubEnv('VITE_ADMIN_PIN', '1234')
    const user = userEvent.setup()
    renderAdmin()
    await user.type(screen.getByRole('textbox'), '1234')
    await user.click(screen.getByRole('button', { name: /unlock/i }))
    expect(await screen.findByText(/admin.*all teams/i)).toBeInTheDocument()
  })
})
