import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Reveal } from "@/components/marketing/Reveal";
import { FaqSection } from "@/components/marketing/FaqSection";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // Absolute: skip the "%s · Fade & Co." template (the name is in the string).
  title: { absolute: "Fade & Co. — barbershop booking" },
  description:
    "Sharp cuts, honest prices, no guesswork. Book online in under a minute — or just tell us what you want.",
};

const SERVICE_ORDER = [
  "haircut",
  "fade",
  "beard-trim",
  "haircut-beard",
  "kids-cut",
];

type Service = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
};

type Barber = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
};

const TESTIMONIALS = [
  {
    quote:
      "Been coming here for three years. The fade is always clean, and they actually remember what you asked for last time.",
    name: "Arif K., regular since 2021",
  },
  {
    quote:
      "Booked online at 11pm, walked in at 10am, was out the door in 30 minutes. Best haircut system in KL.",
    name: "Wei Ling T., first-time visitor",
  },
  {
    quote:
      "Took my 6-year-old for his first real haircut. The barber was patient, the result was sharp, and there was no drama.",
    name: "Priya S., parent",
  },
];

const FAQ_ITEMS = [
  {
    q: "Do I need to book, or can I walk in?",
    a: "Walk-ins welcome, but weekends fill up fast. Booking online guarantees a slot.",
  },
  {
    q: "How long does a haircut take?",
    a: "30 minutes for a standard cut, 45 for a cut and beard. Arrive 5 minutes early — first-timers usually want to chat about what they want.",
  },
  {
    q: "Do you take card or cash?",
    a: "Both. Tap-and-go, or cash. No minimum.",
  },
  {
    q: "What if I'm late?",
    a: "Up to 10 minutes late is fine. After that we may need to shorten or reschedule — we won't rush the person in the chair before you.",
  },
  {
    q: "Do you cut kids' hair?",
    a: "Yes. Kids Cut is a 20-minute appointment for ages 4 and up. Book online and select Kids Cut.",
  },
  {
    q: "Can I pick my barber?",
    a: 'Yes. When booking, choose a specific barber, or select "any available" and we\'ll match you with the next free chair.',
  },
];

function Star() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="text-brass"
    >
      <path d="M12 2l2.9 6.26 6.6.56-5 4.36 1.5 6.45L12 16.9 5.99 19.63l1.5-6.45-5-4.36 6.6-.56L12 2z" />
    </svg>
  );
}

function BarberChair() {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="h-40 w-40 text-brass opacity-30"
    >
      {/* headrest */}
      <rect x="118" y="18" width="26" height="12" rx="4" />
      {/* backrest */}
      <rect x="116" y="32" width="30" height="62" rx="8" />
      {/* seat */}
      <rect x="66" y="94" width="80" height="18" rx="9" />
      {/* armrest */}
      <path d="M72 94 V74 H104" />
      <path d="M72 82 H96" />
      {/* hydraulic column */}
      <path d="M106 112 V142" />
      <path d="M98 126 H114" />
      {/* round base */}
      <ellipse cx="106" cy="152" rx="30" ry="8" />
      {/* footrest */}
      <path d="M146 104 L168 128 M160 128 H176" />
      {/* floor line */}
      <path d="M40 168 H160" />
    </svg>
  );
}

