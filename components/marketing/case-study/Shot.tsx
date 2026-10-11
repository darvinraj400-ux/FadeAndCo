import Image from "next/image";

export type ShotLayout = "full" | "half" | "narrow";

/**
 * Screenshot with a caption. One `layout` union rather than a set of
 * booleans, so the impossible combinations are unrepresentable:
 *   full  — spans the page column
 *   half  — one cell of a two-column row (vertical rhythm owned by the grid)
 *   narrow — capped at 320px and centred, for the booking wizard
 */
export function Shot({
  src,
  alt,
  width,
  height,
  caption,
  priority = false,
  layout = "full",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  priority?: boolean;
  layout?: ShotLayout;
}) {
  return (
    <figure
      className={
        layout === "narrow"
          ? "mx-auto my-10 w-full max-w-[320px]"
          : layout === "half"
            ? "w-full"
            : "my-10 w-full"
      }
    >
      <div className="overflow-hidden rounded-2xl border border-line">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={
            layout === "half"
              ? // The column is (min(100vw, 1024) - 32 - 24) / 2, so 484px is
                // the real ceiling and 768px is never reached.
                "(max-width: 767px) calc(100vw - 2rem), 484px"
              : layout === "narrow"
                ? "320px"
                : "(max-width: 1056px) calc(100vw - 2rem), 992px"
          }
          className="h-auto w-full"
        />
      </div>
      {caption ? (
        <figcaption className="mt-2 text-sm text-bark">{caption}</figcaption>
      ) : null}
    </figure>
  );
}