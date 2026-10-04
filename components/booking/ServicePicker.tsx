"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ServiceOption = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
};

export function ServicePicker({
  services,
  value,
  onChange,
  loading,
}: {
  services: ServiceOption[];
  value: string | null;
  onChange: (id: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading services…</p>;
  }
  if (services.length === 0) {
    return <p className="text-sm text-muted-foreground">No services found.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.map((s) => {
        const selected = s.id === value;
        return (
          <button key={s.id} type="button" onClick={() => onChange(s.id)}>
            <Card
              className={cn(
                "p-4 text-left transition-colors hover:border-primary",
                selected && "border-primary ring-1 ring-primary"
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{s.name}</span>
                <span className="text-sm text-muted-foreground">
                  ${(s.price_cents / 100).toFixed(0)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {s.duration_minutes} min
                {s.description ? ` · ${s.description}` : ""}
              </p>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
