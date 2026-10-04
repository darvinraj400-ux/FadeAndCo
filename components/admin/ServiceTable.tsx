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

// Parse a decimal dollar string to integer cents without float artifacts
// ("19.99" -> 1999). Returns null when invalid or negative.
function dollarsToCents(value: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"));
}

export type ServiceRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  priceLabel: string;
  active: boolean;
};

type FormState = {
  name: string;
  slug: string;
  slugTouched: boolean;
  description: string;
  durationMinutes: string;
  priceDollars: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  slugTouched: false,
  description: "",
  durationMinutes: "30",
  priceDollars: "30",
  active: true,
};

export function ServiceTable({ services }: { services: ServiceRow[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceRow | null>(null);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(s: ServiceRow) {
    setEditing(s);
    setForm({
      name: s.name,
      slug: s.slug,
      slugTouched: true,
      description: s.description ?? "",
      durationMinutes: String(s.durationMinutes),
      priceDollars: (s.priceCents / 100).toFixed(2),
      active: s.active,
    });
    setDialogOpen(true);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => {
      if (key === "name" && !f.slugTouched) {
        return { ...f, name: value as string, slug: slugify(value as string) };
      }
      return { ...f, [key]: value };
    });
  }

  async function handleSubmit() {
    const duration = Number.parseInt(form.durationMinutes, 10);
    const cents = dollarsToCents(form.priceDollars);
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required.");
      return;
    }
    if (!Number.isInteger(duration) || duration < 1 || duration > 240) {
      toast.error("Duration must be 1–240 minutes.");
      return;
    }
    if (cents === null) {
      toast.error("Price must be a non-negative amount.");
      return;
    }
    setPending(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        duration_minutes: duration,
        price_cents: cents,
        active: form.active,
      };
      const res = editing
        ? await fetch(`/api/services/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(
          res.status === 409 && body.error === "slug_taken"
            ? "That slug is taken."
            : "Save failed."
        );
        return;
      }
      toast.success(editing ? "Service updated." : "Service created.");
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
      const res = await fetch(`/api/services/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const body = (await res.json()) as { error?: string; count?: number };
      if (!res.ok) {
        if (res.status === 409 && body.error === "has_future_bookings") {
          toast.error(
            `This service has ${body.count} future appointment${body.count === 1 ? "" : "s"}. Cancel them first or deactivate instead.`
          );
        } else {
          toast.error("Delete failed.");
        }
        return;
      }
      toast.success("Service deleted.");
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Delete failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(s: ServiceRow) {
    try {
      const res = await fetch(`/api/services/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !s.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(s.active ? "Service deactivated." : "Service activated.");
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
          Add service
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Name</TableHead>
              <TableHead className="text-zinc-400">Slug</TableHead>
              <TableHead className="text-zinc-400">Duration</TableHead>
              <TableHead className="text-zinc-400">Price</TableHead>
              <TableHead className="text-zinc-400">Active</TableHead>
              <TableHead className="text-right text-zinc-400">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((s) => (
              <TableRow key={s.id} className="border-zinc-800">
                <TableCell className="font-medium text-zinc-100">
                  {s.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-zinc-400">
                  {s.slug}
                </TableCell>
                <TableCell className="text-sm text-zinc-300">
                  {s.durationMinutes} min
                </TableCell>
                <TableCell className="text-sm text-zinc-300">
                  {s.priceLabel}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => toggleActive(s)}
                    className={`rounded-full border px-2.5 py-0.5 text-xs ${s.active ? "border-green-500/30 bg-green-500/15 text-green-300" : "border-zinc-700 text-zinc-400"}`}
                  >
                    {s.active ? "Active" : "Off"}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(s)}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(s)}
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
        <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit service" : "Add service"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="svc-name">Name</Label>
              <Input
                id="svc-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="svc-slug">Slug</Label>
              <Input
                id="svc-slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))}
                className="border-zinc-700 bg-zinc-950 font-mono text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="svc-desc">Description (optional)</Label>
              <Textarea
                id="svc-desc"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="svc-duration">Duration (min)</Label>
                <Input
                  id="svc-duration"
                  type="number"
                  min={1}
                  max={240}
                  value={form.durationMinutes}
                  onChange={(e) => set("durationMinutes", e.target.value)}
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="svc-price">Price ($)</Label>
                <Input
                  id="svc-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.priceDollars}
                  onChange={(e) => set("priceDollars", e.target.value)}
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
              />
              Active (visible on booking page)
            </label>
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
            This cannot be undone. Services with future appointments cannot be
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
