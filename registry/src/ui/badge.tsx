import { fv, type VariantProps } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";
import { TextSlot } from "~/lib/text";
import { cn } from "~/lib/utils";

// `border border-transparent` on the base is shadcn's, and it is load-bearing
// here for a different reason than there. shadcn needs it so an outlined badge
// is not a pixel larger than a filled one; a Roblox `UIStroke` is drawn on the
// border and changes no size at all. What it does do is split the stroke in two:
// this line sets its *thickness*, and `outline`'s `border-border` sets only its
// *colour*. Drop the base token and the outline variant colours a stroke that
// was never created.
export const badgeVariants = fv(
  "flex-row items-center justify-center gap-1 size-fit overflow-hidden rounded-full border border-transparent px-2 py-0.5",
  {
    variants: {
      variant: {
        default: "bg-primary",
        secondary: "bg-secondary",
        destructive: "bg-destructive",
        outline: "border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// Nothing inherits, so the text colour lives here rather than on the badge.
// `whitespace-nowrap` is the base's, restated: Roblox wraps nothing by default,
// but `TextSlot` is where the token has to land to reach a `TextLabel`.
export const badgeLabelVariants = fv("whitespace-nowrap text-xs font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      // shadcn writes a literal `text-white` here, and this is the one place
      // this pass does not follow it. Tailwind v4's theme dropped
      // `--destructive-foreground`, so white is what shadcn has left; Facet's
      // theme still defines the role, and it resolves to the same near-white.
      // Naming the role keeps a retheme a config edit, which is the rule a
      // literal colour would break. See AGENTS.md, "Layer boundaries".
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type BadgeProps = VariantProps<typeof badgeVariants> & {
  Text?: string;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

const OWN_PROPS = ["variant", "className", "Text", "children"] as const;

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export function Badge(props: BadgeProps) {
  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);

  return (
    <frame
      className={cn(badgeVariants({ variant: props.variant, className: props.className }))}
      {...NEUTRAL_PROPS}
      {...passthrough}
    >
      <TextSlot Text={props.Text} className={badgeLabelVariants({ variant: props.variant })}>
        {props.children}
      </TextSlot>
    </frame>
  );
}
