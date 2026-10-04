import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { shopDateStringToInstant } from "@/lib/booking/shop-date";
import { formatShopTime, shopDayBounds } from "@/lib/timezone";
import {
  AppointmentTable,
  type BookingRow,
} from "@/components/admin/AppointmentTable";
import type { AppointmentStatus } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

const STATUSES = ["confirmed", "completed", "cancelled", "no_show"] as const;

type SearchParams = {
  status?: string;
  barberId?: string;
  date?: string;
};

function filterHref(
  current: SearchParams,
  patch: { status?: string | null; barberId?: string | null; date?: string | null }
): string {
  const params = new URLSearchParams();
  const status = patch.status !== undefined ? patch.status : current.status;
  const barberId =
    patch.barberId !== undefined ? patch.barberId : current.barberId;
  const date = patch.date !== undefined ? patch.date : current.date;
  if (status) params.set("status", status);
  if (barberId) params.set("barberId", barberId);
  if (date) params.set("date", date);
  const qs = params.toString();
  return qs ? `/admin/appointments?${qs}` : "/admin/appointments";
}

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const status = STATUSES.includes(query.status as AppointmentStatus)
    ? (query.status as AppointmentStatus)
    : undefined;
  // Malformed barberIds match nothing — ignore the filter instead of
  // showing a confusing empty list.
  const barberId =
    query.barberId?.trim() &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      query.barberId.trim()
    )
      ? query.barberId.trim()
      : undefined;

  let dayBounds: { start: Date; end: Date } | null = null;
  let dateValue = "";
  if (query.date) {
    try {
      const day = shopDateStringToInstant(query.date);
      dayBounds = shopDayBounds(day);
      dateValue = query.date;
    } catch {
      dayBounds = null;
    }
  }

  const admin = createAdminClient();
  let db = admin
    .from("fade_appointments")
    .select(
      "id,reference_code,barber_id,service_id,customer_name,customer_email,customer_phone,starts_at,ends_at,status,notes"
    )
    .order("starts_at", { ascending: false })
    .limit(100);
  if (status) db = db.eq("status", status);
  if (barberId) db = db.eq("barber_id", barberId);
  if (dayBounds) {
    db = db
      .lt("starts_at", dayBounds.end.toISOString())
      .gt("ends_at", dayBounds.start.toISOString());
  }
  const [{ data: appointments }, { data: barbers }, { data: services }] =
    await Promise.all([
      db,
      admin.from("fade_barbers").select("id,name").order("name"),
      admin.from("fade_services").select("id,name"),
    ]);

  const barberNames = new Map(
    ((barbers ?? []) as Array<{ id: string; name: string }>).map((b) => [
      b.id,
      b.name,
    ])
  );
  const serviceNames = new Map(
    ((services ?? []) as Array<{ id: string; name: string }>).map((s) => [
      s.id,
      s.name,
    ])
  );

  const rows: BookingRow[] = (
    (appointments ?? []) as Array<{
      id: string;
      reference_code: string;
      customer_name: string;
      customer_email: string;
      customer_phone: string | null;
      barber_id: string;
      service_id: string;
      starts_at: string;
      ends_at: string;
      status: AppointmentStatus;
      notes: string | null;
    }>
  ).map((a) => ({
    id: a.id,
    referenceCode: a.reference_code,
    customerName: a.customer_name,
    customerEmail: a.customer_email,
    customerPhone: a.customer_phone,
    barberName: barberNames.get(a.barber_id) ?? "Unknown",
    serviceName: serviceNames.get(a.service_id) ?? "Unknown",
    startLabel: formatShopTime(new Date(a.starts_at), "h:mm a"),
    endLabel: formatShopTime(new Date(a.ends_at), "h:mm a"),
    dateLabel: formatShopTime(new Date(a.starts_at), "EEE d MMM"),
    status: a.status,
    notes: a.notes,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Appointments
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {rows.length} shown · newest first · showing up to 100 — narrow
            filters for more
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={filterHref(query, { status: null })}
            className={`rounded-lg border px-3 py-1.5 ${!status ? "border-indigo-500 bg-indigo-500/15 text-indigo-300" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"}`}
          >
            All
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={filterHref(query, { status: s })}
              className={`rounded-lg border px-3 py-1.5 capitalize ${status === s ? "border-indigo-500 bg-indigo-500/15 text-indigo-300" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"}`}
            >
              {s === "no_show" ? "No-show" : s}
            </Link>
          ))}
        </div>
      </div>

      <form
        method="GET"
        action="/admin/appointments"
        className="flex flex-wrap items-end gap-3"
      >
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <label className="grid gap-1 text-xs text-zinc-400">
          Barber
          <select
            name="barberId"
            defaultValue={barberId ?? ""}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100"
          >
            <option value="">All barbers</option>
            {((barbers ?? []) as Array<{ id: string; name: string }>).map(
              (b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              )
            )}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-zinc-400">
          Day
          <input
            type="date"
            name="date"
            defaultValue={dateValue}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white"
        >
          Filter
        </button>
        <Link
          href="/admin/appointments"
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white"
        >
          Clear
        </Link>
      </form>

      <AppointmentTable bookings={rows} />
    </div>
  );
}
