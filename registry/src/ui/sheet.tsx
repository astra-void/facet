import { fv, type VariantProps } from "@facet-ui/react-variants";
import { Dialog as DialogPrimitive } from "@lattice-ui/react-dialog";
import type { LayerInteractEvent } from "@lattice-ui/react-layer";
import { getPassthroughProps, type PassthroughProps, React, toSlotProps } from "@lattice-ui/react-runtime";
import { type ClassName, cn } from "~/lib/utils";

/**
 * `dialog` with the panel pinned to an edge instead of centred. Same primitive,
 * same `PortalProvider` requirement, same dismissal — only the geometry differs,
 * which is why this is a `side` variant rather than a second set of parts.
 *
 * **How an edge is expressed.** `dialog` centres with `mx-auto my-auto`, which
 * Vela lowers to `AnchorPoint` 0.5 plus `Position` 0.5 on that axis. There is no
 * `ml-auto` equivalent to push a panel to one side — Vela consumes the token and
 * does nothing with it — so an edge is stated directly: `origin-*` is the
 * `AnchorPoint`, and `left-0` / `right-0` / `top-0` / `bottom-0` are the
 * `Position`. `right-0` is `UDim.new(1, 0)`, not zero; the family is measured
 * from the far edge, as it is in CSS.
 *
 * This works for the reason `dialog`'s centring does: `Dialog.Content`'s host
 * spans the screen and lays nothing out, so the panel positions itself inside it.
 *
 * **No `rounded-*` and one `border`.** A sheet is flush with the edge it sits on,
 * so there is nothing to round. shadcn draws a single border on the inner side;
 * Vela lowers `border` onto a `UIStroke`, which has no per-side thickness, so it
 * is the whole outline or none. It is the whole outline.
 *
 * One recipe object rather than seven exports: every exported name costs a Luau
 * register. See docs/decisions/luau-register-limit.md.
 */
export const sheetVariants = {
  // The registry's one colour-by-name, for the reason `dialog` gives:
  // docs/decisions/overlay-scrim.md.
  overlay: fv("bg-black/50"),
  // No padding on the panel — shadcn puts it on the parts (`p-4` on the header
  // and the footer) so a part can run edge to edge by dropping one class. Same
  // split as `card`'s.
  content: fv("flex-col gap-4 border border-border bg-background shadow-lg", {
    variants: {
      side: {
        // Both axes on every side, as everything here declares both: the pinned
        // axis is the sheet's own measurement, the other spans the screen.
        //
        // `w-96` is shadcn's `sm:max-w-sm`, the width its `w-3/4` is capped at
        // on anything wider than a phone. Vela has no max-width — `max-w-sm`
        // reads `sm` as a spacing key and warns — so the cap is stated as the
        // width.
        top: "origin-top-left top-0 left-0 w-full h-fit",
        bottom: "origin-bottom-left bottom-0 left-0 w-full h-fit",
        left: "origin-top-left top-0 left-0 w-96 h-full",
        right: "origin-top-right top-0 right-0 w-96 h-full",
      },
    },
    defaultVariants: { side: "right" },
  }),
  // `mt-4 mr-4` is where shadcn's `top-4 right-4` puts it. The panel carries no
  // padding of its own now, so the inset has to come from the button.
  close: fv("size-6 self-end mt-4 mr-4 rounded-md text-sm font-normal text-muted-foreground hover:bg-accent"),
  header: fv("flex-col w-full h-fit gap-1.5 p-4"),
  // A column, not a row. `dialog`'s footer is a row of buttons; a sheet's is a
  // stack, and shadcn pushes it to the bottom with `mt-auto` — a token Vela
  // rejects outright ("use a spacing key, or mx-auto/my-auto"), so the footer
  // sits where the column leaves it.
  footer: fv("flex-col w-full h-fit gap-2 p-4"),
  // No `text-lg`: a sheet's title is body-sized and bold, unlike a dialog's.
  title: fv("w-full h-fit whitespace-normal text-left text-base font-semibold text-foreground"),
  description: fv("w-full h-fit whitespace-normal leading-tight text-left text-sm font-normal text-muted-foreground"),
};

