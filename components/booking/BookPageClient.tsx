"use client";

import { useState } from "react";
import { BookingFlow, type NlPrefill } from "@/components/booking/BookingFlow";
import {
  NlBookingInput,
  type ParseResult,
} from "@/components/booking/NlBookingInput";
import { ParsedIntentCard } from "@/components/booking/ParsedIntentCard";

// Client bridge: NL input stays opt-in and secondary; the wizard is primary.
export function BookPageClient() {
  const [nlPrefill, setNlPrefill] = useState<NlPrefill>(null);
  const [lastResult, setLastResult] = useState<ParseResult | null>(null);

  function handleParsed(result: ParseResult) {
    setLastResult(result);
    setNlPrefill(null);
  }

  function handleSelectSlot(slot: {
    startsAt: string;
    endsAt: string;
    displayTime: string;
    barberId: string;
    serviceId: string;
    dayLabel: string;
    dayValue: string;
  }) {
    setNlPrefill({
      kind: "slot",
      slot: {
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        displayTime: slot.displayTime,
        barberId: slot.barberId,
        serviceId: slot.serviceId,
      },
      dayLabel: slot.dayLabel,
      dayValue: slot.dayValue,
      serviceId: slot.serviceId,
      barberId: slot.barberId,
    });
  }

  function handleApplyPrefill(prefill: {
    serviceId: string | null;
    barberId: string | null;
  }) {
    setNlPrefill({ kind: "ids", ...prefill });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <NlBookingInput onParsed={handleParsed} />
        {lastResult ? (
          <div className="mt-4">
            <ParsedIntentCard
              result={lastResult}
              onSelectSlot={handleSelectSlot}
              onApplyPrefill={handleApplyPrefill}
            />
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-sm text-zinc-500">
        <span className="h-px flex-1 bg-zinc-800" />
        or pick step by step
        <span className="h-px flex-1 bg-zinc-800" />
      </div>
      <BookingFlow nlPrefill={nlPrefill} />
    </div>
  );
}
