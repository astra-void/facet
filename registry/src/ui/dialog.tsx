import { fv } from "@facet-ui/react-variants";
import { Dialog as DialogPrimitive } from "@lattice-ui/react-dialog";
import type { LayerInteractEvent } from "@lattice-ui/react-layer";
import { getPassthroughProps, type PassthroughProps, React, toSlotProps } from "@lattice-ui/react-runtime";
import { type ClassName, cn } from "~/lib/utils";

/**
 * The first layered component, and the layering is entirely Lattice's: the
 * portal, the dim's own `ScreenGui`, the focus trap and the outside-press
 * dismissal all come from `@lattice-ui/react-dialog`. This file says what the
 * panel looks like and where it sits.
 *
 * **A `PortalProvider` has to be above this.** `Dialog.Portal` reads a strict
 * context for the `BasePlayerGui` it renders into, so an app that mounts a
 * dialog wraps its tree once:
 *
 * ```tsx
 * <PortalProvider container={Players.LocalPlayer.WaitForChild("PlayerGui")}>
 *   <App />
 * </PortalProvider>
 * ```
 *
 * Without it the dialog throws on open rather than rendering nowhere, which is
 * the better of the two failures but still surprising the first time.
 *
 * One recipe object rather than seven exports: every exported name costs a
 * Luau register once Vela inlines its runtime. See
 * docs/decisions/luau-register-limit.md.
 */
export const dialogVariants = {
  // The one class in the registry that names a colour instead of a role. A
  // scrim is not a themed surface — it is the absence of light, black under
  // shadcn's light theme and its dark one alike, and every role that stays dark
  // in both modes stays dark by coincidence. `overlayClassName` is the way out.
  // See docs/decisions/overlay-scrim.md.
  overlay: fv("bg-black/50"),
  // `mx-auto my-auto` is the centring: Vela lowers each to `AnchorPoint` 0.5
  // plus `Position` 0.5 on that axis. It works because the primitive's content
  // host spans the layer and lays nothing out, so this frame positions itself
  // inside it.
  content: fv("flex-col gap-4 w-128 h-fit mx-auto my-auto rounded-lg border border-border bg-background p-6 shadow-lg"),
  close: fv("size-6 self-end rounded-md text-sm font-normal text-muted-foreground hover:bg-accent"),
  header: fv("flex-col w-full h-fit gap-2"),
  footer: fv("flex-row items-center justify-end w-full h-fit gap-2"),
  title: fv("w-full h-fit whitespace-normal leading-none text-left text-lg font-semibold text-foreground"),
  description: fv("w-full h-fit whitespace-normal leading-tight text-left text-sm font-normal text-muted-foreground"),
};

/**
 * Re-exported unstyled, as shadcn does: the trigger is whatever the consumer
 * puts in it.
 *
 * ```tsx
 * <DialogTrigger asChild>
 *   <Button Text="Open" />
 * </DialogTrigger>
 * ```
 *
 * Reached for bare it is a `textbutton` with Roblox's defaults neutralized and
 * no size of its own, so give it a `className` with both axes resolved.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export type DialogOverlayProps = {
  className?: ClassName;
} & PassthroughProps<TextButton>;

export type DialogContentProps = {
  className?: ClassName;
  /** Styles the dim behind the panel. `DialogContent` renders its own overlay. */
  overlayClassName?: ClassName;
  /** The ✕ in the panel's top-right. Pass `false` when the only way out is a footer button. */
  showCloseButton?: boolean;
  /** Fires before an outside press dismisses; `event.preventDefault()` keeps the dialog open. */
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type DialogSectionProps = {
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type DialogTextProps = {
  className?: ClassName;
  Text?: string;
} & PassthroughProps<TextLabel>;

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

const OVERLAY_OWN_PROPS = ["className", "children"] as const;
const CONTENT_OWN_PROPS = [
  "className",
  "overlayClassName",
  "showCloseButton",
  "onPointerDownOutside",
  "onInteractOutside",
  "children",
] as const;
const SECTION_OWN_PROPS = ["className", "children"] as const;
const TEXT_OWN_PROPS = ["className", "Text"] as const;

// The forwarded bag is widened by `toSlotProps` and then has `children`
// dropped from its *type*: the overlay types `children` as the single element
// `asChild` merges onto, and the bag never carries one — `children` is listed
// as an own prop — so only the type needs narrowing.
function forwardProps(props: object, ownKeys: readonly string[]): { key?: React.Key } & { [index: string]: unknown } {
  return toSlotProps(getPassthroughProps(props, ownKeys));
}

export function DialogOverlay(props: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      className={cn(dialogVariants.overlay({ className: props.className }))}
      {...forwardProps(props, OVERLAY_OWN_PROPS)}
    />
  );
}

/**
 * Portal, overlay and panel in one part, like shadcn's — the composition is the
 * same every time, and `DialogOverlay` is exported for the time it is not.
 *
 * The panel is a frame *inside* `Dialog.Content` rather than `Dialog.Content`
 * itself, and that is structural rather than stylistic. The primitive forces
 * `Size` on its own host so the layer spans the screen, and it takes the first
 * host element under it as the boundary an outside press is measured against.
 * A `className` here would fight the first and — through the `UICorner` Vela
 * prepends for `rounded-lg` — quietly become the second.
 */
export function DialogContent(props: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      {/* The primitive rather than `DialogOverlay`, so `overlayClassName` and
          the recipe meet in one `className` expression. Vela resolves a
          `className` at the call site and hands the component the resolved
          properties instead of the string, so routing it through a second
          component would let this file's `bg-black/80` land on top of the
          consumer's — the same trap `TextSlot` avoids by taking no `className`
          at all. `overlayClassName` is not spelled `className`, so it arrives
          here intact. */}
      <DialogPrimitive.Overlay className={cn(dialogVariants.overlay({ className: props.overlayClassName }))} />
      <DialogPrimitive.Content
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
      >
        <frame
          className={cn(dialogVariants.content({ className: props.className }))}
          {...NEUTRAL_PROPS}
          {...getPassthroughProps<Frame>(props, CONTENT_OWN_PROPS)}
        >
          {/* Not the corner overlay shadcn draws: a `UIListLayout` positions
              every child it has, so a floating ✕ inside a `flex-col` panel is
              not expressible without a second frame to escape the layout. It
              takes its own line at the top instead, pushed right by `self-end`
              (a `UIFlexItem`), and the glyph is text — replace it to use your
              own artwork. */}
          {props.showCloseButton === false ? undefined : (
            <DialogPrimitive.Close className={cn(dialogVariants.close())} Text="✕" />
          )}
          {props.children}
        </frame>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader(props: DialogSectionProps) {
  return (
    <frame
      className={cn(dialogVariants.header({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, SECTION_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function DialogFooter(props: DialogSectionProps) {
  return (
    <frame
      className={cn(dialogVariants.footer({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, SECTION_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function DialogTitle(props: DialogTextProps) {
  return (
    <textlabel
      className={cn(dialogVariants.title({ className: props.className }))}
      Text={props.Text ?? ""}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}

export function DialogDescription(props: DialogTextProps) {
  return (
    <textlabel
      className={cn(dialogVariants.description({ className: props.className }))}
      Text={props.Text ?? ""}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}
