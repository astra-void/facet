import { fv } from "@facet-ui/react-variants";
import type { LayerInteractEvent } from "@lattice-ui/react-layer";
import { Popover as PopoverPrimitive } from "@lattice-ui/react-popover";
import type { PopperPlacement } from "@lattice-ui/react-popper";
import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";
import { type ClassName, cn } from "~/lib/utils";

/**
 * The first component positioned *relative to something else*. `dialog` and
 * `sheet` place a panel against the screen; this one places it against its
 * trigger, and the measurement is entirely Lattice's — `@lattice-ui/react-popper`
 * reads both rects and hands back an `AnchorPoint` and a `Position`. This file
 * says what the panel looks like and how far off the trigger it sits.
 *
 * **A `PortalProvider` has to be above this**, for the reason `dialog` gives:
 * the layer portals into a `BasePlayerGui` it reads from a strict context.
 *
 * **`side` and `align` are one prop here, and it is `placement`.** Lattice's
 * popper takes `"top" | "bottom" | "left" | "right"` and always centres the
 * panel on the other axis — shadcn's `align="start"` and `align="end"` have no
 * equivalent. `alignOffset` shifts along that axis in pixels, which is the way
 * to fake either one; `sideOffset` is the gap from the trigger, defaulted to
 * shadcn's 4.
 *
 * **`text-sm` is on the title and the description, not the header.** shadcn puts
 * it on the header once and lets it cascade; nothing cascades in Roblox, so
 * every text part states its own size. See docs/registry-design.md.
 *
 * One recipe object rather than four exports: every exported name costs a Luau
 * register once Vela inlines its runtime. See docs/decisions/luau-register-limit.md.
 */
export const popoverVariants = {
  content: fv("flex-col w-72 h-fit rounded-md border border-border bg-popover p-4 shadow-md"),
  header: fv("flex-col w-full h-fit gap-1"),
  title: fv("w-full h-fit whitespace-normal text-left text-sm font-medium text-popover-foreground"),
  description: fv("w-full h-fit whitespace-normal leading-tight text-left text-sm font-normal text-muted-foreground"),
};

/**
 * Re-exported unstyled, as shadcn does: the trigger is whatever the consumer
 * puts in it. Reached for bare it is a `textbutton` with Roblox's defaults
 * neutralized and no size of its own, so give it a `className` with both axes
 * resolved.
 *
 * `PopoverAnchor` is the escape hatch for the case the two differ — wrap the
 * element the panel should measure against, and the trigger can sit anywhere.
 * Without one the trigger is the anchor.
 */
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export type PopoverContentProps = {
  className?: ClassName;
  /** Which side of the anchor the panel sits on. Defaults to `"bottom"`. */
  placement?: PopperPlacement;
  /** Gap from the anchor, in pixels. Defaults to 4, as shadcn's does. */
  sideOffset?: number;
  /** Shift along the other axis. The panel is centred there, so this is what offsets it. */
  alignOffset?: number;
  /** How close to the screen edge the panel may land before it is nudged back. */
  collisionPadding?: number;
  /** Fires before an outside press dismisses; `event.preventDefault()` keeps the popover open. */
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type PopoverSectionProps = {
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type PopoverTextProps = {
  className?: ClassName;
  Text?: string;
} & PassthroughProps<TextLabel>;

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

const CONTENT_OWN_PROPS = [
  "className",
  "placement",
  "sideOffset",
  "alignOffset",
  "collisionPadding",
  "onPointerDownOutside",
  "onInteractOutside",
  "children",
] as const;
const SECTION_OWN_PROPS = ["className", "children"] as const;
const TEXT_OWN_PROPS = ["className", "Text"] as const;

// shadcn's default, restated here because Lattice's popper defaults to 0 — an
// unstyled popover has no border to clear, and this one does.
const DEFAULT_SIDE_OFFSET = 4;

/**
 * Portal and panel in one part, like shadcn's.
 *
 * The panel is a frame *inside* `Popover.Content` rather than `Popover.Content`
 * itself, and here that is load-bearing twice over. The primitive forces
 * `AutomaticSize.XY` on its own host so the popper has something to measure, and
 * that would eat `w-72` — a class on the host would be overridden into a
 * content-hugging width. It is also the boundary an outside press is measured
 * against, so it has to end up exactly as large as the panel: the host measures
 * this frame, this frame is `w-72 h-fit`, and the popper positions what it
 * measured.
 */
export function PopoverContent(props: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        alignOffset={props.alignOffset}
        collisionPadding={props.collisionPadding}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        placement={props.placement}
        sideOffset={props.sideOffset ?? DEFAULT_SIDE_OFFSET}
      >
        <frame
          className={cn(popoverVariants.content({ className: props.className }))}
          {...NEUTRAL_PROPS}
          {...getPassthroughProps<Frame>(props, CONTENT_OWN_PROPS)}
        >
          {props.children}
        </frame>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

export function PopoverHeader(props: PopoverSectionProps) {
  return (
    <frame
      className={cn(popoverVariants.header({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, SECTION_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function PopoverTitle(props: PopoverTextProps) {
  return (
    <textlabel
      className={cn(popoverVariants.title({ className: props.className }))}
      Text={props.Text ?? ""}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}

export function PopoverDescription(props: PopoverTextProps) {
  return (
    <textlabel
      className={cn(popoverVariants.description({ className: props.className }))}
      Text={props.Text ?? ""}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}
