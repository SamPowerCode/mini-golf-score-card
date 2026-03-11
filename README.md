# Mini-Golf Scorecard

A mobile-first web app for tracking mini-golf scores at an event. Teams enter their scores hole-by-hole, then submit to see the leaderboard.

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Copy your **Project URL** and **anon public key** from **Settings → API**

### 2. Environment variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: gate the app behind a password (players enter once, then never again)
VITE_APP_PASSWORD=your-event-password

# Optional: PIN to access the admin panel at /#/admin
VITE_ADMIN_PIN=1234
```

If `VITE_APP_PASSWORD` is not set, the app is open to anyone with the URL. If `VITE_ADMIN_PIN` is not set, the admin panel shows "Admin panel not configured".

### 3. Local development

```bash
npm install
npm run dev
```

The app password gate and admin panel are skipped when the env vars are not set, so local dev works without configuration.

### 4. Deploy to Vercel

1. Push the repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (required)
   - `VITE_APP_PASSWORD` (optional — gates the app for players)
   - `VITE_ADMIN_PIN` (optional — enables the admin panel)
4. Deploy — `vercel.json` handles the SPA routing automatically

## How it works

1. If `VITE_APP_PASSWORD` is set, players enter the event password once — it's remembered in their browser
2. A team enters their team name, number of players, and number of holes
3. Players enter their names
4. The scorecard grid lets any team member tap +/− to set each player's score per hole (default 0)
5. Scores save to Supabase automatically (with optimistic updates)
6. The team reviews and submits when ready
7. The leaderboard shows all submitted teams and players, sorted by lowest total score

## Admin panel

Navigate to `/#/admin` to access the admin panel. Enter the `VITE_ADMIN_PIN` to unlock it.

The admin panel shows all teams (submitted and unsubmitted) with player counts and submission times. You can delete individual teams or reset the entire event.

## Tech stack

- React 19 + Vite
- Supabase (PostgreSQL)
- React Router (HashRouter)
- Deployed on Vercel
