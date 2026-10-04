"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type TimeOffRow = {
  id: string;
  startLabel: string;
  endLabel: string;
  reason: string | null;
};

export function TimeOffEditor({
  barberId,
  barberName,
}: {
  barberId: string;
  barberName: string;
}) {
  const [blocks, setBlocks] = useState<TimeOffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  async function load(signal?: AbortSignal) {
    try {
      const res = await fetch(
        `/api/time-off?barberId=${encodeURIComponent(barberId)}`,
        { cache: "no-store", signal }
      );
      if (!res.ok) throw new Error();
      const body = (await res.json()) as { timeOff: TimeOffRow[] };
      setBlocks(body.timeOff ?? []);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("Could not load time-off blocks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    setBlocks([]);
    setLoading(true);
    load(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberId]);

  async function handleAdd() {
    if (!start || !end) {
      toast.error("Pick a start and end.");
      return;
    }
    if (new Date(end) <= new Date(start)) {
      toast.error("End must be after start.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/time-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId,
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(end).toISOString(),
          reason: reason.trim() || null,
        }),
      });
      const body = (await res.json()) as { error?: string; count?: number };
      if (!res.ok) {
        if (res.status === 409 && body.error === "conflicts_with_bookings") {
          toast.error(
            `This conflicts with ${body.count} appointment${body.count === 1 ? "" : "s"}. Cancel or reschedule them first.`
          );
        } else {
          toast.error("Could not add the block.");
        }
        return;
      }
      toast.success("Time-off block added.");
      setStart("");
      setEnd("");
      setReason("");
      await load();
    } catch {
      toast.error("Could not add the block.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/time-off/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Block removed.");
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.error("Delete failed. Try again.");
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-200">
        Time off — {barberName}
      </h3>
      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : blocks.length === 0 ? (
        <p className="text-sm text-zinc-500">No time-off blocks.</p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-zinc-700 px-3 py-2 text-sm"
            >
              <span className="text-zinc-300">
                {b.startLabel} – {b.endLabel}
                {b.reason ? ` · ${b.reason}` : ""}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDelete(b.id)}
                className="border-zinc-700 text-red-300 hover:bg-zinc-800"
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-2 rounded-lg border border-zinc-800 p-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs text-zinc-400">
            Start
            <Input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="border-zinc-700 bg-zinc-950"
            />
          </label>
          <label className="grid gap-1 text-xs text-zinc-400">
            End
            <Input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="border-zinc-700 bg-zinc-950"
            />
          </label>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="timeoff-reason">Reason (optional)</Label>
          <Input
            id="timeoff-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Vacation, sick day…"
            className="border-zinc-700 bg-zinc-950"
          />
        </div>
        <Button
          type="button"
          onClick={handleAdd}
          disabled={pending}
          variant="outline"
          size="sm"
          className="w-fit border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          {pending ? "Adding…" : "Add block"}
        </Button>
      </div>
    </div>
  );
}
