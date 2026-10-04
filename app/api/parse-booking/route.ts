import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import { computeAvailableSlots } from "@/lib/booking/slots";
import { resolveDayHint } from "@/lib/booking/day-hints";
import {
  fuzzyMatchBarber,
  fuzzyMatchService,
  parseBookingIntent,
  timeBandToRange,
} from "@/lib/booking/parse-intent";
import type { ParsedIntent } from "@/lib/booking/schema";
import { SHOP_TZ, formatShopTime, shopDayBounds, toShopTime } from "@/lib/timezone";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// In-memory rate limit: 10 parses per IP per minute. Not distributed and
// resets on cold start — accepted limitation, same pattern as LeadFlow.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_MAP_CAP = 5000;
const rateLimitHits = new Map<string, number[]>();

function getClientIp(req: Request): string {
  // X-Forwarded-For is client-controlled on the left: a sender can prepend
  // arbitrary entries. The entry our edge appends is the rightmost, so the
  // last entry is the hardest to spoof. Direct (proxiless) requests share
  // the 'unknown' bucket — still limited, just collectively.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const entries = forwarded
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const last = entries[entries.length - 1];
    if (last) return last;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  // Opportunistic eviction: entries are otherwise only pruned on re-access,
  // so a flood of unique (spoofed) IPs would grow the map without bound.
  if (rateLimitHits.size > RATE_LIMIT_MAP_CAP) {
    for (const [key, times] of rateLimitHits) {
      if (times.every((t) => t <= windowStart)) rateLimitHits.delete(key);
    }
  }
  const hits = (rateLimitHits.get(ip) ?? []).filter((t) => t > windowStart);
  if (hits.length === 0) {
    rateLimitHits.delete(ip);
  } else {
    rateLimitHits.set(ip, hits);
  }
  if (hits.length >= RATE_LIMIT_MAX) {
    return true;
  }
  rateLimitHits.set(ip, [...hits, now]);
  return false;
}

const bodySchema = z.object({
  text: z.string().trim().min(10).max(500),
});

function toRanges(
  rows: Array<{ starts_at: string; ends_at: string }>
): Array<{ starts_at: Date; ends_at: Date }> {
  return rows.map((r) => ({
    starts_at: new Date(r.starts_at),
    ends_at: new Date(r.ends_at),
  }));
}

