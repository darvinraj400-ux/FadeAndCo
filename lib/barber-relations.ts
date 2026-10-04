import type { createAdminClient } from "@/lib/supabase";

type AdminClient = ReturnType<typeof createAdminClient>;

export type WeeklyHoursInput = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

// Replace-all persistence for a barber's M:N services and weekly hours.
// One range per weekday (matches unique(barber_id, day_of_week)).
// Validation runs BEFORE any delete so a bad payload can never wipe
// existing relations. Returns an error message, or null on success.
export async function saveBarberRelations(
  admin: AdminClient,
  barberId: string,
  serviceIds?: string[],
  weeklyHours?: WeeklyHoursInput[]
): Promise<string | null> {
  if (serviceIds !== undefined) {
    if (serviceIds.length > 0) {
      const { data: existing, error: svcError } = await admin
        .from("fade_services")
        .select("id")
        .in("id", serviceIds);
      if (svcError) return "service lookup failed";
      const found = new Set(
        ((existing ?? []) as Array<{ id: string }>).map((s) => s.id)
      );
      if (serviceIds.some((id) => !found.has(id))) {
        return "unknown serviceIds";
      }
    }
    const { error: delError } = await admin
      .from("fade_service_barbers")
      .delete()
      .eq("barber_id", barberId);
    if (delError) return delError.message;
    if (serviceIds.length > 0) {
      const { error: insError } = await admin
        .from("fade_service_barbers")
        .insert(
          serviceIds.map((service_id) => ({ barber_id: barberId, service_id }))
        );
      if (insError) return insError.message;
    }
  }
  if (weeklyHours !== undefined) {
    const seen = new Set<number>();
    for (const h of weeklyHours) {
      if (seen.has(h.day_of_week)) {
        return `duplicate hours for day ${h.day_of_week}`;
      }
      seen.add(h.day_of_week);
    }
    const { error: delError } = await admin
      .from("fade_barber_hours")
      .delete()
      .eq("barber_id", barberId);
    if (delError) return delError.message;
    if (weeklyHours.length > 0) {
      const { error: insError } = await admin.from("fade_barber_hours").insert(
        weeklyHours.map((h) => ({
          barber_id: barberId,
          day_of_week: h.day_of_week,
          start_time: h.start_time,
          end_time: h.end_time,
        }))
      );
      if (insError) return insError.message;
    }
  }
  return null;
}
