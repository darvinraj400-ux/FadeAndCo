export const SHOP_TZ = process.env.SHOP_TIMEZONE ?? "UTC";

export function toShopTime(_utc: Date): Date {
  throw new Error("TODO: Layer 3");
}

export function toUtc(_shopLocal: Date): Date {
  throw new Error("TODO: Layer 3");
}

export function shopDayBounds(_utc: Date): { start: Date; end: Date } {
  throw new Error("TODO: Layer 3");
}

export function formatShopTime(_utc: Date, _pattern: string): string {
  throw new Error("TODO: Layer 3");
}
