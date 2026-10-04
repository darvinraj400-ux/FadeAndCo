// Single source of truth for the site's public origin. Never throws:
// malformed APP_URL values fall back to localhost instead of crashing
// the build (layout metadata) or /sitemap.xml at request time.
export function siteOrigin(): string {
  const raw = (process.env.APP_URL ?? "").trim();
  if (!raw) return "http://localhost:3000";
  try {
    return new URL(raw).origin;
  } catch {
    // Bare hostname (no protocol) — the common Vercel-dashboard copy.
  }
  try {
    return new URL(`https://${raw}`).origin;
  } catch {
    return "http://localhost:3000";
  }
}
