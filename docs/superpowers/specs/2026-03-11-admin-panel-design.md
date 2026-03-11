# Admin Panel Design

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** A PIN-protected admin screen for the event organiser to view all teams and delete them individually or all at once.

---

## Architecture

A new route `/#/admin` added to the existing React SPA. No new backend, no schema changes — team deletion cascades to players and scores via existing foreign keys. The PIN is stored as `VITE_ADMIN_PIN` in Vercel environment variables and checked client-side.

## Screen Flow

1. User navigates to `/#/admin` manually
2. PIN gate renders: a number input and a Submit button
3. On wrong PIN: inline error message, input cleared
4. On correct PIN: PIN gate replaced by admin dashboard in the same screen
5. Unlocked state is component state only — navigating away re-locks it

## Admin Dashboard

A table of **all teams** (submitted and unsubmitted) with columns:

| Column | Notes |
|---|---|
| Team name | — |
| Holes | `num_holes` |
| Players | Count of players in the team |
| Submitted | ✓ + formatted timestamp, or — |
| Created | Formatted `created_at` |
| Delete | Button; confirms via `window.confirm`, then deletes team (cascades to players + scores) |

Below the table: a **Reset Event** button that deletes all teams in one action. Requires `window.confirm` before proceeding. Shown only when at least one team exists.

## Data Loading

On unlock, fetch:
1. All teams (no `submitted_at` filter)
2. All players (to compute per-team player counts)

Player count per team is computed client-side from the players array.

After any delete, reload data to keep the table fresh.

## Navigation

No NavBar link — the route is accessed by typing `/#/admin` directly. The existing `NavBar` is not rendered on this screen.

## Error Handling

- PIN env var not set (`VITE_ADMIN_PIN` is empty/undefined): show a message "Admin panel not configured" instead of the PIN gate
- Load error after unlock: show inline error with a retry prompt
- Delete error: show inline error, do not remove the row optimistically

## Security

PIN check is client-side only. This is appropriate for a one-day event app with no sensitive personal data. The PIN is not exposed in the UI source beyond the env var comparison.

## New Files

- `src/screens/Admin.jsx` — PIN gate + dashboard

## Modified Files

- `src/App.jsx` — add `/admin` route
- `vercel.json` / deployment — add `VITE_ADMIN_PIN` env var (user action)
