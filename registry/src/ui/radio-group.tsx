import { fv } from "@facet-ui/react-variants";
import { type RadioGroupOrientation, RadioGroup as RadioGroupPrimitive } from "@lattice-ui/react-radio-group";
import { React, useControllableState } from "@lattice-ui/react-runtime";
import { type ClassName, cn } from "~/lib/utils";

/**
 * The selected value is mirrored here with `useControllableState` — the same
 * hook the primitive uses — because Lattice keeps its context private and an
 * item's border changes with whether it is the checked one. The dot inside
 * needs no mirror at all: `RadioGroup.Indicator` mounts and unmounts it from
 * the primitive's own state.
 *
 * One recipe object rather than four exports: every exported name costs a
 * Luau register once Vela inlines its runtime. See
 * docs/decisions/luau-register-limit.md.
 */
export const radioGroupVariants = {
  // `gap-3` is shadcn's. Its root is a single-column `grid`, which Vela lowers
  // to a `UIGridLayout` with uniform cells — a column of radios is not uniform,
  // so `flex-col` is the shape and the gap is the part that carries over.
  root: fv("flex-col gap-3 w-fit h-fit"),
  item: fv("shrink-0 size-4 rounded-full border border-input shadow-sm transition duration-150"),
  indicator: fv("size-full flex-row items-center justify-center"),
  dot: fv("size-2 rounded-full bg-primary"),
};

const RadioGroupContext = React.createContext<{ value?: string; disabled: boolean } | undefined>(undefined);

export type RadioGroupProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  orientation?: RadioGroupOrientation;
  className?: ClassName;
  children?: React.ReactNode;
};

export type RadioGroupItemProps = {
  value: string;
  disabled?: boolean;
  className?: ClassName;
};

export function RadioGroup(props: RadioGroupProps) {
  const [value, setValue] = useControllableState<string | undefined>({
    value: props.value,
    defaultValue: props.defaultValue,
    onChange: props.onValueChange as (value: string | undefined) => void,
  });

  const disabled = props.disabled === true;
  const contextValue = React.useMemo(() => ({ value, disabled }), [disabled, value]);

  return (
    <RadioGroupPrimitive.Root
      disabled={disabled}
      onValueChange={setValue}
      orientation={props.orientation}
      value={value}
    >
      <RadioGroupContext.Provider value={contextValue}>
        <frame
          className={radioGroupVariants.root({
            className: cn(props.orientation === "horizontal" && "flex-row", props.className),
          })}
          BackgroundTransparency={1}
        >
          {props.children}
        </frame>
      </RadioGroupContext.Provider>
    </RadioGroupPrimitive.Root>
  );
}

export function RadioGroupItem(props: RadioGroupItemProps) {
  const group = React.useContext(RadioGroupContext);
  if (group === undefined) {
    error("[RadioGroupItem] must be rendered inside a RadioGroup.");
  }

  const checked = group.value === props.value;
  const disabled = group.disabled || props.disabled === true;

  return (
    <RadioGroupPrimitive.Item
      className={radioGroupVariants.item({
        className: cn(checked && "border-primary", disabled && "opacity-50", props.className),
      })}
      disabled={props.disabled}
      value={props.value}
    >
      <RadioGroupPrimitive.Indicator className={cn(radioGroupVariants.indicator())}>
        <frame className={cn(radioGroupVariants.dot())} BorderSizePixel={0} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}