export default async function MarketingHomePage() {
  const admin = createAdminClient();
  const [{ data: services }, { data: barbers }, { data: mappings }] =
    await Promise.all([
      admin
        .from("fade_services")
        .select("id,name,slug,description,duration_minutes,price_cents")
        .eq("active", true),
      admin
        .from("fade_barbers")
        .select("id,name,slug,bio")
        .eq("active", true)
        .order("name"),
      admin.from("fade_service_barbers").select("barber_id,service_id"),
    ]);

  const orderOf = (slug: string) => {
    const idx = SERVICE_ORDER.indexOf(slug);
    return idx === -1 ? SERVICE_ORDER.length : idx;
  };
  const orderedServices = ((services ?? []) as Service[]).sort(
    (a, b) => orderOf(a.slug) - orderOf(b.slug)
  );
  const barberList = ((barbers ?? []) as Barber[]).filter(Boolean);
  const serviceNames = new Map(
    orderedServices.map((s) => [s.id, s.name] as [string, string])
  );
  const servicesByBarber = new Map<string, string[]>();
  for (const m of (mappings ?? []) as Array<{
    barber_id: string;
    service_id: string;
  }>) {
    const name = serviceNames.get(m.service_id);
    if (!name) continue;
    const list = servicesByBarber.get(m.barber_id) ?? [];
    list.push(name);
    servicesByBarber.set(m.barber_id, list);
  }

  return (
    <div id="top" tabIndex={-1} className="bg-bone text-ink">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-20 md:py-28">
        <h1 className="font-display text-5xl tracking-tight md:text-7xl">
          Sharp cuts, honest prices, no guesswork.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-bark">
          Fade &amp; Co. is a three-chair barbershop. Book online in under a
          minute — or just tell us what you want and let the AI figure it out.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/book"
            className="rounded-lg bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:bg-brass/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
          >
            Book now
          </Link>
          <a
            href="#services"
            className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink hover:border-bronze focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
          >
            See services
          </a>
        </div>
        <p className="mt-6 text-sm text-bark">
          Walk-ins welcome · Tue–Sun (shop local)
        </p>
      </section>

      {/* Trust strip */}
      <div className="border-t border-brass bg-bone">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-4 text-sm">
          <span className="flex items-center gap-1.5">
            <Star /> 4.9 · 120+ reviews
          </span>
          <span aria-hidden="true" className="text-line">
            ·
          </span>
          <span>Bangsar, KL</span>
          <span aria-hidden="true" className="text-line">
            ·
          </span>
          <span>Est. 2018</span>
          <span aria-hidden="true" className="text-line">
            ·
          </span>
          <span>Walk-ins welcome</span>
        </div>
      </div>

      {/* Services */}
      <section
        id="services"
        className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
      >
        <h2 className="font-display text-3xl tracking-tight md:text-4xl">
          Services
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedServices.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-line bg-parchment p-5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-medium">{s.name}</h3>
                <span className="font-mono text-sm text-bark">
                  ${(s.price_cents / 100).toFixed(0)}
                </span>
              </div>
              <p className="mt-1 text-sm text-bark">
                {s.duration_minutes} min
                {s.description ? ` · ${s.description}` : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Barbers */}
      <section
        id="barbers"
        className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
      >
        <h2 className="font-display text-3xl tracking-tight md:text-4xl">
          The chairs
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {barberList.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-line bg-parchment p-5"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-brass/25 font-display text-4xl text-bronze">
                {b.name.charAt(0)}
              </div>
              <h3 className="mt-3 font-display text-xl">{b.name}</h3>
              {b.bio ? (
                <p className="mt-1 text-sm text-bark">{b.bio}</p>
              ) : null}
              <p className="mt-2 text-sm text-bark">
                {(servicesByBarber.get(b.id) ?? []).join(", ") ||
                  "Ask us what this chair does best."}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery — placeholder grid; real photography lands in Phase 2. */}
      <section
        id="gallery"
        className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
      >
        <p className="font-mono text-xs tracking-widest text-bronze">
          GALLERY
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
          The shop
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {["Chair one", "Chair two", "Chair three"].map((label) => (
            <div
              key={label}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-parchment"
            >
              <span className="text-sm text-bark">{label}</span>
              <span className="font-mono text-xs text-bark">
                Photos — Phase 2
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* About */}      <Reveal>
        <section
          id="about"
          className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
        >
          <div className="grid gap-8 md:grid-cols-[3fr_2fr]">
            <div>
              <p className="font-mono text-xs tracking-widest text-bronze">
                OUR STORY
              </p>
              <h2 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
                Three chairs. One street. Eight years of sharp.
              </h2>
              <div className="mt-4 max-w-[70ch] space-y-4 text-bark">
                <p>
                  Founded 2018 in a narrow shop on a Bangsar side street.
                  Started with one chair and a standing agreement with the
                  barber next door about which radio station to play.
                </p>
                <p>
                  Grew to three chairs. Kept the radio argument. Kept the
                  prices honest. Kept the walk-ins welcome.
                </p>
                <p>
                  Today: three barbers, five services, and a booking system
                  that actually respects your time. But the point is still the
                  same — you come in, you sit down, you leave sharper than you
                  walked in.
                </p>
              </div>
            </div>
            <div className="flex aspect-square items-center justify-center rounded-2xl border border-line bg-parchment">
              <BarberChair />
            </div>
          </div>
        </section>
      </Reveal>

      {/* Testimonials */}
      <Reveal>
        <section
          id="testimonials"
          className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
        >
          <p className="font-mono text-xs tracking-widest text-bronze">
            WHAT CUSTOMERS SAY
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
            Reviews
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="rounded-xl border border-line bg-parchment p-5 shadow-[0_1px_2px_rgba(33,24,18,0.06)]"
              >
                <div
                  className="flex gap-1"
                  role="img"
                  aria-label="5 out of 5 stars"
                >
                  <Star />
                  <Star />
                  <Star />
                  <Star />
                  <Star />
                </div>
                <blockquote className="mt-3 text-sm text-ink">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-3 font-mono text-xs text-bark">
                  — {t.name}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 text-sm text-bark">
            Demo reviews — Fade &amp; Co. is a fictional shop.
          </p>
        </section>
      </Reveal>

      {/* Location & Hours.
          Phase-1 tradeoff: the generic hours table below is static copy.
          Per-barber availability still comes from fade_barber_hours and
          drives the booking flow — rewire the display in Phase 2. */}
      <Reveal>
        <section
          id="location"
          className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
        >
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="font-mono text-xs tracking-widest text-bronze">
                FIND US
              </p>
              <address className="mt-2 font-display text-2xl not-italic md:text-3xl">
                12 Jalan Telawi 4, Bangsar,
                <br />
                59100 Kuala Lumpur
              </address>
              <p className="mt-4 font-mono text-sm">
                <a href="tel:+60322880000" className="hover:text-bronze">
                  03-2288 XXXX
                </a>
              </p>
              <p className="mt-1 text-sm text-bark"><a href="mailto:hello@fadeand.co" className="hover:text-ink">hello@fadeand.co</a></p>
              <a
                href="https://www.openstreetmap.org/?mlat=3.1389&mlon=101.6711#map=17/3.1389/101.6711"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-lg bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:bg-brass/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
              >
                Get directions
              </a>
            </div>
            <div>
              <p className="font-mono text-xs tracking-widest text-bronze">
                HOURS
              </p>
              <table className="mt-2 w-full font-mono text-sm">
                <tbody>
                  <tr className="border-b border-line">
                    <td className="py-2">TUE–SAT</td>
                    <td className="py-2 text-right">09:00–19:00</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td className="py-2">SUN</td>
                    <td className="py-2 text-right">11:00–19:00</td>
                  </tr>
                  <tr>
                    <td className="py-2">MON</td>
                    <td className="py-2 text-right">Closed</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-4 aspect-[4/3] overflow-hidden rounded-2xl border border-line md:aspect-[16/9]">
                <iframe
                  title="Map — Fade & Co., Bangsar, Kuala Lumpur"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=101.6600%2C3.1330%2C101.6820%2C3.1450&layer=mapnik&marker=3.1389%2C101.6711"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0"
                />
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* FAQ */}
      <Reveal>
        <FaqSection items={FAQ_ITEMS} />
      </Reveal>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="font-display text-xl">Fade &amp; Co.</p>
            <p className="mt-2 text-sm text-bark">
              Three chairs. One street. Since 2018.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Shop</h3>
            <ul className="mt-3 space-y-2 text-sm text-bark">
              <li>
                <a href="#services" className="hover:text-ink">
                  Services
                </a>
              </li>
              <li>
                <a href="#barbers" className="hover:text-ink">
                  Barbers
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-ink">
                  Gallery
                </a>
              </li>
              <li>
                <a href="#location" className="hover:text-ink">
                  Hours
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-ink">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/book" className="hover:text-ink">
                  Book now
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-bark">
              <li>
                12 Jalan Telawi 4, Bangsar,
                <br />
                59100 Kuala Lumpur
              </li>
              <li>
                <a href="tel:+60322880000" className="font-mono hover:text-ink">
                  03-2288 XXXX
                </a>
              </li>
              <li><a href="mailto:hello@fadeand.co" className="hover:text-ink">hello@fadeand.co</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium">Hours</h3>
            <ul className="mt-3 space-y-2 font-mono text-sm text-bark">
              <li>TUE–SAT 09:00–19:00</li>
              <li>SUN 11:00–19:00</li>
              <li>MON Closed</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-bark">
            <p>
              © 2026 Fade &amp; Co. — a fictional barbershop built as a
              portfolio piece.
            </p>
            <p className="flex items-center gap-4">
              <span>
                Built by{" "}
                <a
                  href="https://github.com/darvinraj400-ux"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ink"
                >
                  Darvin Raj
                </a>
              </span>
              <a href="#top" className="hover:text-ink">
                Back to top
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
