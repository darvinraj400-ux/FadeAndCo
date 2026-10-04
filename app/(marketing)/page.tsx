import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { shopTzAbbrev } from "@/lib/timezone";

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

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
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

type HoursRow = {
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export default async function MarketingHomePage() {
  const admin = createAdminClient();
  const [{ data: services }, { data: barbers }, { data: hours }, { data: mappings }] =
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
      admin
        .from("fade_barber_hours")
        .select("barber_id,day_of_week,start_time,end_time"),
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
  const hoursRows = ((hours ?? []) as HoursRow[]).filter(Boolean);
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

  const hoursByBarber = new Map<string, HoursRow[]>();
  for (const h of hoursRows) {
    const list = hoursByBarber.get(h.barber_id) ?? [];
    list.push(h);
    hoursByBarber.set(h.barber_id, list);
  }
  for (const list of hoursByBarber.values()) {
    list.sort(
      (a, b) =>
        a.day_of_week - b.day_of_week ||
        a.start_time.localeCompare(b.start_time)
    );
  }

  return (
    <div className="bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-serif text-xl">
            Fade &amp; Co.
          </Link>
          <div className="hidden items-center gap-6 text-sm text-zinc-400 sm:flex">
            <a href="#services" className="hover:text-zinc-100">
              Services
            </a>
            <a href="#barbers" className="hover:text-zinc-100">
              Barbers
            </a>
            <a href="#hours" className="hover:text-zinc-100">
              Hours
            </a>
            <a href="/book" className="hover:text-zinc-100">
              Book
            </a>
          </div>
          <Link
            href="/book"
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Book now
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-20 md:py-28">
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
          Sharp cuts, honest prices, no guesswork.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-400">
          Fade &amp; Co. is a three-chair barbershop. Book online in under a
          minute — or just tell us what you want and let the AI figure it out.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/book"
            className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Book now
          </Link>
          <a
            href="#services"
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-500"
          >
            See services
          </a>
        </div>
        <p className="mt-6 text-sm text-zinc-400">
          Walk-ins welcome · Tue–Sun · 09:00–19:00 (shop local)
        </p>
      </section>

      {/* Services */}
      <section
        id="services"
        className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
      >
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Services
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedServices.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-medium">{s.name}</h3>
                <span className="text-sm text-zinc-400">
                  ${(s.price_cents / 100).toFixed(0)}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
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
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          The chairs
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {barberList.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-800 text-2xl font-semibold text-zinc-400">
                {b.name.charAt(0)}
              </div>
              <h3 className="mt-3 font-serif text-lg">{b.name}</h3>
              {b.bio ? (
                <p className="mt-1 text-sm text-zinc-400">{b.bio}</p>
              ) : null}
              <p className="mt-2 text-sm text-zinc-400">
                {(servicesByBarber.get(b.id) ?? []).join(", ")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Hours */}
      <section
        id="hours"
        className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28"
      >
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Hours
        </h2>
        <div className="mt-8 space-y-8">
          {barberList.map((b) => (
            <div key={b.id}>
              <h3 className="font-medium">{b.name}</h3>
              <table className="mt-2 w-full max-w-md text-sm">
                <tbody>
                  {(hoursByBarber.get(b.id) ?? []).map((h) => (
                    <tr
                      key={`${b.id}-${h.day_of_week}-${h.start_time}`}
                      className="border-b border-zinc-800"
                    >
                      <td className="py-2 text-zinc-400">
                        {DAY_NAMES[h.day_of_week]}
                      </td>
                      <td className="py-2 text-right">
                        {h.start_time.slice(0, 5)} – {h.end_time.slice(0, 5)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-zinc-400">
          Times shown in shop local ({shopTzAbbrev()}).
        </p>
      </section>

      {/* Location */}
      <section className="mx-auto max-w-5xl px-4 py-20 md:py-28">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Find us
        </h2>
        <p className="mt-4 text-zinc-400">
          12 Jalan Telawi, Bangsar, Kuala Lumpur
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          Two doors down from the kopitiam with the green awning.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-medium">Shop</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>
                <a href="#services" className="hover:text-zinc-100">
                  Services
                </a>
              </li>
              <li>
                <a href="#barbers" className="hover:text-zinc-100">
                  Barbers
                </a>
              </li>
              <li>
                <a href="#hours" className="hover:text-zinc-100">
                  Hours
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>+60 3-2200 0000</li>
              <li>hello@fadeandco.example</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>
                <a href="#" className="hover:text-zinc-100">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-zinc-100">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-800">
          <p className="mx-auto max-w-5xl px-4 py-4 text-sm text-zinc-400">
            © 2026 Fade &amp; Co. A fictional barbershop built as a portfolio
            piece by Darvin Raj.
          </p>
        </div>
      </footer>
    </div>
  );
}
