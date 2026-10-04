import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import { computeAvailableSlots } from "@/lib/booking/slots";
import { shopDateStringToInstant } from "@/lib/booking/shop-date";
import { formatShopTime, shopDayBounds, toShopTime } from "@/lib/timezone";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  barberId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD shop-local"),
});

function toRanges(
  rows: Array<{ starts_at: string; ends_at: string }>
): Array<{ starts_at: Date; ends_at: Date }> {
  return rows.map((r) => ({
    starts_at: new Date(r.starts_at),
    ends_at: new Date(r.ends_at),
  }));
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const parsed = querySchema.safeParse({
    barberId: params.get("barberId"),
    serviceId: params.get("serviceId"),
    date: params.get("date"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_params",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }
  const { barberId, serviceId, date } = parsed.data;

  let day: Date;
  try {
    day = shopDateStringToInstant(date);
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_params", message: (err as Error).message },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: barber, error: barberError } = await admin
    .from("fade_barbers")
    .select("id,active")
    .eq("id", barberId)
    .single();
  if (barberError || !barber || !barber.active) {
    return NextResponse.json({ error: "barber_not_found" }, { status: 404 });
  }

  const { data: service, error: serviceError } = await admin
    .from("fade_services")
    .select("id,active,duration_minutes")
    .eq("id", serviceId)
    .single();
  if (serviceError || !service || !service.active) {
    return NextResponse.json({ error: "service_not_found" }, { status: 404 });
  }

  const { data: mappings, error: mappingError } = await admin
    .from("fade_service_barbers")
    .select("barber_id")
    .eq("barber_id", barberId)
    .eq("service_id", serviceId);
  if (mappingError) {
    console.error("GET /api/slots mapping failed:", mappingError);
    return NextResponse.json({ error: "slots_failed" }, { status: 500 });
  }
  if (!mappings || mappings.length === 0) {
    return NextResponse.json(
      { error: "service_not_offered_by_barber" },
      { status: 404 }
    );
  }

  const dayOfWeek = toShopTime(day).getDay();
  const { data: hours, error: hoursError } = await admin
    .from("fade_barber_hours")
    .select("start_time,end_time")
    .eq("barber_id", barberId)
    .eq("day_of_week", dayOfWeek);
  if (hoursError) {
    console.error("GET /api/slots hours failed:", hoursError);
    return NextResponse.json({ error: "slots_failed" }, { status: 500 });
  }
  if (!hours || hours.length === 0) {
    return NextResponse.json(
      { slots: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const { start, end } = shopDayBounds(day);
  const { data: appointments, error: apptsError } = await admin
    .from("fade_appointments")
    .select("starts_at,ends_at")
    .eq("barber_id", barberId)
    .neq("status", "cancelled")
    .lt("starts_at", end.toISOString())
    .gt("ends_at", start.toISOString());
  if (apptsError) {
    console.error("GET /api/slots appointments failed:", apptsError);
    return NextResponse.json({ error: "slots_failed" }, { status: 500 });
  }
  const { data: timeOff, error: timeOffError } = await admin
    .from("fade_time_off")
    .select("starts_at,ends_at")
    .eq("barber_id", barberId)
    .lt("starts_at", end.toISOString())
    .gt("ends_at", start.toISOString());
  if (timeOffError) {
    console.error("GET /api/slots time_off failed:", timeOffError);
    return NextResponse.json({ error: "slots_failed" }, { status: 500 });
  }

  const slots = computeAvailableSlots(
    {
      hours: hours.map((h) => ({
        start_time: (h.start_time as string).slice(0, 5),
        end_time: (h.end_time as string).slice(0, 5),
      })),
      busy: toRanges(
        (appointments ?? []) as Array<{ starts_at: string; ends_at: string }>
      ),
      timeOff: toRanges(
        (timeOff ?? []) as Array<{ starts_at: string; ends_at: string }>
      ),
      serviceDurationMinutes: service.duration_minutes as number,
    },
    { barberId, serviceId, shopLocalDate: day, now: new Date() }
  );

  return NextResponse.json(
    {
      // displayTime/dayLabel are server-formatted: client components cannot
      // import lib/timezone (server-only env validation at import).
      day: { value: date, label: formatShopTime(day, "EEEE, d MMM") },
      slots: slots.map((s) => ({
        startsAt: s.startUtc.toISOString(),
        endsAt: s.endUtc.toISOString(),
        displayTime: formatShopTime(s.startUtc, "h:mm a"),
        barberId: s.barberId,
        serviceId: s.serviceId,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
