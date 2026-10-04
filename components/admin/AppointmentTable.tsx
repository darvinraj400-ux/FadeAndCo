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
      <p className="text-sm text-zinc-400">
        No appointments match these filters.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Reference</TableHead>
              <TableHead className="text-zinc-400">When</TableHead>
              <TableHead className="text-zinc-400">Customer</TableHead>
              <TableHead className="text-zinc-400">Barber</TableHead>
              <TableHead className="text-zinc-400">Service</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow
                key={b.id}
                className="cursor-pointer border-zinc-800 hover:bg-zinc-900"
                onClick={() => setSelectedId(b.id)}
              >
                <TableCell className="font-mono text-xs text-zinc-300">
                  {b.referenceCode}
                </TableCell>
                <TableCell className="text-sm text-zinc-300">
                  {b.dateLabel} · {b.startLabel} – {b.endLabel}
                </TableCell>
                <TableCell>
                  <p className="text-sm text-zinc-100">{b.customerName}</p>
                  <p className="text-xs text-zinc-400">{b.customerEmail}</p>
                </TableCell>
                <TableCell className="text-sm text-zinc-300">
                  {b.barberName}
                </TableCell>
                <TableCell className="text-sm text-zinc-300">
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
        <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              {selected?.referenceCode}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {selected?.dateLabel} · {selected?.startLabel} –{" "}
              {selected?.endLabel}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-zinc-400">Customer: </span>
                {selected.customerName}
              </p>
              <p>
                <span className="text-zinc-400">Email: </span>
                <a
                  href={`mailto:${selected.customerEmail}`}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  {selected.customerEmail}
                </a>
              </p>
              {selected.customerPhone ? (
                <p>
                  <span className="text-zinc-400">Phone: </span>
                  {selected.customerPhone}
                </p>
              ) : null}
              <p>
                <span className="text-zinc-400">Barber: </span>
                {selected.barberName} · {selected.serviceName}
              </p>
              {selected.notes ? (
                <p>
                  <span className="text-zinc-400">Notes: </span>
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
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
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
