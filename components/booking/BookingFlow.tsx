"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ServicePicker,
  type ServiceOption,
} from "@/components/booking/ServicePicker";
import {
  BarberPicker,
  type BarberOption,
} from "@/components/booking/BarberPicker";
import { SlotPicker, type SlotItem } from "@/components/booking/SlotPicker";
import {
  ConfirmStep,
  type CustomerForm,
} from "@/components/booking/ConfirmStep";
import {
  BookingSuccess,
  type CreatedBooking,
} from "@/components/booking/BookingSuccess";

const STEPS = ["Service", "Barber", "Time", "Confirm"] as const;

const TRANSITION_MS = 320;
// Tailwind v4 emits `translate-x-*` as the standalone `translate` property, not
// `transform: translateX()`. transition-property must therefore list `translate`,
// or only the opacity half of the cross-fade would animate and the slide would
// snap. translate-x-10 is 2.5rem = exactly 40px.
const PANEL_BASE =
  "col-start-1 row-start-1 transition-[opacity,translate] duration-[320ms] " +
  "ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

// Read after mount, never during render: `window` does not exist on the server
// and reading it in a useState initialiser would break hydration.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export type NlPrefill =
  | {
      kind: "slot";
      slot: SlotItem;
      dayLabel: string;
      dayValue: string;
      serviceId: string;
      barberId: string;
    }
  | { kind: "ids"; serviceId: string | null; barberId: string | null }
  | null;

type DeepLink = {
  barberId: string | null;
  barberName: string | null;
};

/** One panel in the transition stack, with the direction it is moving. */
type Layer = { step: number; dir: 1 | -1 };

const EMPTY_FORM: CustomerForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  notes: "",
};

