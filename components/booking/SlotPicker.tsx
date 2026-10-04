"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SlotItem = {
  startsAt: string;
  endsAt: string;
  displayTime: string;
  barberId: string;
  serviceId: string;
};

export type ShopDay = {
  value: string;
  label: string;
};

export function SlotPicker({
  barberId,
  serviceId,
  value,
  onChange,
  refreshKey,
  initialDate = null,
}: {
  barberId: string;
  serviceId: string;
  value: string | null;
  onChange: (slot: SlotItem | null, dayLabel: string) => void;
  refreshKey: number;
  // Shop-local YYYY-MM-DD to preselect (NL jumps). Used once when days load;
  // afterwards the user owns the selection.
  initialDate?: string | null;
}) {
  const [days, setDays] = useState<ShopDay[]>([]);
  const [dateStr, setDateStr] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loadingDays, setLoadingDays] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadDays() {
      try {
        const res = await fetch("/api/shop-days", { cache: "no-store" });
        if (!res.ok) throw new Error(`shop-days ${res.status}`);
        const body = (await res.json()) as { days: ShopDay[] };
        if (cancelled) return;
        const loaded = body.days ?? [];
        setDays(loaded);
        setDateStr((prev) => {
          if (prev) return prev;
          if (
            initialDate &&
            loaded.some((d) => d.value === initialDate)
          ) {
            return initialDate;
          }
          return loaded[0]?.value ?? null;
        });
      } catch {
        if (!cancelled) toast.error("Could not load available days.");
      } finally {
        if (!cancelled) setLoadingDays(false);
      }
    }
    loadDays();
    return () => {
      cancelled = true;
    };
    // initialDate is mount-time only: the picker remounts per step visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dateStr === null) return;
    const day: string = dateStr;
    let cancelled = false;
    async function loadSlots() {
      setLoadingSlots(true);
      setSlots([]);
      try {
        const res = await fetch(
          `/api/slots?barberId=${encodeURIComponent(barberId)}&serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(day)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`slots ${res.status}`);
        const body = (await res.json()) as { slots: SlotItem[] };
        if (!cancelled) setSlots(body.slots ?? []);
      } catch {
        if (!cancelled) {
          setSlots([]);
          toast.error("Could not load slots for this day.");
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }
    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [barberId, serviceId, dateStr, refreshKey]);

  if (loadingDays) {
    return <p className="text-sm text-muted-foreground">Loading days…</p>;
  }

  const dayLabel =
    days.find((d) => d.value === dateStr)?.label ?? dateStr ?? "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {days.map((d) => (
          <Button
            key={d.value}
            type="button"
            variant={d.value === dateStr ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setDateStr(d.value);
              onChange(null, "");
            }}
          >
            {d.label}
          </Button>
        ))}
      </div>
      {loadingSlots ? (
        <p className="text-sm text-muted-foreground">Loading times…</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No slots this day — pick another.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <Button
              key={s.startsAt}
              type="button"
              variant={s.startsAt === value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(s, dayLabel)}
              className={cn(s.startsAt === value && "ring-1 ring-primary")}
            >
              {s.displayTime}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
