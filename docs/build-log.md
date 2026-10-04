# Build Log

Reverse-chronological. One section per completed layer.

## 2026-10-04 — Layer 6A: polish, metadata, README

- Error boundaries: root logs via `useEffect` + digest; new admin-context
  boundary. Six loading skeletons matching content shapes. Dark 404 with
  home link and disclaimer.
- Empty states: "No appointments today." banner, "No services yet.",
  "No barbers yet." (+ `role="status"`); appointments/slots already had
  theirs — copy verified.
- Metadata: title template + absolute homepage title, resilient
  `metadataBase` via never-throw `lib/site-url.ts` (shared with sitemap),
  OG/Twitter, Inter. Case-study title/description (page itself is 6B).
  robots disallows `/admin` + `/api`; sitemap lists `/` + `/case-study`;
  admin layout + login carry noindex.
- README (85 lines): design decision, stack table, local setup, env table,
  schema note, concurrency test with expected output, deploy notes, scope,
  MIT, footer. TODO markers for demo/case-study URLs + screenshot.
- Review fixes: never-throw origin helper, absolute homepage title, Inter
  without dangling variable, admin-wide noindex, dark root skeleton,
  flex-1 404 wrapper.
- NOT done here (no push, no deploy, per instructions): C1 waitUntil email
  on Vercel, C2 production concurrency, C3 browser rate-limit check, real-
  device mobile sanity, case study (6B), screenshots.

## 2026-10-04 — Layer 5: admin dashboard, CRUD, time-off

- Auth: `fade_admin` HMAC cookie + Edge middleware verified unchanged
  (LeadFlow pattern). Login/logout routes (zod, 500ms delay, no logging),
  dark login card, admin shell (Today/Appointments/Services/Barbers +
  logout), `StatusBadge` (indigo/green/zinc/red, unknown-status fallback).
- Today schedule (hero): server page + server component, per-barber cards
  with sorted blocks, time-off stripes, free windows (30-min probe,
  cancelled excluded), `?date` prev/next with today fallback. Per-barber
  hours in cards (no mixed global range).
- Appointments: server filters (status pills, barber select, day) + client
  table with Dialog detail (mailto, notes) and Complete/No-show/Cancel
  actions via existing PATCH (cancellation email on cancel).
- Services/barbers CRUD APIs (admin-gated; `slug_taken` / `has_future_bookings`
  409s) + tables (dialogs, active toggles, price dollars↔cents without float
  artifacts). Barber edit: service checkboxes + 7-day hours editor +
  time-off tab. Relations via replace-all `saveBarberRelations` with
  validate-before-delete (dup-day guard).
- Time-off API (overlap check vs confirmed only, 409 with count) + editor.
- Fixes from review: resurrection `excludeAppointmentId` (completed/no-show
  re-confirm works), ref-code retry loop (self-heals seed-sequence
  collisions), dialog close-while-pending guards, login/logout error toasts.
  Redirect for bad `?date` abandoned: `redirect()` serializes as a digest
  in this Next version — fallback rendering kept deliberately.
- Verified live: 13-step smoke all green (307/401/login/3 columns/filters/
  PATCH cycle/CRUD create-edit-delete/conflict 409/logout/public intact);
  resurrection proven 200; delete/conflict guards proven 409 with counts.
- Deferred: login rate limiting, CSRF origin check, stateful sessions
  (inherited single-password design, documented trade-offs).

## 2026-10-04 — Layer 4: landing, AI intent parsing, NL booking input

- Landing (`app/(marketing)/page.tsx`): async server component, 7 sections,
  dark zinc + indigo-500, no gradients/images. Real services (fixed slug
  order), barbers with M:N service lists, hours grouped by barber with
  `shopTzAbbrev()` note, fake address, verbatim fictional-shop disclaimer.
