import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

// TODO(deps): add a Content-Security-Policy. Deferred deliberately:
//  - the marketing page embeds an OpenStreetMap iframe, so `frame-src
//    https://www.openstreetmap.org` is required;
//  - the App Router inlines RSC bootstrap <script> tags, so a naive
//    `script-src 'self'` breaks hydration — it needs a nonce;
//  - `style-src` has to allow inline styles (next/font and the clipboard
//    fallback in BookingSuccess set inline style/cssText);
//  - middleware.ts currently matches only `/admin/:path*`, so a CSP added
//    there would silently apply to the admin alone. Broaden the matcher first.
// Note this is NOT about the booking `data:text/calendar` anchor — that is
// governed by the browser's own top-level data:-URL rules, not by CSP.
//
// Deployment note: the HSTS value above ships `includeSubDomains; preload` as
// specified. Once a browser caches it, any subdomain that is not HTTPS-only
// becomes unreachable for up to max-age. Inventory subdomains before the first
// production deploy, or narrow this to `max-age=31536000` until they are
// confirmed. HSTS is inert on http://localhost, where the dev server runs.
