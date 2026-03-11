import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Admin from '../screens/Admin'

const mockTeams = [
  { id: 't1', name: 'Eagles', num_holes: 9, created_at: '2026-03-11T10:00:00Z', submitted_at: '2026-03-11T11:00:00Z' },
  { id: 't2', name: 'Sharks', num_holes: 18, created_at: '2026-03-11T10:05:00Z', submitted_at: null },
]
const mockPlayers = [
  { id: 'p1', team_id: 't1', name: 'Alice' },
  { id: 'p2', team_id: 't1', name: 'Bob' },
  { id: 'p3', team_id: 't2', name: 'Carol' },
]

const mockDeleteEq = vi.fn(() => Promise.resolve({ error: null }))
const mockDeleteNot = vi.fn(() => Promise.resolve({ error: null }))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'teams') return {
        select: vi.fn(() => ({ not: vi.fn(() => Promise.resolve({ data: mockTeams, error: null })) })),
        delete: vi.fn(() => ({
          eq: mockDeleteEq,
          not: mockDeleteNot,
        })),
      }
      if (table === 'players') return {
        select: vi.fn(() => ({ in: vi.fn(() => Promise.resolve({ data: mockPlayers, error: null })) })),
      }
      return {}
    }),
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

// Helper: unlock the admin panel before each dashboard test
async function renderAndUnlock() {
  vi.stubEnv('VITE_ADMIN_PIN', '1234')
  const user = userEvent.setup()
  renderAdmin()
  await user.type(screen.getByRole('textbox'), '1234')
  await user.click(screen.getByRole('button', { name: /unlock/i }))
  return user
}

describe('Admin — dashboard', () => {
  it('shows team names after unlock', async () => {
    await renderAndUnlock()
    expect(await screen.findByText('Eagles')).toBeInTheDocument()
    expect(screen.getByText('Sharks')).toBeInTheDocument()
  })

  it('shows correct player counts', async () => {
    await renderAndUnlock()
    await screen.findByText('Eagles')
    // Table columns: Team(0) Holes(1) Players(2) Submitted(3) Created(4) Delete(5)
    // data rows start at index 1 (index 0 is header)
    const rows = screen.getAllByRole('row')
    const eaglesCells = rows[1].querySelectorAll('td')
    expect(eaglesCells[2].textContent).toBe('2') // Eagles has 2 players
    const sharksCells = rows[2].querySelectorAll('td')
    expect(sharksCells[2].textContent).toBe('1') // Sharks has 1 player
  })

  it('calls supabase delete.eq with the team id when Delete is confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockDeleteEq.mockClear()
    const user = await renderAndUnlock()
    await screen.findByText('Eagles')
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0]) // first row is Eagles (id: 't1')
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 't1')
  })

  it('shows "All teams deleted." after Reset Event', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockDeleteNot.mockClear()
    const user = await renderAndUnlock()
    await screen.findByText('Eagles')
    await user.click(screen.getByRole('button', { name: /reset event/i }))
    expect(await screen.findByText(/all teams deleted/i)).toBeInTheDocument()
    expect(mockDeleteNot).toHaveBeenCalledWith('id', 'is', null)
  })

  it('shows delete error and re-enables button on failure', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockDeleteEq.mockResolvedValueOnce({ error: { message: 'DB error' } })
    const user = await renderAndUnlock()
    await screen.findByText('Eagles')
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])
    expect(await screen.findByText(/delete failed/i)).toBeInTheDocument()
    // Re-query after re-render to avoid stale DOM reference
    expect(screen.getAllByRole('button', { name: /delete/i })[0]).not.toBeDisabled()
  })
})

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
