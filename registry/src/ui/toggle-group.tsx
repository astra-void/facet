import { fv } from "@facet-ui/react-variants";
import {
  getPassthroughProps,
  type PassthroughProps,
  React,
  toSlotProps,
  useControllableState,
} from "@lattice-ui/react-runtime";
import { ToggleGroup as ToggleGroupPrimitive } from "@lattice-ui/react-toggle-group";
import { TextSlot } from "~/lib/text";
import { type ClassName, cn } from "~/lib/utils";

/**
 * The group's value is mirrored here with `useControllableState` — the same
 * hook the primitive uses — because Lattice keeps its context private and each
 * item's surface changes with whether it is pressed. The primitive is then
 * driven controlled, so there is exactly one copy of the state, and a Facet
 * context hands each item its answer.
 *
 * One recipe object rather than three exports: every exported name costs a
 * Luau register once Vela inlines its runtime. See
 * docs/decisions/luau-register-limit.md.
 */
export const toggleGroupVariants = {
  root: fv("flex-row items-center gap-1 w-fit h-fit"),
  item: fv(
    "flex-row items-center justify-center gap-2 h-9 w-fit min-w-9 px-2 rounded-md transition duration-150 hover:bg-muted",
  ),
  label: fv("whitespace-nowrap text-sm font-medium text-foreground"),
};

type ToggleGroupContextValue = {
  isPressed: (value: string) => boolean;
  disabled: boolean;
};

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | undefined>(undefined);

export type ToggleGroupProps = {
  /** `single` keeps at most one item pressed; `multiple` lets them accumulate. */
  type: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[] | undefined) => void;
  disabled?: boolean;
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type ToggleGroupItemProps = {
  value: string;
  disabled?: boolean;
  Text?: string;
  className?: ClassName;
  children?: React.ReactNode;
};

const ROOT_OWN_PROPS = ["type", "value", "defaultValue", "onValueChange", "disabled", "className", "children"] as const;

export function ToggleGroup(props: ToggleGroupProps) {
  const [value, setValue] = useControllableState<string | string[] | undefined>({
    value: props.value,
    defaultValue: props.defaultValue,
    onChange: props.onValueChange,
  });

  const disabled = props.disabled === true;

  const isPressed = React.useCallback(
    (itemValue: string) => {
      if (typeIs(value, "table")) {
        return (value as string[]).includes(itemValue);
      }
      return value === itemValue;
    },
    [value],
  );

  const contextValue = React.useMemo(() => ({ isPressed, disabled }), [disabled, isPressed]);

  // `className` is written out as an attribute on both branches rather than
  // tucked into a shared spread: Vela rewrites the call site it can *see*, and
  // a className hidden inside a spread would reach the primitive as a raw prop
  // instead of being resolved.
  //
  // The primitive's props are a discriminated union over `type`, and the
  // mirrored value is the union's width — so one branch per arm keeps the
  // narrowing honest instead of casting across it.
  const className = toggleGroupVariants.root({ className: props.className });
  const passthrough = toSlotProps(getPassthroughProps<Frame>(props, ROOT_OWN_PROPS));

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      {props.type === "multiple" ? (
        <ToggleGroupPrimitive.Root
          className={className}
          type="multiple"
          value={typeIs(value, "table") ? (value as string[]) : []}
          onValueChange={setValue}
          disabled={disabled}
          {...passthrough}
        >
          {props.children}
        </ToggleGroupPrimitive.Root>
      ) : (
        <ToggleGroupPrimitive.Root
          className={className}
          type="single"
          value={typeIs(value, "string") ? value : undefined}
          onValueChange={setValue}
          disabled={disabled}
          {...passthrough}
        >
          {props.children}
        </ToggleGroupPrimitive.Root>
      )}
    </ToggleGroupContext.Provider>
  );
}

export function ToggleGroupItem(props: ToggleGroupItemProps) {
  const group = React.useContext(ToggleGroupContext);
  if (group === undefined) {
    error("[ToggleGroupItem] must be rendered inside a ToggleGroup.");
  }

  const pressed = group.isPressed(props.value);
  const disabled = group.disabled || props.disabled === true;

  return (
    <ToggleGroupPrimitive.Item
      className={toggleGroupVariants.item({
        className: cn(pressed && "bg-accent hover:bg-accent", disabled && "opacity-50", props.className),
      })}
      disabled={props.disabled}
      value={props.value}
    >
      <TextSlot
        Text={props.Text}
        TextTransparency={disabled ? 0.5 : 0}
        className={cn(toggleGroupVariants.label(), pressed && "text-accent-foreground")}
      >
        {props.children}
      </TextSlot>
    </ToggleGroupPrimitive.Item>
  );
}
