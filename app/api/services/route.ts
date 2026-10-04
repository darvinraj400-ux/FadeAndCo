import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ todo: "Layer 2+" });
}
