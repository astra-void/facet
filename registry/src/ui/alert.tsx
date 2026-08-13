import { fv, type VariantProps } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";
import { type ClassName, cn } from "~/lib/utils";

/**
 * One object rather than three exported recipes: every exported name costs a
 * Luau register, and Vela inlines its runtime into any file with a computed
 * `className`, leaving a component only a slice of the 200 available. `card`
 * stopped loading entirely over exactly this — see
 * docs/decisions/luau-register-limit.md.
 *
 * `w-full h-fit` all the way down, like `card`: width from the parent, height
 * from the content, and any part that fails to resolve a height collapses the
 * alert above it.
 */
export const alertVariants = {
  // `px-4 py-3` and `gap-y-0.5` are shadcn's, to the pixel. What is not shadcn's
  // is `flex-col`: the original is a two-column grid whose empty first column
  // reserves room for an icon, and Vela's `grid` lowers to a `UIGridLayout` with
  // uniform cells — it cannot express `grid-cols-[0_1fr]`. A column is the
  // honest shape for a component that has no icon slot here.
  root: fv("flex-col w-full h-fit gap-0.5 rounded-lg border border-border px-4 py-3", {
    variants: {
      variant: {
        default: "bg-card",
        // shadcn's destructive alert keeps the default border and recolours the
        // text only. It looked like an oversight and is not one: the variant is
        // `bg-card text-destructive`.
        destructive: "bg-card",
      },
    },
    defaultVariants: { variant: "default" },
  }),
  // `text-sm` on both parts is the root's `text-sm` restated: shadcn sets it
  // once on the root and lets it cascade, and nothing cascades here.
  title: fv("w-full h-fit whitespace-normal text-left text-sm font-medium", {
    variants: {
      variant: {
        default: "text-card-foreground",
        destructive: "text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  }),
  description: fv("w-full h-fit whitespace-normal leading-tight text-left text-sm font-normal", {
    variants: {
      variant: {
        default: "text-muted-foreground",
        // shadcn dims this one against the title: `text-destructive/90`.
        destructive: "text-destructive/90",
      },
    },
    defaultVariants: { variant: "default" },
  }),
};

/**
 * Each part takes its own `variant`, which is the thing to notice if you are
 * coming from shadcn. There it is set once on the root and a descendant
 * selector colours the title; here nothing inherits, so `variant` has to reach
 * every part that draws something:
 *
 * ```tsx
 * <Alert variant="destructive">
 *   <AlertTitle variant="destructive" Text="Kicked" />
 *   <AlertDescription variant="destructive" Text="You were removed from the server." />
 * </Alert>
 * ```
 *
 * Verbose on purpose. The alternative is a context, and a context is a thing
 * the consumer then owns and has to keep wired up through their own edits — for
 * a component whose whole body is three instances.
 */
export type AlertProps = VariantProps<typeof alertVariants.root> & {
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type AlertTextProps = VariantProps<typeof alertVariants.title> & {
  className?: ClassName;
  Text?: string;
} & PassthroughProps<TextLabel>;

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

const FRAME_OWN_PROPS = ["variant", "className", "children"] as const;
const TEXT_OWN_PROPS = ["variant", "className", "Text"] as const;

export function Alert(props: AlertProps) {
  return (
    <frame
      className={cn(alertVariants.root({ variant: props.variant, className: props.className }))}
      // The border is the alert's own surface, so this one keeps its background
      // and only drops Roblox's 1px border.
      BorderSizePixel={0}
      {...getPassthroughProps<Frame>(props, FRAME_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function AlertTitle(props: AlertTextProps) {
  return (
    <textlabel
      className={cn(alertVariants.title({ variant: props.variant, className: props.className }))}
      Text={props.Text ?? ""}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}

export function AlertDescription(props: AlertTextProps) {
  return (
    <textlabel
      className={cn(alertVariants.description({ variant: props.variant, className: props.className }))}
      Text={props.Text ?? ""}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}