- `POST /api/parse-booking`: `{text}` 10–500 chars, 10/min in-memory IP limit
  (LeadFlow pattern, last-entry XFF), Groq `openai/gpt-oss-120b` →
  Gemini `gemini-3.1-flash-lite` fallback via `generateObject` (`temperature: 0`,
  unchanged `parsedIntentSchema`). Names fuzzy-resolved to IDs (exact →
  word → substring, deterministic); unknown names → null. Candidate slots
  (max 8) only for valid service+barber+day (+ mapping check), time bands
  morning/afternoon/evening/specific per spec. `maxDuration = 30`.
- `lib/booking/day-hints.ts`: today/tonight/tomorrow/day-after/weekdays +
  abbrevs/weekend, `next X` = coming X + 7, noon-instant convention,
  host-independent. `lib/booking/parse-intent.ts` replaced (was stale stub).
- `/book`: NL card above the wizard (opt-in, divider, wizard primary).
  `ParsedIntentCard` shows the interpretation explicitly (confidence-gated
  fallback, "You said" raw block, ≤8 slot buttons, null-vs-[] copy).
  `BookingFlow` additive `nlPrefill` prop: slot jumps → Confirm (with day
  preserved on Back via `initialDate`), ids → slot/barber step.
- Verified live: full parse (Fade/Sam/Saturday, 0.99), partial (Haircut only,
  slots null), gibberish (0.1, all null), 10×200 + 429 on 11th, candidate
  slot booked 201 then cleaned, no hallucinations (exact vocab or null).
  Invalid pair (Kids Cut + Priya) yields no jump targets; "this evening"
  resolves; "haircut" deterministically matches Haircut.
- Reviews: fuzzy tiers, pair validation, day preservation, copy branches,
  landing sort/keys/parallel fetch, upstream error distinction, prompt-tag
  stripping. Deferred: AI spend controls (cache/budget/Turnstile), Redis
  rate limiting, evening-band clamping (bands are cosmetic — slots are
  hours-constrained), test suite (Layer 6).

## 2026-10-04 — Layer 3: booking flow, race-safe create, concurrency test

- `GET /api/slots`: zod params, barber/service/mapping 404s, no-hours → 200 `[]`,
  overlap day filters, server-formatted display times, `no-store`.
- `POST /api/bookings` (public): schema validation, server-side slot
  re-validation (`lib/booking/validate-slot.ts` — direct-POST bypass closed:
  3 AM and off-grid attempts return 409), ref codes scoped to the appointment's
  shop day with one recount retry on 23505, 23P01 → 409 `slot_taken`,
  `waitUntil` confirmation email, `maxDuration = 30`, 201
  `{ ok, reference_code, appointment_id }`.
- Admin `GET /api/bookings` (status/barberId/date filters, limit 50/max 200)
  and `PATCH /api/bookings/[id]` (status enum, resurrection re-validated,
  cancellation email on →cancelled), both `isAdminRequest`-gated (401 verified).
- `GET /api/services`, `GET /api/barbers?serviceId` (M:N filter),
  `GET /api/shop-days` (14 unique shop days, server-formatted so the client
  needs no timezone logic).
- Emails: LeadFlow pattern (boolean, never-throw, `re_` gate, `escapeHtml`);
  `send-booking-confirmation.ts` new, `send-cancellation.ts` rewritten,
  dead `send-confirmation.ts` stub removed.
- `/book`: 4-step wizard (Service → Barber → Time → Confirm) with progress,
  back/next rules, 409 → toast + back to slots + refresh, success screen;
  `NlBookingInput`/`ParsedIntentCard` return null (Layer 4). Toaster in layout.
- `scripts/test-concurrency.ts`: same-tick dual POST → exactly one 201 + one
  409, DB count == 1, winner cleaned up. PASS live (ref FC-20261006-0005).
  Constraint fires as Postgres `23P01`.
- Reviews: direct-POST bypass fixed + proven, ref-counter realigned to shop
  day (was colliding with seed refs), PATCH hardening, email failure logging.
  Deferred: rate limiting (needs infra), random ref suffixes, admin session
  redesign (all noted, auth untouched by design).

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
