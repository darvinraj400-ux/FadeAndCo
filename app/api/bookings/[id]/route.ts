import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json({ todo: "Layer 2+" }, { status: 501 });
}
