"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BarberOption } from "@/components/booking/BarberPicker";
import type { ServiceOption } from "@/components/booking/ServicePicker";
import type { SlotItem } from "@/components/booking/SlotPicker";

export type CustomerForm = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
};

export function ConfirmStep({
  service,
  barber,
  slot,
  dayLabel,
  form,
  onFormChange,
  onSubmit,
  pending,
  error,
}: {
  service: ServiceOption;
  barber: BarberOption;
  slot: SlotItem;
  dayLabel: string;
  form: CustomerForm;
  onFormChange: (form: CustomerForm) => void;
  onSubmit: () => void;
  pending: boolean;
  error: string | null;
}) {
  const nameOk = form.customerName.trim().length >= 2;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    form.customerEmail.trim()
  );
  const canSubmit = nameOk && emailOk && !pending;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Service</dt>
          <dd>
            {service.name} · {service.duration_minutes} min · $
            {(service.price_cents / 100).toFixed(0)}
          </dd>
          <dt className="text-muted-foreground">Barber</dt>
          <dd>{barber.name}</dd>
          <dt className="text-muted-foreground">When</dt>
          <dd>
            {dayLabel} at {slot.displayTime}
          </dd>
        </dl>
      </Card>
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="customerName">Name</Label>
          <Input
            id="customerName"
            value={form.customerName}
            onChange={(e) =>
              onFormChange({ ...form, customerName: e.target.value })
            }
            placeholder="Your full name"
            autoComplete="name"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="customerEmail">Email</Label>
          <Input
            id="customerEmail"
            type="email"
            value={form.customerEmail}
            onChange={(e) =>
              onFormChange({ ...form, customerEmail: e.target.value })
            }
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="customerPhone">Phone (optional)</Label>
          <Input
            id="customerPhone"
            value={form.customerPhone}
            onChange={(e) =>
              onFormChange({ ...form, customerPhone: e.target.value })
            }
            placeholder="Phone number"
            autoComplete="tel"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
            placeholder="Anything the barber should know"
          />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="button" onClick={onSubmit} disabled={!canSubmit}>
        {pending ? "Booking…" : "Confirm booking"}
      </Button>
    </div>
  );
}
