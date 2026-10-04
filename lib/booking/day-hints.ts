import { addDays } from "date-fns";
import { SHOP_TZ, shopDateTimeToUtc, toShopTime } from "@/lib/timezone";

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sun: 0,
  mon: 1,
  tue: 2,
  tues: 2,
  wed: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  fri: 5,
  sat: 6,
};

// Time-of-day words carry no day information — the timeHint field owns them.
const TIME_WORDS = ["morning", "afternoon", "evening", "night", "tonight"];

// Parse common English day hints into a shop-local date.
// Returns the true UTC instant of shop-local noon (12:00) on the resolved
// day — noon avoids midnight-boundary ambiguity and feeds directly into
// shopDayBounds / shopDateTimeToUtc / computeAvailableSlots, which all take
// "any instant within the day".
// Host-independent: weekdays via toShopTime local getters, construction via
// shopDateTimeToUtc, day stepping via date-fns (+24h steps are exact for the
// fixed-offset shop TZ).
// "next week" and anything unrecognized return null (too vague — user picks).
export function resolveDayHint(
  hint: string | null,
  now: Date,
  shopTz: string
): Date | null {
  if (shopTz !== SHOP_TZ) return null;
  if (hint === null) return null;
  const h = hint.trim().toLowerCase();
  if (h.length === 0) return null;

  const todayNoon = shopDateTimeToUtc(now, "12:00");
  if (h === "today" || h === "tonight") return todayNoon;
  if (h === "tomorrow") {
    return shopDateTimeToUtc(addDays(todayNoon, 1), "12:00");
  }
  if (
    h === "day after tomorrow" ||
    h === "day-after-tomorrow" ||
    h === "the day after tomorrow"
  ) {
    return shopDateTimeToUtc(addDays(todayNoon, 2), "12:00");
  }
  if (h === "next week") return null;
  if (h === "weekend" || h === "this weekend") {
    // Coming Saturday (today counts).
    for (let i = 0; i < 14; i++) {
      const candidate = shopDateTimeToUtc(addDays(todayNoon, i), "12:00");
      if (toShopTime(candidate).getDay() === 6) return candidate;
    }
    return null;
  }

  // Named weekdays: "saturday" / "this saturday" = coming Saturday (today if
  // today is Saturday); "next saturday" = the Saturday after that (+7).
  // Leading time-of-day words ("friday afternoon", "this evening") are
  // stripped — timeHint owns the time; a bare time word means today.
  let modifier: "this" | "next" = "this";
  let rest = h;
  if (rest.startsWith("this ")) {
    rest = rest.slice("this ".length);
  } else if (rest.startsWith("next ")) {
    modifier = "next";
    rest = rest.slice("next ".length);
  }
  for (const w of TIME_WORDS) {
    if (rest === w) return todayNoon;
    if (rest.endsWith(` ${w}`)) {
      rest = rest.slice(0, rest.length - w.length - 1);
      break;
    }
  }
  if (rest === "this" || rest.length === 0) return todayNoon;
  const target = WEEKDAYS[rest];
  if (target === undefined) return null;

  for (let i = 0; i < 14; i++) {
    const candidate = shopDateTimeToUtc(addDays(todayNoon, i), "12:00");
    if (toShopTime(candidate).getDay() !== target) continue;
    // Bare/"this" = first occurrence (today counts). "next" = the one after
    // the coming one (coming Saturday + 7), even when today matches.
    if (modifier === "next") {
      return shopDateTimeToUtc(addDays(candidate, 7), "12:00");
    }
    return candidate;
  }
  return null;
}
