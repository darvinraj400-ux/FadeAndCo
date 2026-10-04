"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { slugify } from "@/lib/admin-schemas";
import { TimeOffEditor } from "@/components/admin/TimeOffEditor";

export type BarberRow = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  active: boolean;
  serviceIds: string[];
  serviceNames: string[];
  hours: Array<{ day_of_week: number; start_time: string; end_time: string }>;
};

export type ServiceChoice = { id: string; name: string };

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type HoursForm = Array<{ on: boolean; start: string; end: string }>;

function hoursToForm(
  hours: BarberRow["hours"]
): HoursForm {
  const byDay = new Map(hours.map((h) => [h.day_of_week, h]));
  return DAY_NAMES.map((_, day) => {
    const h = byDay.get(day);
    return h
      ? { on: true, start: h.start_time.slice(0, 5), end: h.end_time.slice(0, 5) }
      : { on: false, start: "09:00", end: "17:00" };
  });
}

function formToHours(form: HoursForm) {
  return form.flatMap((d, day_of_week) =>
    d.on ? [{ day_of_week, start_time: d.start, end_time: d.end }] : []
  );
}

export function BarberTable({
  barbers,
  services,
}: {
  barbers: BarberRow[];
  services: ServiceChoice[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BarberRow | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [bio, setBio] = useState("");
  const [active, setActive] = useState(true);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [hours, setHours] = useState<HoursForm>(
    DAY_NAMES.map(() => ({ on: false, start: "09:00", end: "17:00" }))
  );
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BarberRow | null>(null);

  function openNew() {
    setEditing(null);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setBio("");
    setActive(true);
    setServiceIds([]);
    setHours(DAY_NAMES.map(() => ({ on: false, start: "09:00", end: "17:00" })));
    setDialogOpen(true);
  }

  function openEdit(b: BarberRow) {
    setEditing(b);
    setName(b.name);
    setSlug(b.slug);
    setSlugTouched(true);
    setBio(b.bio ?? "");
    setActive(b.active);
    setServiceIds(b.serviceIds);
    setHours(hoursToForm(b.hours));
    setDialogOpen(true);
  }

  function toggleService(id: string) {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function setDay(day: number, patch: Partial<HoursForm[number]>) {
    setHours((prev) =>
      prev.map((d, i) => (i === day ? { ...d, ...patch } : d))
    );
  }

  async function handleSubmit() {
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required.");
      return;
    }
    setPending(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        bio: bio.trim() || null,
        active,
        serviceIds,
        weeklyHours: formToHours(hours),
      };
      const res = editing
        ? await fetch(`/api/barbers/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/barbers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const body = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        toast.error(
          res.status === 409 && body.error === "slug_taken"
            ? "That slug is taken."
            : (body.message ?? "Save failed.")
        );
        return;
      }
      toast.success(editing ? "Barber updated." : "Barber created.");
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Save failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    try {
      const res = await fetch(`/api/barbers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const body = (await res.json()) as { error?: string; count?: number };
      if (!res.ok) {
        if (res.status === 409 && body.error === "has_future_bookings") {
          toast.error(
            `This barber has ${body.count} future appointment${body.count === 1 ? "" : "s"}. Cancel them first or deactivate instead.`
          );
        } else {
          toast.error("Delete failed.");
        }
        return;
      }
      toast.success("Barber deleted.");
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Delete failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(b: BarberRow) {
    try {
      const res = await fetch(`/api/barbers/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !b.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(b.active ? "Barber deactivated." : "Barber activated.");
      router.refresh();
    } catch {
      toast.error("Update failed. Try again.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={openNew}
          className="bg-indigo-500 text-white hover:bg-indigo-400"
        >
          Add barber
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Name</TableHead>
              <TableHead className="text-zinc-400">Services</TableHead>
              <TableHead className="text-zinc-400">Days</TableHead>
              <TableHead className="text-zinc-400">Active</TableHead>
              <TableHead className="text-right text-zinc-400">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {barbers.map((b) => (
              <TableRow key={b.id} className="border-zinc-800">
                <TableCell>
                  <p className="font-medium text-zinc-100">{b.name}</p>
                  <p className="font-mono text-xs text-zinc-500">{b.slug}</p>
                </TableCell>
                <TableCell className="text-sm text-zinc-300">
                  {b.serviceNames.length > 0
                    ? `${b.serviceNames.length} · ${b.serviceNames.join(", ")}`
                    : "—"}
                </TableCell>
                <TableCell className="text-sm text-zinc-300">
                  {b.hours.length > 0 ? `${b.hours.length} days` : "—"}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => toggleActive(b)}
                    className={`rounded-full border px-2.5 py-0.5 text-xs ${b.active ? "border-green-500/30 bg-green-500/15 text-green-300" : "border-zinc-700 text-zinc-400"}`}
                  >
                    {b.active ? "Active" : "Off"}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(b)}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(b)}
                      className="border-zinc-700 text-red-300 hover:bg-zinc-800"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (pending) return;
          setDialogOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : "Add barber"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="barber-name">Name</Label>
                <Input
                  id="barber-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="barber-slug">Slug</Label>
                <Input
                  id="barber-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugTouched(true);
                  }}
                  className="border-zinc-700 bg-zinc-950 font-mono text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="barber-bio">Bio (optional)</Label>
                <Textarea
                  id="barber-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Active (visible on booking page)
              </label>
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-200">
                Services offered
              </p>
              <div className="mt-2 grid gap-1.5">
                {services.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 text-sm text-zinc-300"
                  >
                    <input
                      type="checkbox"
                      checked={serviceIds.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-200">
                Weekly hours
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                One range per day. Unchecked days are days off.
              </p>
              <div className="mt-2 grid gap-1.5">
                {DAY_NAMES.map((dayName, day) => (
                  <div key={dayName} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={hours[day]?.on ?? false}
                      onChange={(e) => setDay(day, { on: e.target.checked })}
                    />
                    <span className="w-24 text-zinc-300">{dayName}</span>
                    <Input
                      type="time"
                      value={hours[day]?.start ?? "09:00"}
                      disabled={!hours[day]?.on}
                      onChange={(e) => setDay(day, { start: e.target.value })}
                      className="w-28 border-zinc-700 bg-zinc-950"
                    />
                    <span className="text-zinc-500">–</span>
                    <Input
                      type="time"
                      value={hours[day]?.end ?? "17:00"}
                      disabled={!hours[day]?.on}
                      onChange={(e) => setDay(day, { end: e.target.value })}
                      className="w-28 border-zinc-700 bg-zinc-950"
                    />
                  </div>
                ))}
              </div>
            </div>

            {editing ? (
              <TimeOffEditor barberId={editing.id} barberName={editing.name} />
            ) : (
              <p className="text-xs text-zinc-500">
                Time-off blocks can be added after creating the barber.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className="bg-indigo-500 text-white hover:bg-indigo-400"
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (pending) return;
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            This cannot be undone. Barbers with future appointments cannot be
            deleted — deactivate them instead.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-zinc-700 text-zinc-300"
            >
              Keep
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
