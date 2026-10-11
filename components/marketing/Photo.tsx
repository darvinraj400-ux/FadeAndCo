// Renders a local optimised photograph with a real JPEG fallback.
// WebP is offered through <source>; browsers without WebP (or with images
// disabled for <source>) fall back to the JPEG sibling in /public/images.
// Explicit width/height on the <img> reserves layout space, so there is no CLS.

const SAFE_NAME = /^[a-z0-9-]+$/;

export function Photo({
  name,
  alt,
  width,
  height,
  className,
}: {
  name: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  // Guard here as well as at the call sites: `name` becomes a path segment, so
  // anything that is not a plain file stem must not reach the src.
  if (!SAFE_NAME.test(name)) {
    throw new Error(`Photo: unsafe image name ${JSON.stringify(name)}`);
  }

  return (
    <picture>
      <source type="image/webp" srcSet={`/images/${name}.webp`} />
      <img
        src={`/images/${name}.jpg`}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={className}
      />
    </picture>
  );
}
