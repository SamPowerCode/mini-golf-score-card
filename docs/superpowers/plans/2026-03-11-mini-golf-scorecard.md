# Mini-Golf Scorecard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first React web app where mini-golf teams self-register, track scores on a scrollable grid, submit when done, and view leaderboards.

**Architecture:** React + Vite frontend using HashRouter (no server config needed on Vercel). Supabase handles all data persistence via its JS client. No custom backend. Session continuity via `localStorage`.

**Tech Stack:** React 18, Vite, Vitest, React Testing Library, @supabase/supabase-js, react-router-dom (HashRouter)

---

## File Structure

```
/
├── index.html
├── vite.config.js              # Vite + Vitest config
├── package.json
├── .env.example                # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── supabase/
│   └── schema.sql              # Run once in Supabase SQL editor
├── src/
│   ├── main.jsx                # Entry point
│   ├── App.jsx                 # HashRouter + routes + session resume logic
│   ├── index.css               # Mobile-first global styles
│   ├── lib/
│   │   └── supabase.js         # Supabase client singleton
│   ├── hooks/
│   │   └── useSession.js       # Read/write team ID in localStorage
│   ├── components/
│   │   ├── NavBar.jsx          # Top nav with Leaderboards link
│   │   └── ScorecardGrid.jsx   # Reusable player×hole grid (editable or read-only)
│   └── screens/
│       ├── TeamSetup.jsx       # Screen 1
│       ├── PlayerNames.jsx     # Screen 2
│       ├── Scorecard.jsx       # Screen 3
│       ├── Review.jsx          # Screen 4
│       └── Leaderboards.jsx    # Screen 5
│   └── __tests__/
│       ├── useSession.test.js
│       ├── ScorecardGrid.test.jsx
│       ├── TeamSetup.test.jsx
│       ├── PlayerNames.test.jsx
│       ├── Scorecard.test.jsx
│       ├── Review.test.jsx
│       └── Leaderboards.test.jsx
```

---

## Chunk 1: Project Setup

### Task 1: Scaffold Vite React project and install dependencies

**Files:**
- Create: `vite.config.js`
- Create: `package.json`
- Create: `.env.example`
- Create: `src/main.jsx`
- Create: `index.html`

- [ ] **Step 1: Scaffold the project**

Run inside the repo root (existing files like `spec.md` will remain):

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm create vite@latest . -- --template react --yes
```

If prompted about existing files, choose to ignore/keep them.

- [ ] **Step 2: Install runtime dependencies**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm install @supabase/supabase-js react-router-dom
```

- [ ] **Step 3: Install dev/test dependencies**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 4: Replace `vite.config.js` with Vitest config included**

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
  },
})
```

- [ ] **Step 5: Create test setup file**

```js
// src/test-setup.js
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test script to package.json**

Edit `package.json` to add to the `"scripts"` section:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 7: Create `.env.example`**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 8: Create `.env.local` (not committed) with real values**

Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key. You can find these in the Supabase dashboard under Project Settings → API.

- [ ] **Step 9: Add `.env.local` to `.gitignore`**

Check that `.gitignore` (auto-created by Vite) includes `.env.local`. It should already be there.

- [ ] **Step 10: Verify setup runs**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run
```

Expected: no test files found yet, exits 0 (or with "no tests" message — that's fine).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold vite react project with vitest"
```

---

### Task 2: Create Supabase schema and client

**Files:**
- Create: `supabase/schema.sql`
- Create: `src/lib/supabase.js`
- Create: `src/__tests__/supabase.test.js`

- [ ] **Step 1: Create the schema SQL file**

```sql
-- supabase/schema.sql
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor)

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  num_holes integer not null check (num_holes between 1 and 36),
  created_at timestamptz default now(),
  submitted_at timestamptz
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  hole_number integer not null check (hole_number >= 1),
  strokes integer not null check (strokes >= 1),
  unique (player_id, hole_number)
);
```

- [ ] **Step 2: Run the schema in Supabase**

Open the Supabase dashboard → SQL Editor → paste and run `supabase/schema.sql`. Verify the three tables appear in Table Editor.

- [ ] **Step 3: Write the failing test for the Supabase client**

