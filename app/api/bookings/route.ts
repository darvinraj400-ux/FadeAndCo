import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin-auth";
import { isReferenceCollision, isSlotTaken } from "@/lib/booking/db-errors";
import { bookingRequestSchema } from "@/lib/booking/schema";
import { shopDateStringToInstant } from "@/lib/booking/shop-date";
import { isSlotBookable } from "@/lib/booking/validate-slot";
import { sendBookingConfirmation } from "@/lib/email/send-booking-confirmation";
import { formatShopTime, shopDayBounds } from "@/lib/timezone";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_error",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const startsAt = new Date(input.startsAt);
  if (!Number.isFinite(startsAt.getTime())) {
    return NextResponse.json({ error: "invalid_starts_at" }, { status: 400 });
  }
  if (startsAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "starts_at_in_past" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: service, error: serviceError } = await admin
    .from("fade_services")
    .select("id,name,active,duration_minutes")
    .eq("id", input.serviceId)
    .single();
  if (serviceError || !service || !service.active) {
    return NextResponse.json({ error: "service_not_found" }, { status: 404 });
  }

  const { data: barber, error: barberError } = await admin
    .from("fade_barbers")
    .select("id,name,active")
    .eq("id", input.barberId)
    .single();
  if (barberError || !barber || !barber.active) {
    return NextResponse.json({ error: "barber_not_found" }, { status: 404 });
  }

  const { data: mappings, error: mappingError } = await admin
    .from("fade_service_barbers")
    .select("barber_id")
    .eq("barber_id", input.barberId)
    .eq("service_id", input.serviceId);
  if (mappingError) {
    console.error("POST /api/bookings mapping failed:", mappingError);
    return NextResponse.json({ error: "booking_failed" }, { status: 500 });
  }
  if (!mappings || mappings.length === 0) {
    return NextResponse.json(
      { error: "service_not_offered_by_barber" },
      { status: 404 }
    );
  }

  const endsAt = new Date(
    startsAt.getTime() + (service.duration_minutes as number) * 60_000
  );

  // The slot list is UX only and bypassable via direct POST — re-validate
  // server-side (hours, timeOff, notice, grid, closing fit). The exclusion
  // constraint remains the race-safety source of truth.
  const bookable = await isSlotBookable(admin, {
    barberId: input.barberId,
    serviceId: input.serviceId,
    startsAt,
  });
  if (!bookable) {
    return NextResponse.json(
      {
        error: "slot_taken",
        message: "That slot was just taken. Please pick another time.",
      },
      { status: 409 }
    );
  }

  // Reference code FC-YYYYMMDD-XXXX with a daily counter scoped to the
  // appointment's shop-local day (same day as the YYYYMMDD part — a
  // created_at-based counter would collide with seeded/future bookings).
  // The counter has a tiny race window (two concurrent bookings for
  // different slots on the same day can compute the same XXXX): one retry
  // with a recount covers the demo case; a second collision surfaces as a
  // generic 500, never as a phantom success. Proper fix: DB sequence.
  const { start: refDayStart, end: refDayEnd } = shopDayBounds(startsAt);
  async function nextReferenceCode(): Promise<string> {
    const { count, error: countError } = await admin
      .from("fade_appointments")
      .select("id", { count: "exact", head: true })
      .gte("starts_at", refDayStart.toISOString())
      .lt("starts_at", refDayEnd.toISOString());
    if (countError) throw countError;
    return `FC-${formatShopTime(startsAt, "yyyyMMdd")}-${String((count ?? 0) + 1).padStart(4, "0")}`;
  }
  let referenceCode: string;
  try {
    referenceCode = await nextReferenceCode();
  } catch (countError) {
    console.error("POST /api/bookings counter failed:", countError);
    return NextResponse.json({ error: "booking_failed" }, { status: 500 });
  }

  const row = {
    barber_id: input.barberId,
    service_id: input.serviceId,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone ?? null,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: "confirmed",
    notes: input.notes ?? null,
  };

  async function tryInsert(code: string) {
    return admin
      .from("fade_appointments")
      .insert({ ...row, reference_code: code })
      .select("id")
      .single();
  }

  let attempt = await tryInsert(referenceCode);
  if (attempt.error && isReferenceCollision(attempt.error)) {
    try {
      referenceCode = await nextReferenceCode();
    } catch {
      // Recount failed — retry once with the same code; a second 23505
      // surfaces as a generic 500 below.
    }
    attempt = await tryInsert(referenceCode);
  }
  const { data, error } = attempt;

  if (error) {
    // The exclusion constraint is the source of truth for race safety.
    // It fires as Postgres error code 23P01 — translate to a friendly 409.
    if (isSlotTaken({ code: error.code, message: error.message })) {
      return NextResponse.json(
        {
          error: "slot_taken",
          message: "That slot was just taken. Please pick another time.",
        },
        { status: 409 }
      );
    }
    console.error("POST /api/bookings insert failed:", error);
    return NextResponse.json({ error: "booking_failed" }, { status: 500 });
  }

  waitUntil(
    sendBookingConfirmation(
      input.customerEmail,
      input.customerName,
      referenceCode,
      service.name as string,
      barber.name as string,
      startsAt,
      endsAt
    ).then((ok) => {
      if (!ok) console.error("POST /api/bookings email failed:", referenceCode);
    })
  );

  if (!data) {
    console.error("POST /api/bookings insert returned no row");
    return NextResponse.json({ error: "booking_failed" }, { status: 500 });
  }
  return NextResponse.json(
    { ok: true, reference_code: referenceCode, appointment_id: data.id },
    { status: 201 }
  );
}

const adminQuerySchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed", "no_show"]).optional(),
  barberId: z.string().uuid().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD shop-local")
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const params = new URL(req.url).searchParams;
  const parsed = adminQuerySchema.safeParse({
    status: params.get("status") ?? undefined,
    barberId: params.get("barberId") ?? undefined,
    date: params.get("date") ?? undefined,
    limit: params.get("limit") ?? undefined,
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

  let dayBounds: { start: Date; end: Date } | null = null;
  if (parsed.data.date) {
    try {
      const day = shopDateStringToInstant(parsed.data.date);
      dayBounds = shopDayBounds(day);
    } catch (err) {
      return NextResponse.json(
        { error: "invalid_params", message: (err as Error).message },
        { status: 400 }
      );
    }
  }

  const admin = createAdminClient();
  let query = admin
    .from("fade_appointments")
    .select(
      "id,reference_code,barber_id,service_id,customer_name,customer_email,customer_phone,starts_at,ends_at,status,notes,created_at"
    )
    .order("starts_at", { ascending: false })
    .limit(parsed.data.limit ?? 50);
  if (parsed.data.status) query = query.eq("status", parsed.data.status);
  if (parsed.data.barberId) query = query.eq("barber_id", parsed.data.barberId);
  if (dayBounds) {
    query = query
      .lt("starts_at", dayBounds.end.toISOString())
      .gt("ends_at", dayBounds.start.toISOString());
  }
  const { data, error } = await query;
  if (error) {
    console.error("GET /api/bookings failed:", error);
    return NextResponse.json({ error: "bookings_failed" }, { status: 500 });
  }
  return NextResponse.json({ bookings: data ?? [] });
}
