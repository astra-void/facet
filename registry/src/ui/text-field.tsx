import { fv } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React, toSlotProps } from "@lattice-ui/react-runtime";
import { TextField as TextFieldPrimitive } from "@lattice-ui/react-text-field";
import { type ClassName, cn } from "~/lib/utils";

/**
 * A `textbox` draws its own text, so unlike a button there is no second label
 * recipe here — the text classes sit on the input itself, and `font-normal` is
 * load-bearing: without a `font-*` the box renders in LegacyArial, not in the
 * theme's typeface.
 *
 * `invalid` and `disabled` are visual states of the input but props of the
 * root, because Lattice's context is what carries them to the behavior; the
 * input takes them again for its own border and fade since nothing inherits.
 *
 * One recipe object rather than five exports: every exported name costs a
 * Luau register once Vela inlines its runtime. See
 * docs/decisions/luau-register-limit.md.
 */
export const textFieldVariants = {
  root: fv("flex-col gap-2 w-full h-fit"),
  input: fv(
    "h-9 w-full rounded-md border border-input px-3 text-left text-sm font-normal text-foreground placeholder-muted-foreground focus:border-ring",
  ),
  label: fv("w-full h-fit text-left text-sm font-medium text-foreground"),
  description: fv("w-full h-fit whitespace-normal text-left text-xs font-normal text-muted-foreground"),
  message: fv("w-full h-fit whitespace-normal text-left text-xs font-medium text-destructive"),
};

export type TextFieldProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fires when the box loses focus, with the text as it stands. */
  onValueCommit?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type TextFieldInputProps = {
  disabled?: boolean;
  invalid?: boolean;
  className?: ClassName;
} & PassthroughProps<TextBox>;

export type TextFieldTextProps = { Text?: string; className?: ClassName } & PassthroughProps<TextLabel>;
export type TextFieldLabelProps = { Text?: string; className?: ClassName } & PassthroughProps<TextButton>;

// The forwarded bag is widened by `toSlotProps` and then has `children`
// dropped from its *type*: these parts type `children` as a single element
// (what `asChild` merges onto), and the bag never actually carries one —
// `children` is listed as an own prop — so only the type needs narrowing.
function forwardProps(props: object, ownKeys: readonly string[]): { key?: React.Key } & { [index: string]: unknown } {
  return toSlotProps(getPassthroughProps(props, ownKeys));
}

const ROOT_OWN_PROPS = [
  "value",
  "defaultValue",
  "onValueChange",
  "onValueCommit",
  "disabled",
  "readOnly",
  "invalid",
  "className",
  "children",
] as const;
const INPUT_OWN_PROPS = ["disabled", "invalid", "className", "children"] as const;
const TEXT_OWN_PROPS = ["Text", "className", "children"] as const;

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export function TextField(props: TextFieldProps) {
  return (
    <TextFieldPrimitive.Root
      defaultValue={props.defaultValue}
      disabled={props.disabled}
      invalid={props.invalid}
      onValueChange={props.onValueChange}
      onValueCommit={props.onValueCommit}
      readOnly={props.readOnly}
      value={props.value}
    >
      <frame
        className={cn(textFieldVariants.root({ className: props.className }))}
        {...NEUTRAL_PROPS}
        {...getPassthroughProps<Frame>(props, ROOT_OWN_PROPS)}
      >
        {props.children}
      </frame>
    </TextFieldPrimitive.Root>
  );
}

export function TextFieldInput(props: TextFieldInputProps) {
  const disabled = props.disabled === true;

  return (
    <TextFieldPrimitive.Input
      className={textFieldVariants.input({
        className: cn(props.invalid === true && "border-destructive", disabled && "opacity-50", props.className),
      })}
      disabled={props.disabled}
      {...forwardProps(props, INPUT_OWN_PROPS)}
    />
  );
}

export function TextFieldLabel(props: TextFieldLabelProps) {
  return (
    <TextFieldPrimitive.Label
      className={cn(textFieldVariants.label({ className: props.className }))}
      Text={props.Text ?? ""}
      {...forwardProps(props, TEXT_OWN_PROPS)}
    />
  );
}

export function TextFieldDescription(props: TextFieldTextProps) {
  return (
    <TextFieldPrimitive.Description
      className={cn(textFieldVariants.description({ className: props.className }))}
      Text={props.Text ?? ""}
      {...forwardProps(props, TEXT_OWN_PROPS)}
    />
  );
}

export function TextFieldMessage(props: TextFieldTextProps) {
  return (
    <TextFieldPrimitive.Message
      className={cn(textFieldVariants.message({ className: props.className }))}
      Text={props.Text ?? ""}
      {...forwardProps(props, TEXT_OWN_PROPS)}
    />
  );
}
