import { addDays } from "date-fns";
import { createAdminClient } from "@/lib/supabase";
import { computeAvailableSlots } from "@/lib/booking/slots";
import { shopDateStringToInstant } from "@/lib/booking/shop-date";
import {
  formatShopTime,
  shopDayBounds,
  shopTzAbbrev,
  toShopTime,
} from "@/lib/timezone";
import {
  TodaySchedule,
  type BarberDay,
  type ScheduleBlock,
  type TimeOffBlock,
} from "@/components/admin/TodaySchedule";

export const dynamic = "force-dynamic";

type SearchParams = { date?: string };

// Invalid input yields null (caller falls back to today).
function parseDateParam(value: string | undefined): Date | null {
  if (!value) return new Date();
  try {
    return shopDateStringToInstant(value);
  } catch {
    return null;
  }
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  // Invalid ?date= falls back to today (200, never 404). A redirect() here
  // serializes as a NEXT_REDIRECT digest in the RSC payload instead of a
  // 307 in this Next version, so fallback rendering is the robust choice.
  const day = parseDateParam(params.date) ?? new Date();

  const admin = createAdminClient();
  const [{ data: barbers }, { data: services }] = await Promise.all([
    admin.from("fade_barbers").select("id,name").eq("active", true).order("name"),
    admin.from("fade_services").select("id,name,duration_minutes"),
  ]);
  const barberList = ((barbers ?? []) as Array<{ id: string; name: string }>);
  const serviceMap = new Map(
    ((services ?? []) as Array<{
      id: string;
      name: string;
      duration_minutes: number;
    }>).map((s) => [s.id, s] as [string, { name: string; duration_minutes: number }])
  );

  const { start, end } = shopDayBounds(day);
  const dayOfWeek = toShopTime(day).getDay();
  const [{ data: hours }, { data: appointments }, { data: timeOff }] =
    await Promise.all([
      admin
        .from("fade_barber_hours")
        .select("barber_id,start_time,end_time")
        .eq("day_of_week", dayOfWeek),
      admin
        .from("fade_appointments")
        .select(
          "id,barber_id,service_id,customer_name,starts_at,ends_at,status"
        )
        .lt("starts_at", end.toISOString())
        .gt("ends_at", start.toISOString())
        .order("starts_at"),
      admin
        .from("fade_time_off")
        .select("id,barber_id,starts_at,ends_at,reason")
        .lt("starts_at", end.toISOString())
        .gt("ends_at", start.toISOString()),
    ]);

  const hoursByBarber = new Map<
    string,
    { start_time: string; end_time: string }
  >();
  for (const h of (hours ?? []) as Array<{
    barber_id: string;
    start_time: string;
    end_time: string;
  }>) {
    hoursByBarber.set(h.barber_id, {
      start_time: h.start_time.slice(0, 5),
      end_time: h.end_time.slice(0, 5),
    });
  }

  const toRange = (r: { starts_at: string; ends_at: string }) => ({
    starts_at: new Date(r.starts_at),
    ends_at: new Date(r.ends_at),
  });
  // Cancelled rows neither block free time nor need schedule space here —
  // the appointments list is the audit trail. Badges still render any
  // other status that arrives.
  const isLive = (a: { status: string }) => a.status !== "cancelled";

  const days: BarberDay[] = barberList.map((b) => {
    const h = hoursByBarber.get(b.id);
    const barberAppts = ((appointments ?? []) as Array<{
      id: string;
      barber_id: string;
      service_id: string;
      customer_name: string;
      starts_at: string;
      ends_at: string;
      status: string;
    }>)
      .filter((a) => a.barber_id === b.id)
      .filter(isLive);
    const barberOff = ((timeOff ?? []) as Array<{
      id: string;
      barber_id: string;
      starts_at: string;
      ends_at: string;
      reason: string | null;
    }>).filter((t) => t.barber_id === b.id);

    const blocks: ScheduleBlock[] = barberAppts.map((a) => {
      const svc = serviceMap.get(a.service_id);
      return {
        id: a.id,
        customerName: a.customer_name,
        serviceName: svc?.name ?? "Unknown service",
        durationMinutes: svc?.duration_minutes ?? 0,
        startLabel: formatShopTime(new Date(a.starts_at), "h:mm a"),
        endLabel: formatShopTime(new Date(a.ends_at), "h:mm a"),
        status: a.status as ScheduleBlock["status"],
      };
    });
    const offBlocks: TimeOffBlock[] = barberOff.map((t) => ({
      id: t.id,
      startLabel: formatShopTime(new Date(t.starts_at), "h:mm a"),
      endLabel: formatShopTime(new Date(t.ends_at), "h:mm a"),
      reason: t.reason,
    }));

    let freeLabels: string[] = [];
    let freeMore = 0;
    if (h) {
      const slots = computeAvailableSlots(
        {
          hours: [{ start_time: h.start_time, end_time: h.end_time }],
          busy: barberAppts.map(toRange),
          timeOff: barberOff.map(toRange),
          serviceDurationMinutes: 30,
        },
        { barberId: b.id, serviceId: "today", shopLocalDate: day }
      );
      freeLabels = slots
        .slice(0, 8)
        .map((s) => formatShopTime(s.startUtc, "h:mm a"));
      freeMore = Math.max(0, slots.length - 8);
    }

    return {
      barber: { id: b.id, name: b.name },
      working: !!h,
      hoursLabel: h ? `${h.start_time} – ${h.end_time} (shop local)` : null,
      blocks,
      timeOff: offBlocks,
      freeLabels,
      freeMore,
    };
  });

  const total = days.reduce((n, d) => n + d.blocks.length, 0);
  const dateLabel = formatShopTime(day, "EEEE, d MMMM");
  // Per-barber hours render in each card — no mixed global range.
  const dayLink = (offset: number) =>
    `/admin?date=${formatShopTime(addDays(day, offset), "yyyy-MM-dd")}`;

  return (
    <TodaySchedule
      dateLabel={dateLabel}
      count={total}
      tzAbbrev={shopTzAbbrev()}
      days={days}
      prevHref={dayLink(-1)}
      todayHref="/admin"
      nextHref={dayLink(1)}
    />
  );
}
