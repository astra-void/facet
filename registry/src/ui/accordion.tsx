import { fv } from "@facet-ui/react-variants";
import { Accordion as AccordionPrimitive, type AccordionType } from "@lattice-ui/react-accordion";
import {
  getPassthroughProps,
  type PassthroughProps,
  React,
  toSlotProps,
  useControllableState,
} from "@lattice-ui/react-runtime";
import { TextSlot } from "~/lib/text";
import { type ClassName, cn } from "~/lib/utils";

/**
 * The open values are mirrored here with `useControllableState` — the same
 * hook the primitive uses — because Lattice keeps its context private and the
 * trigger's chevron flips with its item. The primitive is then driven
 * controlled, so there is exactly one copy of the state; the item hands its
 * own `open` down a second context so the trigger does not need to know the
 * item's value.
 *
 * One recipe object rather than seven exports: every exported name costs a
 * Luau register once Vela inlines its runtime. See
 * docs/decisions/luau-register-limit.md.
 */
export const accordionVariants = {
  // The rule between items is `divide-y` on the root, not `border-b` on the
  // item. A `border-*` class lowers to a `UIStroke`, which outlines the whole
  // instance — Roblox has no per-side stroke, so Vela drops `border-b` and the
  // surviving `border-border` would box every item. `divide-y` interleaves real
  // one-pixel frames between children, and leaves no rule under the last item.
  root: fv("flex-col w-full h-fit divide-y divide-border"),
  item: fv("flex-col w-full h-fit"),
  trigger: fv("flex-row items-center justify-between w-full h-fit py-4"),
  triggerLabel: fv("text-left text-sm font-medium text-foreground"),
  chevron: fv("size-fit text-xs font-normal text-muted-foreground text-center"),
  content: fv("flex-col gap-2 w-full h-fit pb-4"),
  contentText: fv("w-full h-fit whitespace-normal text-left text-sm font-normal text-muted-foreground"),
};

const AccordionContext = React.createContext<{ isOpen: (value: string) => boolean } | undefined>(undefined);
const AccordionItemContext = React.createContext<{ open: boolean } | undefined>(undefined);

export type AccordionProps = {
  /** `single` closes the previous item when the next opens; `multiple` lets them accumulate. */
  type?: AccordionType;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  /** In `single` mode, whether the open item can be clicked closed again. */
  collapsible?: boolean;
  className?: ClassName;
  children?: React.ReactNode;
};

export type AccordionItemProps = {
  value: string;
  disabled?: boolean;
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type AccordionTriggerProps = {
  Text?: string;
  className?: ClassName;
  children?: React.ReactNode;
};

export type AccordionContentProps = {
  Text?: string;
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

const ITEM_OWN_PROPS = ["value", "disabled", "className", "children"] as const;
const CONTENT_OWN_PROPS = ["Text", "className", "children"] as const;

export function Accordion(props: AccordionProps) {
  const [value, setValue] = useControllableState<string | string[] | undefined>({
    value: props.value,
    defaultValue: props.defaultValue,
    onChange: props.onValueChange as (value: string | string[] | undefined) => void,
  });

  const isOpen = React.useCallback(
    (itemValue: string) => {
      if (typeIs(value, "table")) {
        return (value as string[]).includes(itemValue);
      }
      return value === itemValue;
    },
    [value],
  );

  const contextValue = React.useMemo(() => ({ isOpen }), [isOpen]);

  return (
    <AccordionPrimitive.Root
      collapsible={props.collapsible}
      onValueChange={setValue}
      type={props.type}
      value={value ?? (props.type === "multiple" ? [] : "")}
    >
      <AccordionContext.Provider value={contextValue}>
        <frame className={cn(accordionVariants.root({ className: props.className }))} BackgroundTransparency={1}>
          {props.children}
        </frame>
      </AccordionContext.Provider>
    </AccordionPrimitive.Root>
  );
}

export function AccordionItem(props: AccordionItemProps) {
  const accordion = React.useContext(AccordionContext);
  if (accordion === undefined) {
    error("[AccordionItem] must be rendered inside an Accordion.");
  }

  const open = accordion.isOpen(props.value);
  const itemContextValue = React.useMemo(() => ({ open }), [open]);

  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <AccordionPrimitive.Item
        className={cn(accordionVariants.item({ className: props.className }))}
        disabled={props.disabled}
        value={props.value}
        {...toSlotProps(getPassthroughProps<Frame>(props, ITEM_OWN_PROPS))}
      >
        {props.children}
      </AccordionPrimitive.Item>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger(props: AccordionTriggerProps) {
  const item = React.useContext(AccordionItemContext);
  if (item === undefined) {
    error("[AccordionTrigger] must be rendered inside an AccordionItem.");
  }

  // No layout class on the header: `flex-*` would lower to a `uilistlayout`
  // sibling next to its single child, and the primitive types `children` as
  // one element.
  return (
    <AccordionPrimitive.Header className="w-full h-fit">
      <AccordionPrimitive.Trigger className={cn(accordionVariants.trigger({ className: props.className }))}>
        {/* biome-ignore lint/complexity/noUselessFragments: the primitive types
            `children` as a single element (what `asChild` merges onto), so the
            label and the chevron have to arrive as one. */}
        <>
          <TextSlot Text={props.Text} className={cn(accordionVariants.triggerLabel())}>
            {props.children}
          </TextSlot>
          {/* An icon font does not exist on Roblox, so the chevron is a text
              glyph, flipped by rotation — replace it to use your own artwork. */}
          <textlabel
            className={cn(accordionVariants.chevron())}
            Rotation={item.open ? 180 : 0}
            Text="▾"
            BackgroundTransparency={1}
            BorderSizePixel={0}
          />
        </>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent(props: AccordionContentProps) {
  return (
    <AccordionPrimitive.Content
      className={cn(accordionVariants.content({ className: props.className }))}
      {...toSlotProps(getPassthroughProps<Frame>(props, CONTENT_OWN_PROPS))}
    >
      <TextSlot Text={props.Text} className={cn(accordionVariants.contentText())}>
        {props.children}
      </TextSlot>
    </AccordionPrimitive.Content>
  );
}
