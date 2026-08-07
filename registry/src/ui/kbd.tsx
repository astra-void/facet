import { fv } from "@facet-ui/react-variants";
import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";
import { TextSlot } from "~/lib/text";
import { type ClassName, cn } from "~/lib/utils";

/**
 * A key cap — `Ctrl`, `⌘`, `E`.
 *
 * `size-fit` with padding rather than a fixed square: a cap has to hold `Ctrl`
 * as readily as `E`, and Roblox will not infer that width for us.
 */
export const kbdVariants = fv(
  "flex-row items-center justify-center size-fit rounded-md border border-border bg-muted px-1.5 py-0.5",
);

/**
 * `font-mono` is a family here, not a weight — Vela resolves it to RobotoMono
 * against `theme.fontFamily`, where the weights resolve against something else
 * entirely. It is the one place in the registry where the mandatory `font-*`
 * (see registry-design.md §4) is picking a typeface on purpose rather than
 * naming a weight to avoid Roblox's LegacyArial default.
 */
export const kbdLabelVariants = fv("text-xs font-mono text-muted-foreground");

export type KbdProps = { className?: ClassName; Text?: string; children?: React.ReactNode } & PassthroughProps<Frame>;

const OWN_PROPS = ["className", "Text", "children"] as const;

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
