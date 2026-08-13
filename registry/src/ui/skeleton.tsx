import { fv } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";
import { type ClassName, cn } from "~/lib/utils";

/**
 * A placeholder for content that has not arrived.
 *
 * shadcn's is `animate-pulse rounded-md bg-accent`, and all three carry over.
 * `animate-pulse` is Vela's own loop, not a `transition-*` — it compiles the
 * element into Vela's runtime host and drives the tween there, so the pulse
 * costs this file nothing but the token.
 *
 * The surface is `bg-accent`, not `bg-muted`. They are close in the zinc ramp
 * and they are not the same role, and this is the component shadcn moved.
 *
 * The default size is a line of text. Both axes are declared because everything
 * here declares both axes, and a consumer overriding one of them lands after
 * this in `className`, so `<Skeleton className="h-32 w-32" />` wins.
 */
export const skeletonVariants = fv("animate-pulse w-full h-4 rounded-md bg-accent");

export type SkeletonProps = { className?: ClassName } & PassthroughProps<Frame>;

const OWN_PROPS = ["className"] as const;

// No `BackgroundTransparency: 1`: like `separator`, the background is the
// component.
const NEUTRAL_PROPS = {
  BorderSizePixel: 0,
};

export function Skeleton(props: SkeletonProps) {
  return (
    <frame
      className={cn(skeletonVariants({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, OWN_PROPS)}
    />
  );
}
