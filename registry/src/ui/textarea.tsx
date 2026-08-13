import { fv } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React, toSlotProps } from "@lattice-ui/react-runtime";
import { Textarea as TextareaPrimitive } from "@lattice-ui/react-textarea";
import { type ClassName, cn } from "~/lib/utils";

/**
 * The input recipe declares only `w-full` — no height, which everywhere else
 * would collapse the frame. Here it is deliberate: Lattice's `Textarea.Input`
 * owns `Size.Y`, growing it line by line between `minRows` and `maxRows` as the
 * text wraps. Declaring a height class would just be overwritten on the next
 * keystroke.
 *
 * One recipe object rather than four exports: every exported name costs a
 * Luau register once Vela inlines its runtime. See
 * docs/decisions/luau-register-limit.md.
 */
export const textareaVariants = {
  root: fv("flex-col gap-2 w-full h-fit"),
  input: fv(
    "w-full min-h-16 rounded-md border border-input shadow-sm px-3 py-2 text-left text-sm font-normal text-foreground placeholder-muted-foreground focus:border-ring",
  ),
  label: fv("w-full h-fit text-left text-sm font-medium text-foreground"),
  description: fv("w-full h-fit whitespace-normal leading-normal text-left text-sm font-normal text-muted-foreground"),
};

export type TextareaProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fires when the box loses focus, with the text as it stands. */
  onValueCommit?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  /** Grow with the text. On by default; the box then sizes between `minRows` and `maxRows`. */
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type TextareaInputProps = {
  disabled?: boolean;
  invalid?: boolean;
  className?: ClassName;
} & PassthroughProps<TextBox>;

export type TextareaTextProps = { Text?: string; className?: ClassName } & PassthroughProps<TextLabel>;
export type TextareaLabelProps = { Text?: string; className?: ClassName } & PassthroughProps<TextButton>;

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
  "autoResize",
  "minRows",
  "maxRows",
  "className",
  "children",
] as const;
const INPUT_OWN_PROPS = ["disabled", "invalid", "className", "children"] as const;
const TEXT_OWN_PROPS = ["Text", "className", "children"] as const;

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export function Textarea(props: TextareaProps) {
  return (
    <TextareaPrimitive.Root
      autoResize={props.autoResize}
      defaultValue={props.defaultValue}
      disabled={props.disabled}
      invalid={props.invalid}
      maxRows={props.maxRows}
      minRows={props.minRows}
      onValueChange={props.onValueChange}
      onValueCommit={props.onValueCommit}
      readOnly={props.readOnly}
      value={props.value}
    >
      <frame
        className={cn(textareaVariants.root({ className: props.className }))}
        {...NEUTRAL_PROPS}
        {...getPassthroughProps<Frame>(props, ROOT_OWN_PROPS)}
      >
        {props.children}
      </frame>
    </TextareaPrimitive.Root>
  );
}

export function TextareaInput(props: TextareaInputProps) {
  const disabled = props.disabled === true;

  return (
    <TextareaPrimitive.Input
      className={textareaVariants.input({
        className: cn(props.invalid === true && "border-destructive", disabled && "opacity-50", props.className),
      })}
      disabled={props.disabled}
      {...forwardProps(props, INPUT_OWN_PROPS)}
    />
  );
}

export function TextareaLabel(props: TextareaLabelProps) {
  return (
    <TextareaPrimitive.Label
      className={cn(textareaVariants.label({ className: props.className }))}
      Text={props.Text ?? ""}
      {...forwardProps(props, TEXT_OWN_PROPS)}
    />
  );
}

export function TextareaDescription(props: TextareaTextProps) {
  return (
    <TextareaPrimitive.Description
      className={cn(textareaVariants.description({ className: props.className }))}
      Text={props.Text ?? ""}
      {...forwardProps(props, TEXT_OWN_PROPS)}
    />
  );
}
