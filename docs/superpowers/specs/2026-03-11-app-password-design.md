# App Password Gate Design

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** A one-time password gate that blocks access to the entire app until the correct password is entered. Once unlocked, the user never sees the gate again.

---

## Architecture

A `useAppAccess` hook manages unlock state using localStorage. `App.jsx` checks the hook and renders either the password screen or the normal `<HashRouter>` + routes. No route changes needed.

## Hook: `useAppAccess`

```js
// src/hooks/useAppAccess.js
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

A full-screen layout using `className="screen"` with a centred `className="card"`:

- `<h1>⛳ Mini-Golf Scorecard</h1>`
- `<p className="hint">Enter the event password to continue</p>`
- `<input type="password">` for the password field
- `<button className="btn btn-primary">Enter</button>`
- `<p className="error-msg">` shown on wrong password, hidden otherwise

On submit:
- Compare entered value to `import.meta.env.VITE_APP_PASSWORD` using `===` (string comparison)
- Correct: call `onUnlock()`, gate disappears, app renders
- Wrong: show error message "Incorrect password", clear the input

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

  Use `vi.stubEnv('VITE_APP_PASSWORD', 'secret')` to set the password in tests and `vi.unstubAllEnvs()` in `afterEach`. Use `localStorage.setItem('appUnlocked', 'true')` / `localStorage.clear()` in test setup as needed.

## Modified Files

- `src/App.jsx` — import `useAppAccess` and `AppPasswordGate`, wrap router with gate check
- Vercel deployment — add `VITE_APP_PASSWORD` env var (user action)
