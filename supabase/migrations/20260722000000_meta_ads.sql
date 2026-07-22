create table if not exists meta_ads_spend_raw (
  data date primary key,
  spend numeric not null,
  synced_at timestamptz not null default now()
);

create table if not exists meta_video_retention_raw (
  ad_id text primary key,
  ad_name text not null,
  campaign_name text not null,
  plays numeric not null,
  p25 numeric not null,
  p50 numeric not null,
  p75 numeric not null,
  p95 numeric not null,
  p100 numeric not null,
  synced_at timestamptz not null default now()
);

alter table meta_ads_spend_raw enable row level security;
alter table meta_video_retention_raw enable row level security;

create policy "Authenticated users can read meta_ads_spend_raw"
  on meta_ads_spend_raw for select
  to authenticated
  using (true);

create policy "Authenticated users can read meta_video_retention_raw"
  on meta_video_retention_raw for select
  to authenticated
  using (true);
