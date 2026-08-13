import { fv } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";
import { TextSlot } from "~/lib/text";
import { type ClassName, cn } from "~/lib/utils";

/**
 * A key cap — `Ctrl`, `⌘`, `E`.
 *
 * Fixed height, fitted width, and a floor under the width: `h-5 w-fit min-w-5`
 * is shadcn's, and it is what makes `E` a square and `Backspace` a lozenge from
 * the same recipe. Vela lowers `min-w-5` onto a `UISizeConstraint`.
 *
 * No border. shadcn's cap is a filled `bg-muted` block and nothing more — the
 * outline this file used to draw was an invention.
 */
export const kbdVariants = fv(
  "flex-row items-center justify-center gap-1 w-fit h-5 min-w-5 rounded-sm bg-muted px-1 pointer-events-none",
);

/**
 * `font-sans` is a family, not a weight — Vela resolves it to SourceSansPro
 * against `theme.fontFamily`, where the weights resolve against something else
 * entirely. shadcn names it explicitly here because a `<kbd>` element is
 * monospace by user-agent default and the cap is not meant to be; Roblox has no
 * such default, so the token is carried over for the meaning rather than the
 * correction.
 */
export const kbdLabelVariants = fv("whitespace-nowrap text-xs font-sans font-medium text-muted-foreground");

/** A run of caps read as one shortcut — `Ctrl` `Shift` `P`. */
export const kbdGroupVariants = fv("flex-row items-center gap-1 size-fit");

export type KbdProps = { className?: ClassName; Text?: string; children?: React.ReactNode } & PassthroughProps<Frame>;

export type KbdGroupProps = { className?: ClassName; children?: React.ReactNode } & PassthroughProps<Frame>;

const OWN_PROPS = ["className", "Text", "children"] as const;
const GROUP_OWN_PROPS = ["className", "children"] as const;

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

export function Kbd(props: KbdProps) {
  return (
    <frame
      className={cn(kbdVariants({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, OWN_PROPS)}
    >
      <TextSlot Text={props.Text} className={kbdLabelVariants()}>
        {props.children}
      </TextSlot>
    </frame>
  );
}

export function KbdGroup(props: KbdGroupProps) {
  return (
    <frame
      className={cn(kbdGroupVariants({ className: props.className }))}
      {...NEUTRAL_PROPS}
      {...getPassthroughProps<Frame>(props, GROUP_OWN_PROPS)}
    >
      {props.children}
    </frame>
  );
}
