import { z } from "zod";

function isValidIanaTimezone(tz: string): boolean {
  try {
    const supported = (
      Intl as unknown as {
        supportedValuesOf?: (key: string) => string[];
      }
    ).supportedValuesOf;
    if (typeof supported === "function") {
      return supported.call(Intl, "timeZone").includes(tz);
    }
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  GOOGLE_GENERATIVE_AI_API_KEY: z
    .string()
    .min(1, "GOOGLE_GENERATIVE_AI_API_KEY is required"),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  SHOP_EMAIL: z.string().min(1, "SHOP_EMAIL is required"),
  SHOP_TIMEZONE: z
    .string()
    .min(1, "SHOP_TIMEZONE is required")
    .refine(isValidIanaTimezone, {
      message: "SHOP_TIMEZONE must be a valid IANA timezone",
    }),
  ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD is required"),
  APP_URL: z.string().min(1, "APP_URL is required"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Missing or invalid environment variables:\n${missing}`);
}

export const env = result.data;
