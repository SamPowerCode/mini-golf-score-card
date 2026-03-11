import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Scorecard from '../screens/Scorecard'

const mockTeam = { id: 'team-1', name: 'Eagles', num_holes: 2 }
const mockPlayers = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }]
const mockScores = []

vi.mock('../hooks/useSession', () => ({
  useSession: () => ({ teamId: 'team-1', setTeamId: vi.fn(), clearSession: vi.fn() })
}))

const mockUpsert = vi.fn(() => Promise.resolve({ error: null }))
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'teams') return {
        select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: mockTeam, error: null })) })) }))
      }
      if (table === 'players') return {
        select: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: mockPlayers, error: null })) }))
      }
      if (table === 'scores') return {
        select: vi.fn(() => ({ in: vi.fn(() => Promise.resolve({ data: mockScores, error: null })) })),
        upsert: mockUpsert,
      }
      return {}
    })
  }
}))

function renderScorecard() {
  return render(
    <MemoryRouter initialEntries={['/scorecard']}>
      <Routes>
        <Route path="/scorecard" element={<Scorecard />} />
        <Route path="/review" element={<div>Review screen</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Scorecard', () => {
  beforeEach(() => { mockUpsert.mockClear() })

  it('renders player names after loading', async () => {
    renderScorecard()
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('"Finish & Review" button is always enabled', async () => {
    renderScorecard()
    await waitFor(() => screen.getByText('Alice'))
    expect(screen.getByRole('button', { name: /finish/i })).not.toBeDisabled()
  })

  it('upserts score when a cell is changed', async () => {
    const user = userEvent.setup()
    renderScorecard()
    await waitFor(() => screen.getByText('Alice'))
    // Click "set score" on Alice hole 1
    const setCells = screen.getAllByRole('button', { name: /set score/i })
    await user.click(setCells[0])
    await waitFor(() => expect(mockUpsert).toHaveBeenCalled())
  })
})
