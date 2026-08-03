import { getPassthroughProps, type PassthroughProps, React } from "@lattice-ui/react-runtime";

export type TextSlotProps = {
  /** The label to draw. When absent, `children` is rendered instead. */
  text?: string;
  children?: React.ReactNode;
} & PassthroughProps<TextLabel>;

const OWN_PROPS = ["text", "children"] as const;

/**
 * Draws `text` as a styled `textlabel`, or renders `children` when there is none.
 *
 * Text arrives as a prop rather than as children because roblox-ts React's
 * `ReactNode` has no string member — host instances draw text from a `Text`
 * property, so `<Button>Save</Button>` is a `TS2747` no matter what the
 * component declares. The label is still a child *instance*, which is what lets
 * it be sized and coloured independently and sit beside an icon.
 *
 * There is deliberately no `className` prop. Vela lowers `className` at the call
 * site — `<TextSlot className={...}>` becomes a runtime host whose resolved
 * `TextColor3` / `TextSize` / `FontFace` arrive here as ordinary props — so this
 * only has to forward them. Accepting `className` and re-applying it inside
 * drops them on the floor instead, which is what put every button label on
 * Roblox's 8px near-black default.
 *
 * `size-fit` is not decoration: a label with no resolved size collapses its
 * parent's automatic sizing along with it.
 */
export function TextSlot(props: TextSlotProps) {
  if (props.text === undefined) {
    return <>{props.children}</>;
  }

  return (
    <textlabel
      className="size-fit"
      Text={props.text}
      BackgroundTransparency={1}
      BorderSizePixel={0}
      {...getPassthroughProps<TextLabel>(props, OWN_PROPS)}
    />
  );
}