export function BookingFlow({ nlPrefill = null }: { nlPrefill?: NlPrefill }) {
  const searchParams = useSearchParams();
  const barberSlug = searchParams.get("barber") || null;
  const serviceSlug = searchParams.get("service") || null;
  const reducedMotion = usePrefersReducedMotion();

  // Wizard "step" is derived: `layers` is the transition stack, and the last
  // entry is the current step. Entries carry their own direction so a panel
  // that is exiting while the user reverses keeps animating its original way.
  const [layers, setLayers] = useState<Layer[]>([{ step: 0, dir: 1 }]);
  const step = layers[layers.length - 1]?.step ?? 0;
  const transiting = layers.length > 1;

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [allBarbers, setAllBarbers] = useState<BarberOption[]>([]);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  /** Which service the current `barbers` list was fetched for. Lets us tell
   *  "still loading" apart from "loaded, and this barber isn't in it". */
  const [servedServiceId, setServedServiceId] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotItem | null>(null);
  const [dayLabel, setDayLabel] = useState("");
  const [nlDayValue, setNlDayValue] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingBarbers, setLoadingBarbers] = useState(false);
  const [loadingAllBarbers, setLoadingAllBarbers] = useState(
    barberSlug !== null
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedBooking | null>(null);

  const [deepLink, setDeepLink] = useState<DeepLink | null>(null);
  const nlRef = useRef(nlPrefill);
  nlRef.current = nlPrefill;

  // Programmatic navigation (NL prefill, 409 bounce, deep-link landing)
  // replaces the stack outright, so there is nothing to animate out.
  const jumpTo = useCallback((n: number) => {
    setLayers([{ step: n, dir: 1 }]);
  }, []);

  function goTo(n: number, d: 1 | -1) {
    if (transiting || n === step) return;
    // Keep the previous panel's own direction when it becomes the exiting
    // layer, and cap the stack at two: a step index can legitimately repeat
    // (Service -> Time -> Service -> ...), which would otherwise duplicate
    // React keys and mount an extra SlotPicker per hop.
    setLayers((prev) => {
      const kept = prev.map((l, i) =>
        i === prev.length - 1 ? { step: l.step, dir: l.dir } : l
      );
      return [...kept, { step: n, dir: d }].slice(-2);
    });
  }

  useEffect(() => {
    if (!transiting) return;
    // Under reduced motion the CSS transition is already off, so the extra
    // panel would just sit there hidden for 320ms. Collapse on the next tick
    // instead — the swap is genuinely instant.
    const t = setTimeout(
      () => setLayers((p) => p.slice(-1)),
      reducedMotion ? 0 : TRANSITION_MS
    );
    return () => clearTimeout(t);
  }, [transiting, reducedMotion]);

  useEffect(() => {
    let cancelled = false;
    async function loadServices() {
      try {
        const res = await fetch("/api/services", { cache: "no-store" });
        if (!res.ok) throw new Error(`services ${res.status}`);
        const body = (await res.json()) as { services: ServiceOption[] };
        if (!cancelled) setServices(body.services ?? []);
      } catch {
        if (!cancelled) toast.error("Could not load services.");
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    }
    loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  // Only fetched when a `?barber=` deep link is present, so a plain /book
  // visit still makes exactly one request.
  useEffect(() => {
    if (!barberSlug) return;
    let cancelled = false;
    async function loadAllBarbers() {
      try {
        const res = await fetch("/api/barbers", { cache: "no-store" });
        if (!res.ok) throw new Error(`barbers ${res.status}`);
        const body = (await res.json()) as { barbers: BarberOption[] };
        if (!cancelled) setAllBarbers(body.barbers ?? []);
      } catch {
        // An unreachable list just means the slug can't be resolved, which
        // the spec says to ignore silently.
        if (!cancelled) setAllBarbers([]);
      } finally {
        if (!cancelled) setLoadingAllBarbers(false);
      }
    }
    loadAllBarbers();
    return () => {
      cancelled = true;
    };
  }, [barberSlug]);

  const loadBarbers = useCallback(async (svcId: string, isStale: () => boolean) => {
    setLoadingBarbers(true);
    try {
      const res = await fetch(
        `/api/barbers?serviceId=${encodeURIComponent(svcId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`barbers ${res.status}`);
      const body = (await res.json()) as { barbers: BarberOption[] };
      if (isStale()) return;
      const list = body.barbers ?? [];
      setBarbers(list);
      setBarberId((prev) => (prev && list.some((b) => b.id === prev) ? prev : null));
    } catch {
      if (isStale()) return;
      toast.error("Could not load barbers.");
      setBarbers([]);
    } finally {
      // Set in both branches: a failed fetch is still "settled", otherwise the
      // deep-link landing below would wait forever. Skipped when stale, so a
      // superseded response can never pin servedServiceId to the wrong service
      // and wedge the deep-link hold open.
      if (!isStale()) setServedServiceId(svcId);
      if (!isStale()) setLoadingBarbers(false);
    }
  }, []);

  useEffect(() => {
    if (!serviceId) {
      setBarbers([]);
      // barberId is deliberately NOT cleared here. It used to be, which wiped
      // a `?barber=` deep link before the user had picked a service.
      // loadBarbers() is now the only thing that drops an unavailable barber.
      return;
    }
    // Cancellation guard. Switching service quickly fires overlapping requests,
    // and without this the slower one wins — leaving `barbers` belonging to a
    // service that is no longer selected.
    let cancelled = false;
    void loadBarbers(serviceId, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [serviceId, loadBarbers]);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const barber = barbers.find((b) => b.id === barberId) ?? null;

  // Deep-link resolution, phase 1: slugs -> ids. Runs once per distinct query
  // string, not once per mount — /book?a=1 -> / -> /book?b=2 is a client-side
  // transition onto the same route, so the component is reconciled rather than
  // remounted, and a plain "already ran" boolean would latch forever.
  const deepLinkKey = `${barberSlug ?? ""}|${serviceSlug ?? ""}`;
  const resolvedKey = useRef<string | null>(null);
  useEffect(() => {
    if (resolvedKey.current === deepLinkKey) return;
    if (loadingServices || (barberSlug !== null && loadingAllBarbers)) return;
    resolvedKey.current = deepLinkKey;

    const svc = serviceSlug
      ? services.find((s) => s.slug === serviceSlug) ?? null
      : null;
    const br = barberSlug
      ? allBarbers.find((b) => b.slug === barberSlug) ?? null
      : null;

    if (!svc && !br) return;

    setDeepLink({ barberId: br?.id ?? null, barberName: br?.name ?? null });
    if (svc) setServiceId(svc.id);
    if (br) setBarberId(br.id);
    // The step for "both params" is deferred to phase 2, which needs to know
    // whether the barber actually offers the service.
  }, [
    deepLinkKey,
    loadingServices,
    loadingAllBarbers,
    barberSlug,
    serviceSlug,
    services,
    allBarbers,
  ]);

  // Phase 2: both params present — verify the barber offers the service.
  const landedKey = useRef<string | null>(null);
  useEffect(() => {
    if (landedKey.current === deepLinkKey) return;
    if (!deepLink?.barberId || !deepLink.barberName) return;
    if (!serviceId || !service) return;
    if (servedServiceId !== serviceId) return;
    landedKey.current = deepLinkKey;
    if (barber) jumpTo(2);
    else jumpTo(1);
  }, [deepLinkKey, deepLink, serviceId, service, servedServiceId, barber, jumpTo]);

  // Deep-link landing for the service-only case (barber list is irrelevant).
  const landedServiceKey = useRef<string | null>(null);
  useEffect(() => {
    if (landedServiceKey.current === deepLinkKey) return;
    if (!serviceSlug || deepLink?.barberId) return;
    if (!serviceId || !service) return;
    landedServiceKey.current = deepLinkKey;
    jumpTo(1);
  }, [deepLinkKey, serviceSlug, deepLink, serviceId, service, jumpTo]);

  // Natural-language prefill from ParsedIntentCard. Slot jumps go straight
  // to Confirm (ConfirmStep only needs the slot object + dayLabel).
  useEffect(() => {
    const prefill = nlRef.current;
    if (!prefill) return;
    if (prefill.kind === "slot") {
      setServiceId(prefill.serviceId);
      setBarberId(prefill.barberId);
      setSlot(prefill.slot);
      setDayLabel(prefill.dayLabel);
      setNlDayValue(prefill.dayValue);
      setSubmitError(null);
      jumpTo(3);
    } else {
      if (prefill.serviceId) setServiceId(prefill.serviceId);
      if (prefill.barberId) setBarberId(prefill.barberId);
      setSlot(null);
      setNlDayValue(null);
      jumpTo(
        prefill.serviceId && prefill.barberId ? 2 : prefill.serviceId ? 1 : 0
      );
    }
  }, [nlPrefill, jumpTo]);

  const canNext =
    (step === 0 && service !== null) ||
    (step === 1 && barber !== null) ||
    (step === 2 && slot !== null);

  // A deep-linked barber that a later service choice invalidated. Derived
  // rather than stored, so it covers both triggers: the initial both-params
  // mismatch, and the user picking a service in step 0 that Marcus doesn't do.
  // `deepLink` is cleared as soon as the user picks for themselves, otherwise
  // this would keep naming Marcus after they had chosen someone else.
  const conflict =
    deepLink?.barberId && deepLink.barberName && serviceId && !barberId
      ? { barberName: deepLink.barberName, serviceName: service?.name ?? "" }
      : null;

  // Hold the wizard until we know which step a deep link lands on, otherwise
  // step 0 flashes before jumping to Time.
  const deepLinkPending = Boolean(
    barberSlug !== null &&
      (loadingAllBarbers ||
        (deepLink?.barberId && serviceId && servedServiceId !== serviceId))
  );

  function handleSlotChange(next: SlotItem | null, label: string) {
    setSlot(next);
    if (next) setDayLabel(label);
  }

  async function handleConfirm() {
    if (!service || !barber || !slot) return;
    setPending(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId: barber.id,
          serviceId: service.id,
          startsAt: slot.startsAt,
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          ...(form.customerPhone.trim()
            ? { customerPhone: form.customerPhone.trim() }
            : {}),
          ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        reference_code?: string;
        error?: string;
        message?: string;
      };
      if (res.status === 201 && body.ok && body.reference_code) {
        setCreated({
          reference_code: body.reference_code,
          service,
          barber,
          slot,
          dayLabel,
          // /api/bookings does not echo the email, and we are not changing
          // the API, so capture it here from the submitted form.
          email: form.customerEmail.trim(),
        });
        toast.success("Booking confirmed.");
        return;
      }
      if (res.status === 409 && body.error === "slot_taken") {
        toast.error("That slot was just taken — pick another time.");
        setSlot(null);
        setRefreshKey((k) => k + 1);
        jumpTo(2);
        return;
      }
      throw new Error(body.message ?? body.error ?? `bookings ${res.status}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Booking failed. Try again.";
      setSubmitError(message);
      toast.error("Booking failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (created) {
    return <BookingSuccess booking={created} />;
  }

  const renderPanel = (panelStep: number) => {
    if (panelStep === 0) {
      return (
        <ServicePicker
          services={services}
          value={serviceId}
          onChange={(id) => {
            setServiceId(id);
            setSlot(null);
            setNlDayValue(null);
            // Deliberately NOT clearing deepLink here: choosing a service is
            // exactly the moment a deep-linked barber may be invalidated, and
            // the conflict banner depends on still knowing who it was.
          }}
          loading={loadingServices}
        />
      );
    }
    if (panelStep === 1) {
      return (
        <BarberPicker
          barbers={barbers}
          value={barberId}
          onChange={(id) => {
            setBarberId(id);
            setSlot(null);
            setNlDayValue(null);
            // The user picked a barber themselves, so the deep link no longer
            // owns that selection. Without this the banner would keep naming
            // the deep-linked barber for whatever they choose next.
            setDeepLink(null);
          }}
          loading={loadingBarbers}
        />
      );
    }
    if (panelStep === 2) {
      if (!barber || !service) {
        return (
          <p className="text-sm text-muted-foreground">Loading times…</p>
        );
      }
      return (
        <SlotPicker
          barberId={barber.id}
          serviceId={service.id}
          value={slot?.startsAt ?? null}
          onChange={handleSlotChange}
          refreshKey={refreshKey}
          initialDate={nlDayValue}
        />
      );
    }
    if (panelStep === 3) {
      if (!service || !barber || !slot) return null;
      return (
        <ConfirmStep
          service={service}
          barber={barber}
          slot={slot}
          dayLabel={dayLabel}
          form={form}
          onFormChange={setForm}
          onSubmit={handleConfirm}
          pending={pending}
          error={submitError}
        />
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-2" aria-label="Booking progress">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                disabled={!done}
                onClick={() => done && goTo(i, -1)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border font-mono text-xs transition-colors",
                  done &&
                    "cursor-pointer border-brass bg-brass text-ink hover:brightness-110",
                  active && "border-brass text-brass",
                  !done && !active && "border-line text-bark"
                )}
              >
                {done ? (
                  <>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2.5 6.2 L4.8 8.5 L9.5 3.5" />
                    </svg>
                    <span className="sr-only">{label} — completed</span>
                  </>
                ) : (
                  i + 1
                )}
              </button>
              <span
                className={cn(
                  "text-sm",
                  active ? "font-medium text-ink" : "text-bark"
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 ? (
                <span aria-hidden="true" className="mx-1 h-px w-4 bg-border" />
              ) : null}
            </li>
          );
        })}
      </ol>

      {conflict ? (
        <p
          role="status"
          className="rounded-lg border border-brass/40 bg-brass/10 px-3 py-2 text-sm text-ink"
        >
          {conflict.barberName} doesn&rsquo;t do {conflict.serviceName}. Pick
          another barber or service.
        </p>
      ) : null}

      {deepLinkPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid" aria-busy={transiting || undefined}>
          {layers.map((layer, idx) => {
            const leaving = idx < layers.length - 1;
            const forward = layer.dir === 1;
            return (
              <div
                // Key on the stack position, not the step index: the same step
                // can legitimately appear twice (Service -> Time -> Service).
                key={idx}
                data-step={layer.step}
                data-state={leaving ? "exit" : "enter"}
                inert={leaving ? true : undefined}
                aria-hidden={leaving ? true : undefined}
                className={cn(
                  PANEL_BASE,
                  leaving
                    ? forward
                      ? "-translate-x-10 opacity-0"
                      : "translate-x-10 opacity-0"
                    : "translate-x-0 opacity-100 " +
                      (forward
                        ? "starting:translate-x-10 starting:opacity-0"
                        : "starting:-translate-x-10 starting:opacity-0")
                )}
              >
                {renderPanel(layer.step)}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        {step > 0 && step < STEPS.length ? (
          <Button
            type="button"
            variant="outline"
            disabled={transiting || deepLinkPending}
            onClick={() => goTo(step - 1, -1)}
          >
            Back
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            disabled={!canNext || transiting || deepLinkPending}
            onClick={() => canNext && goTo(step + 1, 1)}
          >
            Next
          </Button>
        ) : null}
      </div>
    </div>
  );
}
