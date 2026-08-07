import { fv } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";
import { type ClassName, cn } from "~/lib/utils";

/**
 * A placeholder for content that has not arrived.
 *
 * shadcn's is `animate-pulse rounded-md bg-muted`. This is the same thing minus
 * the pulse: Vela has no `animate-*` family, and the families it does have —
 * `transition-*`, `duration-*`, `ease-*` — animate a change rather than loop,
 * so a pulse would have to be driven by the component. That is a `useEffect`
 * and a tween in a file that is otherwise a recipe and a frame, and it is
 * runtime behaviour nobody can check by reading it. It stays out until Facet
 * has an animation primitive worth putting under it.
 *
 * The default size is a line of text. Both axes are declared because everything
 * here declares both axes, and a consumer overriding one of them lands after
 * this in `className`, so `<Skeleton className="h-32 w-32" />` wins.
 */
export const skeletonVariants = fv("w-full h-4 rounded-md bg-muted");

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
