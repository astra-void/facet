import { fv, type VariantProps } from "@facet-ui/react-variants";
import { Dialog as DialogPrimitive } from "@lattice-ui/react-dialog";
import type { LayerInteractEvent } from "@lattice-ui/react-layer";
import {
  composeEvents,
  getPassthroughProps,
  type PassthroughProps,
  React,
  toSlotProps,
} from "@lattice-ui/react-runtime";
import { TextSlot } from "~/lib/text";
import { type ClassName, cn } from "~/lib/utils";
import { buttonLabelVariants, buttonVariants } from "~/ui/button";

/**
 * `dialog` again, with the two things that make an alert dialog one: no ✕, and
 * no way to leave without answering. A destructive confirm that a stray click
 * dismisses is a dialog wearing a different name.
 *
 * **The dim is a child of `Content` here, not `Dialog.Overlay`.** That is the
 * whole trick, and it is worth understanding before editing it.
 *
 * `Dialog.Overlay` is a `textbutton` that closes the dialog on `Activated`, and
 * the primitive composes that handler in itself — a consumer cannot take it off.
 * Built on it, this would dismiss on a stray click no matter what else we did.
 *
 * What replaces it leans on how the layer decides a press is "outside". It looks
 * for a content boundary among `Content`'s **host** children, and a Facet child
 * is never one: every element carrying a `className` compiles to Vela's runtime
 * host, which is a component. So the boundary falls back to the layer's own
 * full-screen canvas, and a press counts as inside when anything under the
 * pointer is a *descendant* of that canvas.
 *
 * `dialog`'s panel is such a descendant over its own rect, which is exactly why
 * pressing its dim dismisses it. This one adds a descendant that covers the
 * screen, so every press lands on content and the dismissal path never runs.
 * That same frame is the dim. The panel is the second child and says `z-10` so
 * it draws above rather than by sibling order.
 *
 * Everything else — the portal, the focus trap, presence — is Lattice's, and a
 * `PortalProvider` has to sit above the app exactly as it does for `dialog`.
 *
 * One recipe object rather than six exports: every exported name costs a Luau
 * register. See docs/decisions/luau-register-limit.md.
 */
export const alertDialogVariants = {
  // `size-full` is not decoration — it is what leaves no position where the
  // press misses. Shrink it and the alert dialog becomes dismissable again.
  //
  // `bg-black/80` is the one class in the registry that names a colour instead
  // of a role, for the reason `dialog` gives: a scrim is the absence of light in
  // both themes. See docs/decisions/overlay-scrim.md.
  overlay: fv("size-full bg-black/50"),
  content: fv(
    "flex-col gap-4 w-128 h-fit mx-auto my-auto z-10 rounded-lg border border-border bg-background p-6 shadow-lg",
  ),
  header: fv("flex-col w-full h-fit gap-2"),
  // The buttons sit at the end of the line, cancel first, as they do on the web.
  footer: fv("flex-row items-center justify-end w-full h-fit gap-2"),
  title: fv("w-full h-fit whitespace-normal text-left text-lg font-semibold text-foreground"),
  description: fv("w-full h-fit whitespace-normal leading-tight text-left text-sm font-normal text-muted-foreground"),
};

export const AlertDialog = DialogPrimitive.Root;
export const AlertDialogTrigger = DialogPrimitive.Trigger;
export const AlertDialogPortal = DialogPrimitive.Portal;

