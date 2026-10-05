import { createAdminClient } from "@/lib/supabase";
import {
  BarberTable,
  type BarberRow,
  type ServiceChoice,
} from "@/components/admin/BarberTable";

export const dynamic = "force-dynamic";

export default async function AdminBarbersPage() {
  const admin = createAdminClient();
  const [{ data: barbers }, { data: services }, { data: mappings }, { data: hours }] =
    await Promise.all([
      admin
        .from("fade_barbers")
        .select("id,name,slug,bio,active")
        .order("name"),
      admin.from("fade_services").select("id,name").order("name"),
      admin.from("fade_service_barbers").select("barber_id,service_id"),
      admin
        .from("fade_barber_hours")
        .select("barber_id,day_of_week,start_time,end_time"),
    ]);

  const serviceNames = new Map(
    ((services ?? []) as ServiceChoice[]).map((s) => [s.id, s.name])
  );
  const serviceIdsByBarber = new Map<string, string[]>();
  for (const m of (mappings ?? []) as Array<{
    barber_id: string;
    service_id: string;
  }>) {
    const list = serviceIdsByBarber.get(m.barber_id) ?? [];
    list.push(m.service_id);
    serviceIdsByBarber.set(m.barber_id, list);
  }
  const hoursByBarber = new Map<
    string,
    Array<{ day_of_week: number; start_time: string; end_time: string }>
  >();
  for (const h of (hours ?? []) as Array<{
    barber_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>) {
    const list = hoursByBarber.get(h.barber_id) ?? [];
    list.push({
      day_of_week: h.day_of_week,
      start_time: h.start_time.slice(0, 5),
      end_time: h.end_time.slice(0, 5),
    });
    hoursByBarber.set(h.barber_id, list);
  }

  const rows: BarberRow[] = (
    (barbers ?? []) as Array<{
      id: string;
      name: string;
      slug: string;
      bio: string | null;
      active: boolean;
    }>
  ).map((b) => {
    const ids = serviceIdsByBarber.get(b.id) ?? [];
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      bio: b.bio,
      active: b.active,
      serviceIds: ids,
      serviceNames: ids
        .map((id) => serviceNames.get(id))
        .filter((n): n is string => !!n),
      hours: hoursByBarber.get(b.id) ?? [],
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-cream">
          Barbers
        </h1>
        <p className="mt-1 text-sm text-cream/60">
          {rows.length} barbers · services and weekly hours per barber
        </p>
      </div>
      <BarberTable
        barbers={rows}
        services={(services ?? []) as ServiceChoice[]}
      />
    </div>
  );
}
