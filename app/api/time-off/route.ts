import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin-auth";
import { timeOffInputSchema } from "@/lib/admin-schemas";
import { formatShopTime } from "@/lib/timezone";

export const dynamic = "force-dynamic";

function withLabels(row: {
  id: string;
  barber_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}) {
  return {
    ...row,
    startLabel: formatShopTime(new Date(row.starts_at), "EEE d MMM h:mm a"),
    endLabel: formatShopTime(new Date(row.ends_at), "h:mm a"),
  };
}

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const params = new URL(req.url).searchParams;
  const parsed = z.object({ barberId: z.string().uuid() }).safeParse({
    barberId: params.get("barberId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fade_time_off")
    .select("id,barber_id,starts_at,ends_at,reason")
    .eq("barber_id", parsed.data.barberId)
    .order("starts_at");
  if (error) {
    console.error("GET /api/time-off failed:", error);
    return NextResponse.json({ error: "time_off_failed" }, { status: 500 });
  }
  return NextResponse.json({
    timeOff: (
      (data ?? []) as Array<{
        id: string;
        barber_id: string;
        starts_at: string;
        ends_at: string;
        reason: string | null;
      }>
    ).map(withLabels),
  });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = timeOffInputSchema.safeParse(body);
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
  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (
    !Number.isFinite(startsAt.getTime()) ||
    !Number.isFinite(endsAt.getTime()) ||
    endsAt <= startsAt
  ) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }
  const admin = createAdminClient();
  // Only confirmed bookings block time-off — same rule as the service/barber
  // delete guards. Completed/no-show history never blocks.
  const { count, error: countError } = await admin
    .from("fade_appointments")
    .select("id", { count: "exact", head: true })
    .eq("barber_id", parsed.data.barberId)
    .eq("status", "confirmed")
    .lt("starts_at", endsAt.toISOString())
    .gt("ends_at", startsAt.toISOString());
  if (countError) {
    console.error("POST /api/time-off conflict check failed:", countError);
    return NextResponse.json({ error: "time_off_failed" }, { status: 500 });
  }
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "conflicts_with_bookings", count },
      { status: 409 }
    );
  }
  const { data, error } = await admin
    .from("fade_time_off")
    .insert({
      barber_id: parsed.data.barberId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      reason: parsed.data.reason ?? null,
    })
    .select("id,barber_id,starts_at,ends_at,reason")
    .single();
  if (error) {
    console.error("POST /api/time-off failed:", error);
    return NextResponse.json({ error: "time_off_failed" }, { status: 500 });
  }
  return NextResponse.json(
    {
      timeOff: withLabels(
        data as {
          id: string;
          barber_id: string;
          starts_at: string;
          ends_at: string;
          reason: string | null;
        }
      ),
    },
    { status: 201 }
  );
}