export type AlertDialogContentProps = {
  className?: ClassName;
  /** Styles the dim behind the panel. `AlertDialogContent` renders its own. */
  overlayClassName?: ClassName;
  /**
   * Fires when a press lands outside the panel. The dialog does not dismiss on
   * one — the dim absorbs it — so this is a notification, not a veto, and
   * `event.preventDefault()` has nothing left to prevent.
   */
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type AlertDialogSectionProps = {
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type AlertDialogTextProps = {
  className?: ClassName;
  Text?: string;
} & PassthroughProps<TextLabel>;

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

/**
 * The two buttons are `Dialog.Close` wearing `button`'s recipes, which is what
 * shadcn does and why this entry depends on `button`: a project that restyles
 * its buttons restyles these with them.
 *
 * `variant` and `size` are `button`'s own, so a cancel can be `ghost` and an
 * action can be `destructive` without this file knowing what either means.
 */
export type AlertDialogActionProps = VariantProps<typeof buttonVariants> & {
  className?: ClassName;
  Text?: string;
  /** Runs before the dialog closes. Closing is the primitive's and always happens. */
  onClick?: () => void;
  children?: React.ReactNode;
} & PassthroughProps<TextButton>;

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

const CONTENT_OWN_PROPS = [
  "className",
  "overlayClassName",
  "onPointerDownOutside",
  "onInteractOutside",
  "children",
] as const;
const SECTION_OWN_PROPS = ["className", "children"] as const;
const TEXT_OWN_PROPS = ["className", "Text"] as const;
const CLOSE_BUTTON_OWN_PROPS = [
  "variant",
  "size",
  "className",
  "Text",
  "onClick",
  "children",
  "fallbackVariant",
] as const;

export function AlertDialogContent(props: AlertDialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Content
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
      >
        {/* The dim, and the reason no press reads as outside. Both roles belong
            to this one frame — see the note above the recipe. */}
        <frame className={cn(alertDialogVariants.overlay({ className: props.overlayClassName }))} BorderSizePixel={0} />
        <frame
          className={cn(alertDialogVariants.content({ className: props.className }))}
          {...NEUTRAL_PROPS}
          {...getPassthroughProps<Frame>(props, CONTENT_OWN_PROPS)}
        >
          {props.children}
        </frame>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function AlertDialogHeader(props: AlertDialogSectionProps) {
  return (
    <frame
      className={cn(alertDialogVariants.header({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, SECTION_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function AlertDialogFooter(props: AlertDialogSectionProps) {
  return (
    <frame
      className={cn(alertDialogVariants.footer({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, SECTION_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function AlertDialogTitle(props: AlertDialogTextProps) {
  return (
    <textlabel
      className={cn(alertDialogVariants.title({ className: props.className }))}
      Text={props.Text ?? ""}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}

export function AlertDialogDescription(props: AlertDialogTextProps) {
  return (
    <textlabel
      className={cn(alertDialogVariants.description({ className: props.className }))}
      Text={props.Text ?? ""}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}

/**
 * Both buttons, differing only in which variant they fall back to. Written once
 * because the alternative is thirty duplicated lines that have to stay in step.
 *
 * The label is a child `textlabel` with its own recipe, exactly as in `button`:
 * `Dialog.Close` clears its own `Text`, and nothing inherits, so a class on the
 * button never reaches the string. `buttonLabelVariants` is why this is not
 * `buttonVariants` twice.
 */
function AlertDialogCloseButton(props: AlertDialogActionProps & { fallbackVariant: ButtonVariant }) {
  const variant = props.variant ?? props.fallbackVariant;

  const handleActivated = React.useCallback(() => {
    props.onClick?.();
  }, [props.onClick]);

  const passthrough = getPassthroughProps<TextButton>(props, CLOSE_BUTTON_OWN_PROPS);

  return (
    <DialogPrimitive.Close
      className={cn(buttonVariants({ variant, size: props.size, className: props.className }))}
      // `toSlotProps` is the crossing point: the typed bag carries a
      // `Ref<TextButton>`, and the runtime host Vela wraps this call site in
      // types its own `ref` as `Ref<unknown>`. Widening here is what the roadmap
      // calls the boundary a forwarded bag crosses.
      {...toSlotProps(passthrough)}
      Event={composeEvents(passthrough.Event, { Activated: handleActivated })}
    >
      <TextSlot Text={props.Text} className={buttonLabelVariants({ variant, size: props.size })}>
        {props.children}
      </TextSlot>
    </DialogPrimitive.Close>
  );
}

export function AlertDialogAction(props: AlertDialogActionProps) {
  return <AlertDialogCloseButton {...props} fallbackVariant="default" />;
}

/**
 * `outline` by default, so the destructive answer is never the quiet one. Pass
 * `variant` to say otherwise.
 */
export function AlertDialogCancel(props: AlertDialogActionProps) {
  return <AlertDialogCloseButton {...props} fallbackVariant="outline" />;
}
