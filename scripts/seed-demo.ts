import "./_env";
import { addDays, addMinutes } from "date-fns";
import { createAdminClient } from "@/lib/supabase";
import { computeAvailableSlots } from "@/lib/booking/slots";
import {
  formatShopTime,
  shopDateTimeToUtc,
  shopDayBounds,
  toShopTime,
} from "@/lib/timezone";

type Barber = { id: string; name: string; slug: string };
type Service = { id: string; name: string; slug: string; duration: number };

// Weekly schedule: day_of_week 0=Sunday.
const SCHEDULES: Record<string, { days: number[]; open: string; close: string }> = {
  marcus: { days: [2, 3, 4, 5, 6], open: "09:00", close: "17:00" }, // Tue–Sat
  sam: { days: [1, 2, 3, 4, 5], open: "10:00", close: "18:00" }, // Mon–Fri
  priya: { days: [3, 4, 5, 6, 0], open: "11:00", close: "19:00" }, // Wed–Sun
};

// True UTC instant of shop-local noon today. All seed days are true instants
// (never wall-field containers), so every helper stays host-independent:
// weekdays via toShopTime local getters, day math via date-fns (+24h steps
// advance the wall calendar by exactly one day for the fixed-offset shop TZ).
function shopNoonToday(): Date {
  return shopDateTimeToUtc(new Date(), "12:00");
}

