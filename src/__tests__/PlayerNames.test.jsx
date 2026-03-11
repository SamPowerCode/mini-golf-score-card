import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PlayerNames from '../screens/PlayerNames'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }
}))

vi.mock('../hooks/useSession', () => ({
  useSession: () => ({ teamId: 'team-uuid-123', setTeamId: vi.fn(), clearSession: vi.fn() })
}))

function renderPlayerNames(numPlayers = '3') {
  sessionStorage.setItem('numPlayers', numPlayers)
  return render(
    <MemoryRouter initialEntries={['/players']}>
      <Routes>
        <Route path="/players" element={<PlayerNames />} />
        <Route path="/scorecard" element={<div>Scorecard screen</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PlayerNames', () => {
  beforeEach(() => sessionStorage.clear())

  it('renders one input per player', () => {
    renderPlayerNames('3')
    expect(screen.getAllByRole('textbox')).toHaveLength(3)
  })

  it('submit button is disabled when any name is empty', async () => {
    const user = userEvent.setup()
    renderPlayerNames('2')
    const inputs = screen.getAllByRole('textbox')
    // Only fill first input — second is still empty, button must stay disabled
    await user.type(inputs[0], 'Alice')
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
  })

  it('navigates to /scorecard after successful submit', async () => {
    const user = userEvent.setup()
    renderPlayerNames('2')
    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'Alice')
    await user.type(inputs[1], 'Bob')
    await user.click(screen.getByRole('button', { name: /start/i }))
    await waitFor(() => expect(screen.getByText('Scorecard screen')).toBeInTheDocument())
  })
})
