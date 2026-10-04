"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const STEPS = ["Service", "Barber", "Time", "Confirm"] as const;

type CreatedBooking = {
  reference_code: string;
  service: ServiceOption;
  barber: BarberOption;
  slot: SlotItem;
  dayLabel: string;
};

const EMPTY_FORM: CustomerForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  notes: "",
};

export function BookingFlow() {
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotItem | null>(null);
  const [dayLabel, setDayLabel] = useState("");
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingBarbers, setLoadingBarbers] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedBooking | null>(null);

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

  const loadBarbers = useCallback(async (svcId: string) => {
    setLoadingBarbers(true);
    try {
      const res = await fetch(
        `/api/barbers?serviceId=${encodeURIComponent(svcId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`barbers ${res.status}`);
      const body = (await res.json()) as { barbers: BarberOption[] };
      setBarbers(body.barbers ?? []);
      setBarberId((prev) =>
        (body.barbers ?? []).some((b) => b.id === prev) ? prev : null
      );
    } catch {
      toast.error("Could not load barbers.");
      setBarbers([]);
    } finally {
      setLoadingBarbers(false);
    }
  }, []);

  useEffect(() => {
    if (serviceId) loadBarbers(serviceId);
    else {
      setBarbers([]);
      setBarberId(null);
    }
  }, [serviceId, loadBarbers]);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const barber = barbers.find((b) => b.id === barberId) ?? null;

  const canNext =
    (step === 0 && service !== null) ||
    (step === 1 && barber !== null) ||
    (step === 2 && slot !== null);

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
        });
        toast.success("Booking confirmed.");
        return;
      }
      if (res.status === 409 && body.error === "slot_taken") {
        toast.error("That slot was just taken — pick another time.");
        setSlot(null);
        setRefreshKey((k) => k + 1);
        setStep(2);
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

  function reset() {
    setStep(0);
    setServiceId(null);
    setBarberId(null);
    setSlot(null);
    setDayLabel("");
    setForm(EMPTY_FORM);
    setSubmitError(null);
    setCreated(null);
  }

  if (created) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Booking confirmed</p>
        <p className="mt-1 text-2xl font-semibold">
          {created.reference_code}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {created.service.name} with {created.barber.name} ·{" "}
          {created.dayLabel} at {created.slot.displayTime}
        </p>
        <Button type="button" variant="outline" className="mt-4" onClick={reset}>
          Book another
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                disabled={!done}
                onClick={() => done && setStep(i)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium",
                  active && "border-primary bg-primary text-primary-foreground",
                  done && "cursor-pointer border-primary text-primary",
                  !active && !done && "text-muted-foreground"
                )}
              >
                {i + 1}
              </button>
              <span
                className={cn(
                  "text-sm",
                  active ? "font-medium" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 ? (
                <span className="mx-1 h-px w-4 bg-border" />
              ) : null}
            </li>
          );
        })}
      </ol>

      {step === 0 ? (
        <ServicePicker
          services={services}
          value={serviceId}
          onChange={(id) => {
            setServiceId(id);
            setSlot(null);
          }}
          loading={loadingServices}
        />
      ) : null}
      {step === 1 ? (
        <BarberPicker
          barbers={barbers}
          value={barberId}
          onChange={(id) => {
            setBarberId(id);
            setSlot(null);
          }}
          loading={loadingBarbers}
        />
      ) : null}
      {step === 2 && barber && service ? (
        <SlotPicker
          barberId={barber.id}
          serviceId={service.id}
          value={slot?.startsAt ?? null}
          onChange={handleSlotChange}
          refreshKey={refreshKey}
        />
      ) : null}
      {step === 3 && service && barber && slot ? (
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
      ) : null}

      <div className="flex items-center gap-2">
        {step > 0 && step < 4 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
        ) : null}
        {step < 3 ? (
          <Button
            type="button"
            disabled={!canNext}
            onClick={() => canNext && setStep((s) => s + 1)}
          >
            Next
          </Button>
        ) : null}
      </div>
    </div>
  );
}
