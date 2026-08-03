import { fv, type VariantProps } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";
import { cn } from "~/lib/utils";

export const labelVariants = fv("text-foreground text-sm font-medium");

export type LabelProps = VariantProps<typeof labelVariants> & {
  Text?: string;
} & PassthroughProps<TextLabel>;

const OWN_PROPS = ["className", "Text"] as const;

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

/**
 * A leaf, so it draws its own `Text` rather than delegating to `TextSlot` —
 * there is nothing to compose around.
 */
export function Label(props: LabelProps) {
  const passthrough = getPassthroughProps<TextLabel>(props, OWN_PROPS);

  return (
    <textlabel
      className={cn(labelVariants({ className: props.className }))}
      Text={props.Text ?? ""}
      {...NEUTRAL_PROPS}
      AutomaticSize={Enum.AutomaticSize.XY}
      {...passthrough}
    />
  );
}
