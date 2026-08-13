import { fv } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React, toSlotProps } from "@lattice-ui/react-runtime";
import { type ScrollAreaOrientation, ScrollArea as ScrollAreaPrimitive } from "@lattice-ui/react-scroll-area";
import { type ClassName, cn } from "~/lib/utils";

/**
 * The root deliberately carries no `flex-*`: the scrollbar is pinned to an edge
 * with inset classes, and a `UIListLayout` would pull it into the flow.
 *
 * **The height comes from the parent.** A scroll area that hugs its content has
 * nothing to scroll, so something has to state a size — and it cannot be a
 * `className` at the call site. Vela resolves that class where it is written and
 * the recipe below, which names `Size` on both axes, is emitted after the props
 * it arrives as. So `<ScrollArea className="h-32" />` inside a 200px parent
 * renders 200px tall. Put the height on a frame around it, or edit `root` here.
 *
 * The viewport hides Roblox's native scrollbar (`scrollbar-none`) because the
 * visible one is drawn by `ScrollBar` below: Lattice sizes and positions the
 * thumb from the scroll ratio and fades it after `scrollHideDelayMs`; this file
 * only says what it looks like.
 *
 * One recipe object rather than four exports: every exported name costs a
 * Luau register once Vela inlines its runtime. See
 * docs/decisions/luau-register-limit.md.
 */
export const scrollAreaVariants = {
  root: fv("w-full h-full overflow-hidden"),
  viewport: fv("size-full scrollbar-none"),
  // `p-px` is shadcn's. Its inner `border-l-transparent` is a per-side border,
  // which Vela rejects outright — the padding is what that border was buying.
  // The bar's own thickness is set at the call site with its position, because
  // both depend on `orientation`.
  scrollbar: fv("p-px rounded-full"),
  thumb: fv("rounded-full bg-border"),
};

export type ScrollAreaProps = {
  /** `auto` shows the bar while scrolling, `always` keeps it, `scroll` matches the platform. */
  type?: "auto" | "always" | "scroll";
  scrollHideDelayMs?: number;
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type ScrollBarProps = {
  orientation?: ScrollAreaOrientation;
  className?: ClassName;
} & PassthroughProps<Frame>;

const ROOT_OWN_PROPS = ["type", "scrollHideDelayMs", "className", "children"] as const;
const BAR_OWN_PROPS = ["orientation", "className", "children"] as const;

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export function ScrollArea(props: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root scrollHideDelayMs={props.scrollHideDelayMs} type={props.type}>
      <frame
        className={cn(scrollAreaVariants.root({ className: props.className }))}
        {...NEUTRAL_PROPS}
        {...getPassthroughProps<Frame>(props, ROOT_OWN_PROPS)}
      >
        <ScrollAreaPrimitive.Viewport className={cn(scrollAreaVariants.viewport())}>
          {props.children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
      </frame>
    </ScrollAreaPrimitive.Root>
  );
}

export function ScrollBar(props: ScrollBarProps) {
  const orientation = props.orientation ?? "vertical";

  return (
    <ScrollAreaPrimitive.Scrollbar
      className={scrollAreaVariants.scrollbar({
        className: cn(
          orientation === "vertical" ? "right-0 top-0 h-full w-2.5" : "bottom-0 left-0 w-full h-2.5",
          props.className,
        ),
      })}
      orientation={orientation}
      {...toSlotProps(getPassthroughProps<Frame>(props, BAR_OWN_PROPS))}
    >
      <ScrollAreaPrimitive.Thumb
        className={cn(scrollAreaVariants.thumb(), orientation === "vertical" ? "w-full" : "h-full")}
        orientation={orientation}
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}
