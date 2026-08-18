-- Student Price Copilot — core schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) after
-- creating a new project.

create extension if not exists "uuid-ossp";

create table if not exists items (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('textbook', 'dorm')),
  title text not null,
  isbn text, -- textbooks only
  category text, -- dorm only, e.g. "bedding", "storage", "appliances"
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists items_type_idx on items (type);
create unique index if not exists items_isbn_unique_idx on items (isbn)
  where isbn is not null; -- enables upsert-by-isbn in scripts/seed-textbooks.ts

create table if not exists prices (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references items (id) on delete cascade,
  vendor text not null, -- e.g. "amazon", "chegg", "abebooks", "target"
  price numeric(10, 2) not null,
  format text, -- textbooks: new / used / rental / ebook. dorm: null
  url text,
  date_seen timestamptz not null default now()
);

create index if not exists prices_item_id_idx on prices (item_id);
create index if not exists prices_date_seen_idx on prices (date_seen);

create table if not exists recommendations (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references items (id) on delete cascade,
  signal text not null check (signal in ('buy_now', 'wait')),
  rationale_text text,
  generated_at timestamptz not null default now()
);

create index if not exists recommendations_item_id_idx on recommendations (item_id);

-- Feedback loop: "suggest an item" widget on the dorm and textbooks pages
-- (src/components/SuggestItemButton.tsx). No public read policy on
-- purpose, this is for the site owner to check in the Supabase dashboard,
-- not to display back on the site.
create table if not exists suggestions (
  id uuid primary key default uuid_generate_v4(),
  page text not null check (page in ('dorm', 'textbooks')),
  item_title text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists suggestions_created_at_idx on suggestions (created_at);

-- Row Level Security: this app has no user accounts yet (MVP), so allow
-- public read access and restrict writes to the service role (used by the
-- seed script and API routes running server-side).
alter table items enable row level security;
alter table prices enable row level security;
alter table recommendations enable row level security;
alter table suggestions enable row level security;

create policy "Public read access" on items for select using (true);
create policy "Public read access" on prices for select using (true);
create policy "Public read access" on recommendations for select using (true);
-- suggestions intentionally has no policies at all: no anon-key access in
-- either direction, only the service-role client (server-side) can insert.
