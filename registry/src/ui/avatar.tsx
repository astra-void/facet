import { fv } from "@facet-ui/react-variants";
import { Avatar as AvatarPrimitive } from "@lattice-ui/react-avatar";
import { getPassthroughProps, type PassthroughProps, React, toSlotProps } from "@lattice-ui/react-runtime";
import { type ClassName, cn } from "~/lib/utils";

/**
 * Lattice's `Avatar.Root` renders no instance — it only tracks whether the
 * image loaded — so the circle itself is drawn here. The image and the fallback
 * both fill it and carry their own `rounded-full`: Roblox clips to a rectangle,
 * so rounding the parent alone would leave square corners poking out of the
 * circle whenever a child paints.
 *
 * One recipe object rather than three exports: every exported name costs a
 * Luau register once Vela inlines its runtime. See
 * docs/decisions/luau-register-limit.md.
 */
export const avatarVariants = {
  root: fv("size-10 rounded-full bg-muted overflow-hidden"),
  image: fv("size-full rounded-full"),
  fallback: fv("size-full rounded-full bg-muted text-sm font-medium text-muted-foreground text-center"),
};

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

const ROOT_OWN_PROPS = ["src", "delayMs", "className", "children"] as const;
const IMAGE_OWN_PROPS = ["className", "children"] as const;
const FALLBACK_OWN_PROPS = ["className", "Text", "children"] as const;

export type AvatarProps = {
  /** The image source — an `rbxassetid://` or `rbxthumb://` URL. */
  src?: string;
  /** How long to hold the fallback back while the image loads, in milliseconds. */
  delayMs?: number;
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type AvatarImageProps = { className?: ClassName } & PassthroughProps<ImageLabel>;
export type AvatarFallbackProps = { className?: ClassName; Text?: string } & PassthroughProps<TextLabel>;

// The forwarded bag is widened by `toSlotProps` and then has `children`
// dropped from its *type*: these parts type `children` as a single element
// (what `asChild` merges onto), and the bag never actually carries one —
// `children` is listed as an own prop — so only the type needs narrowing.
function forwardProps(props: object, ownKeys: readonly string[]): { key?: React.Key } & { [index: string]: unknown } {
  return toSlotProps(getPassthroughProps(props, ownKeys));
}

export function Avatar(props: AvatarProps) {
  return (
    <AvatarPrimitive.Root delayMs={props.delayMs} src={props.src}>
      <frame
        className={cn(avatarVariants.root({ className: props.className }))}
        {...NEUTRAL_PROPS}
        {...getPassthroughProps<Frame>(props, ROOT_OWN_PROPS)}
      >
        {props.children}
      </frame>
    </AvatarPrimitive.Root>
  );
}

export function AvatarImage(props: AvatarImageProps) {
  return (
    <AvatarPrimitive.Image
      className={cn(avatarVariants.image({ className: props.className }))}
      {...forwardProps(props, IMAGE_OWN_PROPS)}
    />
  );
}

export function AvatarFallback(props: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(avatarVariants.fallback({ className: props.className }))}
      Text={props.Text ?? ""}
      {...forwardProps(props, FALLBACK_OWN_PROPS)}
    />
  );
}