export async function POST(req: Request) {
  if (isRateLimited(getClientIp(req))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_text" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_text",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }
  const text = parsed.data.text;

  const admin = createAdminClient();
  let serviceRows: Array<{
    id: string;
    name: string;
    duration_minutes: number;
    price_cents: number;
  }>;
  let barberRows: Array<{ id: string; name: string }>;
  try {
    const [{ data: services }, { data: barbers }] = await Promise.all([
      admin
        .from("fade_services")
        .select("id,name,duration_minutes,price_cents")
        .eq("active", true)
        .order("name"),
      admin.from("fade_barbers").select("id,name").eq("active", true).order("name"),
    ]);
    serviceRows =
      (services as Array<{
        id: string;
        name: string;
        duration_minutes: number;
        price_cents: number;
      }>) ?? [];
    barberRows = (barbers as Array<{ id: string; name: string }>) ?? [];
  } catch (err) {
    console.error("POST /api/parse-booking vocab failed:", err);
    return NextResponse.json({ error: "upstream" }, { status: 500 });
  }

  let intent: ParsedIntent;
  try {
    intent = await parseBookingIntent(text, serviceRows, barberRows);
  } catch {
    return NextResponse.json({ error: "parse_failed" }, { status: 502 });
  }

  const matchedServiceRow =
    fuzzyMatchService(intent.service, serviceRows) ?? null;
  const matchedBarberRow = fuzzyMatchBarber(intent.barber, barberRows) ?? null;
  const matchedService = matchedServiceRow
    ? {
        id: matchedServiceRow.id,
        name: matchedServiceRow.name,
        duration_minutes: matchedServiceRow.duration_minutes,
        price_cents: matchedServiceRow.price_cents,
      }
    : null;
  const matchedBarber = matchedBarberRow
    ? { id: matchedBarberRow.id, name: matchedBarberRow.name }
    : null;

  // Candidate slots only when service + barber + a resolvable day exist
  // AND the barber actually offers the service (an unbookable pair must
  // never produce jump targets — the wizard would strand on Confirm).
  // Day resolves but no slots -> [] (attempted, nothing free). Otherwise null.
  let candidateSlots: Array<{
    startsAt: string;
    endsAt: string;
    displayTime: string;
    barberId: string;
    serviceId: string;
    dayLabel: string;
    dayValue: string;
  }> | null = null;

  const day = resolveDayHint(intent.dayHint, new Date(), SHOP_TZ);
  if (matchedService && matchedBarber && day) {
    const { data: pair } = await admin
      .from("fade_service_barbers")
      .select("barber_id")
      .eq("barber_id", matchedBarber.id)
      .eq("service_id", matchedService.id);
    if (pair && pair.length > 0) {
      const dayValue = formatShopTime(day, "yyyy-MM-dd");
      const dayOfWeek = toShopTime(day).getDay();
      const { data: hours } = await admin
        .from("fade_barber_hours")
        .select("start_time,end_time")
        .eq("barber_id", matchedBarber.id)
        .eq("day_of_week", dayOfWeek);
      if (hours && hours.length > 0) {
        const { start, end } = shopDayBounds(day);
        const [{ data: appointments }, { data: timeOff }] = await Promise.all([
          admin
            .from("fade_appointments")
            .select("starts_at,ends_at")
            .eq("barber_id", matchedBarber.id)
            .neq("status", "cancelled")
            .lt("starts_at", end.toISOString())
            .gt("ends_at", start.toISOString()),
          admin
            .from("fade_time_off")
            .select("starts_at,ends_at")
            .eq("barber_id", matchedBarber.id)
            .lt("starts_at", end.toISOString())
            .gt("ends_at", start.toISOString()),
        ]);
        const allSlots = computeAvailableSlots(
          {
            hours: (
              hours as Array<{ start_time: string; end_time: string }>
            ).map((h) => ({
              start_time: h.start_time.slice(0, 5),
              end_time: h.end_time.slice(0, 5),
            })),
            busy: toRanges(
              (appointments ?? []) as Array<{
                starts_at: string;
                ends_at: string;
              }>
            ),
            timeOff: toRanges(
              (timeOff ?? []) as Array<{ starts_at: string; ends_at: string }>
            ),
            serviceDurationMinutes: matchedService.duration_minutes,
          },
          {
            barberId: matchedBarber.id,
            serviceId: matchedService.id,
            shopLocalDate: day,
            now: new Date(),
          }
        );
        const band = timeBandToRange(intent.timeHint, intent.specificTime);
        const filtered = band
          ? allSlots.filter((s) => {
              const hm = formatShopTime(s.startUtc, "HH:mm");
              if ("atOrAfter" in band) return hm >= band.atOrAfter;
              return hm >= band.from && hm < band.to;
            })
          : allSlots;
        const dayLabel = formatShopTime(day, "EEEE, d MMM");
        candidateSlots = filtered.slice(0, 8).map((s) => ({
          startsAt: s.startUtc.toISOString(),
          endsAt: s.endUtc.toISOString(),
          displayTime: formatShopTime(s.startUtc, "h:mm a"),
          barberId: s.barberId,
          serviceId: s.serviceId,
          dayLabel,
          dayValue,
        }));
      } else {
        candidateSlots = [];
      }
    } else {
      // Valid names but a pair the shop doesn't offer — nothing bookable.
      candidateSlots = [];
    }
  }

  return NextResponse.json(
    { intent, matchedService, matchedBarber, candidateSlots },
    { headers: { "Cache-Control": "no-store" } }
  );
}
