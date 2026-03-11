import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Leaderboards from '../screens/Leaderboards'

// Two submitted teams, one unsubmitted
const mockTeams = [
  { id: 't1', name: 'Eagles', submitted_at: '2026-01-01T10:00:00Z' },
  { id: 't2', name: 'Sharks', submitted_at: '2026-01-01T10:05:00Z' },
  { id: 't3', name: 'Pending', submitted_at: null },
]
const mockPlayers = [
  { id: 'p1', team_id: 't1', name: 'Alice' },
  { id: 'p2', team_id: 't1', name: 'Bob' },
  { id: 'p3', team_id: 't2', name: 'Carol' },
]
const mockScores = [
  { player_id: 'p1', hole_number: 1, strokes: 3 },
  { player_id: 'p1', hole_number: 2, strokes: 2 },  // Alice = 5
  { player_id: 'p2', hole_number: 1, strokes: 4 },
  { player_id: 'p2', hole_number: 2, strokes: 4 },  // Bob = 8
  { player_id: 'p3', hole_number: 1, strokes: 2 },
  { player_id: 'p3', hole_number: 2, strokes: 2 },  // Carol = 4
]
// Team totals: Eagles=13, Sharks=4 → Sharks wins

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'teams') return {
        select: vi.fn(() => ({ not: vi.fn(() => Promise.resolve({ data: mockTeams.filter(t => t.submitted_at), error: null })) }))
      }
      if (table === 'players') return {
        select: vi.fn(() => ({ in: vi.fn(() => Promise.resolve({ data: mockPlayers, error: null })) }))
      }
      if (table === 'scores') return {
        select: vi.fn(() => ({ in: vi.fn(() => Promise.resolve({ data: mockScores, error: null })) }))
      }
      return {}
    })
  }
}))

function renderLeaderboards() {
  return render(
    <MemoryRouter initialEntries={['/leaderboards']}>
      <Routes>
        <Route path="/leaderboards" element={<Leaderboards />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Leaderboards', () => {
  it('renders team leaderboard heading', async () => {
    renderLeaderboards()
    await waitFor(() => expect(screen.getByText(/team leaderboard/i)).toBeInTheDocument())
  })

  it('ranks Sharks above Eagles in team board (4 < 13)', async () => {
    renderLeaderboards()
    await waitFor(() => screen.getByText(/team leaderboard/i))
    const rows = screen.getAllByRole('row')
    const sharkIdx = rows.findIndex(r => r.textContent.includes('Sharks'))
    const eagleIdx = rows.findIndex(r => r.textContent.includes('Eagles'))
    expect(sharkIdx).toBeLessThan(eagleIdx)
  })

  it('ranks Carol first in player board (4 strokes)', async () => {
    renderLeaderboards()
    await waitFor(() => screen.getByText(/player leaderboard/i))
    const rows = screen.getAllByRole('row')
    const carolIdx = rows.findIndex(r => r.textContent.includes('Carol'))
    const aliceIdx = rows.findIndex(r => r.textContent.includes('Alice'))
    expect(carolIdx).toBeLessThan(aliceIdx)
  })

  it('does not show unsubmitted team', async () => {
    renderLeaderboards()
    await waitFor(() => screen.getByText(/team leaderboard/i))
    expect(screen.queryByText('Pending')).not.toBeInTheDocument()
  })
})
