# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A PIN-protected admin screen at `/#/admin` where the event organiser can view all teams, delete them individually, or reset the entire event.

**Architecture:** A single new `Admin.jsx` screen handles both the PIN gate (component state, not persisted) and the dashboard (table of all teams with delete controls). Added as a route in `App.jsx` before the wildcard catch-all. No schema changes — cascade deletes handle cleanup.

**Tech Stack:** React 19, Supabase JS v2, Vite env vars, Vitest + React Testing Library

---

## Chunk 1: Admin screen — PIN gate

### Task 1: PIN gate (not-configured and wrong-PIN states)

**Files:**
- Create: `src/screens/Admin.jsx`
- Create: `src/__tests__/Admin.test.jsx`

- [ ] **Step 1: Write failing tests for the PIN gate**

Create `src/__tests__/Admin.test.jsx`:

```jsx
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
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/Admin.test.jsx
```

Expected: FAIL — `Admin` not found.

- [ ] **Step 3: Implement the PIN gate**

Create `src/screens/Admin.jsx`:

```jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const pin = import.meta.env.VITE_ADMIN_PIN?.trim()
  const [unlocked, setUnlocked] = useState(false)

  if (!pin) {
    return (
      <div className="screen" style={{ justifyContent: 'center' }}>
        <div className="card">
          <p className="error-msg">Admin panel not configured</p>
        </div>
      </div>
    )
  }

  if (!unlocked) {
    return <PinGate correctPin={pin} onUnlock={() => setUnlocked(true)} />
  }

  return <Dashboard />
}

function PinGate({ correctPin, onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (value === correctPin) {
      onUnlock()
    } else {
      setError('Incorrect PIN')
      setValue('')
    }
  }

  return (
    <div className="screen" style={{ justifyContent: 'center' }}>
      <div className="card">
        <h2>Admin</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <label htmlFor="pin">PIN</label>
            <input
              id="pin"
              type="text"
              inputMode="numeric"
              value={value}
              onChange={e => { setValue(e.target.value); setError('') }}
              autoComplete="off"
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary">Unlock</button>
        </form>
      </div>
    </div>
  )
}

// Placeholder — implemented in Task 2
function Dashboard() {
  return <div className="screen"><p className="hint">Loading…</p></div>
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/Admin.test.jsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/screens/Admin.jsx src/__tests__/Admin.test.jsx
git commit -m "feat: admin PIN gate"
```

---

### Task 2: Correct PIN unlocks the dashboard

**Files:**
- Modify: `src/screens/Admin.jsx` (Dashboard component)
- Modify: `src/__tests__/Admin.test.jsx`

- [ ] **Step 1: Add a test for correct PIN unlocking**

Append to the `'Admin — PIN gate'` describe block in `src/__tests__/Admin.test.jsx`:

```jsx
  it('reveals dashboard heading on correct PIN', async () => {
    vi.stubEnv('VITE_ADMIN_PIN', '1234')
    const user = userEvent.setup()
    renderAdmin()
    await user.type(screen.getByRole('textbox'), '1234')
    await user.click(screen.getByRole('button', { name: /unlock/i }))
    expect(await screen.findByText(/admin.*all teams/i)).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/Admin.test.jsx
```

Expected: FAIL — the placeholder Dashboard renders "Loading…", not the heading. This test will pass once Task 3 implements the real Dashboard.

- [ ] **Step 3: Commit the test**

```bash
git add src/__tests__/Admin.test.jsx
git commit -m "test: correct PIN reveals dashboard"
```

---

## Chunk 2: Admin dashboard

### Task 3: Dashboard — load and display teams

**Files:**
- Modify: `src/screens/Admin.jsx` (replace Dashboard placeholder)
- Modify: `src/__tests__/Admin.test.jsx`

The `Dashboard` component fetches all teams and all players on mount, computes per-team player counts client-side, and renders a table.

- [ ] **Step 1: Add failing tests for the dashboard table**

Add a new describe block to `src/__tests__/Admin.test.jsx`. First, update the Supabase mock at the top to return test data. Replace the existing `vi.mock('../lib/supabase', ...)` block with:

```jsx
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
```

Then add:

```jsx
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
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/Admin.test.jsx
```

Expected: FAIL — Dashboard is a placeholder.

- [ ] **Step 3: Implement the Dashboard component**

Replace the `Dashboard` placeholder in `src/screens/Admin.jsx` with:

