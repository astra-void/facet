import { fv } from "@facet-ui/react-variants";
import { Checkbox as CheckboxPrimitive, type CheckedState } from "@lattice-ui/react-checkbox";
import {
  getPassthroughProps,
  type PassthroughProps,
  React,
  toSlotProps,
  useControllableState,
} from "@lattice-ui/react-runtime";
import { type ClassName, cn } from "~/lib/utils";

/**
 * The checked state is mirrored here with `useControllableState` — the same
 * hook the primitive uses — because Lattice keeps its context private and the
 * box's border and fill change with it. The primitive is then driven controlled,
 * so there is exactly one copy of the state and it lives in this file.
 *
 * One recipe object rather than three exports: every exported name costs a
 * Luau register once Vela inlines its runtime. See
 * docs/decisions/luau-register-limit.md.
 */
export const checkboxVariants = {
  // `rounded-sm` is shadcn's `rounded-[4px]` by another name — both are 4px.
  root: fv("shrink-0 size-4 rounded-sm border border-input shadow-sm transition duration-150"),
  indicator: fv("size-full flex-row items-center justify-center"),
  // The glyph is a text instance of its own, and nothing inherits: without a
  // `font-*` it would render in LegacyArial, not in the theme's typeface.
  glyph: fv("size-fit text-xs font-bold text-primary-foreground text-center"),
};

export type CheckboxProps = {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: CheckedState) => void;
  disabled?: boolean;
  className?: ClassName;
} & PassthroughProps<TextButton>;

const OWN_PROPS = ["checked", "defaultChecked", "onCheckedChange", "disabled", "className"] as const;

export function Checkbox(props: CheckboxProps) {
  const [checked, setChecked] = useControllableState<CheckedState>({
    value: props.checked,
    defaultValue: props.defaultChecked ?? false,
    onChange: props.onCheckedChange,
  });

  const disabled = props.disabled === true;

  // State classes sit inside the recipe's className slot, ahead of the
  // consumer's: resolution is last-token-wins, so anything appended after
  // `props.className` would be an override the consumer cannot undo.
  const className = checkboxVariants.root({
    className: cn(checked !== false && "border-primary bg-primary", disabled && "opacity-50", props.className),
  });

  return (
    <CheckboxPrimitive.Root
      checked={checked}
      className={className}
      disabled={disabled}
      onCheckedChange={setChecked}
      {...toSlotProps(getPassthroughProps<TextButton>(props, OWN_PROPS))}
    >
      <CheckboxPrimitive.Indicator className={cn(checkboxVariants.indicator())}>
        {/* An icon font does not exist on Roblox, so the mark is a text glyph —
            replace this label to use your own artwork. */}
        <textlabel
          className={cn(checkboxVariants.glyph())}
          Text={checked === "indeterminate" ? "–" : "✓"}
          BackgroundTransparency={1}
          BorderSizePixel={0}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
