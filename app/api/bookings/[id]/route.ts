import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin-auth";
import { isSlotTaken } from "@/lib/booking/db-errors";
import { isSlotBookable } from "@/lib/booking/validate-slot";
import { sendBookingCancellation } from "@/lib/email/send-cancellation";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const patchSchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed", "no_show"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
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

  const admin = createAdminClient();
  const { data: existing, error: fetchError } = await admin
    .from("fade_appointments")
    .select(
      "id,reference_code,barber_id,service_id,customer_name,customer_email,starts_at,status"
    )
    .eq("id", id)
    .single();
  if (fetchError || !existing) {
    return NextResponse.json({ error: "booking_not_found" }, { status: 404 });
  }

  // Resurrection (cancelled/completed/no_show -> confirmed) must pass the
  // same server-side slot validation as a new booking — the constraint
  // alone would allow e.g. out-of-hours re-confirmation.
  if (parsed.data.status === "confirmed" && existing.status !== "confirmed") {
    const bookable = await isSlotBookable(admin, {
      barberId: existing.barber_id as string,
      serviceId: existing.service_id as string,
      startsAt: new Date(existing.starts_at as string),
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
  }

  const { data, error } = await admin
    .from("fade_appointments")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select(
      "id,reference_code,barber_id,service_id,customer_name,customer_email,customer_phone,starts_at,ends_at,status,notes,created_at"
    )
    .single();
  if (error) {
    if (isSlotTaken({ code: error.code, message: error.message })) {
      return NextResponse.json(
        {
          error: "slot_taken",
          message: "That slot was just taken. Please pick another time.",
        },
        { status: 409 }
      );
    }
    console.error("PATCH /api/bookings/[id] failed:", error);
    return NextResponse.json({ error: "booking_failed" }, { status: 500 });
  }

  if (parsed.data.status === "cancelled" && existing.status !== "cancelled") {
    const [{ data: service }, { data: barber }] = await Promise.all([
      admin
        .from("fade_services")
        .select("name")
        .eq("id", existing.service_id)
        .single(),
      admin
        .from("fade_barbers")
        .select("name")
        .eq("id", existing.barber_id)
        .single(),
    ]);
    waitUntil(
      sendBookingCancellation(
        existing.customer_email as string,
        existing.customer_name as string,
        existing.reference_code as string,
        (service?.name as string | undefined) ?? "your service",
        (barber?.name as string | undefined) ?? "your barber",
        new Date(existing.starts_at as string)
      ).then((ok) => {
        if (!ok)
          console.error(
            "PATCH /api/bookings/[id] email failed:",
            existing.reference_code
          );
      })
    );
  }

  return NextResponse.json({ booking: data });
}
