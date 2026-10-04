import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin-auth";
import { serviceInputSchema, slugify } from "@/lib/admin-schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fade_services")
    .select("id,name,slug,description,duration_minutes,price_cents")
    .eq("active", true)
    .order("name");
  if (error) {
    console.error("GET /api/services failed:", error);
    return NextResponse.json({ error: "services_failed" }, { status: 500 });
  }
  return NextResponse.json({ services: data ?? [] });
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
  const parsed = serviceInputSchema.safeParse(body);
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
    .from("fade_services")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug ?? slugify(parsed.data.name),
      description: parsed.data.description ?? null,
      duration_minutes: parsed.data.duration_minutes,
      price_cents: parsed.data.price_cents,
      active: parsed.data.active ?? true,
    })
    .select(
      "id,name,slug,description,duration_minutes,price_cents,active"
    )
    .single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    console.error("POST /api/services failed:", error);
    return NextResponse.json({ error: "service_failed" }, { status: 500 });
  }
  return NextResponse.json({ service: data }, { status: 201 });
}
