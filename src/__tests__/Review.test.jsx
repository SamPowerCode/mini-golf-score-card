import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Review from '../screens/Review'

const mockTeam = { id: 'team-1', name: 'Eagles', num_holes: 2, submitted_at: null }
const mockPlayers = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }]
const mockScores = [
  { player_id: 'p1', hole_number: 1, strokes: 3 },
  { player_id: 'p1', hole_number: 2, strokes: 2 },
  { player_id: 'p2', hole_number: 1, strokes: 4 },
  { player_id: 'p2', hole_number: 2, strokes: 3 },
]

vi.mock('../hooks/useSession', () => ({
  useSession: () => ({ teamId: 'team-1', setTeamId: vi.fn(), clearSession: vi.fn() })
}))

const mockUpdate = vi.fn(() => Promise.resolve({ error: null }))
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'teams') return {
        select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: mockTeam, error: null })) })) })),
        update: vi.fn(() => ({ eq: vi.fn((col, val) => mockUpdate(col, val)) })),
      }
      if (table === 'players') return {
        select: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: mockPlayers, error: null })) }))
      }
      if (table === 'scores') return {
        select: vi.fn(() => ({ in: vi.fn(() => Promise.resolve({ data: mockScores, error: null })) }))
      }
      return {}
    })
  }
}))

function renderReview() {
  return render(
    <MemoryRouter initialEntries={['/review']}>
      <Routes>
        <Route path="/review" element={<Review />} />
        <Route path="/leaderboards" element={<div>Leaderboards screen</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Review', () => {
  it('renders player names after loading', async () => {
    renderReview()
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
  })

  it('shows team total (3+2+4+3=12)', async () => {
    renderReview()
    await waitFor(() => screen.getByText('Alice'))
    expect(screen.getByText(/team total/i)).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('navigates to leaderboards after submit and calls eq with correct args', async () => {
    const user = userEvent.setup()
    renderReview()
    await waitFor(() => screen.getByText('Alice'))
    await user.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(screen.getByText('Leaderboards screen')).toBeInTheDocument())
    expect(mockUpdate).toHaveBeenCalledWith('id', 'team-1')
  })
})
