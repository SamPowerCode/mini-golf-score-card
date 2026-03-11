# Admin Panel Design

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** A PIN-protected admin screen for the event organiser to view all teams and delete them individually or all at once.

---

## Architecture

A new route `/#/admin` added to the existing React SPA. No new backend, no schema changes — team deletion cascades to players and scores via existing foreign keys. The PIN is stored as `VITE_ADMIN_PIN` in Vercel environment variables and checked client-side.

## Screen Flow

1. User navigates to `/#/admin` manually
2. PIN gate renders: a text input (with `inputMode="numeric"`) and a Submit button
3. On wrong PIN: inline error message, input cleared
4. On correct PIN: PIN gate replaced by admin dashboard in the same screen
5. Unlocked state is component state only — navigating away re-locks it

## PIN Handling

- Use `<input type="text" inputMode="numeric">` — **not** `type="number"`, to preserve leading zeros
- Compare entered value to `VITE_ADMIN_PIN` as strings using `===`
- If `!import.meta.env.VITE_ADMIN_PIN?.trim()`, show "Admin panel not configured" instead of the PIN gate

## Admin Dashboard

A table of **all teams** (submitted and unsubmitted) with columns:

| Column | Notes |
|---|---|
| Team name | — |
| Holes | `num_holes` |
| Players | Count of players in the team, computed client-side |
| Submitted | ✓ + `new Date(submitted_at).toLocaleString()`, or — |
| Created | `new Date(created_at).toLocaleString()` |
| Delete | Button; disabled while any delete is in-flight; confirms via `window.confirm`, then deletes team (cascades to players + scores) |

Below the table: a **Reset Event** button that deletes all teams in one action. Only shown when at least one team exists. Disabled while the operation is in-flight. Requires `window.confirm` before proceeding.

After a successful Reset Event, show a brief inline success message: "All teams deleted."

## Data Loading

On unlock, fetch:
1. All teams (no `submitted_at` filter)
2. All players (to compute per-team player counts)

Player count per team is computed client-side from the players array.

After any delete, reload data to keep the table fresh.

If loading fails, show an inline error and a **Retry** button that re-calls `loadData()`.

## Deletion Strategy

**Single team delete:** `supabase.from('teams').delete().eq('id', teamId)`

**Reset Event (all teams):** `supabase.from('teams').delete().not('id', 'is', null)`

Both rely on DB cascade deletes to clean up players and scores automatically.

## Navigation

No NavBar link — the route is accessed by typing `/#/admin` directly. The existing `NavBar` is not rendered on this screen.

The `/admin` route must be added to `App.jsx` **before** the `path="*"` wildcard catch-all route, otherwise it will never match.

## Error Handling

- `VITE_ADMIN_PIN` not configured: show "Admin panel not configured" instead of the PIN gate
- Load error after unlock: show inline error with a Retry button
- Delete error: show inline error; do not remove the row optimistically; re-enable the delete button

## Styling

Follow existing conventions: `className="screen"` wrapper, `className="card"` for the PIN gate, `className="btn btn-primary"` / `className="btn btn-secondary"` for buttons, `className="error-msg"` for errors. Inline styles for table elements, mirroring `Leaderboards.jsx`.

Note: `.btn` is `display: block; width: 100%` by default. Buttons inside table cells must override this with `style={{ width: 'auto', display: 'inline-block' }}` to avoid stretching to fill the cell.

## Security

PIN check is client-side only. Appropriate for a one-day event app with no sensitive personal data.

## New Files

- `src/screens/Admin.jsx` — PIN gate + dashboard
- `src/__tests__/Admin.test.jsx` — tests covering:
  - Wrong PIN shows error
  - Correct PIN reveals the dashboard
  - Teams table renders after unlock
  - Delete button calls Supabase delete (mock `window.confirm` to return `true` via `vi.spyOn(window, 'confirm').mockReturnValue(true)`)
  - Delete error re-enables the delete button and shows an error message
  - Reset Event success shows "All teams deleted." message
  - "Admin panel not configured" renders when env var is absent

  Use `vi.stubEnv('VITE_ADMIN_PIN', '1234')` to set the PIN in tests and `vi.unstubAllEnvs()` in `afterEach` to reset. Use `vi.spyOn(window, 'confirm').mockReturnValue(true)` for any test that exercises a delete flow.

## Modified Files

- `src/App.jsx` — add `/admin` route before the `path="*"` wildcard
- Vercel deployment — add `VITE_ADMIN_PIN` env var (user action)
