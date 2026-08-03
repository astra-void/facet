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
// an automatic width this renders zero pixels wide. The `icon` size overrides it
// with a concrete `w-9`, and the later token wins.
export const buttonVariants = fv(
  "flex-row items-center justify-center gap-2 w-fit rounded-md transition duration-150",
  {
    variants: {
      variant: {
        default: "bg-primary hover:bg-primary/90",
        destructive: "bg-destructive hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary hover:bg-secondary/80",
        ghost: "hover:bg-accent",
        link: "",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-9 px-4",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

// Nothing inherits on Roblox, so the label needs its own recipe rather than
// picking up `text-*` from the button.
export const buttonLabelVariants = fv("font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      link: "text-primary",
    },
    size: {
      sm: "text-sm",
      md: "text-sm",
      lg: "text-base",
      icon: "text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
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
  // and no `opacity-*` on the runtime class path either, so the dimming has to
  // come from colour tokens rather than transparency.
  const className = cn(
    buttonVariants({
      variant: props.variant,
      size: props.size,
      className: props.className,
    }),
    disabled && "bg-muted",
  );

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
      text={props.Text}
      className={cn(
        buttonLabelVariants({ variant: props.variant, size: props.size }),
        disabled && "text-muted-foreground",
      )}
    >
      {props.children}
    </TextSlot>
  );

  if (props.asChild === true) {
    if (getSlotChild(props.children) === undefined) {
      error("[Button] `asChild` requires a child element.");
    }

    // UNVERIFIED: whether Vela lowers `className` on `Slot` the way it does on a
    // host element, and whether the lowered props survive Slot's merge onto the
    // child. Confirm in the playground before shipping any `asChild` component.
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
