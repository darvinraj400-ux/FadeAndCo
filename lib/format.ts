// Display formatting for shop prices. Stored values are integer cents;
// rendered as ringgit ("RM 30", "RM 19.99"). Display only — parsing and
// storage stay in cents.
export function formatPrice(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) return "RM —";
  if (cents % 100 === 0) return `RM ${(cents / 100).toFixed(0)}`;
  return `RM ${(cents / 100).toFixed(2)}`;
}
