create extension if not exists btree_gist;

create table fade_barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  bio text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table fade_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  duration_minutes int not null check (duration_minutes > 0 and duration_minutes <= 240),
  price_cents int not null check (price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- M:N: not every barber offers every service
create table fade_service_barbers (
  barber_id uuid not null references fade_barbers(id) on delete cascade,
  service_id uuid not null references fade_services(id) on delete cascade,
  primary key (barber_id, service_id)
);

-- Weekly recurring hours per barber, stored in SHOP local time (no tz)
create table fade_barber_hours (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references fade_barbers(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),  -- 0=Sunday
  start_time time not null,
  end_time time not null,
  check (end_time > start_time),
  unique (barber_id, day_of_week)
);

-- One-off blocks (vacation, sick day, etc.)
create table fade_time_off (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references fade_barbers(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (ends_at > starts_at)
);

create table fade_appointments (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  barber_id uuid not null references fade_barbers(id),
  service_id uuid not null references fade_services(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),

  -- Race safety: no overlapping appointments for the same barber.
  -- The unique-index-on-(barber_id, starts_at) approach only blocks
  -- exact-start collisions; overlapping-but-different-start bookings
  -- would slip through. Exclusion constraint with tstzrange is the
  -- correct primitive.
  constraint fade_appointments_no_overlap
    exclude using gist (
      barber_id with =,
      tstzrange(starts_at, ends_at, '[)') with &&
    ) where (status != 'cancelled')
);

create index fade_appointments_barber_starts_idx
  on fade_appointments (barber_id, starts_at desc);
create index fade_appointments_status_idx on fade_appointments (status);
create index fade_time_off_barber_idx on fade_time_off (barber_id, starts_at, ends_at);

-- All access goes through service_role from Next.js server routes.
-- No anon access needed — booking is a server action, admin is service-role gated.
-- Zero policies = deny-by-default for anon/authenticated; service_role
-- bypasses RLS by design. Never add an open policy on fade_appointments
-- (customer PII); future public reads need a dedicated view + policy.
alter table fade_barbers enable row level security;
alter table fade_services enable row level security;
alter table fade_service_barbers enable row level security;
alter table fade_barber_hours enable row level security;
alter table fade_time_off enable row level security;
alter table fade_appointments enable row level security;
