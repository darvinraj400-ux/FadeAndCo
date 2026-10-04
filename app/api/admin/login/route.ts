import { NextResponse } from "next/server";
import { z } from "zod";
import { setAdminCookie, verifyAdminPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  password: z.string().min(1),
});

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 500 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
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

  if (!verifyAdminPassword(parsed.data.password)) {
    // Slow brute force. No logging of attempts.
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  if (!setAdminCookie(res)) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 500 });
  }
  return res;
}
