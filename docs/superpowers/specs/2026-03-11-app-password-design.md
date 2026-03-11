# App Password Gate Design

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** A one-time password gate that blocks access to the entire app until the correct password is entered. Once unlocked, the user never sees the gate again.

---

## Architecture

A `useAppAccess` hook manages unlock state using localStorage. `App.jsx` checks the hook and renders either the password screen or the normal `<HashRouter>` + routes. No route changes needed.

## Hook: `useAppAccess`

```js
// src/hooks/useAppAccess.js
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

## App.jsx Integration

```jsx
function App() {
  const { unlocked, unlock } = useAppAccess()
  const password = import.meta.env.VITE_APP_PASSWORD

  if (password && !unlocked) {
    return <AppPasswordGate onUnlock={unlock} />
  }

  return (
    <HashRouter>
      <Routes>...</Routes>
    </HashRouter>
  )
}
```

If `VITE_APP_PASSWORD` is not set (empty/undefined), the gate is skipped — the app renders normally. This ensures local development works without configuration.

## Password Gate Screen

`AppPasswordGate` reads `import.meta.env.VITE_APP_PASSWORD` internally (not via prop) and compares the entered value against it.

A full-screen layout: `<div className="screen" style={{ justifyContent: 'center' }}>` (inline style on this component only — do not modify the shared `.screen` CSS class) containing a `className="card"`:

- `<h1>⛳ Mini-Golf Scorecard</h1>`
- Wrap input and button in a `<form onSubmit={handleSubmit}>` so pressing Enter submits
- `<label htmlFor="password">Password</label>` paired with `<input id="password" type="password">`
- `<button className="btn btn-primary">Enter</button>`
- `<p className="error-msg">` shown on wrong password, hidden otherwise

`index.css` must add an `input[type="password"]` rule matching `input[type="text"]` so the field inherits the dark-theme styling.

On submit:
- Compare entered value to `import.meta.env.VITE_APP_PASSWORD` using `===` (string comparison)
- Correct: call `onUnlock()`, gate disappears, app renders
- Wrong: show error "Incorrect password", clear the input, return focus to the input

## Password Checking

- Compare as strings with `===`
- `VITE_APP_PASSWORD` is always a string from `import.meta.env`
- Use `type="password"` input (masks entry, no leading-zero issue since this is a text password not a PIN)

## Persistence

- On unlock, `localStorage.setItem('appUnlocked', 'true')` is called via the hook
- On subsequent visits, `localStorage.getItem('appUnlocked') === 'true'` skips the gate entirely
- No expiry — access persists until localStorage is cleared

## Env Var Behaviour

| `VITE_APP_PASSWORD` | `appUnlocked` in localStorage | Result |
|---|---|---|
| Not set | Any | Gate skipped, app renders |
| Set | `'true'` | Gate skipped, app renders |
| Set | Missing/other | Password gate shown |

## Styling

Use existing CSS classes: `className="screen"`, `className="card"`, `className="btn btn-primary"`, `className="error-msg"`, `className="hint"`. The card should be centred vertically using `justifyContent: 'center'` on the screen's flex column.

## New Files

- `src/hooks/useAppAccess.js` — unlock state hook
- `src/screens/AppPasswordGate.jsx` — password screen component
- `src/__tests__/AppPasswordGate.test.jsx` — tests covering:
  - Password gate renders when `VITE_APP_PASSWORD` is set and storage is not unlocked
  - Gate is skipped when `VITE_APP_PASSWORD` is not set
  - Gate is skipped when `appUnlocked` is already `'true'` in localStorage
  - Wrong password shows error message
  - Correct password calls `onUnlock` and sets localStorage

  Test component targeting:
  - Tests for wrong/correct password behaviour: render `<AppPasswordGate onUnlock={mockFn} />` directly (stub the env var so the component has a password to compare against)
  - Tests for "gate skipped when env var not set" and "gate skipped when already unlocked": render `<App />` (these conditions are evaluated in `App`, not in `AppPasswordGate`)

  Use `vi.stubEnv('VITE_APP_PASSWORD', 'secret')` to set the password in tests and `vi.unstubAllEnvs()` in `afterEach`. Use `localStorage.clear()` in `beforeEach` (matching the pattern in `useSession.test.js`) to prevent test-order contamination.

  Note: `AppPasswordGate` reads `import.meta.env.VITE_APP_PASSWORD` internally to avoid threading the password string as a prop (which would expose it in React DevTools). `App` reads the same var independently to decide whether to render the gate at all.

## Modified Files

- `src/App.jsx` — import `useAppAccess` and `AppPasswordGate`, wrap router with gate check
- Vercel deployment — add `VITE_APP_PASSWORD` env var (user action)
