import type { Metadata } from "next";
import Link from "next/link";
import { Shot } from "@/components/marketing/case-study/Shot";
import { Flow } from "@/components/marketing/case-study/Flow";
import { Facts, type Fact } from "@/components/marketing/case-study/Facts";

export const metadata: Metadata = {
  title: "Case study",
  description:
    "How Fade & Co. was built: race-safe multi-barber scheduling, a deep-linkable booking flow, and an identity that doesn't look like a SaaS dashboard.",
};

const DEMO_URL = "https://fade-and-co-psi.vercel.app";
const REPO_URL = "https://github.com/darvinraj400-ux/FadeAndCo";
const PROFILE_URL = "https://github.com/darvinraj400-ux";

// Read from `npm run build` at the time of writing. Next exposes First Load JS
// only as a human-readable report, not a stable file to read at build time, so
// the honest option is a constant with a provenance comment. Same convention as
// docs/build-log.md.
const BUILD = { route: "/", routeKb: "4.54 kB", firstLoadKb: "116 kB" };
const CASE_STUDY_JS = "177 B / 111 kB";

const FACTS: Fact[] = [
  {
    label: "First Load JS",
    value: `${BUILD.firstLoadKb} on ${BUILD.route}`,
    note: `route JS ${BUILD.routeKb} · this page ${CASE_STUDY_JS}`,
  },
  { label: "Commits", value: "13 · 8 days · 3 visual phases" },
  {
    label: "Size",
    value: "9,263 lines / 85 files",
    wide: true,
    note: "app/ lib/ components/ scripts/ — *.ts and *.tsx only, excl. the generated UI kit",
  },
  {
    label: "Stack",
    value:
      "Next.js 15 App Router · Tailwind v4 · shadcn/ui (Base-UI) · Supabase Postgres + btree_gist · Groq / Gemini · Resend · Vercel",
    wide: true,
  },
  {
    label: "Cost",
    value: "Zero paid tools",
    wide: true,
    note: "Supabase, Groq, Gemini, Vercel, Resend, GitHub — every service on a free tier. Unsplash photos used under the Unsplash License.",
  },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="my-4 overflow-x-auto rounded-xl border border-line bg-parchment p-4 font-mono text-[13px] leading-relaxed text-ink">
      {children}
    </pre>
  );
}

const H2 = "mt-12 font-display text-3xl tracking-tight md:text-4xl";
const H3 = "font-medium text-base text-ink";

