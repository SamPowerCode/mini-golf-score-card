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
  hole_number integer not null check (hole_number between 1 and 36),
  strokes integer not null check (strokes >= 0),
  unique (player_id, hole_number)
);

ALTER TABLE scores DROP CONSTRAINT scores_strokes_check;                                                                                                                                                  
ALTER TABLE scores ADD CONSTRAINT scores_strokes_check CHECK (strokes >= 0);   