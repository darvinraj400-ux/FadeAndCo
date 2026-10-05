import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge, type AppointmentStatus } from "@/components/admin/StatusBadge";

export type ScheduleBlock = {
  id: string;
  customerName: string;
  serviceName: string;
  durationMinutes: number;
  startLabel: string;
  endLabel: string;
  status: AppointmentStatus;
};

export type TimeOffBlock = {
  id: string;
  startLabel: string;
  endLabel: string;
  reason: string | null;
};

export type BarberDay = {
  barber: { id: string; name: string };
  working: boolean;
  hoursLabel: string | null;
  blocks: ScheduleBlock[];
  timeOff: TimeOffBlock[];
  freeLabels: string[];
  freeMore: number;
};

export function TodaySchedule({
  dateLabel,
  count,
  tzAbbrev,
  days,
  prevHref,
  todayHref,
  nextHref,
}: {
  dateLabel: string;
  count: number;
  tzAbbrev: string;
  days: BarberDay[];
  prevHref: string;
  todayHref: string;
  nextHref: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-cream md:text-4xl">
            Today — {dateLabel}
          </h1>
          <p className="mt-1 text-sm text-cream/60">
            {count} appointment{count === 1 ? "" : "s"} · shop local (
            {tzAbbrev})
          </p>
          {count === 0 ? (
            <p
              role="status"
              className="mt-3 rounded-lg border border-cream/10 bg-panel px-4 py-3 text-sm text-cream/60"
            >
              No appointments today.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={prevHref}
            className="rounded-lg border border-cream/15 px-3 py-1.5 text-cream/70 hover:border-brass hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            ← Prev
          </Link>
          <Link
            href={todayHref}
            className="rounded-lg border border-cream/15 px-3 py-1.5 text-cream/70 hover:border-brass hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            Today
          </Link>
          <Link
            href={nextHref}
            className="rounded-lg border border-cream/15 px-3 py-1.5 text-cream/70 hover:border-brass hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            Next →
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {days.map((d) => (
          <Card
            key={d.barber.id}
            className="border-cream/10 bg-panel p-4"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-xl text-cream">
                {d.barber.name}
              </h2>
              <span className="text-xs text-cream/60">
                {d.working
                  ? `Today: ${d.blocks.length} appointment${d.blocks.length === 1 ? "" : "s"}`
                  : "Not working today"}
              </span>
            </div>
            {d.hoursLabel ? (
              <p className="mt-0.5 text-xs text-cream/40">{d.hoursLabel}</p>
            ) : null}

            <div className="mt-3 space-y-2">
              {!d.working ? (
                <p className="text-sm text-cream/40">Not working today.</p>
              ) : (
                <>
                  {d.timeOff.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-lg border border-dashed border-cream/15 bg-cream/5 px-3 py-2"
                    >
                      <p className="text-xs text-cream/60">
                        Off · {t.startLabel} – {t.endLabel}
                        {t.reason ? ` · ${t.reason}` : ""}
                      </p>
                    </div>
                  ))}
                  {d.blocks.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-lg border border-cream/15 bg-cream/5 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-cream/60">
                          {b.startLabel} – {b.endLabel}
                        </span>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="mt-1 text-sm font-medium text-cream">
                        {b.customerName}
                      </p>
                      <p className="text-xs text-cream/60">
                        {b.serviceName} · {b.durationMinutes} min
                      </p>
                    </div>
                  ))}
                  {d.blocks.length === 0 && d.timeOff.length === 0 ? (
                    <p className="text-sm text-cream/40">
                      No appointments — wide open.
                    </p>
                  ) : null}
                  {d.freeLabels.length > 0 ? (
                    <div className="rounded-lg border border-cream/10 px-3 py-2">
                      <p className="text-xs text-cream/40">
                        Free windows (30-min probe):{" "}
                        {d.freeLabels.join(", ")}
                        {d.freeMore > 0 ? ` +${d.freeMore} more` : ""}
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="mt-3 border-t border-cream/10 pt-2">
              <Link
                href="/admin/appointments"
                className="text-xs text-brass hover:text-cream"
              >
                Add booking →
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
