import type { createAdminClient } from "@/lib/supabase";
import { computeAvailableSlots } from "@/lib/booking/slots";
import { shopDayBounds, toShopTime } from "@/lib/timezone";

type AdminClient = ReturnType<typeof createAdminClient>;

// Server-side slot validation shared by POST /api/bookings and PATCH resurrections.
// The wizard's slot list is UX only and bypassable via direct POST — this check
// re-runs the same availability computation on the server and requires the
// requested startsAt to exactly match an offered slot (hours, timeOff,
// minimum notice, grid alignment, and closing fit all enforced).
export async function isSlotBookable(
  admin: AdminClient,
  input: {
    barberId: string;
    serviceId: string;
    startsAt: Date;
    now?: Date;
  }
): Promise<boolean> {
  const { data: service } = await admin
    .from("fade_services")
    .select("duration_minutes,active")
    .eq("id", input.serviceId)
    .single();
  if (!service || !service.active) return false;

  const { data: hours } = await admin
    .from("fade_barber_hours")
    .select("start_time,end_time")
    .eq("barber_id", input.barberId)
    .eq("day_of_week", toShopTime(input.startsAt).getDay());
  if (!hours || hours.length === 0) return false;

  const { start, end } = shopDayBounds(input.startsAt);
  const { data: appointments } = await admin
    .from("fade_appointments")
    .select("starts_at,ends_at")
    .eq("barber_id", input.barberId)
    .neq("status", "cancelled")
    .lt("starts_at", end.toISOString())
    .gt("ends_at", start.toISOString());
  const { data: timeOff } = await admin
    .from("fade_time_off")
    .select("starts_at,ends_at")
    .eq("barber_id", input.barberId)
    .lt("starts_at", end.toISOString())
    .gt("ends_at", start.toISOString());

  const toRanges = (rows: Array<{ starts_at: string; ends_at: string }> | null) =>
    (rows ?? []).map((r) => ({
      starts_at: new Date(r.starts_at),
      ends_at: new Date(r.ends_at),
    }));

  const slots = computeAvailableSlots(
    {
      hours: (hours as Array<{ start_time: string; end_time: string }>).map(
        (h) => ({
          start_time: h.start_time.slice(0, 5),
          end_time: h.end_time.slice(0, 5),
        })
      ),
      busy: toRanges(
        appointments as Array<{ starts_at: string; ends_at: string }> | null
      ),
      timeOff: toRanges(
        timeOff as Array<{ starts_at: string; ends_at: string }> | null
      ),
      serviceDurationMinutes: service.duration_minutes as number,
    },
    {
      barberId: input.barberId,
      serviceId: input.serviceId,
      shopLocalDate: input.startsAt,
      now: input.now ?? new Date(),
    }
  );
  const target = input.startsAt.getTime();
  return slots.some((s) => s.startUtc.getTime() === target);
}
