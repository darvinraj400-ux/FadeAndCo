import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin-auth";
import { barberInputSchema } from "@/lib/admin-schemas";
import { saveBarberRelations } from "@/lib/barber-relations";

export const dynamic = "force-dynamic";

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
  const parsed = barberInputSchema.partial().safeParse(body);
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
    .from("fade_barbers")
    .select("id")
    .eq("id", id)
    .single();
  if (fetchError || !existing) {
    return NextResponse.json({ error: "barber_not_found" }, { status: 404 });
  }
  const { serviceIds, weeklyHours, ...fields } = parsed.data;
  if (Object.keys(fields).length > 0) {
    const { error } = await admin
      .from("fade_barbers")
      .update(fields)
      .eq("id", id);
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "slug_taken" }, { status: 409 });
      }
      console.error("PATCH /api/barbers/[id] failed:", error);
      return NextResponse.json({ error: "barber_failed" }, { status: 500 });
    }
  }
  const relError = await saveBarberRelations(admin, id, serviceIds, weeklyHours);
  if (relError) {
    console.error("PATCH /api/barbers/[id] relations failed:", relError);
    return NextResponse.json(
      { error: "validation_error", message: relError },
      { status: 400 }
    );
  }
  const { data, error } = await admin
    .from("fade_barbers")
    .select("id,name,slug,bio,active")
    .eq("id", id)
    .single();
  if (error) {
    console.error("PATCH /api/barbers/[id] refetch failed:", error);
    return NextResponse.json({ error: "barber_failed" }, { status: 500 });
  }
  return NextResponse.json({ barber: data });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = createAdminClient();
  const { data: existing, error: fetchError } = await admin
    .from("fade_barbers")
    .select("id")
    .eq("id", id)
    .single();
  if (fetchError || !existing) {
    return NextResponse.json({ error: "barber_not_found" }, { status: 404 });
  }
  const { count, error: countError } = await admin
    .from("fade_appointments")
    .select("id", { count: "exact", head: true })
    .eq("barber_id", id)
    .eq("status", "confirmed")
    .gt("starts_at", new Date().toISOString());
  if (countError) {
    console.error("DELETE /api/barbers/[id] count failed:", countError);
    return NextResponse.json({ error: "barber_failed" }, { status: 500 });
  }
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "has_future_bookings", count },
      { status: 409 }
    );
  }
  const { error } = await admin.from("fade_barbers").delete().eq("id", id);
  if (error) {
    console.error("DELETE /api/barbers/[id] failed:", error);
    return NextResponse.json({ error: "barber_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
