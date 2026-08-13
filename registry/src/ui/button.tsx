import { fv, type VariantProps } from "@facet-ui/react-variants";
import {
  composeEvents,
  getPassthroughProps,
  getSlotChild,
  type PassthroughProps,
  React,
  Slot,
  toSlotProps,
} from "@lattice-ui/react-runtime";
import { TextSlot } from "~/lib/text";
import { cn } from "~/lib/utils";

// `w-fit` is load-bearing: padding does not grow a frame on Roblox, so without
// an automatic width this renders zero pixels wide. The `icon*` sizes override it
// with a concrete `size-*`, and the later token wins.
//
// The size names are shadcn's, which means the default one is called `default`
// and not `md`. shadcn's set is eight: four that hug a label and four square ones
// for a lone glyph.
export const buttonVariants = fv(
  "flex-row shrink-0 items-center justify-center gap-2 w-fit rounded-md transition duration-150",
  {
    variants: {
      variant: {
        default: "bg-primary hover:bg-primary/90",
        destructive: "bg-destructive hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent",
        secondary: "bg-secondary hover:bg-secondary/80",
        ghost: "hover:bg-accent",
        link: "",
      },
      size: {
        xs: "h-6 gap-1 px-2",
        sm: "h-8 gap-1.5 px-3",
        default: "h-9 px-4 py-2",
        lg: "h-10 px-6",
        icon: "size-9",
        "icon-xs": "size-6",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// Nothing inherits on Roblox, so the label needs its own recipe rather than
// picking up `text-*` from the button.
//
// Only `xs` changes the type size. shadcn's base is `text-sm` and no size but
// `xs` overrides it — a `lg` button is a taller button, not a bigger typeface.
//
// One token from shadcn is deliberately absent: `hover:text-accent-foreground`
// on `outline` and `ghost`. Vela supports `hover:`, but a Roblox hover fires per
// instance, and the label is a child of the button — so the colour would change
// only while the pointer was over the glyphs themselves, not over the padding
// the background already lit up. A half-working hover is worse than none.
export const buttonLabelVariants = fv("whitespace-nowrap text-sm font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      // shadcn writes a literal `text-white` here. Facet's theme still defines
      // the role Tailwind v4 dropped, and naming it keeps a retheme a config
      // edit. Same call as `badge`'s.
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      link: "text-primary",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      default: "text-sm",
      lg: "text-sm",
      icon: "text-sm",
      "icon-xs": "text-xs",
      "icon-sm": "text-sm",
      "icon-lg": "text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ButtonProps = VariantProps<typeof buttonVariants> & {
  /**
   * The button's label. Drawn as a styled child `textlabel`, not as this
   * instance's `Text` — so it can be sized and coloured independently, and sit
   * alongside an icon passed through `children`.
   */
  Text?: string;
  /** Render the child element instead of a `textbutton`, merging behavior onto it. */
  asChild?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
} & PassthroughProps<TextButton>;

const OWN_PROPS = ["variant", "size", "className", "Text", "asChild", "disabled", "onClick", "children"] as const;

// A bare `textbutton` renders an opaque grey box labelled "Button". Neutralize
// that, then let the recipe and the consumer decide everything visual. `Text` is
// cleared because the label is a child instance, not this instance's property.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function Button(props: ButtonProps) {
  const disabled = props.disabled === true;

  // Vela has no `disabled:` variant — disabled is our state, not the host's —
  // so the dimming is applied here rather than selected by one.
  //
  // It goes *inside* the recipe's className slot, ahead of the consumer's:
  // resolution is last-token-wins, so anything appended after `props.className`
  // is an override the consumer cannot undo. See docs/decisions/class-conflicts.md.
  const className = buttonVariants({
    variant: props.variant,
    size: props.size,
    className: cn(disabled && "opacity-50", props.className),
  });

  const handleActivated = React.useCallback(() => {
    if (disabled) {
      return;
    }
    props.onClick?.();
  }, [disabled, props.onClick]);

  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Event: composeEvents(passthrough.Event, { Activated: handleActivated }),
    Selectable: !disabled,
  };

  const content = (
    <TextSlot
      Text={props.Text}
      // The label states its own fade, and states it as a prop. `opacity-50`
      // cannot cross this boundary in either direction: the button's alpha stops
      // at a component child, and a class on `TextSlot` resolves against a tag
      // the runtime cannot identify, so it drops `TextTransparency` and leaves
      // only a background that was already invisible.
      // See docs/decisions/opacity-does-not-cascade.md.
      TextTransparency={disabled ? 0.5 : 0}
      className={buttonLabelVariants({
        variant: props.variant,
        size: props.size,
      })}
    >
      {props.children}
    </TextSlot>
  );

  if (props.asChild === true) {
    if (getSlotChild(props.children) === undefined) {
      error("[Button] `asChild` requires a child element.");
    }

    // Verified in Studio against a bare `<textbutton>`: the recipe crosses `Slot`
    // whole — background, size, automatic sizing, the hover variant, and the
    // `UICorner`/`UIListLayout`/`UIPadding` re-parented under the child.
    //
    // The label does not come with it. `TextSlot` never renders on this path, so
    // the child draws its own text at Roblox's 8px near-black default unless the
    // consumer styles it. `buttonLabelVariants` is exported for that.
    return (
      <Slot className={className} {...toSlotProps(passthrough)} {...behaviorProps}>
        {props.children}
      </Slot>
    );
  }

  return (
    <textbutton className={className} {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps}>
      {content}
    </textbutton>
  );
}
