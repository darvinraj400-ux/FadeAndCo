"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildIcs } from "@/lib/ics";
import { formatPrice } from "@/lib/format";
import type { ServiceOption } from "./ServicePicker";
import type { BarberOption } from "./BarberPicker";
import type { SlotItem } from "./SlotPicker";

const SHOP_ADDRESS = "12 Jalan Telawi 4, Bangsar, KL";

export type CreatedBooking = {
  reference_code: string;
  service: ServiceOption;
  barber: BarberOption;
  slot: SlotItem;
  dayLabel: string;
  /** Captured client-side at submit time — /api/bookings does not echo it. */
  email: string;
};

export function BookingSuccess({ booking }: { booking: CreatedBooking }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  // Safari on iOS ignores `download` on blob: URLs, and navigating to a data:
  // URL replaces the document (destroying this screen and the Done button).
  // So there we render a real tap target instead of navigating for the user.
  const [icsHref, setIcsHref] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    const isIOS =
      /iP(hone|ad|od)/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isIOS) return;
    const ics = buildIcs({
      uid: booking.reference_code,
      startsAt: booking.slot.startsAt,
      endsAt: booking.slot.endsAt,
      summary: `${booking.service.name} at Fade & Co.`,
      description: `Booking reference ${booking.reference_code} with ${booking.barber.name}`,
      location: SHOP_ADDRESS,
    });
    setIcsHref(`data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`);
  }, [booking]);

  async function copyReference() {
    const code = booking.reference_code;
    try {
      // navigator.clipboard is undefined in insecure contexts, so the
      // execCommand path below is the real fallback, not a nicety.
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        // Deprecated, but it is the only zero-dependency fallback for a
        // non-secure context. The textarea must be removed even if the copy
        // throws, or it lingers in the DOM holding the reference.
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.setAttribute("readonly", "");
        ta.style.cssText =
          "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
        document.body.appendChild(ta);
        let ok = false;
        try {
          ta.select();
          ok = document.execCommand("copy");
        } finally {
          document.body.removeChild(ta);
        }
        if (!ok) throw new Error("copy rejected");
      }
      setCopied(true);
      toast.success("Reference copied.");
    } catch {
      // Never leave the user without the code.
      toast.error(`Could not copy — your reference is ${code}`);
    }
  }

  function addToCalendar() {
    // endsAt comes from the slots API and is already start + service
    // duration, so it matches what the booking row stores.
    const ics = buildIcs({
      uid: booking.reference_code,
      startsAt: booking.slot.startsAt,
      endsAt: booking.slot.endsAt,
      summary: `${booking.service.name} at Fade & Co.`,
      description: `Booking reference ${booking.reference_code} with ${booking.barber.name}`,
      location: SHOP_ADDRESS,
    });

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    // The reference is server-generated (FC-yyyyMMdd-NNNN), but sanitise
    // anyway so nothing unexpected can reach the filesystem.
    const safeRef = booking.reference_code.replace(/[^A-Za-z0-9._-]/g, "");
    a.href = url;
    a.download = `fade-and-co-${safeRef}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Card className="p-6 text-center sm:p-8" data-testid="booking-success">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="mx-auto text-brass"
      >
        <circle
          cx="24"
          cy="24"
          r="22"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="1.5"
        />
        <path
          d="M15 24.5 L21.5 31 L34 18"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="draw-check"
        />
      </svg>

      <h2 className="mt-4 font-display text-3xl tracking-tight">
        You&rsquo;re booked in.
      </h2>

      <div className="mt-4 flex items-center justify-center gap-3">
        <span
          className="font-mono text-xl tracking-[0.15em] sm:text-2xl"
          data-testid="booking-ref"
        >
          {booking.reference_code}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyReference}
          aria-label={`Copy booking reference ${booking.reference_code}`}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <Card className="mt-6 bg-parchment p-4 text-left">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
          <dt className="text-bark">Service</dt>
          <dd>
            {booking.service.name} ·{" "}
            <span className="font-mono">
              {booking.service.duration_minutes} min
            </span>{" "}
            ·{" "}
            <span className="font-mono">
              {formatPrice(booking.service.price_cents)}
            </span>
          </dd>

          <dt className="text-bark">Barber</dt>
          <dd>{booking.barber.name}</dd>

          <dt className="text-bark">When</dt>
          <dd className="font-mono">
            {booking.dayLabel} · {booking.slot.displayTime}
          </dd>

          <dt className="text-bark">Where</dt>
          <dd>{SHOP_ADDRESS}</dd>
        </dl>
      </Card>

      <p className="mt-4 text-sm text-bark">
        We&rsquo;ve emailed a confirmation to {booking.email}.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {icsHref ? (
          // Safari/iOS: a real tap target, so we never replace the document.
          <a
            href={icsHref}
            download={`fade-and-co-${booking.reference_code.replace(/[^A-Za-z0-9._-]/g, "")}.ics`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Add to calendar
          </a>
        ) : (
          <Button type="button" onClick={addToCalendar}>
            Add to calendar
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/")}
        >
          Done
        </Button>
      </div>
    </Card>
  );
}