```js
// src/__tests__/supabase.test.js
import { describe, it, expect } from 'vitest'
import { supabase } from '../lib/supabase'

describe('supabase client', () => {
  it('is defined', () => {
    expect(supabase).toBeDefined()
  })

  it('exposes a from() method', () => {
    expect(typeof supabase.from).toBe('function')
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/supabase.test.js
```

Expected: FAIL — "Cannot find module '../lib/supabase'"

- [ ] **Step 5: Create the Supabase client**

```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key)
```

- [ ] **Step 6: Run test to verify it passes**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/supabase.test.js
```

Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add supabase/schema.sql src/lib/supabase.js src/__tests__/supabase.test.js
git commit -m "feat: add supabase schema and client"
```

---

### Task 3: App shell with routing and session resume

**Files:**
- Create: `src/hooks/useSession.js`
- Create: `src/__tests__/useSession.test.js`
- Modify: `src/App.jsx`
- Modify: `src/main.jsx`
- Create: `src/index.css`

- [ ] **Step 1: Write failing tests for useSession hook**

```js
// src/__tests__/useSession.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSession } from '../hooks/useSession'

beforeEach(() => {
  localStorage.clear()
})

describe('useSession', () => {
  it('returns null teamId when localStorage is empty', () => {
    const { result } = renderHook(() => useSession())
    expect(result.current.teamId).toBeNull()
  })

  it('setTeamId stores teamId in localStorage', () => {
    const { result } = renderHook(() => useSession())
    act(() => result.current.setTeamId('abc-123'))
    expect(localStorage.getItem('teamId')).toBe('abc-123')
    expect(result.current.teamId).toBe('abc-123')
  })

  it('clearSession removes teamId from localStorage', () => {
    localStorage.setItem('teamId', 'abc-123')
    const { result } = renderHook(() => useSession())
    act(() => result.current.clearSession())
    expect(localStorage.getItem('teamId')).toBeNull()
    expect(result.current.teamId).toBeNull()
  })

  it('reads existing teamId from localStorage on mount', () => {
    localStorage.setItem('teamId', 'existing-id')
    const { result } = renderHook(() => useSession())
    expect(result.current.teamId).toBe('existing-id')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/useSession.test.js
```

Expected: FAIL — "Cannot find module '../hooks/useSession'"

- [ ] **Step 3: Implement useSession**

```js
// src/hooks/useSession.js
import { useState } from 'react'

const KEY = 'teamId'

export function useSession() {
  const [teamId, setTeamIdState] = useState(() => localStorage.getItem(KEY))

  function setTeamId(id) {
    localStorage.setItem(KEY, id)
    setTeamIdState(id)
  }

  function clearSession() {
    localStorage.removeItem(KEY)
    setTeamIdState(null)
  }

  return { teamId, setTeamId, clearSession }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/useSession.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: Create App.jsx with routing**

```jsx
// src/App.jsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import TeamSetup from './screens/TeamSetup'
import PlayerNames from './screens/PlayerNames'
import Scorecard from './screens/Scorecard'
import Review from './screens/Review'
import Leaderboards from './screens/Leaderboards'

function SessionRouter() {
  const { teamId } = useSession()
  // Default route: if no session go to setup, otherwise session screens handle their own redirect
  return <Navigate to={teamId ? '/scorecard' : '/setup'} replace />
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SessionRouter />} />
        <Route path="/setup" element={<TeamSetup />} />
        <Route path="/players" element={<PlayerNames />} />
        <Route path="/scorecard" element={<Scorecard />} />
        <Route path="/review" element={<Review />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
      </Routes>
    </HashRouter>
  )
}
```

- [ ] **Step 6: Create placeholder screen components (so routing compiles)**

Create each of these with a minimal placeholder — they will be filled in later tasks:

```jsx
// src/screens/TeamSetup.jsx
export default function TeamSetup() { return <div>Team Setup</div> }
```

```jsx
// src/screens/PlayerNames.jsx
export default function PlayerNames() { return <div>Player Names</div> }
```

```jsx
// src/screens/Scorecard.jsx
export default function Scorecard() { return <div>Scorecard</div> }
```

```jsx
// src/screens/Review.jsx
export default function Review() { return <div>Review</div> }
```

```jsx
// src/screens/Leaderboards.jsx
export default function Leaderboards() { return <div>Leaderboards</div> }
```

- [ ] **Step 7: Update main.jsx**

```jsx
// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 8: Create index.css with mobile-first base styles**

