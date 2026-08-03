import { fv, type VariantProps } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";
import { TextSlot } from "~/lib/text";
import { cn } from "~/lib/utils";

export const badgeVariants = fv("flex-row items-center justify-center gap-1 size-fit rounded-full px-2 py-1", {
  variants: {
    variant: {
      default: "bg-primary",
      secondary: "bg-secondary",
      destructive: "bg-destructive",
      outline: "border border-input",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Nothing inherits, so the text colour lives here rather than on the badge.
export const badgeLabelVariants = fv("text-xs font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
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
      <TextSlot text={props.Text} className={badgeLabelVariants({ variant: props.variant })}>
        {props.children}
      </TextSlot>
    </frame>
  );
}
