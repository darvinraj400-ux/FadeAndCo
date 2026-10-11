export type FlowNode = { label: string; detail?: string };

// The request path, in order. An <ol> because the chain *is* an ordered
// sequence: assistive tech announces "3 of 8" for free.
const NODES: FlowNode[] = [
  { label: "Customer picks service and barber" },
  { label: "GET /api/slots" },
  { label: "computeAvailableSlots", detail: "(hours, busy, timeoff)" },
  { label: "Slot list" },
  { label: "POST /api/bookings" },
  { label: "Exclusion constraint enforces" },
  { label: "201 or 409" },
  { label: "Confirmation email" },
];

const LIST =
  "my-6 flex list-none flex-col items-center gap-2 " +
  "sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-2 sm:gap-y-3";

const ITEM = "flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-2";

/**
 * Flow diagram. A wrapping row from `sm` up, a vertical stack below it —
 * the horizontal chain is eight nodes and will not fit on one line. Below
 * `sm` the children are content-sized and centred, so no node can force
 * horizontal overflow at 375px.
 *
 * Arrows lead each node rather than trailing it. With trailing arrows a
 * wrapped row ends in an arrow pointing at empty space, which reads as a
 * rendering bug; leading them means every row starts on an arrow and ends on
 * a box, and a wrapped row still reads as "continues from the row above".
 */
export function Flow({ nodes = NODES }: { nodes?: FlowNode[] }) {
  return (
    // role="list" is required, not decorative: WebKit drops the implicit list
    // role from an <ol> styled `list-none`, which would silence the "8 items"
    // announcement this diagram relies on.
    <ol role="list" className={LIST}>
      {nodes.map((n, i) => (
        <li key={n.label} className={ITEM}>
          {i > 0 ? (
            <span aria-hidden="true" className="font-mono leading-none text-bronze">
              <span className="hidden sm:inline">→</span>
              <span className="sm:hidden">↓</span>
            </span>
          ) : null}
          <span className="rounded-lg border border-line bg-parchment px-3 py-1.5 text-center leading-tight text-ink">
            <span className="block text-sm">{n.label}</span>
            {n.detail ? (
              <span className="block text-[11px] text-bark">{n.detail}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}