```css
/* src/index.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0f172a;
  --surface: #1e293b;
  --border: #334155;
  --accent: #7c3aed;
  --accent-hover: #6d28d9;
  --text: #f1f5f9;
  --text-secondary: #94a3b8;
  --danger: #ef4444;
  --success: #22c55e;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 16px;
  min-height: 100dvh;
}

.screen {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

h1 { font-size: 1.5rem; font-weight: 700; }
h2 { font-size: 1.25rem; font-weight: 600; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}

label { display: block; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 6px; }

input[type="text"],
input[type="number"] {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 1rem;
  padding: 10px 12px;
}

input:focus { outline: 2px solid var(--accent); border-color: transparent; }

.btn {
  display: block;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary { background: var(--accent); color: white; }
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:disabled { background: var(--border); cursor: not-allowed; }

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.error-msg { color: var(--danger); font-size: 0.875rem; }
.hint { color: var(--text-secondary); font-size: 0.875rem; }
```

- [ ] **Step 9: Verify dev server starts**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run dev
```

Expected: server starts at http://localhost:5173, no console errors. Stop with Ctrl+C.

- [ ] **Step 10: Commit**

```bash
git add src/
git commit -m "feat: add routing shell, useSession hook, and base styles"
```

---

## Chunk 2: Team Setup + Player Names

### Task 4: TeamSetup screen

**Files:**
- Modify: `src/screens/TeamSetup.jsx`
- Create: `src/__tests__/TeamSetup.test.jsx`

- [ ] **Step 1: Write failing tests**

```jsx
// src/__tests__/TeamSetup.test.jsx
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/TeamSetup.test.jsx
```

Expected: FAIL — tests can't find labels/buttons on placeholder component.

- [ ] **Step 3: Implement TeamSetup screen**

```jsx
// src/screens/TeamSetup.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'

