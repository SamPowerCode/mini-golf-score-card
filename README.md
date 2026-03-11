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
```

### 3. Local development

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

1. Push the repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables
4. Deploy — `vercel.json` handles the SPA routing automatically

## How it works

1. A team enters their team name, number of players, and number of holes
2. Players enter their names
3. The scorecard grid lets any team member tap +/− to set each player's score per hole
4. Scores save to Supabase automatically (with optimistic updates)
5. Once all holes are filled, the team reviews and submits
6. The leaderboard shows all submitted teams and players, sorted by lowest total score

## Tech stack

- React 18 + Vite
- Supabase (PostgreSQL)
- React Router (HashRouter)
- Deployed on Vercel
