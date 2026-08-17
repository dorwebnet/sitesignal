-- SiteSignal schema (Supabase / Postgres) with row-level security.
-- Roles: 'admin' (Dorweb/Alex, sees all) and 'client' (Mark, sees KAP only).

create table if not exists clients (
  id text primary key,                 -- e.g. 'kap'
  name text not null,
  per_letter_price numeric not null default 2.50,
  stannp_plan text default 'starter',
  created_at timestamptz default now()
);
insert into clients (id, name) values ('kap','KAP Woodwork & Building Services')
  on conflict (id) do nothing;

-- Maps a logged-in user to a role + client. Admins have client_id = null.
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client',   -- 'admin' | 'client'
  client_id text references clients(id),
  full_name text
);

-- Weekly qualified leads awaiting approval.
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  client_id text references clients(id) not null default 'kap',
  application_reference text not null,
  address_key text not null,             -- normalised, for never-send-twice
  site_address text,
  city text,
  postcode text,
  distance_miles numeric,
  application_type text,
  ai_summary text,
  body jsonb,                            -- ["para1","para2","para3"], editable
  source_url text,
  week_label text,                       -- e.g. '2026-W30'
  status text not null default 'pending',-- pending | approved | skipped | posted
  created_at timestamptz default now(),
  unique (client_id, application_reference)
);

-- Sent-ledger: every posted letter. address_key drives suppression.
create table if not exists letters (
  id uuid primary key default gen_random_uuid(),
  client_id text references clients(id) not null default 'kap',
  lead_id uuid references leads(id),
  address_key text not null,
  postage_class text default '2nd',
  cost numeric,
  charge numeric,
  stannp_id text,
  status text default 'posted',          -- posted | delivered
  sent_at timestamptz default now()
);

-- Conversion tracking (derived from GHL stage moves).
create table if not exists conversions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  outcome text,                          -- call | site_visit | proposal | won
  value numeric,
  noted_at timestamptz default now()
);

-- ---------- Row-level security ----------
alter table leads enable row level security;
alter table letters enable row level security;
alter table conversions enable row level security;
alter table profiles enable row level security;

create or replace function is_admin() returns boolean language sql stable as $$
  select exists(select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin');
$$;
create or replace function my_client() returns text language sql stable as $$
  select client_id from profiles where user_id = auth.uid();
$$;

-- Admins see/do everything; clients see only their own client's rows.
create policy leads_read on leads for select using (is_admin() or client_id = my_client());
create policy leads_update on leads for update using (is_admin() or client_id = my_client());
create policy letters_read on letters for select using (is_admin() or client_id = my_client());
create policy conversions_read on conversions for select using (is_admin() or client_id = my_client());
create policy profiles_self on profiles for select using (user_id = auth.uid() or is_admin());
