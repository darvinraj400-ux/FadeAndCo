import { shopDateTimeToUtc, shopDayBounds } from "@/lib/timezone";

export type Slot = {
  startUtc: Date;
  endUtc: Date;
  barberId: string;
  serviceId: string;
};

export type SlotOptions = {
  barberId: string;
  serviceId: string;
  shopLocalDate: Date; // any time within the target day
  slotIntervalMinutes?: number; // default 15
  minimumNoticeMinutes?: number; // default 60
  now?: Date; // injectable for testing
};

export type SlotInputs = {
  hours: { start_time: string; end_time: string }[]; // shop-local, e.g. "09:00"
  busy: { starts_at: Date; ends_at: Date }[]; // existing appointments
  timeOff: { starts_at: Date; ends_at: Date }[]; // blocks
  serviceDurationMinutes: number;
};

// Half-open overlap: [aStart, aEnd) overlaps [bStart, bEnd) iff
// aStart < bEnd && bStart < aEnd. Touching edges do NOT overlap —
// same convention as the exclusion constraint's '[)' range.
function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// Pure. No DB calls, no writes. Callers fetch inputs, pass them in.
export function computeAvailableSlots(
  inputs: SlotInputs,
  options: SlotOptions
): Slot[] {
  const slotIntervalMinutes = options.slotIntervalMinutes ?? 15;
  const minimumNoticeMinutes = options.minimumNoticeMinutes ?? 60;
  const now = options.now ?? new Date();

  if (
    !Number.isFinite(inputs.serviceDurationMinutes) ||
    inputs.serviceDurationMinutes <= 0 ||
    !Number.isFinite(slotIntervalMinutes) ||
    slotIntervalMinutes <= 0 ||
    inputs.hours.length === 0
  ) {
    return [];
  }

  const dayBounds = shopDayBounds(options.shopLocalDate);
  const earliestAllowed = now.getTime() + minimumNoticeMinutes * 60_000;

  // Step 1: if now + notice is past the shop day's end, nothing is bookable.
  if (earliestAllowed > dayBounds.end.getTime()) {
    return [];
  }

  const durationMs = inputs.serviceDurationMinutes * 60_000;
  const intervalMs = slotIntervalMinutes * 60_000;
  const busy = [...inputs.busy, ...inputs.timeOff];
  for (const b of busy) {
    if (
      !Number.isFinite(b.starts_at.getTime()) ||
      !Number.isFinite(b.ends_at.getTime())
    ) {
      throw new Error(
        "computeAvailableSlots: busy/timeOff ranges must be valid Dates"
      );
    }
  }
  const slots: Slot[] = [];

  for (const row of inputs.hours) {
    const rangeStartUtc = shopDateTimeToUtc(
      options.shopLocalDate,
      row.start_time
    ).getTime();
    const rangeEndUtc = shopDateTimeToUtc(
      options.shopLocalDate,
      row.end_time
    ).getTime();
    if (rangeEndUtc <= rangeStartUtc) continue;

    // Step 2: candidate starts at slotIntervalMinutes steps from start_time
    // until end_time - serviceDuration. Aligned to start_time (not to an
    // epoch grid), per spec.
    let cursor = rangeStartUtc;

    while (cursor + durationMs <= rangeEndUtc) {
      const startUtc = new Date(cursor);
      const endUtc = new Date(cursor + durationMs);

      // Steps 4–7: drop candidates past closing, overlapping busy/timeOff,
      // or earlier than now + notice.
      if (
        endUtc.getTime() <= rangeEndUtc &&
        startUtc.getTime() >= earliestAllowed &&
        !busy.some((b) =>
          overlaps(
            startUtc.getTime(),
            endUtc.getTime(),
            b.starts_at.getTime(),
            b.ends_at.getTime()
          )
        )
      ) {
        slots.push({
          startUtc,
          endUtc,
          barberId: options.barberId,
          serviceId: options.serviceId,
        });
      }
      cursor += intervalMs;
    }
  }

  // Step 8: sorted ascending.
  slots.sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
  return slots;
}
