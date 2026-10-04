"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type BarberOption = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
};

export function BarberPicker({
  barbers,
  value,
  onChange,
  loading,
}: {
  barbers: BarberOption[];
  value: string | null;
  onChange: (id: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading barbers…</p>;
  }
  if (barbers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No barbers offer this service.
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {barbers.map((b) => {
        const selected = b.id === value;
        return (
          <button key={b.id} type="button" onClick={() => onChange(b.id)}>
            <Card
              className={cn(
                "p-4 text-left transition-colors hover:border-primary",
                selected && "border-primary ring-1 ring-primary"
              )}
            >
              <span className="font-medium">{b.name}</span>
              {b.bio ? (
                <p className="mt-1 text-sm text-muted-foreground">{b.bio}</p>
              ) : null}
            </Card>
          </button>
        );
      })}
    </div>
  );
}
