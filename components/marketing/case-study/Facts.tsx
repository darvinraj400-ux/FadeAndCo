export type Fact = {
  label: string;
  value: string;
  note?: string;
  /** Span both grid columns. Explicit rather than inferred, so the caller
   *  controls the composition and there is no orphan-cell special case. */
  wide?: boolean;
};

const CARD = "rounded-xl border border-line bg-parchment p-4";

export function Facts({ items }: { items: Fact[] }) {
  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map((f) => (
        <div key={f.label} className={f.wide ? `${CARD} sm:col-span-2` : CARD}>
          <dt className="text-bark">{f.label}</dt>
          <dd className="mt-0.5 font-mono text-ink">{f.value}</dd>
          {f.note ? (
            // Prose, not data — sans and not announced as a second definition.
            <dd aria-hidden="true" className="mt-1 text-xs text-bark">
              {f.note}
            </dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}