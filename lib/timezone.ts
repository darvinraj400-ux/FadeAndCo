import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { env } from "@/lib/env";

export const SHOP_TZ = env.SHOP_TIMEZONE;

// Convert a UTC instant to a Date whose LOCAL fields reflect shop wall-clock
// (date-fns-tz v3 contract). For field extraction with local getters only —
// never persist or compare it.
export function toShopTime(utc: Date): Date {
  return toZonedTime(utc, SHOP_TZ);
}

// Convert a Date whose LOCAL fields are shop-local wall-clock into the true
// UTC instant (date-fns-tz v3 fromZonedTime contract).
export function toUtc(shopLocal: Date): Date {
  return fromZonedTime(shopLocal, SHOP_TZ);
}

// The shop-local calendar day containing `shopLocalDate`, as seen in shop
// time. `shopLocalDate` is a true UTC instant; its shop wall day is read via
// toShopTime's local fields. Constructing the return values uses local-field
// Dates, which fromZonedTime reads as wall-clock on any host.
function shopDayParts(shopLocalDate: Date): {
  year: number;
  month: number;
  day: number;
} {
  const zoned = toZonedTime(shopLocalDate, SHOP_TZ);
  return {
    year: zoned.getFullYear(),
    month: zoned.getMonth(),
    day: zoned.getDate(),
  };
}

// Given a shop-local date (any true instant within that day), return the UTC
// bounds [00:00:00, 23:59:59.999] of that shop-local day.
// Note: on a DST spring-forward day a nonexistent wall time resolves per
// date-fns-tz (shifted forward); Asia/Kuala_Lumpur has no DST so this does
// not occur for the shop, but the helpers stay DST-safe by construction.
export function shopDayBounds(shopLocalDate: Date): {
  start: Date;
  end: Date;
} {
  const { year, month, day } = shopDayParts(shopLocalDate);
  const start = fromZonedTime(new Date(year, month, day, 0, 0, 0, 0), SHOP_TZ);
  const end = fromZonedTime(
    new Date(year, month, day, 23, 59, 59, 999),
    SHOP_TZ
  );
  return { start, end };
}

// Given a shop-local date and a shop-local time string ("14:30"), return
// the UTC instant.
export function shopDateTimeToUtc(
  shopLocalDate: Date,
  hhmm: string
): Date {
  const { year, month, day } = shopDayParts(shopLocalDate);
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(hhmm.trim());
  if (!match) {
    throw new Error(`Invalid time string (expected HH:mm): ${hhmm}`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] !== undefined ? Number(match[3]) : 0;
  if (hours > 23 || minutes > 59 || seconds > 59) {
    throw new Error(`Invalid time string (expected HH:mm): ${hhmm}`);
  }
  return fromZonedTime(
    new Date(year, month, day, hours, minutes, seconds, 0),
    SHOP_TZ
  );
}

// Format a UTC instant as a shop-local string (for display).
export function formatShopTime(utc: Date, pattern = "yyyy-MM-dd HH:mm"): string {
  return formatInTimeZone(utc, SHOP_TZ, pattern);
}

// Human-readable shop timezone for display in the UI.
export function shopTzAbbrev(): string {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: SHOP_TZ,
      timeZoneName: "short",
    }).formatToParts(new Date());
    return (
      parts.find((p) => p.type === "timeZoneName")?.value ?? SHOP_TZ
    );
  } catch {
    return SHOP_TZ;
  }
}
