import { z } from "zod";

export const bookingRequestSchema = z.object({
  barberId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime(), // ISO 8601 UTC
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email().max(200),
  customerPhone: z.string().max(30).optional(),
  notes: z.string().max(500).optional(),
});

export const parsedIntentSchema = z
  .object({
    service: z
      .string()
      .max(100)
      .nullable()
      .describe("Matched service name or null"),
    barber: z
      .string()
      .max(100)
      .nullable()
      .describe("Matched barber name or null"),
    dayHint: z
      .string()
      .max(50)
      .nullable()
      .describe('e.g. "Saturday", "tomorrow", "next Friday"'),
    timeHint: z
      .enum(["morning", "afternoon", "evening", "specific", "any"])
      .nullable(),
    specificTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        'HH:mm in shop time, only if timeHint === "specific"'
      )
      .nullable()
      .describe('HH:mm in shop time, only if timeHint === "specific"'),
    confidence: z.number().finite().min(0).max(1),
    raw: z.string().max(2000).describe("The original user text, verbatim"),
  })
  .refine((v) => v.timeHint !== "specific" || v.specificTime !== null, {
    message: 'specificTime is required when timeHint === "specific"',
    path: ["specificTime"],
  });

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
export type ParsedIntent = z.infer<typeof parsedIntentSchema>;
