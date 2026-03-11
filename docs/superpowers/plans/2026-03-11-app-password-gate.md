# App Password Gate Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block access to the entire app behind a one-time password — once entered correctly, the user is never asked again.

**Architecture:** A `useAppAccess` hook reads/writes an `appUnlocked` flag in localStorage. `App.jsx` checks the hook and renders an `AppPasswordGate` screen if locked, or the normal router if unlocked. If `VITE_APP_PASSWORD` is not set, the gate is skipped entirely (safe for local dev).

**Tech Stack:** React 19, Vite (env vars via `import.meta.env`), localStorage, Vitest + React Testing Library

---

## Chunk 1: Hook and CSS

### Task 1: `useAppAccess` hook

**Files:**
- Create: `src/hooks/useAppAccess.js`
- Create: `src/__tests__/useAppAccess.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/useAppAccess.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppAccess } from '../hooks/useAppAccess'

beforeEach(() => { localStorage.clear() })

describe('useAppAccess', () => {
  it('returns unlocked=false when localStorage has no flag', () => {
    const { result } = renderHook(() => useAppAccess())
    expect(result.current.unlocked).toBe(false)
  })

  it('returns unlocked=true when localStorage flag is set', () => {
    localStorage.setItem('appUnlocked', 'true')
    const { result } = renderHook(() => useAppAccess())
    expect(result.current.unlocked).toBe(true)
  })

  it('unlock() sets localStorage and updates state', () => {
    const { result } = renderHook(() => useAppAccess())
    act(() => { result.current.unlock() })
    expect(result.current.unlocked).toBe(true)
    expect(localStorage.getItem('appUnlocked')).toBe('true')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/useAppAccess.test.js
```

Expected: FAIL — `useAppAccess` not found.

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useAppAccess.js`:

```js
import { useState } from 'react'

const KEY = 'appUnlocked'

export function useAppAccess() {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(KEY) === 'true')

  function unlock() {
    localStorage.setItem(KEY, 'true')
    setUnlocked(true)
  }

  return { unlocked, unlock }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/useAppAccess.test.js
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAppAccess.js src/__tests__/useAppAccess.test.js
git commit -m "feat: add useAppAccess hook"
```

---

### Task 2: Add `input[type="password"]` CSS rule

**Files:**
- Modify: `src/index.css`

The existing `src/index.css` styles `input[type="text"]` and `input[type="number"]` but not `input[type="password"]`. Without this, the password field renders unstyled against the dark background.

- [ ] **Step 1: Add the rule**

In `src/index.css`, find the existing input block (around line 45):

```css
input[type="text"],
input[type="number"] {
```

Add `input[type="password"]` to the selector list:

```css
input[type="text"],
input[type="number"],
input[type="password"] {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 1rem;
  padding: 10px 12px;
}
```

- [ ] **Step 2: Run the full test suite to confirm nothing broke**

```bash
npx vitest run
```

Expected: all existing tests still pass.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: add password input CSS rule"
```

---

## Chunk 2: Component and App integration

### Task 3: `AppPasswordGate` component

**Files:**
- Create: `src/screens/AppPasswordGate.jsx`
- Create: `src/__tests__/AppPasswordGate.test.jsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/AppPasswordGate.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppPasswordGate from '../screens/AppPasswordGate'

beforeEach(() => { localStorage.clear() })
afterEach(() => { vi.unstubAllEnvs() })

describe('AppPasswordGate', () => {
  it('renders the password form', () => {
    vi.stubEnv('VITE_APP_PASSWORD', 'secret')
    render(<AppPasswordGate onUnlock={vi.fn()} />)
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enter/i })).toBeInTheDocument()
  })

  it('shows error and clears input on wrong password', async () => {
    vi.stubEnv('VITE_APP_PASSWORD', 'secret')
    const user = userEvent.setup()
    render(<AppPasswordGate onUnlock={vi.fn()} />)
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /enter/i }))
    expect(screen.getByText(/incorrect password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toHaveValue('')
    expect(screen.getByLabelText(/password/i)).toHaveFocus()
  })

  it('calls onUnlock on correct password', async () => {
    vi.stubEnv('VITE_APP_PASSWORD', 'secret')
    const onUnlock = vi.fn()
    const user = userEvent.setup()
    render(<AppPasswordGate onUnlock={onUnlock} />)
    await user.type(screen.getByLabelText(/password/i), 'secret')
    await user.click(screen.getByRole('button', { name: /enter/i }))
    expect(onUnlock).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/AppPasswordGate.test.jsx
```

Expected: FAIL — component not found.

- [ ] **Step 3: Implement the component**

Create `src/screens/AppPasswordGate.jsx`:

```jsx
import { useState, useRef, useEffect } from 'react'

export default function AppPasswordGate({ onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (value === import.meta.env.VITE_APP_PASSWORD) {
      onUnlock()
    } else {
      setError('Incorrect password')
      setValue('')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="screen" style={{ justifyContent: 'center' }}>
      <div className="card">
        <h1>⛳ Mini-Golf Scorecard</h1>
        <p className="hint">Enter the event password to continue</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={value}
              onChange={e => { setValue(e.target.value); setError('') }}
              ref={inputRef}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary">Enter</button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/AppPasswordGate.test.jsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/screens/AppPasswordGate.jsx src/__tests__/AppPasswordGate.test.jsx
git commit -m "feat: add AppPasswordGate component"
```

---

### Task 4: Wire `App.jsx` and add App-level tests

**Files:**
- Modify: `src/App.jsx`
- Create: `src/__tests__/AppAccess.test.jsx`

- [ ] **Step 1: Write the failing App-level tests**

Create `src/__tests__/AppAccess.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/AppAccess.test.jsx
```

Expected: FAIL — App does not yet render the gate.

- [ ] **Step 3: Update `App.jsx`**

Replace the contents of `src/App.jsx`:

```jsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import { useAppAccess } from './hooks/useAppAccess'
import AppPasswordGate from './screens/AppPasswordGate'
import TeamSetup from './screens/TeamSetup'
import PlayerNames from './screens/PlayerNames'
import Scorecard from './screens/Scorecard'
import Review from './screens/Review'
import Leaderboards from './screens/Leaderboards'

function SessionRouter() {
  const { teamId } = useSession()
  return <Navigate to={teamId ? '/scorecard' : '/setup'} replace />
}

export default function App() {
  const { unlocked, unlock } = useAppAccess()
  const password = import.meta.env.VITE_APP_PASSWORD

  if (password && !unlocked) {
    return <AppPasswordGate onUnlock={unlock} />
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SessionRouter />} />
        <Route path="/setup" element={<TeamSetup />} />
        <Route path="/players" element={<PlayerNames />} />
        <Route path="/scorecard" element={<Scorecard />} />
        <Route path="/review" element={<Review />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
```

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass (including the 3 new App-level tests).

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/__tests__/AppAccess.test.jsx
git commit -m "feat: gate entire app behind VITE_APP_PASSWORD"
```
