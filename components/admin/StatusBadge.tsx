import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AppointmentStatus =
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  confirmed: "border-indigo-500/30 bg-indigo-500/15 text-indigo-300",
  completed: "border-green-500/30 bg-green-500/15 text-green-300",
  cancelled: "border-zinc-700 bg-zinc-800/50 text-zinc-400",
  no_show: "border-red-500/30 bg-red-500/15 text-red-300",
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