// Noon instants of the next `count` working days for a barber, from tomorrow.
function nextWorkingDays(slug: string, count: number): Date[] {
  const days = SCHEDULES[slug]!.days;
  const out: Date[] = [];
  let cursor = addDays(shopNoonToday(), 1);
  while (out.length < count) {
    if (days.includes(toShopTime(cursor).getDay())) out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

// Noon instant of the most recent working day strictly before today
// (for the completed appointment).
function lastWorkingDay(slug: string): Date {
  const days = SCHEDULES[slug]!.days;
  let cursor = addDays(shopNoonToday(), -1);
  while (!days.includes(toShopTime(cursor).getDay())) {
    cursor = addDays(cursor, -1);
  }
  return cursor;
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("seed refused in production (destructive wipe)");
  }
  const supabase = createAdminClient();
  console.log(
    `seeding ${process.env.NEXT_PUBLIC_SUPABASE_URL} (destructive wipe of fade_* tables)`
  );
  let refSeq = 1;
  // YYYYMMDD from the appointment's shop-local day (host-independent).
  const ref = (startsAt: Date) =>
    `FC-${formatShopTime(startsAt, "yyyyMMdd")}-${String(refSeq++).padStart(4, "0")}`;

  // Wipe in FK dependency order. fade_service_barbers has a composite PK
  // (barber_id, service_id) and no id column.
  const wipeOrder: Array<{ table: string; key: string }> = [
    { table: "fade_appointments", key: "id" },
    { table: "fade_time_off", key: "id" },
    { table: "fade_service_barbers", key: "barber_id" },
    { table: "fade_barber_hours", key: "id" },
    { table: "fade_services", key: "id" },
    { table: "fade_barbers", key: "id" },
  ];
  for (const { table, key } of wipeOrder) {
    const { error } = await supabase.from(table).delete().not(key, "is", null);
    if (error) throw new Error(`wipe ${table}: ${error.message}`);
  }

  // Barbers.
  const { data: barbers, error: barbersError } = await supabase
    .from("fade_barbers")
    .insert([
      { name: "Marcus", slug: "marcus", bio: "Owner. 12 years behind the chair." },
      { name: "Sam", slug: "sam", bio: "Fades and modern cuts." },
      { name: "Priya", slug: "priya", bio: "Classic cuts and hot-towel shaves." },
    ])
    .select("id,name,slug");
  if (barbersError) throw new Error(`insert barbers: ${barbersError.message}`);
  const barberBySlug = Object.fromEntries(
    ((barbers ?? []) as Barber[]).map((b) => [b.slug, b])
  );

  // Services.
  const { data: services, error: servicesError } = await supabase
    .from("fade_services")
    .insert([
      { name: "Haircut", slug: "haircut", description: "Classic cut, wash and style.", duration_minutes: 30, price_cents: 3000 },
      { name: "Fade", slug: "fade", description: "Skin fade, any length on top.", duration_minutes: 30, price_cents: 3500 },
      { name: "Beard Trim", slug: "beard-trim", description: "Shape, line-up and hot towel.", duration_minutes: 15, price_cents: 1500 },
      { name: "Haircut + Beard", slug: "haircut-beard", description: "Full service, cut and beard.", duration_minutes: 45, price_cents: 4000 },
      { name: "Kids Cut", slug: "kids-cut", description: "Under-12s cut.", duration_minutes: 20, price_cents: 2000 },
    ])
    .select("id,name,slug,duration_minutes");
  if (servicesError) throw new Error(`insert services: ${servicesError.message}`);
  const serviceBySlug: Record<string, Service> = Object.fromEntries(
    ((services ?? []) as { id: string; name: string; slug: string; duration_minutes: number }[]).map(
      (s) => [s.slug, { id: s.id, name: s.name, slug: s.slug, duration: s.duration_minutes }]
    )
  );

  // Service-barber mappings.
  const mapping: Record<string, string[]> = {
    marcus: ["haircut", "fade", "beard-trim", "haircut-beard", "kids-cut"],
    sam: ["haircut", "fade", "beard-trim", "haircut-beard"],
    priya: ["haircut", "beard-trim", "haircut-beard"],
  };
  const mappingRows = Object.entries(mapping).flatMap(([slug, serviceSlugs]) =>
    serviceSlugs.map((serviceSlug) => ({
      barber_id: barberBySlug[slug]!.id,
      service_id: serviceBySlug[serviceSlug]!.id,
    }))
  );
  const { error: mappingError } = await supabase
    .from("fade_service_barbers")
    .insert(mappingRows);
  if (mappingError) throw new Error(`insert mappings: ${mappingError.message}`);

  // Weekly hours (shop-local).
  const hoursRows = Object.entries(SCHEDULES).flatMap(([slug, s]) =>
    s.days.map((day_of_week) => ({
      barber_id: barberBySlug[slug]!.id,
      day_of_week,
      start_time: s.open,
      end_time: s.close,
    }))
  );
  const { error: hoursError } = await supabase
    .from("fade_barber_hours")
    .insert(hoursRows);
  if (hoursError) throw new Error(`insert hours: ${hoursError.message}`);

  // Working days per barber (next 7 working days from tomorrow).
  const marcusDays = nextWorkingDays("marcus", 7);
  const samDays = nextWorkingDays("sam", 7);
  const priyaDays = nextWorkingDays("priya", 7);

  // Time off: one block per barber in the next 7 days, varied lengths.
  const timeOffSpecs = [
    { slug: "marcus", day: marcusDays[1]!, start: "13:00", end: "15:00", reason: "Supplier visit" },
    { slug: "sam", day: samDays[2]!, start: "12:00", end: "15:00", reason: "Dental appointment" },
    { slug: "priya", day: priyaDays[0]!, start: "14:00", end: "18:00", reason: "Family event" },
  ];
  const { error: timeOffError } = await supabase.from("fade_time_off").insert(
    timeOffSpecs.map((t) => ({
      barber_id: barberBySlug[t.slug]!.id,
      starts_at: shopDateTimeToUtc(t.day, t.start).toISOString(),
      ends_at: shopDateTimeToUtc(t.day, t.end).toISOString(),
      reason: t.reason,
    }))
  );
  if (timeOffError) throw new Error(`insert time_off: ${timeOffError.message}`);

  // Appointments: 13 confirmed (future) + 1 cancelled + 1 completed (past).
  type ApptSpec = {
    slug: string;
    day: Date;
    time: string;
    service: string;
    name: string;
    status: "confirmed" | "cancelled" | "completed";
  };
  const customers = [
    "Ahmad Faiz",
    "Mei Ling",
    "Raj Kumar",
    "Sarah Tan",
    "Wei Jie",
    "Nurul Ain",
    "Daniel Wong",
    "Priya Nair",
    "Hafiz Rahman",
    "Jason Lim",
    "Anita Devi",
    "Kevin Ng",
    "Farah Ali",
  ];
  const specs: ApptSpec[] = [
    { slug: "marcus", day: marcusDays[0]!, time: "10:00", service: "haircut", name: customers[0]!, status: "confirmed" },
    { slug: "marcus", day: marcusDays[0]!, time: "11:00", service: "fade", name: customers[1]!, status: "confirmed" },
    { slug: "marcus", day: marcusDays[1]!, time: "09:30", service: "beard-trim", name: customers[2]!, status: "confirmed" },
    { slug: "marcus", day: marcusDays[2]!, time: "14:00", service: "haircut-beard", name: customers[3]!, status: "confirmed" },
    { slug: "marcus", day: marcusDays[3]!, time: "10:30", service: "kids-cut", name: customers[4]!, status: "confirmed" },
    { slug: "sam", day: samDays[0]!, time: "10:30", service: "fade", name: customers[5]!, status: "confirmed" },
    { slug: "sam", day: samDays[1]!, time: "11:00", service: "haircut", name: customers[6]!, status: "confirmed" },
    { slug: "sam", day: samDays[1]!, time: "15:00", service: "beard-trim", name: customers[7]!, status: "confirmed" },
    { slug: "sam", day: samDays[2]!, time: "10:00", service: "haircut-beard", name: customers[8]!, status: "confirmed" },
    { slug: "sam", day: samDays[4]!, time: "13:00", service: "fade", name: customers[9]!, status: "confirmed" },
    { slug: "priya", day: priyaDays[0]!, time: "11:30", service: "haircut", name: customers[10]!, status: "confirmed" },
    { slug: "priya", day: priyaDays[1]!, time: "12:00", service: "beard-trim", name: customers[11]!, status: "confirmed" },
    { slug: "priya", day: priyaDays[2]!, time: "15:30", service: "haircut-beard", name: customers[12]!, status: "confirmed" },
    { slug: "sam", day: samDays[3]!, time: "12:00", service: "haircut", name: "Kevin Ng", status: "cancelled" },
    { slug: "marcus", day: lastWorkingDay("marcus"), time: "10:00", service: "haircut", name: "Farah Ali", status: "completed" },
  ];
  const emailOf = (name: string) =>
    `${name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@example.com`;
  const apptRows = specs.map((s) => {
    const startsAt = shopDateTimeToUtc(s.day, s.time);
    const endsAt = addMinutes(startsAt, serviceBySlug[s.service]!.duration);
    return {
      reference_code: ref(startsAt),
      barber_id: barberBySlug[s.slug]!.id,
      service_id: serviceBySlug[s.service]!.id,
      customer_name: s.name,
      customer_email: emailOf(s.name),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: s.status,
    };
  });
  const { error: apptsError } = await supabase
    .from("fade_appointments")
    .insert(apptRows);
  if (apptsError) throw new Error(`insert appointments: ${apptsError.message}`);

  // Counts.
  const counts: Record<string, number> = {};
  const countTargets: Array<{ table: string; key: string }> = [
    { table: "fade_barbers", key: "id" },
    { table: "fade_services", key: "id" },
    { table: "fade_service_barbers", key: "barber_id" },
    { table: "fade_barber_hours", key: "id" },
    { table: "fade_time_off", key: "id" },
    { table: "fade_appointments", key: "id" },
  ];
  for (const { table, key } of countTargets) {
    const { count, error } = await supabase
      .from(table)
      .select(key, { count: "exact", head: true });
    if (error) throw new Error(`count ${table}: ${error.message}`);
    counts[table] = count ?? 0;
  }
  console.log("seed counts:", counts);

  // Per barber: next 3 available slots on the next working day.
  for (const slug of ["marcus", "sam", "priya"]) {
    const barber = barberBySlug[slug]!;
    const day = nextWorkingDays(slug, 1)[0]!;
    const sched = SCHEDULES[slug]!;
    const { start: dayStart, end: dayEnd } = shopDayBounds(day);

    const { data: dayAppts, error: dayApptsError } = await supabase
      .from("fade_appointments")
      .select("starts_at,ends_at")
      .eq("barber_id", barber.id)
      .eq("status", "confirmed")
      .lt("starts_at", dayEnd.toISOString())
      .gt("ends_at", dayStart.toISOString());
    if (dayApptsError) throw new Error(`preview appts: ${dayApptsError.message}`);
    const { data: dayOff, error: dayOffError } = await supabase
      .from("fade_time_off")
      .select("starts_at,ends_at")
      .eq("barber_id", barber.id)
      .lt("starts_at", dayEnd.toISOString())
      .gt("ends_at", dayStart.toISOString());
    if (dayOffError) throw new Error(`preview time_off: ${dayOffError.message}`);

    const toRange = (r: { starts_at: string; ends_at: string }) => ({
      starts_at: new Date(r.starts_at),
      ends_at: new Date(r.ends_at),
    });
    const slots = computeAvailableSlots(
      {
        hours: [{ start_time: sched.open, end_time: sched.close }],
        busy: ((dayAppts ?? []) as { starts_at: string; ends_at: string }[]).map(toRange),
        timeOff: ((dayOff ?? []) as { starts_at: string; ends_at: string }[]).map(toRange),
        serviceDurationMinutes: 30,
      },
      { barberId: barber.id, serviceId: serviceBySlug["haircut"]!.id, shopLocalDate: day }
    ).slice(0, 3);

    console.log(
      `${barber.name} — next working day ${formatShopTime(shopDateTimeToUtc(day, "12:00"), "yyyy-MM-dd (EEEE)")}:`
    );
    for (const s of slots) {
      console.log(`  - ${formatShopTime(s.startUtc, "HH:mm")}–${formatShopTime(s.endUtc, "HH:mm")}`);
    }
    if (slots.length === 0) console.log("  (no slots)");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
