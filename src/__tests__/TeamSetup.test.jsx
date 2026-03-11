import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TeamSetup from '../screens/TeamSetup'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'team-uuid-123', name: 'Eagles', num_holes: 9 },
            error: null,
          }))
        }))
      }))
    }))
  }
}))

// Mock useSession
const mockSetTeamId = vi.fn()
vi.mock('../hooks/useSession', () => ({
  useSession: () => ({ teamId: null, setTeamId: mockSetTeamId, clearSession: vi.fn() })
}))

function renderTeamSetup() {
  return render(
    <MemoryRouter initialEntries={['/setup']}>
      <Routes>
        <Route path="/setup" element={<TeamSetup />} />
        <Route path="/players" element={<div>Players screen</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TeamSetup', () => {
  beforeEach(() => { mockSetTeamId.mockClear() })

  it('renders all three fields', () => {
    renderTeamSetup()
    expect(screen.getByLabelText(/team name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/number of players/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/number of holes/i)).toBeInTheDocument()
  })

  it('submit button is disabled when fields are empty', () => {
    renderTeamSetup()
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('shows validation error if players < 1', async () => {
    const user = userEvent.setup()
    renderTeamSetup()
    await user.type(screen.getByLabelText(/team name/i), 'Eagles')
    await user.clear(screen.getByLabelText(/number of players/i))
    await user.type(screen.getByLabelText(/number of players/i), '0')
    await user.type(screen.getByLabelText(/number of holes/i), '9')
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText(/between 1 and 20/i)).toBeInTheDocument()
  })

  it('navigates to /players on valid submit', async () => {
    const user = userEvent.setup()
    renderTeamSetup()
    await user.type(screen.getByLabelText(/team name/i), 'Eagles')
    await user.clear(screen.getByLabelText(/number of players/i))
    await user.type(screen.getByLabelText(/number of players/i), '3')
    await user.clear(screen.getByLabelText(/number of holes/i))
    await user.type(screen.getByLabelText(/number of holes/i), '9')
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => expect(screen.getByText('Players screen')).toBeInTheDocument())
    expect(mockSetTeamId).toHaveBeenCalledWith('team-uuid-123')
  })
})
