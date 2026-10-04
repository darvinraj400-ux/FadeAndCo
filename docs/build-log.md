# Build Log

Reverse-chronological. One section per completed layer.

## 2026-10-04 — Layer 2: schema, timezone, availability, seed

- `docs/schema.sql`: five `fade_` tables, `btree_gist` exclusion constraint
  `fade_appointments_no_overlap` (half-open `[)`, `where status != 'cancelled'`),
  RLS enabled with zero policies (service-role only, deny-by-default for anon).
- `lib/env.ts` wired via side-effect import in `lib/supabase.ts`; `SHOP_TIMEZONE`
  IANA-validated, fail fast at import.
- `lib/timezone.ts`: 7 exports on date-fns-tz v3 (local-field read/write contract,
  `formatInTimeZone` for display). Sole date-fns-tz user; rest is UTC arithmetic.
- `lib/booking/slots.ts`: pure `computeAvailableSlots` (8-step algorithm, half-open
  overlap, start_time-aligned grid, injectable `now`). Verified byte-identical
  output under KL/UTC/New-York host timezones.
- `lib/booking/schema.ts`: `bookingRequestSchema` + `parsedIntentSchema` (+ types).
- `scripts/seed-demo.ts`: 3 barbers / 5 services / mappings / weekly hours /
  time-off / 15 appointments (13 confirmed future, 1 cancelled, 1 completed past),
  `FC-YYYYMMDD-XXXX` codes, counts + per-barber slot preview. Refuses to run with
  `NODE_ENV=production`. Wipe/counts keyed per-table (junction table has no `id`).
  Seed verified live: 3/5/12/15/3/15, re-run idempotent, exclusion constraint
  proven (overlapping confirmed → 23P01, overlapping cancelled → allowed).
- Reviews: fixed host-TZ wall-clock bugs, epoch-grid alignment, NaN guards,
  preview overlap predicate + error checks, intent schema caps. Deferred to later
  layers: admin/client supabase split, CSPRNG reference codes for lookup APIs,
  least-privilege DB role.

## 2026-10-04 — Layer 1: Scaffold

- Next.js 15 App Router, Tailwind v4, shadcn/ui (Base-UI), AI SDK 7.
- Stack consistent with SupportAI and LeadFlow.
- Different AI pattern again: natural-language intent parsing for booking,
  not retrieval or extraction. Third AI use case across the portfolio.
- Multi-barber from day one. Race safety and timezone correctness are
  scope items, not v2 concerns.
