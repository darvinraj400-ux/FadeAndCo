import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Case study",
  description:
    "How Fade & Co. was built: race-safe multi-barber scheduling with natural-language booking input.",
};

const DEMO_URL = "https://fade-and-co-psi.vercel.app/";
const REPO_URL = "https://github.com/darvinraj400-ux/FadeAndCo";
const PROFILE_URL = "https://github.com/darvinraj400-ux";

function Shot({
  src,
  width,
  height,
  alt,
  caption,
  priority = false,
  compact = false,
  scroll = false,
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  priority?: boolean;
  compact?: boolean;
  scroll?: boolean;
}) {
  return (
    <figure className={compact ? "my-0" : "my-10"}>
      <div
        className={
          scroll
            ? "overflow-x-auto rounded-2xl border border-line"
            : "overflow-hidden rounded-2xl border border-line"
        }
      >
        <Image
          src={src}
          width={width}
          height={height}
          alt={alt}
          priority={priority}
          sizes="(max-width: 768px) 100vw, 1024px"
          className={scroll ? "h-auto w-full min-w-[700px]" : "h-auto w-full"}
        />
      </div>
      <figcaption className="mt-2 text-sm text-bark">{caption}</figcaption>
    </figure>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="my-4 overflow-x-auto rounded-xl border border-line bg-parchment p-4 font-mono text-[13px] leading-relaxed text-ink">
      {children}
    </pre>
  );
}