```jsx
function Dashboard() {
  const [teams, setTeams] = useState([])
  const [playerCounts, setPlayerCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  async function loadData() {
    setLoading(true)
    setLoadError('')
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .not('id', 'is', null)

    if (teamError) { setLoadError('Failed to load teams.'); setLoading(false); return }

    const teamIds = (teamData ?? []).map(t => t.id)
    const { data: playerData, error: playerError } = teamIds.length
      ? await supabase.from('players').select('*').in('team_id', teamIds)
      : { data: [], error: null }

    if (playerError) { setLoadError('Failed to load players.'); setLoading(false); return }

    const counts = {}
    for (const p of playerData ?? []) {
      counts[p.team_id] = (counts[p.team_id] ?? 0) + 1
    }

    setTeams(teamData ?? [])
    setPlayerCounts(counts)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleDelete(teamId) {
    if (!window.confirm('Delete this team and all their scores?')) return
    setDeleting(true)
    setDeleteError('')
    const { error } = await supabase.from('teams').delete().eq('id', teamId)
    if (error) {
      setDeleteError('Delete failed. Try again.')
    } else {
      await loadData()
    }
    setDeleting(false)
  }

  async function handleReset() {
    if (!window.confirm('Delete ALL teams and scores? This cannot be undone.')) return
    setDeleting(true)
    setDeleteError('')
    setResetSuccess(false)
    const { error } = await supabase.from('teams').delete().not('id', 'is', null)
    if (error) {
      setDeleteError('Reset failed. Try again.')
    } else {
      setResetSuccess(true)
      await loadData()
    }
    setDeleting(false)
  }

  if (loading) return <div className="screen"><p className="hint">Loading…</p></div>
  if (loadError) return (
    <div className="screen">
      <p className="error-msg">{loadError}</p>
      <button className="btn btn-secondary" onClick={loadData}>Retry</button>
    </div>
  )

  return (
    <div className="screen">
      <h2>Admin — All Teams</h2>
      {deleteError && <p className="error-msg">{deleteError}</p>}
      {resetSuccess && <p style={{ color: 'var(--success)' }}>All teams deleted.</p>}
      {teams.length === 0 ? (
        <p className="hint">No teams yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                {['Team', 'Holes', 'Players', 'Submitted', 'Created', ''].map(h => (
                  <th key={h} style={th()}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.id}>
                  <td style={td()}>{team.name}</td>
                  <td style={td()}>{team.num_holes}</td>
                  <td style={td()}>{playerCounts[team.id] ?? 0}</td>
                  <td style={td()}>
                    {team.submitted_at ? `✓ ${new Date(team.submitted_at).toLocaleString()}` : '—'}
                  </td>
                  <td style={td()}>{new Date(team.created_at).toLocaleString()}</td>
                  <td style={td()}>
                    <button
                      className="btn btn-secondary"
                      style={{ width: 'auto', display: 'inline-block' }}
                      disabled={deleting}
                      onClick={() => handleDelete(team.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        className="btn btn-secondary"
        disabled={deleting || teams.length === 0}
        onClick={handleReset}
      >
        Reset Event
      </button>
    </div>
  )
}

function th() {
  return { padding: '8px 6px', textAlign: 'left', borderBottom: '1px solid #334155', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }
}
function td() {
  return { padding: '8px 6px', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap' }
}
```

Also add `useEffect` to the imports at the top of `Admin.jsx`:

```jsx
import { useState, useEffect } from 'react'
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/__tests__/Admin.test.jsx
```

Expected: 6 tests pass (including the Task 2 unlock test which now passes for the first time).

- [ ] **Step 5: Commit**

```bash
git add src/screens/Admin.jsx src/__tests__/Admin.test.jsx
git commit -m "feat: admin dashboard loads and displays all teams"
```

---

### Task 4: Delete and Reset Event

**Files:**
- Modify: `src/__tests__/Admin.test.jsx`

The delete and reset logic is already implemented in `Dashboard`. This task adds tests to verify it.

- [ ] **Step 1: Add delete and reset tests**

Append to the `'Admin — dashboard'` describe block:

```jsx
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
    // Button should be re-enabled after failure
    expect(deleteButtons[0]).not.toBeDisabled()
  })
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run src/__tests__/Admin.test.jsx
```

Expected: 9 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/Admin.test.jsx
git commit -m "test: admin delete and reset event"
```

---

## Chunk 3: Route registration and full suite

### Task 5: Register `/admin` route in `App.jsx`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the import and route**

In `src/App.jsx`, add the import after the existing screen imports:

```jsx
import Admin from './screens/Admin'
```

Add the route **before** the `path="*"` wildcard (line 25 in the current file):

```jsx
<Route path="/admin" element={<Admin />} />
```

The Routes block should look like:

```jsx
<Routes>
  <Route path="/" element={<SessionRouter />} />
  <Route path="/setup" element={<TeamSetup />} />
  <Route path="/players" element={<PlayerNames />} />
  <Route path="/scorecard" element={<Scorecard />} />
  <Route path="/review" element={<Review />} />
  <Route path="/leaderboards" element={<Leaderboards />} />
  <Route path="/admin" element={<Admin />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

- [ ] **Step 2: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: register /admin route"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run linter**

```bash
npm run lint
```

Expected: 0 errors (warnings about exhaustive-deps are pre-existing and acceptable).

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit if any lint fixes were needed**

If lint required changes, commit them:

```bash
git add -p
git commit -m "chore: lint fixes"
```

---

**Deployment note (user action required):** Add `VITE_ADMIN_PIN` to your Vercel environment variables, then redeploy.
