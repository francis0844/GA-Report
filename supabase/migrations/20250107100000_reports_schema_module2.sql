-- Add required columns to reports table
alter table if exists reports
  add column if not exists type text not null default 'monthly' check (type in ('weekly','monthly','custom')),
  add column if not exists comparison_start_date date,
  add column if not exists comparison_end_date date,
  add column if not exists raw_ga_data jsonb,
  add column if not exists normalized_metrics jsonb,
  add column if not exists ai_analysis jsonb;

-- Retention: delete reports older than 365 days
create or replace function purge_old_reports() returns void as $$
begin
  delete from reports where created_at < now() - interval '365 days';
end;
$$ language plpgsql;

-- Manual delete by id
create or replace function delete_report_by_id(target_id uuid) returns void as $$
begin
  delete from reports where id = target_id;
end;
$$ language plpgsql;