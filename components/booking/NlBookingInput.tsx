"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ParsedIntent } from "@/lib/booking/schema";

export type ParseCandidateSlot = {
  startsAt: string;
  endsAt: string;
  displayTime: string;
  barberId: string;
  serviceId: string;
  dayLabel: string;
  dayValue: string;
};

export type ParseResult = {
  intent: ParsedIntent;
  matchedService: {
    id: string;
    name: string;
    duration_minutes: number;
    price_cents: number;
  } | null;
  matchedBarber: { id: string; name: string } | null;
  candidateSlots: ParseCandidateSlot[] | null;
};

export function NlBookingInput({
  onParsed,
}: {
  onParsed: (result: ParseResult) => void;
}) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "parsing" | "parsed" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const submittable = text.trim().length >= 10 && status !== "parsing";

  async function handleSubmit() {
    if (!submittable) return;
    setStatus("parsing");
    setError(null);
    try {
      const res = await fetch("/api/parse-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (res.status === 429) {
        setStatus("error");
        setError("Too many tries — wait a minute.");
        return;
      }
      if (res.status === 502) {
        setStatus("error");
        setError("The booking helper is having issues — try again in a bit.");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        setError("Couldn't understand that. Try again.");
        return;
      }
      const body = (await res.json()) as ParseResult;
      setStatus("parsed");
      onParsed(body);
    } catch {
      setStatus("error");
      setError("Couldn't understand that. Try again.");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        Not sure where to start? Describe what you want and we&apos;ll figure
        it out. Try: &ldquo;a fade with Sam on Saturday afternoon&rdquo;
      </p>
      <Textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (status === "error" || status === "parsed") setStatus("idle");
        }}
        placeholder="e.g. a fade with Sam on Saturday afternoon"
        rows={3}
        disabled={status === "parsing"}
      />
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!submittable}
        variant="outline"
      >
        {status === "parsing" ? "Figuring it out…" : "Find a time"}
      </Button>
      {status === "error" && error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
