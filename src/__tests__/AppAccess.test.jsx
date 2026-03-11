import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Mock all screens to keep tests fast
vi.mock('../screens/TeamSetup', () => ({ default: () => <div>TeamSetup</div> }))
vi.mock('../screens/PlayerNames', () => ({ default: () => <div>PlayerNames</div> }))
vi.mock('../screens/Scorecard', () => ({ default: () => <div>Scorecard</div> }))
vi.mock('../screens/Review', () => ({ default: () => <div>Review</div> }))
vi.mock('../screens/Leaderboards', () => ({ default: () => <div>Leaderboards</div> }))
vi.mock('../hooks/useSession', () => ({
  useSession: () => ({ teamId: null, setTeamId: vi.fn(), clearSession: vi.fn() })
}))

beforeEach(() => { localStorage.clear() })
afterEach(() => { vi.unstubAllEnvs() })

describe('App access gate', () => {
  it('shows password gate when VITE_APP_PASSWORD is set and not unlocked', () => {
    vi.stubEnv('VITE_APP_PASSWORD', 'secret')
    render(<App />)
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('skips gate when VITE_APP_PASSWORD is not set', () => {
    vi.stubEnv('VITE_APP_PASSWORD', '')
    render(<App />)
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })

  it('skips gate when already unlocked in localStorage', () => {
    vi.stubEnv('VITE_APP_PASSWORD', 'secret')
    localStorage.setItem('appUnlocked', 'true')
    render(<App />)
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })
})