/** Unstyled, like `dialog`'s: the trigger is whatever the consumer puts in it. */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetPortal = DialogPrimitive.Portal;
export const SheetClose = DialogPrimitive.Close;

export type SheetOverlayProps = {
  className?: ClassName;
} & PassthroughProps<TextButton>;

export type SheetContentProps = VariantProps<typeof sheetVariants.content> & {
  className?: ClassName;
  /** Styles the dim behind the panel. `SheetContent` renders its own overlay. */
  overlayClassName?: ClassName;
  /** The ✕ at the top of the panel. Pass `false` when a footer button is the only way out. */
  showCloseButton?: boolean;
  /** Fires before an outside press dismisses; `event.preventDefault()` keeps the sheet open. */
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type SheetSectionProps = {
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type SheetTextProps = {
  className?: ClassName;
  Text?: string;
} & PassthroughProps<TextLabel>;

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

const OVERLAY_OWN_PROPS = ["className", "children"] as const;
const CONTENT_OWN_PROPS = [
  "side",
  "className",
  "overlayClassName",
  "showCloseButton",
  "onPointerDownOutside",
  "onInteractOutside",
  "children",
] as const;
const SECTION_OWN_PROPS = ["className", "children"] as const;
const TEXT_OWN_PROPS = ["className", "Text"] as const;

// The forwarded bag is widened by `toSlotProps` and then has `children` dropped
// from its *type*: the overlay types `children` as the single element `asChild`
// merges onto, and the bag never carries one — `children` is an own prop — so
// only the type needs narrowing. Same crossing point as `dialog`'s.
function forwardProps(props: object, ownKeys: readonly string[]): { key?: React.Key } & { [index: string]: unknown } {
  return toSlotProps(getPassthroughProps(props, ownKeys));
}

export function SheetOverlay(props: SheetOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      className={cn(sheetVariants.overlay({ className: props.className }))}
      {...forwardProps(props, OVERLAY_OWN_PROPS)}
    />
  );
}

/**
 * Portal, overlay and panel in one part, like `dialog`'s.
 *
 * The panel is a frame *inside* `Dialog.Content` rather than `Dialog.Content`
 * itself: the primitive forces `Size` on its own host so the layer spans the
 * screen, and a `className` there would fight it.
 */
export function SheetContent(props: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      {/* The primitive rather than `SheetOverlay`, so `overlayClassName` and the
          recipe meet in one `className` expression — see `dialog`. */}
      <DialogPrimitive.Overlay className={cn(sheetVariants.overlay({ className: props.overlayClassName }))} />
      <DialogPrimitive.Content
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
      >
        <frame
          className={cn(sheetVariants.content({ side: props.side, className: props.className }))}
          {...NEUTRAL_PROPS}
          {...getPassthroughProps<Frame>(props, CONTENT_OWN_PROPS)}
        >
          {/* Its own line at the top rather than floating in the corner: a
              `UIListLayout` positions every child it has, so `self-end` (a
              `UIFlexItem`) is what pushes it to the panel's edge. The glyph is
              text — replace it to use your own artwork. */}
          {props.showCloseButton === false ? undefined : (
            <DialogPrimitive.Close className={cn(sheetVariants.close())} Text="✕" />
          )}
          {props.children}
        </frame>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetHeader(props: SheetSectionProps) {
  return (
    <frame
      className={cn(sheetVariants.header({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, SECTION_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function SheetFooter(props: SheetSectionProps) {
  return (
    <frame
      className={cn(sheetVariants.footer({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, SECTION_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function SheetTitle(props: SheetTextProps) {
  return (
    <textlabel
      className={cn(sheetVariants.title({ className: props.className }))}
      Text={props.Text ?? ""}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}

export function SheetDescription(props: SheetTextProps) {
  return (
    <textlabel
      className={cn(sheetVariants.description({ className: props.className }))}
      Text={props.Text ?? ""}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}
