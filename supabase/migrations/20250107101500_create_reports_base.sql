-- Ensure extension for UUID generation
create extension if not exists "pgcrypto";

-- Base reports table (creates if missing)
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled Report',
  property_id text,
  type text not null default 'monthly' check (type in ('weekly','monthly','custom')),
  start_date date not null,
  end_date date not null,
  comparison_start_date date,
  comparison_end_date date,
  raw_ga_data jsonb,
  normalized_metrics jsonb,
  ai_analysis jsonb,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);