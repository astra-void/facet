import { fv } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";
import { type ClassName, cn } from "~/lib/utils";

/**
 * Flat named exports rather than a `Card.Header` namespace: this is source you
 * paste and edit, and each part should read — and be deletable — on its own.
 *
 * Every part is `w-full h-fit`. That is the whole layout strategy: width comes
 * from the parent, height from the content, all the way down. Break the chain at
 * any level — a part with no resolved height — and the card above it collapses.
 *
 * `font-normal` on the description is not redundant: Vela leaves `FontFace`
 * alone when no `font-*` token appears, and Roblox's untouched default is
 * LegacyArial — a different typeface at a visibly different size from the
 * SourceSansPro every other label here resolves to.
 *
 * shadcn has a seventh part, `CardAction`, and this file does not. It is placed
 * entirely by grid — `col-start-2 row-span-2 justify-self-end` inside a header
 * that is a two-column grid — and Vela lowers `grid` to a `UIGridLayout` with
 * uniform cells, which cannot express any of those three. A part that cannot
 * position itself is worse than no part; put the action in the header and give
 * it `self-end`.
 */
/**
 * One object rather than six exported recipes, and it is not a style choice:
 * Vela inlines its whole runtime into every file with a computed `className`,
 * which leaves a component only a slice of Luau's 200-register limit for its own
 * module-scope locals. Six separate `export const`s put this file over it and
 * the module stopped loading entirely — "Out of local registers when trying to
 * allocate CardHeader". Each exported name costs a register; one object costs
 * one. See docs/decisions/luau-register-limit.md.
 */
export const cardVariants = {
  // The padding is split the way shadcn splits it, and the split is the point:
  // the vertical padding is the card's (`py-6`), the horizontal is each part's
  // (`px-6`). That is what lets a part run edge to edge — a full-bleed image in
  // `CardContent` — by dropping one class instead of unpicking the card's.
  root: fv("flex-col w-full h-fit gap-6 rounded-xl border border-border bg-card py-6 shadow"),
  header: fv("flex-col w-full h-fit gap-2 px-6"),
  // `text-base` is the browser's inherited body size restated; shadcn's title
  // sets weight and leading only. It is not `text-xl`.
  title: fv("w-full h-fit whitespace-normal leading-none text-left text-base font-semibold text-card-foreground"),
  description: fv("w-full h-fit whitespace-normal leading-tight text-left text-sm font-normal text-muted-foreground"),
  content: fv("flex-col w-full h-fit px-6"),
  footer: fv("flex-row items-center w-full h-fit px-6"),
};

// Wrapping and alignment are classes: Roblox centres text and leaves it on one
// line by default, so `text-left` and `whitespace-normal` correct both. Text and
// frame parts share these, so one table serves both.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

const FRAME_OWN_PROPS = ["className", "children"] as const;
const TEXT_OWN_PROPS = ["className", "Text"] as const;

export type CardProps = { className?: ClassName; children?: React.ReactNode } & PassthroughProps<Frame>;
export type CardTextProps = { className?: ClassName; Text?: string } & PassthroughProps<TextLabel>;

export function Card(props: CardProps) {
  return (
    <frame
      className={cn(cardVariants.root({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, FRAME_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function CardHeader(props: CardProps) {
  return (
    <frame
      className={cn(cardVariants.header({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, FRAME_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function CardTitle(props: CardTextProps) {
  return (
    <textlabel
      className={cn(cardVariants.title({ className: props.className }))}
      Text={props.Text ?? ""}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}

export function CardDescription(props: CardTextProps) {
  return (
    <textlabel
      className={cn(cardVariants.description({ className: props.className }))}
      Text={props.Text ?? ""}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<TextLabel>(props, TEXT_OWN_PROPS)}
    />
  );
}

export function CardContent(props: CardProps) {
  return (
    <frame
      className={cn(cardVariants.content({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, FRAME_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}

export function CardFooter(props: CardProps) {
  return (
    <frame
      className={cn(cardVariants.footer({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, FRAME_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}
