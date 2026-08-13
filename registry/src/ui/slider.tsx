import { fv } from "@facet-ui/react-variants";
import { React } from "@lattice-ui/react-runtime";
import { type SliderOrientation, Slider as SliderPrimitive } from "@lattice-ui/react-slider";
import { type ClassName, cn } from "~/lib/utils";

/**
 * The track deliberately carries no `flex-*`: a `UIListLayout` lays out every
 * child and would override the geometry Lattice owns — the range's fill and the
 * thumb's travel are both `Position`/`Size` on instances inside it. The thumb
 * rides the track directly (its anchor is centred by the primitive), so it
 * overhangs a thinner track the way a slider knob should.
 *
 * One recipe object rather than three exports: every exported name costs a
 * Luau register once Vela inlines its runtime. See
 * docs/decisions/luau-register-limit.md.
 */
export const sliderVariants = {
  track: fv("h-1.5 w-full rounded-full bg-muted"),
  range: fv("rounded-full bg-primary"),
  thumb: fv("shrink-0 size-4 rounded-full border border-primary bg-background shadow"),
};

export type SliderProps = {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Fires once per gesture, when the drag or keypress lets go. */
  onValueCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  orientation?: SliderOrientation;
  disabled?: boolean;
  className?: ClassName;
};

export function Slider(props: SliderProps) {
  const disabled = props.disabled === true;

  return (
    <SliderPrimitive.Root
      defaultValue={props.defaultValue}
      disabled={disabled}
      max={props.max}
      min={props.min}
      onValueChange={props.onValueChange}
      onValueCommit={props.onValueCommit}
      orientation={props.orientation}
      step={props.step}
      value={props.value}
    >
      <SliderPrimitive.Track
        className={sliderVariants.track({ className: cn(disabled && "opacity-50", props.className) })}
      >
        <SliderPrimitive.Range className={cn(sliderVariants.range())} />
        <SliderPrimitive.Thumb className={cn(sliderVariants.thumb(), disabled && "opacity-50")} />
      </SliderPrimitive.Track>
    </SliderPrimitive.Root>
  );
}
