import { fv } from "@facet-ui/react-variants";
import { Progress as ProgressPrimitive } from "@lattice-ui/react-progress";
import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";
import { type ClassName, cn } from "~/lib/utils";

/**
 * Lattice's `Progress.Root` renders no instance — it only turns `value`/`max`
 * into a ratio — so the track is drawn here. The indicator's width *is* that
 * ratio: motion owns its `Size`, animates it as the value moves, and sweeps it
 * back and forth when `indeterminate`. This file only says what both look like.
 */
export const progressVariants = {
  root: fv("h-2 w-full rounded-full bg-secondary overflow-hidden"),
  indicator: fv("rounded-full bg-primary"),
};

export type ProgressProps = {
  value?: number;
  max?: number;
  /** Sweep the indicator instead of mapping `value` — for work with no known end. */
  indeterminate?: boolean;
  className?: ClassName;
} & PassthroughProps<Frame>;

const OWN_PROPS = ["value", "max", "indeterminate", "className"] as const;

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export function Progress(props: ProgressProps) {
  return (
    <ProgressPrimitive.Root indeterminate={props.indeterminate} max={props.max} value={props.value}>
      <frame
        className={cn(progressVariants.root({ className: props.className }))}
        {...NEUTRAL_PROPS}
        {...getPassthroughProps<Frame>(props, OWN_PROPS)}
      >
        <ProgressPrimitive.Indicator className={cn(progressVariants.indicator())} />
      </frame>
    </ProgressPrimitive.Root>
  );
}
