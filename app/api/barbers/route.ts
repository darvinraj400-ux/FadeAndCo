import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin-auth";
import { barberInputSchema, slugify } from "@/lib/admin-schemas";
import { saveBarberRelations } from "@/lib/barber-relations";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  serviceId: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const parsed = querySchema.safeParse({
    serviceId: params.get("serviceId") ?? undefined,
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

  const admin = createAdminClient();
  let ids: string[] | null = null;
  if (parsed.data.serviceId) {
    const { data: mappings, error: mappingError } = await admin
      .from("fade_service_barbers")
      .select("barber_id")
      .eq("service_id", parsed.data.serviceId);
    if (mappingError) {
      console.error("GET /api/barbers mapping failed:", mappingError);
      return NextResponse.json({ error: "barbers_failed" }, { status: 500 });
    }
    ids = (mappings ?? []).map((m) => m.barber_id as string);
    if (ids.length === 0) return NextResponse.json({ barbers: [] });
  }

  let query = admin
    .from("fade_barbers")
    .select("id,name,slug,bio")
    .eq("active", true)
    .order("name");
  if (ids) query = query.in("id", ids);
  const { data, error } = await query;
  if (error) {
    console.error("GET /api/barbers failed:", error);
    return NextResponse.json({ error: "barbers_failed" }, { status: 500 });
  }
  return NextResponse.json({ barbers: data ?? [] });
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
  const parsed = barberInputSchema.safeParse(body);
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
  const { data, error } = await admin
    .from("fade_barbers")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug ?? slugify(parsed.data.name, "barber"),
      bio: parsed.data.bio ?? null,
      active: parsed.data.active ?? true,
    })
    .select("id,name,slug,bio,active")
    .single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    console.error("POST /api/barbers failed:", error);
    return NextResponse.json({ error: "barber_failed" }, { status: 500 });
  }
  const relError = await saveBarberRelations(
    admin,
    (data as { id: string }).id,
    parsed.data.serviceIds,
    parsed.data.weeklyHours
  );
  if (relError) {
    console.error("POST /api/barbers relations failed:", relError);
    return NextResponse.json({ error: "barber_failed" }, { status: 500 });
  }
  return NextResponse.json({ barber: data }, { status: 201 });
}
