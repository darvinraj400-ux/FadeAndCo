"use client";

import { Button } from "@/components/ui/button";
import type {
  ParseCandidateSlot,
  ParseResult,
} from "@/components/booking/NlBookingInput";

// React auto-escapes interpolated strings — no dangerouslySetInnerHTML
// anywhere here, so the verbatim raw text is safe to render.
export function ParsedIntentCard({
  result,
  onSelectSlot,
  onApplyPrefill,
}: {
  result: ParseResult;
  onSelectSlot: (slot: ParseCandidateSlot) => void;
  onApplyPrefill: (prefill: {
    serviceId: string | null;
    barberId: string | null;
  }) => void;
}) {
  const { intent, matchedService, matchedBarber, candidateSlots } = result;
  const lowConfidence = intent.confidence < 0.5 || !matchedService;

  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      {lowConfidence ? (
        <p className="text-sm text-ink">
          We couldn&apos;t quite figure that out. Try being specific — for
          example, &ldquo;haircut with Marcus tomorrow morning.&rdquo;
        </p>
      ) : (
        <>
          <p className="font-display text-lg text-bronze">
            Understood: {matchedService?.name ?? "any service"}
            {matchedBarber ? ` with ${matchedBarber.name}` : ""}
            {intent.dayHint ? `, ${intent.dayHint}` : ""}
            {intent.timeHint && intent.timeHint !== "any"
              ? intent.timeHint === "specific" && intent.specificTime
                ? ` at ${intent.specificTime}`
                : ` ${intent.timeHint}`
              : ""}
            .
          </p>
          <p className="mt-2 text-sm text-bark">
            Service: {matchedService?.name}
            {matchedService
              ? ` (${matchedService.duration_minutes} min, $${(matchedService.price_cents / 100).toFixed(0)})`
              : ""}
            {matchedBarber ? ` · Barber: ${matchedBarber.name}` : ""}
          </p>
          {candidateSlots && candidateSlots.length > 0 ? (
            <div className="mt-3">
              <p className="text-sm text-ink">Available times:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {candidateSlots.map((s) => (
                  <Button
                    key={s.startsAt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectSlot(s)}
                  >
                    {s.dayLabel} · {s.displayTime}
                  </Button>
                ))}
              </div>
            </div>
          ) : candidateSlots !== null ? (
            <p className="mt-2 text-sm text-bark">
              No matching times on that day. Pick a different day.
            </p>
          ) : (
            <p className="mt-2 text-sm text-bark">
              Tell us who and when — or continue below and pick step by step.
            </p>
          )}
          {matchedService && (!candidateSlots || candidateSlots.length === 0) ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() =>
                onApplyPrefill({
                  serviceId: matchedService.id,
                  barberId: matchedBarber?.id ?? null,
                })
              }
            >
              Continue with {matchedService.name}
              {matchedBarber ? ` and ${matchedBarber.name}` : ""}
            </Button>
          ) : null}
        </>
      )}
      <blockquote className="mt-4 border-l-2 border-brass pl-3 text-sm text-bark">
        You said: &lsquo;{intent.raw}&rsquo;
      </blockquote>
    </div>
  );
}
