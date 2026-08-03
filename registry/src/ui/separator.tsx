import { fv, type VariantProps } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";
import { cn } from "~/lib/utils";

// Both axes are concrete on each orientation, so this needs no `AutomaticSize`.
// `h-px` is one pixel, not a spacing step.
export const separatorVariants = fv("bg-border", {
  variants: {
    orientation: {
      horizontal: "w-full h-px",
      vertical: "h-full w-px",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export type SeparatorProps = VariantProps<typeof separatorVariants> & PassthroughProps<Frame>;

const OWN_PROPS = ["orientation", "className"] as const;

// No `BackgroundTransparency: 1` here — unlike every other component, the
// background *is* the separator.
const NEUTRAL_PROPS = {
  BorderSizePixel: 0,
};

export function Separator(props: SeparatorProps) {
  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);

  return (
    <frame
      className={cn(
        separatorVariants({
          orientation: props.orientation,
          className: props.className,
        }),
      )}
      {...NEUTRAL_PROPS}
      {...passthrough}
    />
  );
}
