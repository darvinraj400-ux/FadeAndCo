import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

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
    .from("fade_time_off")
    .select("id")
    .eq("id", id)
    .single();
  if (fetchError || !existing) {
    return NextResponse.json({ error: "time_off_not_found" }, { status: 404 });
  }
  const { error } = await admin.from("fade_time_off").delete().eq("id", id);
  if (error) {
    console.error("DELETE /api/time-off/[id] failed:", error);
    return NextResponse.json({ error: "time_off_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
