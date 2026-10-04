import { z } from "zod";

export const bookingSchema = z.object({
  serviceId: z.string().min(1),
  barberId: z.string().min(1),
  startAt: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
