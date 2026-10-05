"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  StatusBadge,
  type AppointmentStatus,
} from "@/components/admin/StatusBadge";

export type BookingRow = {
  id: string;
  referenceCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  barberName: string;
  serviceName: string;
  startLabel: string;
  endLabel: string;
  dateLabel: string;
  status: AppointmentStatus;
  notes: string | null;
};

const ACTIONS: Array<{ status: AppointmentStatus; label: string }> = [
  { status: "completed", label: "Mark completed" },
  { status: "no_show", label: "Mark no-show" },
  { status: "cancelled", label: "Cancel" },
];

export function AppointmentTable({ bookings }: { bookings: BookingRow[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const selected = bookings.find((b) => b.id === selectedId) ?? null;

  async function setStatus(id: string, status: AppointmentStatus) {
    setPending(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (res.status === 409) {
          toast.error("That slot was just taken.");
        } else {
          toast.error(body.error ?? "Update failed.");
        }
        return;
      }
      toast.success(
        status === "cancelled"
          ? "Cancelled — email sent if configured."
          : "Appointment updated."
      );
      setSelectedId(null);
      router.refresh();
    } catch {
      toast.error("Update failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (bookings.length === 0) {
    return (
      <p className="text-sm text-cream/60">
        No appointments match these filters.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-cream/10">
        <Table>
          <TableHeader>
            <TableRow className="border-cream/10 hover:bg-transparent">
              <TableHead className="text-cream/60">Reference</TableHead>
              <TableHead className="text-cream/60">When</TableHead>
              <TableHead className="text-cream/60">Customer</TableHead>
              <TableHead className="text-cream/60">Barber</TableHead>
              <TableHead className="text-cream/60">Service</TableHead>
              <TableHead className="text-cream/60">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow
                key={b.id}
                className="cursor-pointer border-cream/10 hover:bg-cream/5"
                onClick={() => setSelectedId(b.id)}
              >
                <TableCell className="font-mono text-xs text-cream/70">
                  {b.referenceCode}
                </TableCell>
                <TableCell className="text-sm text-cream/70">
                  {b.dateLabel} · {b.startLabel} – {b.endLabel}
                </TableCell>
                <TableCell>
                  <p className="text-sm text-cream">{b.customerName}</p>
                  <p className="text-xs text-cream/60">{b.customerEmail}</p>
                </TableCell>
                <TableCell className="text-sm text-cream/70">
                  {b.barberName}
                </TableCell>
                <TableCell className="text-sm text-cream/70">
                  {b.serviceName}
                </TableCell>
                <TableCell>
                  <StatusBadge status={b.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (pending) return;
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent className="border-cream/10 bg-panel text-cream">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              {selected?.referenceCode}
            </DialogTitle>
            <DialogDescription className="text-cream/60">
              {selected?.dateLabel} · {selected?.startLabel} –{" "}
              {selected?.endLabel}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-cream/60">Customer: </span>
                {selected.customerName}
              </p>
              <p>
                <span className="text-cream/60">Email: </span>
                <a
                  href={`mailto:${selected.customerEmail}`}
                  className="text-brass hover:text-cream"
                >
                  {selected.customerEmail}
                </a>
              </p>
              {selected.customerPhone ? (
                <p>
                  <span className="text-cream/60">Phone: </span>
                  {selected.customerPhone}
                </p>
              ) : null}
              <p>
                <span className="text-cream/60">Barber: </span>
                {selected.barberName} · {selected.serviceName}
              </p>
              {selected.notes ? (
                <p>
                  <span className="text-cream/60">Notes: </span>
                  {selected.notes}
                </p>
              ) : null}
              <div className="flex items-center gap-2 pt-1">
                <StatusBadge status={selected.status} />
              </div>
            </div>
          ) : null}
          <DialogFooter className="flex-wrap gap-2">
            {selected &&
              ACTIONS.filter((a) => a.status !== selected.status).map((a) => (
                <Button
                  key={a.status}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => setStatus(selected.id, a.status)}
                  className="border-cream/15 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
                >
                  {a.label}
                </Button>
              ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
