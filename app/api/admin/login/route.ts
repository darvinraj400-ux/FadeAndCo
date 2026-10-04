import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ todo: "Layer 2+" }, { status: 501 });
}
