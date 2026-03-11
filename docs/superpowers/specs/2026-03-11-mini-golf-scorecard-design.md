# Mini-Golf Scorecard App — Design Document

**Date:** 2026-03-11

---

## Overview

A mobile-first web app for team-building mini-golf events. Teams self-register on arrival, track scores hole-by-hole on a shared scorecard grid, submit when finished, and view overall leaderboards.

---

## Architecture

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | React + Vite | Vercel (free) |
| Database | Supabase (PostgreSQL) | Supabase (free tier) |

No custom backend server. The frontend communicates directly with Supabase via its REST API. No authentication required.

---

## Data Model

### `teams`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | auto-generated |
| name | text | team display name |
| num_holes | integer | number of holes this team plays |
| created_at | timestamptz | auto |
| submitted_at | timestamptz | null until team submits; locks scores |

### `players`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | auto-generated |
| team_id | uuid (FK → teams) | |
| name | text | player display name |

### `scores`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | auto-generated |
| player_id | uuid (FK → players) | |
| hole_number | integer | 1-indexed |
| strokes | integer | must be ≥ 1 |

---

## App Screens

### Screen 1 — Team Setup
- Fields: team name, number of players, number of holes
- All fields required; validation before advancing
- On submit: creates `teams` record, stores team ID in `localStorage`

### Screen 2 — Player Names
- One text input per player (count from Screen 1)
- All names required
- On submit: creates `players` records linked to the team

### Screen 3 — Scorecard
- Full scrollable grid: rows = players, columns = holes
- Each cell shows current strokes (editable via tap → +/− buttons or direct number input)
- Running totals column on the right
- Scores saved to Supabase on each edit
- Nav link to Leaderboards visible (read-only view of current standings)
- "Finish & Review" button advances to Screen 4

### Screen 4 — Review & Submit
- Same grid in read-only mode
- Shows each player's total and team total
- "Submit" button sets `submitted_at`, locking scores
- Once submitted, redirects to Leaderboards

### Screen 5 — Leaderboards
- **Team leaderboard:** teams ranked by sum of all players' strokes (lowest first), only submitted teams shown
- **Player leaderboard:** individual players ranked by total strokes across all holes (lowest first), only from submitted teams
- Teams with different hole counts are compared by raw total strokes
- Accessible via nav link from Screen 3 onward; full destination after Submit

---

## Session Persistence

- On setup completion, team ID is stored in `localStorage`
- On app load, if a `localStorage` team ID exists, skip setup screens and resume at Scorecard
- Allows teams to reload the page without losing their session

---

## Error Handling

- Network errors on score save: show inline retry prompt, do not block UI
- Duplicate team names: allowed (teams identified by UUID, not name)
- Submit failure: show error toast, keep Submit button enabled for retry

---

## Deployment

1. Push code to GitHub
2. Connect repo to Vercel — auto-deploys on push
3. Set Supabase URL and anon key as Vercel environment variables
4. Teams access the app via the Vercel URL on their phones

---

## Out of Scope

- Authentication / admin panel
- Par values per hole
- Real-time score updates between devices
- Offline support
