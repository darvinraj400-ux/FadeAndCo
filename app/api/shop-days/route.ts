import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { formatShopTime } from "@/lib/timezone";

export const dynamic = "force-dynamic";

// Next 14 shop-local days for the booking date selector. Computed
// server-side so the client needs no timezone logic (client components
// cannot import lib/timezone — it validates server-only env at import).
export async function GET() {
  const now = new Date();
  const days: Array<{ value: string; label: string }> = [];
  const seen = new Set<string>();
  // Collect 14 *unique* shop days: near a midnight boundary two instants
  // can share a shop date, so iterate until the set is full, not just 14.
  for (let i = 0; days.length < 14 && i < 21; i++) {
    const day = addDays(now, i);
    const value = formatShopTime(day, "yyyy-MM-dd");
    if (seen.has(value)) continue;
    seen.add(value);
    days.push({ value, label: formatShopTime(day, "EEE, d MMM") });
  }
  return NextResponse.json({ days });
}
