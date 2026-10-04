import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

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
