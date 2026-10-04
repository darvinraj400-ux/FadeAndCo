# Fade & Co.

Multi-barber booking with a race-safe scheduler and natural-language input.

Live demo: TODO_DEMO_URL

Case study: TODO_CASE_STUDY_URL

## Screenshot

TODO_SCREENSHOT: today-schedule view (three barber columns with appointment blocks).

## What it does

- Public booking flow: pick a service, barber, and time — confirmation is instant.
- Natural-language input: "fade with Sam Saturday afternoon" parses to a structured intent and pre-fills the wizard.
- Multi-barber scheduling with M:N service availability and per-barber weekly hours.
- Race-safe booking: an exclusion constraint prevents double-booking at the DB level.
- Admin dashboard: today's schedule, appointments list, services CRUD, barbers CRUD, time-off blocks.

## The design decision

Race safety is enforced at the DB layer, not the app. `fade_appointments` carries `exclude using gist (barber_id with =, tstzrange(starts_at, ends_at, '[)') with &&) where (status != 'cancelled')` — two overlapping confirmed bookings for one barber cannot both commit, no matter how the requests interleave. The app-layer "is this slot free?" check is UX only: it re-runs the availability computation so users don't pick taken times, but correctness never depends on it. A concurrency test fires two `POST /api/bookings` calls at the same slot via `Promise.all` and asserts exactly one `201` and one `409 slot_taken`.

## Stack

| Layer | Tech | Why |
|---|---|---|
| Frontend | Next.js 15 App Router, Tailwind v4, shadcn/ui | Server components for data, client islands for the wizard |
| LLM | Groq gpt-oss-120b primary, Gemini 3.1-flash-lite fallback | Intent parsing with a closed vocabulary; nulls instead of guesses |
| Database | Supabase Postgres with btree_gist | Exclusion constraint for race safety |
| Timezone | date-fns-tz, all timestamps UTC | Shop timezone via env; single helper module |
| Email | Resend | Fixed-template confirmations, never AI-generated |
| Deploy | Vercel Hobby | `waitUntil` for background email sends |

## Running locally

```bash
git clone <repo>
cd FadeAndCo
npm install
cp .env.example .env.local
# Fill in keys (see below)
npm run seed     # 3 barbers, 5 services, hours, 15 demo appointments
npm run dev      # http://localhost:3000
```

Useful scripts: `npm run build`, `npm run test-concurrency` (needs dev server running).

## Environment variables

| Var | Where to get it |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase Project Settings → API |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | same |
| SUPABASE_SERVICE_ROLE_KEY | same (secret) |
| GOOGLE_GENERATIVE_AI_API_KEY | aistudio.google.com/apikey |
| GROQ_API_KEY | console.groq.com/keys |
| RESEND_API_KEY | resend.com/api-keys |
| SHOP_EMAIL | destination inbox |
| SHOP_TIMEZONE | IANA zone, e.g. Asia/Kuala_Lumpur |
| ADMIN_PASSWORD | any string, gates /admin |
| APP_URL | deployed URL, include the protocol (`https://…`) — bare hostnames fall back to `https://`, but be explicit |

## Database setup

Run `docs/schema.sql` in the Supabase SQL editor. It requires the `btree_gist` extension (first line). RLS is enabled with zero policies — all access goes through the service role from server code.

## The race-condition test

```bash
npm run dev            # in one terminal
npx tsx scripts/test-concurrency.ts   # in another (APP_URL defaults to localhost:3000)
```

Expected output shape:

```text
contesting slot 2026-10-06T01:00:00.000Z on 2026-10-06
response A: 409 {"error":"slot_taken",...}
response B: 201 {"ok":true,"reference_code":"FC-...","appointment_id":"..."}
✅ Exactly one booking succeeded (ref: FC-...)
✅ Second request rejected with 409 slot_taken
✅ DB has exactly 1 row for slot ...
✅ Winning appointment FC-... cleaned up
PASS
```

Point it at production with `APP_URL=https://your-app.vercel.app npx tsx scripts/test-concurrency.ts`.

## Deployment

Standard Vercel deploy (`vercel --prod`). Set all env vars in the project dashboard. `APP_URL` should include the protocol (`https://…`) so OG URLs resolve correctly. After deploy: complete one live booking and confirm the Resend email arrives (the `waitUntil` path), then run the concurrency test against the live URL.

## Scope

Shipped in v1:

- Customer booking wizard + natural-language input
- Race-safe booking with concurrency proof
- Admin: schedule, appointments, services, barbers, time-off
- Confirmation and cancellation emails

Deliberately out:

- Customer-facing cancellation flow
- No-show detection
- Payments
- SMS reminders
- Multi-location support

## License

MIT

---

Built by Darvin Raj — [GitHub](https://github.com/darvinraj400-ux)

Fade & Co. is a fictional barbershop. This is a portfolio piece.
