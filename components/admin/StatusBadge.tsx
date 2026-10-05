import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AppointmentStatus =
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

// Warm-tinted status colors for the coal admin. Unknown values fall back
// to the muted style with the raw status as label (never a blank badge).
const STATUS_STYLES: Record<AppointmentStatus, string> = {
  confirmed: "border-brass/40 bg-brass/15 text-brass",
  completed: "border-moss/40 bg-moss/15 text-moss",
  cancelled: "border-cream/15 bg-cream/5 text-cream/60",
  no_show: "border-ember/40 bg-brick/20 text-ember",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export function StatusBadge({ status }: { status: string }) {
  const known = status as AppointmentStatus;
  const style = STATUS_STYLES[known] ?? STATUS_STYLES.cancelled;
  const label = STATUS_LABELS[known] ?? status;
  return (
    <Badge variant="outline" className={cn(style)}>
      {label}
    </Badge>
  );
}
