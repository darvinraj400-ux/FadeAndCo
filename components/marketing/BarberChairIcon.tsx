import { cn } from "@/lib/utils";

// Line-drawn barber chair accent, shared by the About section and the
// gallery placeholders. Stroke inherits brass from the parent; opacity
// keeps it a background whisper, not a logo.
export function BarberChairIcon({
  className,
  opacity = "opacity-30",
}: {
  className?: string;
  opacity?: "opacity-30" | "opacity-40";
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className={cn("h-40 w-40 text-brass", opacity, className)}
    >
      {/* headrest */}
      <rect x="118" y="18" width="26" height="12" rx="4" />
      {/* backrest */}
      <rect x="116" y="32" width="30" height="62" rx="8" />
      {/* seat */}
      <rect x="66" y="94" width="80" height="18" rx="9" />
      {/* armrest */}
      <path d="M72 94 V74 H104" />
      <path d="M72 82 H96" />
      {/* hydraulic column */}
      <path d="M106 112 V142" />
      <path d="M98 126 H114" />
      {/* round base */}
      <ellipse cx="106" cy="152" rx="30" ry="8" />
      {/* footrest */}
      <path d="M146 104 L168 128 M160 128 H176" />
      {/* floor line */}
      <path d="M40 168 H160" />
    </svg>
  );
}
