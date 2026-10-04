import { toShopTime } from "@/lib/timezone";

// Convert a shop-local `YYYY-MM-DD` string to a true UTC instant within that
// shop-local day. Needed because shopDayBounds/shopDateTimeToUtc take an
// instant, not a date string — and date-fns-tz must stay inside lib/timezone.
// Every real zone offset is < 24h, so a noon-UTC guess lands on the target
// wall day or exactly ±1 day off; one correction converges (loop is defensive).
// Throws on malformed or nonexistent dates (e.g. 2026-02-30).
export function shopDateStringToInstant(dateStr: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) throw new Error(`Invalid date (expected YYYY-MM-DD): ${dateStr}`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== mo - 1 ||
    probe.getUTCDate() !== d
  ) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  let guess = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0));
  for (let i = 0; i < 3; i++) {
    const w = toShopTime(guess);
    const wy = w.getFullYear();
    const wm = w.getMonth() + 1;
    const wd = w.getDate();
    if (wy === y && wm === mo && wd === d) return guess;
    const target = Date.UTC(y, mo - 1, d);
    const wall = Date.UTC(wy, wm - 1, wd);
    guess = new Date(guess.getTime() + Math.sign(target - wall) * 86_400_000);
  }
  throw new Error(`Unresolvable shop date: ${dateStr}`);
}
