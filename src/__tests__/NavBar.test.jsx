import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NavBar from '../components/NavBar'

describe('NavBar', () => {
  it('does not show leaderboards link by default', () => {
    render(<MemoryRouter><NavBar /></MemoryRouter>)
    expect(screen.queryByRole('link', { name: /leaderboards/i })).not.toBeInTheDocument()
  })

  it('shows leaderboards link when showLeaderboards is true', () => {
    render(<MemoryRouter><NavBar showLeaderboards /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /leaderboards/i })).toBeInTheDocument()
  })
})
