import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Reveal } from "@/components/marketing/Reveal";
import { FaqSection } from "@/components/marketing/FaqSection";
import { Hero } from "@/components/marketing/Hero";
import { AboutPhoto } from "@/components/marketing/AboutPhoto";
import { MobileBookCta } from "@/components/marketing/MobileBookCta";
import { Photo } from "@/components/marketing/Photo";

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

// Opening hours, shown in full in the location table and condensed in the
// footer. Static marketing copy that matches scripts/seed-demo.ts as of the
// Phase 2 build — it is deliberately not read from fade_barber_hours, so an
// admin hours edit will not propagate here until this is rewired.
// [day, time]
const OPENING_HOURS: ReadonlyArray<readonly [string, string]> = [
  ["Monday", "10:00–18:00"],
  ["Tuesday", "09:00–18:00"],
  ["Wednesday", "09:00–19:00"],
  ["Thursday", "09:00–19:00"],
  ["Friday", "09:00–19:00"],
  ["Saturday", "09:00–19:00"],
  ["Sunday", "11:00–19:00"],
];

// The five condensed rows the footer shows. Labels are new; the times are read
// from OPENING_HOURS so the two lists cannot drift apart.
const FOOTER_HOURS: ReadonlyArray<readonly [string, string]> = [
  ["MON", OPENING_HOURS[0][1]],
  ["TUE", OPENING_HOURS[1][1]],
  ["WED–FRI", OPENING_HOURS[2][1]],
  ["SAT", OPENING_HOURS[5][1]],
  ["SUN", OPENING_HOURS[6][1]],
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

function ServiceRow({ service }: { service: Service }) {
  const popular = service.slug === "haircut-beard";
  return (
    <div className="group py-4 transition-transform duration-200 ease-out hover:translate-x-1 motion-reduce:transition-none motion-reduce:hover:translate-x-0">
      <div className="flex items-baseline gap-3">
        <h3 className="font-display text-2xl">
          {service.name}
          {popular ? (
            <span className="ml-2 inline-block rounded-full bg-brass px-2 py-0.5 align-middle font-mono text-[10px] tracking-widest text-ink">
              POPULAR
            </span>
          ) : null}
        </h3>
        <span
          aria-hidden="true"
          className="mx-1 flex-1 border-b border-solid border-bronze/40 md:border-dotted"
        />
        <span className="font-mono text-sm text-bark transition-colors group-hover:text-bronze">
          {formatPrice(service.price_cents)}
        </span>
      </div>
      <p className="mt-1 font-mono text-xs text-bark">
        {service.duration_minutes} MIN
      </p>
      {service.description ? (
        <p className="mt-0.5 text-sm text-bark">{service.description}</p>
      ) : null}
      <Link
        href={`/book?service=${encodeURIComponent(service.slug)}`}
        className="mt-1 inline-block text-sm font-medium text-bronze transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-bronze"
      >
        Book this →
      </Link>
    </div>
  );
}

const BARBER_ROLES: Record<string, string> = {
  marcus: "OWNER",
  priya: "CLASSIC CUTS",
  sam: "FADES & MODERN",
};

// Slugs that have a real portrait in /public/images.
const PORTRAIT_PHOTOS = new Set(["marcus", "priya", "sam"]);

const GALLERY_SHOTS = [
  {
    name: "chair-1",
    width: 900,
    height: 1200,
    alt: "Barber shaping a fade with clippers",
    caption: "Fade · Marcus",
  },
  {
    name: "chair-2",
    width: 900,
    height: 1200,
    alt: "Close-up of a classic cut in progress",
    caption: "Classic cut · Priya",
  },
  {
    name: "chair-3",
    width: 900,
    height: 1200,
    alt: "Barber tools laid out on the counter",
    caption: "Tools of the trade",
  },
];

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
  // Split the menu down the middle rather than filtering on a hardcoded slug
  // allow-list: a filter would silently hide any service an admin adds later
  // (it would still be bookable, just invisible on the pricing page).
  const splitAt = Math.ceil(orderedServices.length / 2);
  const leftServices = orderedServices.slice(0, splitAt);
  const rightServices = orderedServices.slice(splitAt);
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

      <Hero />

      {/* Trust strip */}
      <Reveal>
        <div className="border-y border-brass bg-black/90">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-4 text-sm text-[#F4F0E8]">
            <span className="flex items-center gap-1.5">
              <Star /> 4.9 · 120+ reviews
            </span>
            <span aria-hidden="true" className="text-brass/60">
              ·
            </span>
            <span>Bangsar, KL</span>
            <span aria-hidden="true" className="text-brass/60">
              ·
            </span>
            <span>Est. 2018</span>
            <span aria-hidden="true" className="text-brass/60">
              ·
            </span>
            <span>Walk-ins welcome</span>
          </div>
        </div>
      </Reveal>

      {/* Services — printed menu */}
      <Reveal>
        <section
          id="services"
          className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
        >
          <p className="font-mono text-xs tracking-widest text-bronze">
            SERVICES &amp; PRICING
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
            The menu.
          </h2>
          <div className="mt-8 grid gap-x-12 gap-y-2 md:grid-cols-2">
            <div>
              {leftServices.map((s) => (
                <ServiceRow key={s.id} service={s} />
              ))}
            </div>
            <div>
              {rightServices.map((s) => (
                <ServiceRow key={s.id} service={s} />
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Barbers */}
      <Reveal>
        <section
          id="barbers"
          className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
        >
          <p className="font-mono text-xs tracking-widest text-bronze">
            THE CHAIRS
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
            Meet the barbers.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {barberList.map((b, i) => (
              <Reveal key={b.id} delayMs={i * 80} className="h-full">
                <div className="flex h-full flex-col rounded-xl border border-line bg-parchment p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brass motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  <div className="overflow-hidden rounded-xl">
                    {PORTRAIT_PHOTOS.has(b.slug) ? (
                      <Photo
                        name={`barber-${b.slug}`}
                        width={800}
                        height={800}
                        alt={`${b.name}, barber at Fade & Co.`}
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      // No portrait on disk for a barber added through the
                      // admin — fall back to initials instead of a 404 image.
                      <div
                        aria-hidden="true"
                        className="flex aspect-square w-full items-center justify-center bg-parchment font-display text-6xl text-bronze"
                      >
                        {b.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="mt-4 font-display text-2xl">{b.name}</h3>
                  <p className="mt-1 font-mono text-xs tracking-widest text-bronze">
                    {BARBER_ROLES[b.slug] ?? "BARBER"}
                  </p>
                  {b.bio ? (
                    <p className="mt-2 line-clamp-2 text-sm text-bark">
                      {b.bio}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(servicesByBarber.get(b.id) ?? [])
                      .slice(0, 3)
                      .map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-line px-2.5 py-0.5 text-xs text-bark"
                        >
                          {s}
                        </span>
                      ))}
                  </div>
                  <Link
                    href={`/book?barber=${encodeURIComponent(b.slug)}`}
                    className="mt-3 text-sm font-medium text-bronze hover:text-ink focus-visible:outline-2 focus-visible:outline-bronze"
                  >
                    Book with {b.name} →
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Gallery */}
      <Reveal>
        <section
          id="gallery"
          className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
        >
          <p className="font-mono text-xs tracking-widest text-bronze">
            THE SHOP
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
            Recent work.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {GALLERY_SHOTS.map((g) => (
              <a
                key={g.name}
                href={`/images/${g.name}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${g.alt} full size in a new tab`}
                className="group relative block overflow-hidden rounded-none border border-brass/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
              >
                <Photo
                  name={g.name}
                  width={g.width}
                  height={g.height}
                  alt=""
                  className="aspect-[3/4] w-full object-cover"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-8 font-mono text-xs text-[#F4F0E8] opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none"
                >
                  {g.caption}
                </span>
              </a>
            ))}
          </div>
        </section>
      </Reveal>

      {/* About + Reviews — one dark chapter. */}
      <div className="bg-[#111111] text-[#F4F0E8]">
        {/* About */}
        <Reveal>
          <section
            id="about"
            className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
          >
            <div className="grid gap-8 md:grid-cols-[3fr_2fr]">
              <div>
                <p className="font-mono text-xs tracking-widest text-brass">
                  OUR STORY
                </p>
                <h2 className="mt-2 font-display text-3xl tracking-tight text-[#F4F0E8] md:text-4xl">
                  Three chairs. One street. Eight years of sharp.
                </h2>
                <div className="mt-4 max-w-[70ch] space-y-4 text-[#F4F0E8]/80">
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
                <div className="mt-6 flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 bg-brass"
                  />
                  <span className="font-mono text-xs tracking-widest text-brass">
                    SINCE 2018
                  </span>
                </div>
              </div>
              <AboutPhoto />
            </div>
          </section>
        </Reveal>

        {/* Testimonials */}
        <Reveal>
          <section
            id="testimonials"
            className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
          >
            <p className="font-mono text-xs tracking-widest text-brass">
              WHAT CUSTOMERS SAY
            </p>
            <h2 className="mt-2 font-display text-3xl tracking-tight text-[#F4F0E8] md:text-4xl">
              Reviews
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delayMs={i * 80} className="h-full">
                  <figure className="h-full rounded-xl border border-[rgba(200,164,107,0.2)] bg-[#1a1a1a] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brass/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
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
                    <blockquote className="mt-3 font-display text-[1.125rem] italic text-[#F4F0E8]">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-3 font-mono text-xs text-[#F4F0E8]/60">
                      — {t.name}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
            <p className="mt-4 text-sm text-[#F4F0E8]/50">
              Demo reviews — Fade &amp; Co. is a fictional shop.
            </p>
          </section>
        </Reveal>
      </div>

      {/* Location & Hours.
          Hours are static marketing copy — see OPENING_HOURS. Per-barber
          availability still comes from fade_barber_hours and drives the
          booking flow. */}
      <Reveal>
        <section
          id="location"
          className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
        >
          <h2 className="sr-only">Find us &amp; hours</h2>
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
                className="mt-4 inline-block rounded-lg bg-brass px-5 py-2.5 text-sm font-medium text-ink transition hover:brightness-110 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
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
                  {OPENING_HOURS.map(([day, time], i, arr) => (
                    <tr
                      key={day}
                      className={i < arr.length - 1 ? "border-b border-line" : ""}
                    >
                      <td className="py-2 text-bronze">{day}</td>
                      <td className="py-2 text-right">{time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 aspect-[4/3] overflow-hidden rounded-2xl border border-line md:aspect-[16/9]">
                <iframe
                  title="Map — Fade & Co., Bangsar, Kuala Lumpur"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=101.6600%2C3.1330%2C101.6820%2C3.1450&layer=mapnik&marker=3.1389%2C101.6711"
                  loading="lazy"
                  referrerPolicy="no-referrer"
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

      {/* Footer — deliberately not wrapped in Reveal: it is the last element
          on the page, so it gains nothing from an entrance, and a transform on
          an ancestor would create a containing block for the whole footer. */}
      <footer id="site-footer" className="border-t border-line">
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
              {FOOTER_HOURS.map(([label, time]) => (
                <li key={label}>
                  <span className="text-bronze">{label}</span> {time}
                </li>
              ))}
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

      {/* Outside every <Reveal> and outside the footer — see MobileBookCta. */}
      <MobileBookCta />
    </div>
  );
}
