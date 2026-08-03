import { fv } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";
import { type ClassName, cn } from "~/lib/utils";

/**
 * Flat named exports rather than a `Card.Header` namespace: this is source you
 * paste and edit, and each part should read — and be deletable — on its own.
 *
 * Every part is `w-full` with `AutomaticSize.Y`. That is the whole layout
 * strategy: width comes from the parent, height from the content, all the way
 * down. Break the chain at any level — a part with no resolved height — and the
 * card above it collapses.
 */
export const cardVariants = fv("flex-col w-full rounded-lg border border-border bg-card");
export const cardHeaderVariants = fv("flex-col w-full gap-1 p-6");
export const cardTitleVariants = fv("w-full text-lg font-semibold text-card-foreground");
export const cardDescriptionVariants = fv("w-full text-sm text-muted-foreground");
export const cardContentVariants = fv("flex-col w-full gap-2 px-6 pb-6");
export const cardFooterVariants = fv("flex-row items-center w-full gap-2 px-6 pb-6");

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

// Wrapping and alignment are set as instance props rather than classes: Roblox
// centres text by default, and a card's copy has to wrap inside a fixed width.
const TEXT_PROPS = {
  ...NEUTRAL_PROPS,
  TextWrapped: true,
  TextXAlignment: Enum.TextXAlignment.Left,
};

const FRAME_OWN_PROPS = ["className", "children"] as const;
const TEXT_OWN_PROPS = ["className", "Text"] as const;

export type CardProps = { className?: ClassName; children?: React.ReactNode } & PassthroughProps<Frame>;
export type CardTextProps = { className?: ClassName; Text?: string } & PassthroughProps<TextLabel>;

export function Card(props: CardProps) {
  return (
    <frame
      className={cn(cardVariants({ className: props.className }))}
      {...NEUTRAL_PROPS}
      AutomaticSize={Enum.AutomaticSize.Y}
      {...getPassthroughProps<Frame>(props, FRAME_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function CardHeader(props: CardProps) {
  return (
    <frame
      className={cn(cardHeaderVariants({ className: props.className }))}
      {...NEUTRAL_PROPS}
      AutomaticSize={Enum.AutomaticSize.Y}
      {...getPassthroughProps<Frame>(props, FRAME_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function CardTitle(props: CardTextProps) {
  return (
    <textlabel
      className={cn(cardTitleVariants({ className: props.className }))}
      Text={props.Text ?? ""}
      {...TEXT_PROPS}
      AutomaticSize={Enum.AutomaticSize.Y}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}

export function CardDescription(props: CardTextProps) {
  return (
    <textlabel
      className={cn(cardDescriptionVariants({ className: props.className }))}
      Text={props.Text ?? ""}
      {...TEXT_PROPS}
      AutomaticSize={Enum.AutomaticSize.Y}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}

export function CardContent(props: CardProps) {
  return (
    <frame
      className={cn(cardContentVariants({ className: props.className }))}
      {...NEUTRAL_PROPS}
      AutomaticSize={Enum.AutomaticSize.Y}
      {...getPassthroughProps<Frame>(props, FRAME_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function CardFooter(props: CardProps) {
  return (
    <frame
      className={cn(cardFooterVariants({ className: props.className }))}
      {...NEUTRAL_PROPS}
      AutomaticSize={Enum.AutomaticSize.Y}
      {...getPassthroughProps<Frame>(props, FRAME_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}
