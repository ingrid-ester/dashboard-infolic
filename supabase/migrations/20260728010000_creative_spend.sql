create table if not exists meta_creative_spend_raw (
  creative_name text not null,
  data date not null,
  spend numeric not null default 0,
  leads numeric not null default 0,
  synced_at timestamptz not null default now(),
  primary key (creative_name, data)
);

alter table meta_creative_spend_raw enable row level security;

create policy "Authenticated users can read meta_creative_spend_raw"
  on meta_creative_spend_raw for select
  to authenticated
  using (true);