export default function CaseStudyPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 md:py-24">
      <div className="mx-auto max-w-[70ch]">
        {/* Hero */}
        <p className="text-sm font-medium tracking-wide text-bronze">
          Case Study
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-6xl">
          Fade &amp; Co. — multi-barber booking with a race-safe scheduler
        </h1>
        <p className="mt-4 text-lg text-bark">
          A three-chair barbershop that takes online bookings, including
          natural-language requests. The non-trivial part isn&apos;t the form —
          it&apos;s making sure two people can never book the same chair at
          the same time.
        </p>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-bark">Role</dt>
            <dd className="mt-0.5 font-medium">
              Solo — design, engineering, documentation
            </dd>
          </div>
          <div>
            <dt className="text-bark">Stack</dt>
            <dd className="mt-0.5 font-medium">
              Next.js 15 · Supabase Postgres + btree_gist · Groq / Gemini ·
              Resend · Vercel
            </dd>
          </div>
          <div>
            <dt className="text-bark">Timeline</dt>
            <dd className="mt-0.5 font-medium">Built over 2 days</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:bg-brass/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
          >
            Try the live demo
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink hover:border-bronze focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
          >
            View source
          </a>
        </div>
      </div>

      <Shot
        src="/case-study/landing.png"
        width={1654}
        height={3230}
        alt="Fade & Co. landing page with services, barbers, and hours"
        caption="Three chairs, three barbers, five services. Book online in under a minute."
        priority
      />

      <div className="mx-auto max-w-[70ch]">
        {/* 1 — Problem */}
        <h2 className="font-display text-3xl tracking-tight">
          1. The problem
        </h2>
        <div className="mt-4 space-y-4 text-bark">
          <p>
            What a small barbershop booking flow actually needs is not just a
            form. It needs slot computation that respects each barber&apos;s
            hours, which services each barber offers, and one-off time-off —
            all in the shop&apos;s timezone, not the server&apos;s.
          </p>
          <p>
            The hard part isn&apos;t the UI, it&apos;s correctness. Two people
            booking the same slot at the same instant is a race condition, and
            a naive &ldquo;is this slot free?&rdquo; check followed by an
            insert will silently lose it. Both requests read &ldquo;free&rdquo;
            before either writes. One customer shows up to a double-booked
            chair.
          </p>
          <p>
            And &ldquo;when is the shop open&rdquo; is a question about the
            shop&apos;s timezone. The server runs on UTC, the shop runs on
            Asia/Kuala_Lumpur, and every conversion between the two is a place
            to be off by a day. I made timezone a first-class concept instead
            of scattering conversions through route handlers.
          </p>
        </div>

        {/* 2 — How it works */}
        <h2 className="mt-12 font-display text-3xl tracking-tight">
          2. How it works
        </h2>
        <p className="mt-4 text-bark">
          The customer picks a service and a barber. The frontend asks for
          slots; the server computes them from hours, existing bookings, and
          time-off with a pure function. The customer picks a time and posts
          the booking. The database itself enforces the race safety, and a
          confirmation email fires in the background.
        </p>
        <div className="my-6 flex flex-wrap items-center gap-2 text-sm">
          {[
            "Pick service + barber",
            "GET /api/slots",
            "computeAvailableSlots",
            "Pick a time",
            "POST /api/bookings",
            "Exclusion constraint",
            "201 or 409",
          ].map((step, i, arr) => (
            <span key={step} className="flex items-center gap-2">
              <span className="rounded-lg border border-line bg-parchment px-3 py-1.5 text-ink">
                {step}
              </span>
              {i < arr.length - 1 ? (
                <span aria-hidden="true" className="font-mono text-bronze">
                  →
                </span>
              ) : null}
            </span>
          ))}
        </div>
        <p className="text-bark">
          One predicate runs everywhere — the algorithm, the constraint, and
          the time-off check all use half-open intervals:
        </p>
        <Code>
          {`// Same convention in the algorithm and the constraint:
// overlap  ⟺  aStart < bEnd && aEnd > bStart
// tstzrange(..., '[)')  ⟺  half-open, no off-by-one`}
        </Code>

        {/* 3 — Technical decisions */}
        <h2 className="mt-12 font-display text-3xl tracking-tight">
          3. Technical decisions
        </h2>
        <div className="mt-4 space-y-8">
          <div>
            <h3 className="font-medium text-base text-ink">
              Race safety is a DB constraint, not an app check.
            </h3>
            <p className="mt-1 text-bark">
              Every junior dev writes{" "}
              <code className="font-mono text-[13px] text-ink">
                if (slot is free) {"{ insert }"}
              </code>
              . That&apos;s a check-then-act bug under concurrency. The correct
              primitive is an exclusion constraint — Postgres refuses the second
              insert at the storage layer, no matter how the requests
              interleave. The app catches error code{" "}
              <code className="font-mono text-[13px] text-ink">23P01</code>{" "}
              and returns a friendly 409.
            </p>
            <Code>
              {`constraint fade_appointments_no_overlap
  exclude using gist (
    barber_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status != 'cancelled')`}
            </Code>
          </div>
          <div>
            <h3 className="font-medium text-base text-ink">
              Half-open intervals everywhere.
            </h3>
            <p className="mt-1 text-bark">
              <code className="font-mono text-[13px] text-ink">
                [start, end)
              </code>{" "}
              in the constraint, in the availability algorithm, and in the
              time-off overlap check. The conventions have to match or you get
              phantom one-second overlaps — a 10:00 booking ending at 10:30
              must not block a 10:30 start. Same predicate on every path.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-base text-ink">The direct-POST bypass.</h3>
            <p className="mt-1 text-bark">
              The slots route only returns what the algorithm considers valid.
              But nothing stopped a client from POSTing any time directly — a 3
              AM slot, an off-grid :07 start, whatever. I only caught this in
              code review, after the route already worked. The fix is a shared
              server-side validator that re-checks the requested time against
              the barber&apos;s hours and the service mapping before insert.
              Client filters are UX; server validation is correctness.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-base text-ink">
              <code className="font-mono text-[13px] text-ink">waitUntil</code>{" "}
              for the confirmation email.
            </h3>
            <p className="mt-1 text-bark">
              The booking POST returns in ~300ms; the email fires after. On
              Vercel, a floating promise dies when the response is sent — the
              exact bug I&apos;d already hit on an earlier project.{" "}
              <code className="font-mono text-[13px] text-ink">waitUntil</code>{" "}
              from <code className="font-mono text-[13px] text-ink">@vercel/functions</code>{" "}
              extends the function lifetime until the send settles. The sender
              returns a boolean and never throws, so email can never break a
              booking.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-base text-ink">
              Natural-language booking shows its work.
            </h3>
            <p className="mt-1 text-bark">
              Type &ldquo;fade with Sam Saturday afternoon&rdquo; and the AI
              returns a structured intent — service, barber, day, time, and a
              confidence score. The UI shows that interpretation before the
              slot list rather than jumping straight to times. If confidence is
              low or nothing matches, the card falls back gracefully instead
              of guessing.
            </p>
            <Code>
              {`POST /api/parse-booking { text: "fade with Sam Saturday afternoon" }
→ { service: "Fade", barber: "Sam", dayHint: "Saturday",
    timeHint: "afternoon", confidence: 0.99 }`}
            </Code>
          </div>
          <div>
            <h3 className="font-medium text-base text-ink">
              Timezone is a first-class concept, not an afterthought.
            </h3>
            <p className="mt-1 text-bark">
              All timestamps are stored UTC. Shop-local time comes from a{" "}
              <code className="font-mono text-[13px] text-ink">SHOP_TIMEZONE</code>{" "}
              variable through a single conversion module. Slot math runs in
              shop-local wall clock, then converts to UTC at the boundary.
              I verified the helpers return byte-identical results under
              three different server timezones. Correct by construction, not
              by accident.
            </p>
          </div>
        </div>

        {/* 4 — Concurrency test */}
        <h2 className="mt-12 font-display text-3xl tracking-tight">
          4. The concurrency test
        </h2>
      </div>

      <Shot
        src="/case-study/concurrency-test.png"
        width={1127}
        height={221}
        alt="Terminal showing the concurrency test passing against production"
        caption="Two POSTs, one slot, one winner."
        scroll
      />

      <div className="mx-auto max-w-[70ch]">
        <p className="text-bark">
          The test fires two{" "}
          <code className="font-mono text-[13px] text-ink">
            POST /api/bookings
          </code>{" "}
          calls in the same tick via{" "}
          <code className="font-mono text-[13px] text-ink">Promise.all</code>,
          then asserts exactly one 201 and one 409 and that the database
          contains exactly one row for the slot. The screenshot above is a run
          against the deployed URL — same result as local. The database
          doesn&apos;t care where the request came from; the constraint is
          the constraint.
        </p>
        <Code>
          {`response A: 409 {"error":"slot_taken","message":"That slot was just taken. Please pick another time."}
response B: 201 {"ok":true,"reference_code":"FC-20261006-0005",...}
✅ Exactly one booking succeeded (ref: FC-20261006-0005)
✅ Second request rejected with 409 slot_taken
✅ DB has exactly 1 row for slot 2026-10-06T01:00:00.000Z
PASS`}
        </Code>

        {/* 5 — Design */}
        <h2 className="mt-12 font-display text-3xl tracking-tight">
          5. Design
        </h2>
        <div className="mt-4 space-y-4 text-bark">
          <p>
            Three projects into the portfolio, the visual language needed to
            diverge. The first two both read as SaaS — dark zinc, indigo,
            Inter. That&apos;s correct for a support tool and a B2B lead
            pipeline. Wrong for a neighborhood barbershop. Fade &amp; Co.
            needed its own identity.
          </p>
          <p>
            The storefront is warm cream, Instrument Serif for display,
            brass and amber accents, dark brown text. The admin wing stays
            dark but warm — dark walnut with cream text, same serif.
            Consistent building, two different rooms.
          </p>
          <p>
            Contrast was measured, not eyeballed. Body text 15.49, secondary
            5.45, buttons 6.79 — all AA. Cream palettes fail WCAG easily; a
            beautiful page nobody can read is a worse portfolio piece than a
            plain one.
          </p>
        </div>
      </div>

      <Shot
        src="/case-study/booking.png"
        width={1669}
        height={911}
        alt="The booking wizard with service selection"
        caption="The wizard — warm, uncluttered, no cold SaaS chrome."
      />

      <div className="mx-auto max-w-[70ch]">
        {/* 6 — Differently */}
        <h2 className="font-display text-3xl tracking-tight">
          6. What I&apos;d do differently
        </h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-bark">
          <li>
            <strong className="font-medium text-ink">
              Customer-facing cancellation.
            </strong>{" "}
            v1 has admin-only cancel. The customer path is a two-click flow
            through an email link with a signed token — deliberately deferred,
            but it&apos;s the first thing a real shop would ask for.
          </li>
          <li>
            <strong className="font-medium text-ink">
              Time-off management is a shared calendar, not a form.
            </strong>{" "}
            A shop with three barbers coordinates time off constantly. v1
            treats it as per-barber blocks. A month grid where the owner drags
            across barbers is the right UX.
          </li>
          <li>
            <strong className="font-medium text-ink">
              Rate limiting is a Map, not Redis.
            </strong>{" "}
            Same trade-off as the earlier project — fine for a demo, wrong for
            production.
          </li>
        </ul>

        {/* 7 — Under the hood */}
        <h2 className="mt-12 font-display text-3xl tracking-tight">
          7. Under the hood
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-parchment p-4">
            <dt className="text-bark">Size</dt>
            <dd className="mt-0.5 font-mono text-ink">
              ~6,600 app lines · 76 files · 9 commits
            </dd>
            <dd className="mt-1 font-mono text-[11px] text-bark">
              app/ lib/ components/ scripts/, excl. generated UI kit
            </dd>
          </div>
          <div className="rounded-xl border border-line bg-parchment p-4">
            <dt className="text-bark">Checks</dt>
            <dd className="mt-0.5 font-mono text-ink">
              tsc · build · seed · concurrency — all green
            </dd>
          </div>
          <div className="rounded-xl border border-line bg-parchment p-4">
            <dt className="text-bark">Time</dt>
            <dd className="mt-0.5 font-mono text-ink">
              All timestamps UTC; shop-local via SHOP_TIMEZONE
            </dd>
          </div>
          <div className="rounded-xl border border-line bg-parchment p-4">
            <dt className="text-bark">Database</dt>
            <dd className="mt-0.5 font-mono text-ink">
              btree_gist required for the exclusion constraint
            </dd>
          </div>
          <div className="rounded-xl border border-line bg-parchment p-4 sm:col-span-2">
            <dt className="text-bark">Cost</dt>
            <dd className="mt-0.5 font-mono text-ink">
              Zero paid tools — Supabase, Groq, Gemini, Vercel, Resend,
              GitHub all on free tiers
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Shot
          src="/case-study/admin-schedule.png"
          width={1669}
          height={911}
          alt="Today's schedule showing three barber columns"
          caption="Today's schedule — three barbers, one glance."
          compact
        />
        <Shot
          src="/case-study/service.png"
          width={1669}
          height={911}
          alt="Services table in the admin dashboard"
          caption="Delete protection — a service with future appointments can't be removed."
          compact
        />
      </div>

      <Shot
        src="/case-study/nl-parse.png"
        width={1038}
        height={531}
        alt="Parsed natural-language booking intent card"
        caption="Natural-language input. The parse is shown, not hidden."
      />

      <div className="mx-auto max-w-[70ch]">
        {/* 8 — Footer */}
        <footer className="mt-8 border-t border-line pt-6 text-sm text-bark">
          <p>
            Built by{" "}
            <a
              href={PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink underline decoration-brass decoration-2 underline-offset-4"
            >
              Darvin Raj
            </a>
          </p>
          <p className="mt-1">
            Fade &amp; Co. is a fictional barbershop. This is a portfolio
            piece — no real customers, no real bookings.
          </p>
          <p className="mt-4">
            <Link href="/" className="text-bronze hover:text-ink">
              ← Back to Fade &amp; Co.
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