export default function TeamSetup() {
  const navigate = useNavigate()
  const { setTeamId } = useSession()
  const [name, setName] = useState('')
  const [players, setPlayers] = useState('')
  const [holes, setHoles] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isReady = name.trim() && players && holes

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const p = parseInt(players, 10)
    const h = parseInt(holes, 10)
    if (p < 1 || p > 20) { setError('Number of players must be between 1 and 20'); return }
    if (h < 1 || h > 36) { setError('Number of holes must be between 1 and 36'); return }

    setLoading(true)
    const { data, error: dbError } = await supabase
      .from('teams')
      .insert({ name: name.trim(), num_holes: h })
      .select()
      .single()

    if (dbError) { setError('Failed to create team. Try again.'); setLoading(false); return }

    setTeamId(data.id)
    // Store player count for PlayerNames screen
    sessionStorage.setItem('numPlayers', String(p))
    navigate('/players')
  }

  return (
    <div className="screen">
      <h1>Mini-Golf Scorecard</h1>
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label htmlFor="teamName">Team name</label>
          <input
            id="teamName"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. The Eagles"
          />
        </div>
        <div>
          <label htmlFor="numPlayers">Number of players</label>
          <input
            id="numPlayers"
            type="number"
            min={1}
            max={20}
            value={players}
            onChange={e => setPlayers(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="numHoles">Number of holes</label>
          <input
            id="numHoles"
            type="number"
            min={1}
            max={36}
            value={holes}
            onChange={e => setHoles(e.target.value)}
          />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={!isReady || loading}>
          {loading ? 'Creating…' : 'Next →'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/TeamSetup.test.jsx
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/screens/TeamSetup.jsx src/__tests__/TeamSetup.test.jsx
git commit -m "feat: implement TeamSetup screen"
```

---

### Task 5: PlayerNames screen

**Files:**
- Modify: `src/screens/PlayerNames.jsx`
- Create: `src/__tests__/PlayerNames.test.jsx`

- [ ] **Step 1: Write failing tests**

```jsx
// src/__tests__/PlayerNames.test.jsx
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/PlayerNames.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Implement PlayerNames screen**

```jsx
// src/screens/PlayerNames.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'

export default function PlayerNames() {
  const navigate = useNavigate()
  const { teamId } = useSession()
  const numPlayersRaw = sessionStorage.getItem('numPlayers')
  const numPlayers = parseInt(numPlayersRaw || '1', 10)

  useEffect(() => {
    if (!teamId || !numPlayersRaw) navigate('/setup')
  }, [])
  const [names, setNames] = useState(() => Array(numPlayers).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const allFilled = names.every(n => n.trim().length > 0)

  function updateName(i, value) {
    setNames(prev => prev.map((n, idx) => idx === i ? value : n))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const rows = names.map(name => ({ team_id: teamId, name: name.trim() }))
    const { error: dbError } = await supabase.from('players').insert(rows)
    if (dbError) { setError('Failed to save players. Try again.'); setLoading(false); return }
    navigate('/scorecard')
  }

  return (
    <div className="screen">
      <h1>Player Names</h1>
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {names.map((name, i) => (
          <div key={i}>
            <label htmlFor={`player-${i}`}>Player {i + 1}</label>
            <input
              id={`player-${i}`}
              type="text"
              value={name}
              onChange={e => updateName(i, e.target.value)}
              placeholder={`Player ${i + 1} name`}
            />
          </div>
        ))}
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={!allFilled || loading}>
          {loading ? 'Saving…' : 'Start Scoring →'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/PlayerNames.test.jsx
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/screens/PlayerNames.jsx src/__tests__/PlayerNames.test.jsx
git commit -m "feat: implement PlayerNames screen"
```

---

## Chunk 3: Scorecard

### Task 6: ScorecardGrid component

**Files:**
- Create: `src/components/ScorecardGrid.jsx`
- Create: `src/__tests__/ScorecardGrid.test.jsx`

- [ ] **Step 1: Write failing tests**

```jsx
// src/__tests__/ScorecardGrid.test.jsx
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
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/ScorecardGrid.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Implement ScorecardGrid**

```jsx
// src/components/ScorecardGrid.jsx
// scores shape: { [playerId]: { [holeNumber]: strokes } }

export default function ScorecardGrid({ players, numHoles, scores, onScoreChange, readOnly }) {
  const holes = Array.from({ length: numHoles }, (_, i) => i + 1)

  function getScore(playerId, hole) {
    return scores[playerId]?.[hole] ?? null
  }

  function playerTotal(playerId) {
    return holes.reduce((sum, h) => sum + (scores[playerId]?.[h] ?? 0), 0)
  }

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: '100%', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            <th style={th({ sticky: true })}>Player</th>
            {holes.map(h => <th key={h} style={th()}>{h}</th>)}
            <th style={th()}>Total</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => (
            <tr key={player.id}>
              <td style={td({ sticky: true, bold: true })}>{player.name}</td>
              {holes.map(h => {
                const val = getScore(player.id, h)
                return (
                  <td key={h} style={td()}>
                    {readOnly ? (
                      <span>{val ?? '—'}</span>
                    ) : (
                      <ScoreCell
                        value={val}
                        onChange={newVal => onScoreChange(player.id, h, newVal)}
                      />
                    )}
                  </td>
                )
              })}
              <td style={td({ bold: true })}>{playerTotal(player.id) || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScoreCell({ value, onChange }) {
  if (value === null) {
    return (
      <button
        style={cellBtn('#334155')}
        onClick={() => onChange(1)}
        aria-label="set score"
      >
        —
      </button>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
      <button style={cellBtn('#1e293b')} onClick={() => onChange(Math.max(1, value - 1))} aria-label="-">−</button>
      <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 600 }}>{value}</span>
      <button style={cellBtn('#1e293b')} onClick={() => onChange(value + 1)} aria-label="+">+</button>
    </div>
  )
}

function th({ sticky } = {}) {
  return {
    padding: '8px 6px',
    textAlign: 'center',
    borderBottom: '1px solid #334155',
    color: '#94a3b8',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    ...(sticky ? { position: 'sticky', left: 0, background: '#0f172a', zIndex: 1, textAlign: 'left' } : {}),
  }
}

function td({ sticky, bold } = {}) {
  return {
    padding: '6px 4px',
    textAlign: 'center',
    borderBottom: '1px solid #1e293b',
    whiteSpace: 'nowrap',
    ...(sticky ? { position: 'sticky', left: 0, background: '#0f172a', zIndex: 1, textAlign: 'left', fontWeight: 600 } : {}),
    ...(bold ? { fontWeight: 700 } : {}),
  }
}

function cellBtn(bg) {
  return {
    background: bg,
    border: 'none',
    color: 'white',
    width: 26,
    height: 26,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.9rem',
    lineHeight: 1,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/ScorecardGrid.test.jsx
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ScorecardGrid.jsx src/__tests__/ScorecardGrid.test.jsx
git commit -m "feat: implement ScorecardGrid component"
```

---

### Task 7: NavBar component

**Files:**
- Create: `src/components/NavBar.jsx`
- Create: `src/__tests__/NavBar.test.jsx`

- [ ] **Step 1: Write failing test for NavBar conditional rendering**

```jsx
// src/__tests__/NavBar.test.jsx
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/NavBar.test.jsx
```

Expected: FAIL — "Cannot find module '../components/NavBar'"

- [ ] **Step 3: Implement NavBar**

```jsx
// src/components/NavBar.jsx
import { Link } from 'react-router-dom'

export default function NavBar({ showLeaderboards = false }) {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid #334155',
    }}>
      <span style={{ fontWeight: 700, fontSize: '1rem' }}>⛳ Scorecard</span>
      {showLeaderboards && (
        <Link
          to="/leaderboards"
          style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}
        >
          Leaderboards →
        </Link>
      )}
    </nav>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/NavBar.test.jsx
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/NavBar.jsx src/__tests__/NavBar.test.jsx
git commit -m "feat: add NavBar component"
```

---

### Task 8: Scorecard screen

**Files:**
- Modify: `src/screens/Scorecard.jsx`
- Create: `src/__tests__/Scorecard.test.jsx`

- [ ] **Step 1: Write failing tests**

```jsx
// src/__tests__/Scorecard.test.jsx
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

  it('"Finish & Review" button is disabled when scores are incomplete', async () => {
    renderScorecard()
    await waitFor(() => screen.getByText('Alice'))
    expect(screen.getByRole('button', { name: /finish/i })).toBeDisabled()
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/Scorecard.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Implement Scorecard screen**

```jsx
// src/screens/Scorecard.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'
import ScorecardGrid from '../components/ScorecardGrid'
import NavBar from '../components/NavBar'

export default function Scorecard() {
  const navigate = useNavigate()
  const { teamId } = useSession()
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState([])
  // scores shape: { [playerId]: { [hole]: strokes } }
  const [scores, setScores] = useState({})
  const [saveError, setSaveError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!teamId) { navigate('/setup'); return }
    loadData()
  }, [teamId])

  async function loadData() {
    const [{ data: teamData }, { data: playerData }] = await Promise.all([
      supabase.from('teams').select('*').eq('id', teamId).single(),
      supabase.from('players').select('*').eq('team_id', teamId),
    ])
    if (!teamData) { navigate('/setup'); return }
    if (teamData.submitted_at) { navigate('/leaderboards'); return }
    setTeam(teamData)
    setPlayers(playerData ?? [])

    const playerIds = (playerData ?? []).map(p => p.id)
    if (playerIds.length > 0) {
      const { data: scoreData } = await supabase.from('scores').select('*').in('player_id', playerIds)
      setScores(buildScoresMap(scoreData ?? []))
    }
    setLoading(false)
  }

  function buildScoresMap(rows) {
    const map = {}
    for (const row of rows) {
      if (!map[row.player_id]) map[row.player_id] = {}
      map[row.player_id][row.hole_number] = row.strokes
    }
    return map
  }

  const handleScoreChange = useCallback(async (playerId, hole, strokes) => {
    setSaveError('')
    setScores(prev => ({
      ...prev,
      [playerId]: { ...(prev[playerId] ?? {}), [hole]: strokes }
    }))
    const { error } = await supabase.from('scores').upsert(
      { player_id: playerId, hole_number: hole, strokes },
      { onConflict: 'player_id,hole_number' }
    )
    if (error) setSaveError('Save failed — tap the cell again to retry')
  }, [])

  function allScoresFilled() {
    if (!team || players.length === 0) return false
    return players.every(p =>
      Array.from({ length: team.num_holes }, (_, i) => i + 1)
        .every(h => (scores[p.id]?.[h] ?? 0) >= 1)
    )
  }

  if (loading) return <div className="screen"><p className="hint">Loading…</p></div>

  return (
    <div className="screen">
      <NavBar showLeaderboards />
      <h2>{team?.name}</h2>
      <ScorecardGrid
        players={players}
        numHoles={team?.num_holes ?? 0}
        scores={scores}
        onScoreChange={handleScoreChange}
        readOnly={false}
      />
      {!allScoresFilled() && (
        <p className="hint" style={{ fontSize: '0.8rem' }}>Fill all scores to continue</p>
      )}
      {saveError && <p className="error-msg">{saveError}</p>}
      <button
        className="btn btn-primary"
        disabled={!allScoresFilled()}
        onClick={() => navigate('/review')}
      >
        Finish &amp; Review →
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/Scorecard.test.jsx
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/screens/Scorecard.jsx src/__tests__/Scorecard.test.jsx
git commit -m "feat: implement Scorecard screen"
```

---

## Chunk 4: Review, Leaderboards, and Deployment

### Task 9: Review screen

**Files:**
- Modify: `src/screens/Review.jsx`
- Create: `src/__tests__/Review.test.jsx`

- [ ] **Step 1: Write failing tests**

```jsx
// src/__tests__/Review.test.jsx
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

  it('navigates to leaderboards after submit', async () => {
    const user = userEvent.setup()
    renderReview()
    await waitFor(() => screen.getByText('Alice'))
    await user.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(screen.getByText('Leaderboards screen')).toBeInTheDocument())
    expect(mockUpdate).toHaveBeenCalledWith('id', 'team-1')
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/Review.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Implement Review screen**

```jsx
// src/screens/Review.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'
import ScorecardGrid from '../components/ScorecardGrid'
import NavBar from '../components/NavBar'

export default function Review() {
  const navigate = useNavigate()
  const { teamId } = useSession()
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!teamId) { navigate('/setup'); return }
    loadData()
  }, [teamId])

  async function loadData() {
    const [{ data: teamData }, { data: playerData }] = await Promise.all([
      supabase.from('teams').select('*').eq('id', teamId).single(),
      supabase.from('players').select('*').eq('team_id', teamId),
    ])
    setTeam(teamData)
    setPlayers(playerData ?? [])
    const playerIds = (playerData ?? []).map(p => p.id)
    if (playerIds.length > 0) {
      const { data: scoreData } = await supabase.from('scores').select('*').in('player_id', playerIds)
      setScores(buildScoresMap(scoreData ?? []))
    }
    setLoading(false)
  }

  function buildScoresMap(rows) {
    const map = {}
    for (const row of rows) {
      if (!map[row.player_id]) map[row.player_id] = {}
      map[row.player_id][row.hole_number] = row.strokes
    }
    return map
  }

  function teamTotal() {
    return players.reduce((sum, p) =>
      sum + Object.values(scores[p.id] ?? {}).reduce((s, v) => s + v, 0), 0)
  }

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    const { error: dbError } = await supabase
      .from('teams')
      .update({ submitted_at: new Date().toISOString() })
      .eq('id', teamId)
    if (dbError) { setError('Submit failed. Try again.'); setSubmitting(false); return }
    navigate('/leaderboards')
  }

  if (loading) return <div className="screen"><p className="hint">Loading…</p></div>

  return (
    <div className="screen">
      <NavBar showLeaderboards />
      <h2>Review Scores — {team?.name}</h2>
      <ScorecardGrid
        players={players}
        numHoles={team?.num_holes ?? 0}
        scores={scores}
        onScoreChange={() => {}}
        readOnly={true}
      />
      <div className="card" style={{ textAlign: 'center' }}>
        <p className="hint">Team total</p>
        <p style={{ fontSize: '2rem', fontWeight: 700 }}>{teamTotal()}</p>
      </div>
      {error && <p className="error-msg">{error}</p>}
      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? 'Submitting…' : 'Submit Scores ✓'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/Review.test.jsx
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/screens/Review.jsx src/__tests__/Review.test.jsx
git commit -m "feat: implement Review screen"
```

---

### Task 10: Leaderboards screen

**Files:**
- Modify: `src/screens/Leaderboards.jsx`
- Create: `src/__tests__/Leaderboards.test.jsx`

- [ ] **Step 1: Write failing tests**

```jsx
// src/__tests__/Leaderboards.test.jsx
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

vi.mock('../hooks/useSession', () => ({
  useSession: () => ({ teamId: 't1', setTeamId: vi.fn(), clearSession: vi.fn() })
}))

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
```

- [ ] **Step 2: Run to verify they fail**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/Leaderboards.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Implement Leaderboards screen**

```jsx
// src/screens/Leaderboards.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import NavBar from '../components/NavBar'

export default function Leaderboards() {
  const [teamBoard, setTeamBoard] = useState([])
  const [playerBoard, setPlayerBoard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    // Load only submitted teams
    const { data: teams } = await supabase
      .from('teams')
      .select('*')
      .not('submitted_at', 'is', null)

    if (!teams?.length) { setLoading(false); return }

    const teamIds = teams.map(t => t.id)
    const { data: players } = await supabase.from('players').select('*').in('team_id', teamIds)
    const playerIds = (players ?? []).map(p => p.id)
    const { data: scores } = playerIds.length
      ? await supabase.from('scores').select('*').in('player_id', playerIds)
      : { data: [] }

    // Build player totals
    const playerTotals = {}
    for (const s of scores ?? []) {
      playerTotals[s.player_id] = (playerTotals[s.player_id] ?? 0) + s.strokes
    }

    // Build team totals
    const teamTotals = {}
    for (const p of players ?? []) {
      teamTotals[p.team_id] = (teamTotals[p.team_id] ?? 0) + (playerTotals[p.id] ?? 0)
    }

    const sortedTeams = teams
      .map(t => ({ ...t, total: teamTotals[t.id] ?? 0 }))
      .sort((a, b) => a.total - b.total)

    const sortedPlayers = (players ?? [])
      .map(p => ({
        ...p,
        total: playerTotals[p.id] ?? 0,
        teamName: teams.find(t => t.id === p.team_id)?.name ?? '',
      }))
      .sort((a, b) => a.total - b.total)

    setTeamBoard(sortedTeams)
    setPlayerBoard(sortedPlayers)
    setLoading(false)
  }

  if (loading) return <div className="screen"><p className="hint">Loading…</p></div>

  return (
    <div className="screen">
      <NavBar />
      <h2>Team Leaderboard</h2>
      <LeaderTable rows={teamBoard} cols={['Team', 'Total']} getValue={r => [r.name, r.total]} />

      <h2 style={{ marginTop: 8 }}>Player Leaderboard</h2>
      <LeaderTable rows={playerBoard} cols={['Player', 'Team', 'Total']} getValue={r => [r.name, r.teamName, r.total]} />

      {teamBoard.length === 0 && (
        <p className="hint">No teams have submitted yet. Check back soon!</p>
      )}
    </div>
  )
}

function LeaderTable({ rows, cols, getValue }) {
  if (!rows.length) return null
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
      <thead>
        <tr>
          <th style={th()}>#</th>
          {cols.map(c => <th key={c} style={th()}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const vals = getValue(row)
          return (
            <tr key={row.id} style={i === 0 ? { background: '#1e293b' } : {}}>
              <td style={td()}>{i + 1}</td>
              {vals.map((v, j) => <td key={j} style={td(j === vals.length - 1)}>{v}</td>)}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function th() {
  return { padding: '8px 6px', textAlign: 'left', borderBottom: '1px solid #334155', color: '#94a3b8', fontWeight: 600 }
}
function td(bold = false) {
  return { padding: '8px 6px', borderBottom: '1px solid #1e293b', fontWeight: bold ? 700 : 400 }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run -- src/__tests__/Leaderboards.test.jsx
```

Expected: PASS (4 tests)

- [ ] **Step 5: Run full test suite**

```bash
export PATH="/home/sam/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npm run test:run
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/screens/Leaderboards.jsx src/__tests__/Leaderboards.test.jsx
git commit -m "feat: implement Leaderboards screen"
```

---

### Task 11: Deployment to Vercel

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json for SPA routing**

HashRouter handles all routing client-side, so this is minimal:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Push to GitHub**

```bash
git add vercel.json
git commit -m "chore: add vercel config"
git push origin main
```

- [ ] **Step 3: Deploy to Vercel**

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import the GitHub repo
3. Vercel auto-detects Vite — no build config needed
4. Before deploying, add Environment Variables:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
5. Click Deploy

- [ ] **Step 4: Verify deployment**

Open the Vercel URL on a phone browser. Run through the full flow:
1. Create a team
2. Add player names
3. Enter scores on the grid
4. Review and submit
5. View leaderboards

- [ ] **Step 5: Share URL with teams**

The Vercel URL (e.g. `https://mini-golf-scorecard.vercel.app`) is what teams open on their phones. No login required.
