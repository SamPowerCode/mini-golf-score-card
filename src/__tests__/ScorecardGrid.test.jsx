import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ScorecardGrid from '../components/ScorecardGrid'

const players = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
]
const numHoles = 3
const scores = { p1: { 1: 3, 2: 2 }, p2: { 1: 4 } }

describe('ScorecardGrid', () => {
  it('renders player names as row headers', () => {
    render(<ScorecardGrid players={players} numHoles={numHoles} scores={scores} onScoreChange={vi.fn()} readOnly={false} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('renders hole numbers as column headers', () => {
    render(<ScorecardGrid players={players} numHoles={numHoles} scores={scores} onScoreChange={vi.fn()} readOnly={false} />)
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
  })

  it('shows — for empty cells', () => {
    render(<ScorecardGrid players={players} numHoles={numHoles} scores={scores} onScoreChange={vi.fn()} readOnly={false} />)
    // Bob hole 2 and 3 are empty, Alice hole 3 is empty — at least one dash expected
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('shows correct total for Alice (3+2=5)', () => {
    render(<ScorecardGrid players={players} numHoles={numHoles} scores={scores} onScoreChange={vi.fn()} readOnly={false} />)
    // Alice row total
    const cells = screen.getAllByText('5')
    expect(cells.length).toBeGreaterThan(0)
  })

  it('calls onScoreChange when + button clicked on a filled cell', async () => {
    const user = userEvent.setup()
    const onScoreChange = vi.fn()
    render(<ScorecardGrid players={players} numHoles={1} scores={{ p1: { 1: 3 }, p2: {} }} onScoreChange={onScoreChange} readOnly={false} />)
    // Click + next to Alice hole 1 (score=3)
    const plusButtons = screen.getAllByRole('button', { name: '+' })
    await user.click(plusButtons[0])
    expect(onScoreChange).toHaveBeenCalledWith('p1', 1, 4)
  })

  it('does not render +/- buttons in readOnly mode', () => {
    render(<ScorecardGrid players={players} numHoles={numHoles} scores={scores} onScoreChange={vi.fn()} readOnly={true} />)
    expect(screen.queryAllByRole('button', { name: '+' })).toHaveLength(0)
  })
})