export default function CaseStudyPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 md:py-24">
      <div className="mx-auto max-w-[70ch]">
        <p className="text-sm font-medium tracking-wide text-bronze">
          Case Study
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-6xl">
          Fade &amp; Co. — multi-barber booking with a race-safe scheduler
        </h1>
        <p className="mt-4 text-lg text-bark">
          A three-chair barbershop that takes online bookings, including
          natural-language requests and deep links from the storefront. The
          non-trivial part isn&apos;t the form — it&apos;s making sure two
          people can never book the same chair at the same time, in the
          shop&apos;s timezone rather than the server&apos;s.
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
              Resend · Vercel · Unsplash
            </dd>
          </div>
          <div>
            <dt className="text-bark">Timeline</dt>
            <dd className="mt-0.5 font-medium">
              8 days — 6 engineering layers, then 3 visual phases
            </dd>
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
        src="/case-study/hero.png"
        width={2400}
        height={1500}
        alt="Fade & Co. landing page — cinematic barbershop photograph under a serif headline"
        caption="Cinematic hero — one photograph, one overlay, one serif headline."
        priority
      />

      <div className="mx-auto max-w-[70ch]">
        {/* 1 */}
        <h2 className={H2}>1. The problem</h2>
        <div className="mt-4 space-y-4 text-bark">
          <p>
            Small barbershops need online booking. The hard part isn&apos;t the
            UI — it&apos;s correctness. Two people clicking the same slot at the
            same moment is a race condition, and a naive &ldquo;is this slot
            free?&rdquo; check loses it silently: both requests read
            &ldquo;free&rdquo; before either writes, and one customer turns up
            to a double-booked chair.
          </p>
          <p>
            Shop-local time is the second trap. The server runs on UTC, the shop
            runs on Asia/Kuala_Lumpur, and every conversion between the two is a
            place to be off by a day. I made timezone a first-class concept in a
            single module instead of scattering conversions through route
            handlers.
          </p>
          <p>
            The third is combinatorial. Not every barber offers every service —
            Priya does hot-towel shaves, Sam does not — so a slot list is
            wrong the moment you forget to filter it by the pair. Get any of
            these wrong and the booking is still accepted; it just isn&apos;t
            possible.
          </p>
        </div>

        {/* 2 */}
        <h2 className={H2}>2. How it works</h2>
        <p className="mt-4 text-bark">
          The customer picks a service and a barber. The frontend asks for
          slots; the server computes them from hours, existing bookings, and
          time-off with a pure function. The customer picks a time and posts the
          booking. The database itself enforces the race safety, and a
          confirmation email fires in the background.
        </p>
        <Flow />
        <p className="text-bark">
          One predicate runs everywhere — the algorithm, the constraint, and the
          time-off check all use half-open intervals:
        </p>
        <Code>
          {`// Same convention in the algorithm and the constraint:
// overlap  ⟺  aStart < bEnd && aEnd > bStart
// tstzrange(..., '[)')  ⟺  half-open, no off-by-one`}
        </Code>
        <p className="text-bark">
          There is a second entry point into the same wizard: type{" "}
          <code className="font-mono text-[13px] text-ink">
            &ldquo;fade with Sam Saturday afternoon&rdquo;
          </code>{" "}
          into the box above it and a model returns a structured intent —
          service, barber, day, time, and a confidence score. Groq{" "}
          <code className="font-mono text-[13px] text-ink">
            openai/gpt-oss-120b
          </code>{" "}
          answers with{" "}
          <code className="font-mono text-[13px] text-ink">temperature: 0</code>{" "}
          and Gemini is the fallback when it returns nothing usable. The UI shows
          the parse back to you before the slot list rather than jumping
          straight to times, and falls back to the plain wizard when confidence
          is low. That is the whole feature: it proposes, it never decides.
        </p>

        {/* 3 */}
        <h2 className={H2}>3. Technical decisions</h2>
        <div className="mt-4 space-y-8">
          <div>
            <h3 className={H3}>Race safety is a DB constraint, not an app check.</h3>
            <p className="mt-1 text-bark">
              Every junior dev writes{" "}
              <code className="font-mono text-[13px] text-ink">
                if (slot is free) {"{ insert }"}
              </code>
              . That&apos;s a check-then-act bug under concurrency. The correct
              primitive is an exclusion constraint — Postgres refuses the second
              insert at the storage layer, no matter how the requests
              interleave. The app catches error code{" "}
              <code className="font-mono text-[13px] text-ink">23P01</code> and
              returns a friendly 409.
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
            <h3 className={H3}>Half-open intervals everywhere.</h3>
            <p className="mt-1 text-bark">
              <code className="font-mono text-[13px] text-ink">
                [start, end)
              </code>{" "}
              in the constraint, in the availability algorithm, and in the
              time-off overlap check. Two conventions that don&apos;t match
              produce phantom one-second overlaps: a 10:00 booking ending at
              10:30 must not block a 10:30 start. Same predicate on every path.
            </p>
          </div>

          <div>
            <h3 className={H3}>The direct-POST bypass.</h3>
            <p className="mt-1 text-bark">
              <code className="font-mono text-[13px] text-ink">/api/slots</code>{" "}
              only returns what the algorithm considers valid. But nothing
              stopped a client from POSTing any time directly — a 3 AM slot, an
              off-grid <code className="font-mono text-[13px] text-ink">:07</code>{" "}
              start. I only caught this in code review, after the route already
              worked. The fix was a shared server-side validator that re-checks
              the requested time against the barber&apos;s hours before insert.
              Client filters are UX; server validation is correctness.
            </p>
          </div>

          <div>
            <h3 className={H3}>
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
              booking. The <code className="font-mono text-[13px] text-ink">waitUntil</code> path is
              exercised against the local server; confirming delivery to a
              production inbox is still open.
            </p>
          </div>

          <div>
            <h3 className={H3}>Deep-linkable booking.</h3>
            <p className="mt-1 text-bark">
              <code className="font-mono text-[13px] text-ink">
                /book?barber=sam&amp;service=fade
              </code>{" "}
              preselects both and advances to the slot picker. Every service row
              and barber card on the landing page links through, so the booking
              flow is one URL param away from any marketing surface. The first
              version built the link and then ignored the param entirely — the
              barber card said &ldquo;Book with Sam&rdquo; and landed on a blank
              service list. Fixed in phase 3, along with the case where a
              deep-linked barber doesn&apos;t offer the chosen service.
            </p>
          </div>

          <div>
            <h3 className={H3}>
              Physical materials without photography we don&apos;t have.
            </h3>
            <p className="mt-1 text-bark">
              Fade &amp; Co. is a fictional shop. No real haircuts, no real
              barbers, no real interior. The solution was a small curated set of
              Unsplash photographs for the hero and the portraits, and
              hand-drawn SVG accents where stock imagery would be too obviously
              borrowed. Eight photographs ship as WebP with a JPEG fallback,
              every one credited in{" "}
              <code className="font-mono text-[13px] text-ink">public/CREDITS.md</code>
              . The whole thing is documented as a portfolio piece rather than
              dressed up as a real business.
            </p>
          </div>
        </div>
      </div>

      <Shot
        src="/case-study/menu.png"
        width={2880}
        height={1800}
        alt="Services listed as a printed menu with dotted leaders and right-aligned prices"
        caption="Services as a printed menu — leaders, prices, no boxes."
      />

      <div className="grid items-start gap-6 md:grid-cols-2">
        <Shot
          src="/case-study/barbers.png"
          width={2880}
          height={1800}
          layout="half"
          alt="Three barber portraits with names, roles, and service pills"
          caption="Three barbers, photographed. Roles and specialities underneath."
        />
        <Shot
          src="/case-study/dark-about.png"
          width={2880}
          height={1800}
          layout="half"
          alt="About section on matte black with an offset interior photograph"
          caption="Matte black, gold accent. The dark chapter."
        />
      </div>

      <Shot
        src="/case-study/reviews.png"
        width={2880}
        height={1800}
        alt="Three five-star review cards on matte black, with gold stars and gold rules"
        caption="Five-star cards on matte black, gold rules. Same palette as the admin."
      />

      <div className="mx-auto max-w-[70ch]">
        {/* 4 */}
        <h2 className={H2}>4. The visual system</h2>
        <div className="mt-4 space-y-4 text-bark">
          <p>
            Fade &amp; Co. needed to feel like a neighborhood barbershop, not a
            SaaS dashboard. SupportAI and LeadFlow both live in the same
            dark-zinc-and-indigo world; giving Fade &amp; Co. the same palette would
            have made three projects feel like one design with three names. So:
            cream storefront (Instrument Serif, warm ivory base, brass accent),
            matte black and gold for the dark interior sections (About,
            Reviews), and the admin on the same dark palette — so the shop and
            its back office feel like one building.
          </p>
          <p>
            The typography pairing is Instrument Serif for display — headlines,
            section titles — and Inter for body, with Geist Mono for every
            number, price, time, and reference code. The serif carries the
            heritage; the mono carries the precision.
          </p>
          <p>
            Structurally, three phases added an announcement bar with a session
            dismiss, a trust strip, real photography for the hero and the
            portraits, the printed-menu services layout, the dark About and
            Reviews chapters, a booking flow with slide transitions and a
            success screen, and a mobile sticky CTA. The whole build was three
            phases over eight days; the details are what make it feel like a real
            shop.
          </p>
        </div>

        {/* 5 */}
        <h2 className={H2}>5. The booking flow</h2>
        <div className="mt-4 space-y-4 text-bark">
          <p>
            A booking flow has three states users actually care about: choosing
            a slot, seeing it confirmed, and not having to think about it again.
            Everything else is intermediate. The wizard has four steps — service,
            barber, slot, confirm — the steps slide horizontally between each
            other, and the progress indicator shows completed, current, and
            upcoming states in brass.
          </p>
          <p>
            The success screen is a small thing that matters. A reference code
            in mono with a copy button, the full booking summary, and an{" "}
            <code className="font-mono text-[13px] text-ink">.ics</code>{" "}
            download so the appointment lands in the user&apos;s calendar
            without retyping the details. Building the calendar file surfaced a
            real bug: the timestamps were emitted without the{" "}
            <code className="font-mono text-[13px] text-ink">Z</code> designator,
            which makes an RFC 5545 date-time a floating local time. A 12:00
            booking in Kuala Lumpur opened at 04:00. This is what separates a
            demo from a product — the small courtesies.
          </p>
          <p>
            The concurrency test fires two{" "}
            <code className="font-mono text-[13px] text-ink">
              POST /api/bookings
            </code>{" "}
            calls in the same tick via{" "}
            <code className="font-mono text-[13px] text-ink">Promise.all</code>,
            then asserts exactly one 201 and one 409 and that the database
            contains exactly one row for the slot. It passes against the local
            server and against the deployed URL. The database doesn&apos;t care
            where the request came from — the constraint is the constraint.
          </p>
        </div>
        <Code>
          {`response A: 409 {"error":"slot_taken","message":"That slot was just taken. Please pick another time."}
response B: 201 {"ok":true,"reference_code":"FC-20261006-0005",...}
✅ Exactly one booking succeeded (ref: FC-20261006-0005)
✅ Second request rejected with 409 slot_taken
✅ DB has exactly 1 non-cancelled row for slot 2026-10-06T01:00:00.000Z
✅ Winning appointment cleaned up
PASS`}
        </Code>
      </div>

      <Shot
        src="/case-study/booking-flow.png"
        width={1728}
        height={608}
        layout="narrow"
        alt="Booking wizard on the barber step, progress indicator showing completed, current, and upcoming"
        caption="Four steps, slide transitions, brass progress."
      />

      <Shot
        src="/case-study/booking-success.png"
        width={2880}
        height={1800}
        alt="Booking confirmation with a checkmark, reference code, and booking summary"
        caption="Reference code, full summary, .ics download."
      />

      <div className="mx-auto max-w-[70ch]">
        {/* 6 */}
        <h2 className={H2}>6. What I&apos;d do differently</h2>
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
            A shop with three barbers coordinates time off constantly. v1 treats
            it as per-barber blocks. A month grid where the owner drags across
            barbers is the right UX.
          </li>
          <li>
            <strong className="font-medium text-ink">
              Rate limiting is a Map, not Redis.
            </strong>{" "}
            Same trade-off as the earlier projects — fine for a demo, wrong for
            production. Upstash Redis with a sliding window.
          </li>
        </ul>

        {/* 7 */}
        <h2 className={H2}>7. Under the hood</h2>
        <Facts items={FACTS} />
      </div>

      <Shot
        src="/case-study/admin-schedule.png"
        width={2880}
        height={1800}
        alt="Admin today view with three barber columns, confirmed badges, and free-window blocks"
        caption="The admin on the same matte black + brass as the dark storefront sections."
      />

      <div className="mx-auto max-w-[70ch]">
        {/* 8 */}
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
            Fade &amp; Co. is a fictional barbershop. This is a portfolio piece —
            no real customers, no real bookings.
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
