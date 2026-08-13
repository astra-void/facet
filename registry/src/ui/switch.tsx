import { fv } from "@facet-ui/react-variants";
import {
  getPassthroughProps,
  type PassthroughProps,
  React,
  toSlotProps,
  useControllableState,
} from "@lattice-ui/react-runtime";
import { Switch as SwitchPrimitive } from "@lattice-ui/react-switch";
import { type ClassName, cn } from "~/lib/utils";

/**
 * The checked state is mirrored here with `useControllableState` — the same
 * hook the primitive uses — because Lattice keeps its context private and the
 * track's colour changes with it. The primitive is then driven controlled, so
 * there is exactly one copy of the state and it lives in this file.
 *
 * The thumb's travel is not styled here at all: Lattice's `Switch.Thumb` owns
 * `AnchorPoint` and `Position` and animates them between the track's edges for
 * any thumb size. This file only says what the thumb looks like.
 */
export const switchVariants = {
  // shadcn's track is `h-[1.15rem] w-8` — 18.4 by 32. `h-4.5` is 18, the nearest
  // step Vela has, and the half-pixel is not one Roblox could draw anyway.
  //
  // Not carried over: shadcn's `border border-transparent`. There it keeps an
  // unfocused switch the same size as a focused one under `box-sizing`; Vela
  // lowers a border onto a `UIStroke` drawn *on* the border, which changes no
  // size, so the token would buy an instance and nothing else.
  root: fv("h-4.5 w-8 rounded-full shadow-sm transition duration-150"),
  thumb: fv("size-4 rounded-full bg-background"),
};

export type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: ClassName;
} & PassthroughProps<TextButton>;

const OWN_PROPS = ["checked", "defaultChecked", "onCheckedChange", "disabled", "className"] as const;

export function Switch(props: SwitchProps) {
  const [checked, setChecked] = useControllableState<boolean>({
    value: props.checked,
    defaultValue: props.defaultChecked ?? false,
    onChange: props.onCheckedChange,
  });

  const disabled = props.disabled === true;

  // State classes sit inside the recipe's className slot, ahead of the
  // consumer's: resolution is last-token-wins, so anything appended after
  // `props.className` would be an override the consumer cannot undo.
  const className = switchVariants.root({
    className: cn(checked ? "bg-primary" : "bg-input", disabled && "opacity-50", props.className),
  });

  return (
    <SwitchPrimitive.Root
      checked={checked}
      className={className}
      disabled={disabled}
      onCheckedChange={setChecked}
      {...toSlotProps(getPassthroughProps<TextButton>(props, OWN_PROPS))}
    >
      <SwitchPrimitive.Thumb className={cn(switchVariants.thumb())} />
    </SwitchPrimitive.Root>
  );
}
