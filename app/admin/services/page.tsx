import { createAdminClient } from "@/lib/supabase";
import { ServiceTable, type ServiceRow } from "@/components/admin/ServiceTable";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("fade_services")
    .select("id,name,slug,description,duration_minutes,price_cents,active")
    .order("name");

  const services: ServiceRow[] = (
    (data ?? []) as Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      duration_minutes: number;
      price_cents: number;
      active: boolean;
    }>
  ).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    durationMinutes: s.duration_minutes,
    priceCents: s.price_cents,
    priceLabel: `$${(s.price_cents / 100).toFixed(2)}`,
    active: s.active,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-cream">
          Services
        </h1>
        <p className="mt-1 text-sm text-cream/60">
          {services.length} services · inactive ones stay hidden from booking
        </p>
      </div>
      <ServiceTable services={services} />
    </div>
  );
}
