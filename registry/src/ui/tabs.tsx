import { fv } from "@facet-ui/react-variants";
import {
  getPassthroughProps,
  type PassthroughProps,
  React,
  toSlotProps,
  useControllableState,
} from "@lattice-ui/react-runtime";
import { Tabs as TabsPrimitive } from "@lattice-ui/react-tabs";
import { TextSlot } from "~/lib/text";
import { type ClassName, cn } from "~/lib/utils";

/**
 * The selected value is mirrored here with `useControllableState` — the same
 * hook the primitive uses — because Lattice keeps its context private and a
 * trigger's surface changes with whether it is the selected one. The primitive
 * is then driven controlled, so there is exactly one copy of the state.
 *
 * Give `Tabs` a `defaultValue`: the mirror cannot see the primitive's own
 * first-enabled-trigger fallback, so without one no trigger styles as selected.
 *
 * One recipe object rather than five exports: every exported name costs a
 * Luau register once Vela inlines its runtime. See
 * docs/decisions/luau-register-limit.md.
 */
export const tabsVariants = {
  root: fv("flex-col gap-2 w-full h-fit"),
  list: fv("flex-row items-center justify-center w-fit h-9 rounded-lg bg-muted p-1"),
  trigger: fv(
    "flex-row items-center justify-center gap-1.5 h-7 w-fit px-2 py-1 rounded-md border border-transparent transition duration-150",
  ),
  triggerLabel: fv("whitespace-nowrap text-sm font-medium text-foreground/60"),
  content: fv("flex-col gap-2 w-full h-fit"),
};

const TabsContext = React.createContext<{ value?: string } | undefined>(undefined);

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type TabsListProps = {
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type TabsTriggerProps = {
  value: string;
  disabled?: boolean;
  Text?: string;
  className?: ClassName;
  children?: React.ReactNode;
};

export type TabsContentProps = {
  value: string;
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

const ROOT_OWN_PROPS = ["value", "defaultValue", "onValueChange", "className", "children"] as const;
const LIST_OWN_PROPS = ["className", "children"] as const;
const CONTENT_OWN_PROPS = ["value", "className", "children"] as const;

export function Tabs(props: TabsProps) {
  const [value, setValue] = useControllableState<string | undefined>({
    value: props.value,
    defaultValue: props.defaultValue,
    onChange: props.onValueChange as (value: string | undefined) => void,
  });

  const contextValue = React.useMemo(() => ({ value }), [value]);

  return (
    <TabsPrimitive.Root onValueChange={setValue} value={value}>
      <TabsContext.Provider value={contextValue}>
        <frame
          className={cn(tabsVariants.root({ className: props.className }))}
          {...NEUTRAL_PROPS}
          {...getPassthroughProps<Frame>(props, ROOT_OWN_PROPS)}
        >
          {props.children}
        </frame>
      </TabsContext.Provider>
    </TabsPrimitive.Root>
  );
}

export function TabsList(props: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(tabsVariants.list({ className: props.className }))}
      {...toSlotProps(getPassthroughProps<Frame>(props, LIST_OWN_PROPS))}
    >
      {props.children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger(props: TabsTriggerProps) {
  const tabs = React.useContext(TabsContext);
  if (tabs === undefined) {
    error("[TabsTrigger] must be rendered inside Tabs.");
  }

  const selected = tabs.value === props.value;
  const disabled = props.disabled === true;

  return (
    <TabsPrimitive.Trigger
      className={tabsVariants.trigger({
        className: cn(selected && "bg-background", disabled && "opacity-50", props.className),
      })}
      disabled={props.disabled}
      value={props.value}
    >
      <TextSlot
        Text={props.Text}
        TextTransparency={disabled ? 0.5 : 0}
        className={cn(tabsVariants.triggerLabel(), selected && "text-foreground")}
      >
        {props.children}
      </TextSlot>
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent(props: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={cn(tabsVariants.content({ className: props.className }))}
      value={props.value}
      {...toSlotProps(getPassthroughProps<Frame>(props, CONTENT_OWN_PROPS))}
    >
      {props.children}
    </TabsPrimitive.Content>
  );
}
