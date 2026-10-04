import { z } from "zod";

// Shared admin CRUD validation (services, barbers). Route handlers import
// from here — never from each other's route.ts files.

export const serviceInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, dashes")
    .optional(),
  description: z.string().trim().max(500).nullable().optional(),
  duration_minutes: z.number().int().min(1).max(240),
  price_cents: z.number().int().min(0),
  active: z.boolean().optional(),
});

export function slugify(name: string, fallback = "service"): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback
  );
}

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const weeklyHoursSchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(timeRegex, "expected HH:mm"),
    end_time: z.string().regex(timeRegex, "expected HH:mm"),
  })
  .refine((v) => v.end_time > v.start_time, {
    message: "end_time must be after start_time",
    path: ["end_time"],
  });

export const barberInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, dashes")
    .optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  active: z.boolean().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
  weeklyHours: z.array(weeklyHoursSchema).optional(),
});

export const timeOffInputSchema = z.object({
  barberId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  reason: z.string().trim().max(200).nullable().optional(),
});
