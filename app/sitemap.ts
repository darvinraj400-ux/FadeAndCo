import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteOrigin();
  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/case-study`, lastModified: new Date() },
  ];
}
