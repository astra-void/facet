import { React } from "@lattice-ui/react-runtime";
import { type ClassName, cn } from "~/lib/utils";

export type TextSlotProps = {
  /** The label to draw. When set, `children` is ignored. */
  text?: string;
  className?: ClassName;
  children?: React.ReactNode;
};

/**
 * Draws `text` as a styled `textlabel`, or renders `children` when there is none.
 *
 * Text arrives as a prop rather than as children because roblox-ts React's
 * `ReactNode` has no string member — host instances draw text from a `Text`
 * property, so TypeScript rejects `<Button>Save</Button>` outright (TS2747).
 * The label is still a child *instance* rather than the parent's own `Text`, so
 * icon-plus-label composition and per-part styling work the same as on the web.
 *
 * `AutomaticSize` is set as an instance prop, not through a `size-fit` class:
 * Vela only lowers `fit`/`auto` to `AutomaticSize` when the class string is a
 * static literal, and every Facet class string is computed by a recipe. Sizing
 * itself is not optional either — a label with no resolved size collapses its
 * parent's `AutomaticSize` along with it.
 */
export function TextSlot(props: TextSlotProps) {
  if (props.text === undefined) {
    return <>{props.children}</>;
  }

  return (
    <textlabel
      className={cn(props.className)}
      Text={props.text}
      AutomaticSize={Enum.AutomaticSize.XY}
      BackgroundTransparency={1}
      BorderSizePixel={0}
    />
  );
}
