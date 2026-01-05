-- Core extensions
create extension if not exists "pgcrypto";

-- Reports are immutable once created; AI insights live separately to allow regeneration.
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  property_id text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);

create table if not exists ga_raw_responses (
  id bigserial primary key,
  report_id uuid not null references reports(id) on delete cascade,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists report_totals (
  id bigserial primary key,
  report_id uuid not null references reports(id) on delete cascade,
  metric text not null,
  value numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists report_timeseries (
  id bigserial primary key,
  report_id uuid not null references reports(id) on delete cascade,
  dimension_value date not null,
  metrics jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists ai_insights (
  id bigserial primary key,
  report_id uuid not null references reports(id) on delete cascade,
  summary text not null,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_totals_report on report_totals(report_id);
create index if not exists idx_report_timeseries_report_date on report_timeseries(report_id, dimension_value);
create index if not exists idx_ai_insights_report on ai_insights(report_id);

-- Helper to purge reports older than 365 days; app should call this regularly.
create or replace function purge_old_reports() returns void as $$
begin
  delete from reports where created_at < now() - interval '365 days';
end;
$$ language plpgsql;
