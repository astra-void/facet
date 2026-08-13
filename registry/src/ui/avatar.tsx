import { fv, type VariantProps } from "@facet-ui/react-variants";
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
 * `size` is shadcn's three steps — `sm` 24px, `default` 32px, `lg` 40px — and it
 * has to be passed to the fallback as well as the root, because shadcn changes
 * the initials' size through a `group-data-[size=sm]` selector and nothing
 * cascades here. Same shape as `alert`'s `variant`.
 *
 * shadcn has three more parts this file does not: `AvatarBadge`, `AvatarGroup`
 * and `AvatarGroupCount`. All three are positioned by things Vela reports as
 * having no Roblox equivalent — `absolute` with `right-0 bottom-0` for the
 * badge, a negative `-space-x-2` for the overlap in the group. A stack of
 * avatars is expressible, but not by copying those classes over.
 *
 * One recipe object rather than three exports: every exported name costs a
 * Luau register once Vela inlines its runtime. See
 * docs/decisions/luau-register-limit.md.
 */
export const avatarVariants = {
  root: fv("shrink-0 rounded-full overflow-hidden", {
    variants: {
      size: { sm: "size-6", default: "size-8", lg: "size-10" },
    },
    defaultVariants: { size: "default" },
  }),
  image: fv("aspect-square size-full rounded-full"),
  // `bg-muted` belongs to the fallback, not the circle. shadcn puts it here so
  // an avatar with a loaded image has no surface of its own to show through.
  fallback: fv("size-full rounded-full bg-muted font-normal text-muted-foreground text-center", {
    variants: {
      // shadcn shrinks the initials on the small avatar and leaves the other two
      // at `text-sm`. Nothing cascades here, so `size` reaches this part too.
      size: { sm: "text-xs", default: "text-sm", lg: "text-sm" },
    },
    defaultVariants: { size: "default" },
  }),
};

const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

const ROOT_OWN_PROPS = ["src", "delayMs", "size", "className", "children"] as const;
const IMAGE_OWN_PROPS = ["className", "children"] as const;
const FALLBACK_OWN_PROPS = ["size", "className", "Text", "children"] as const;

export type AvatarProps = VariantProps<typeof avatarVariants.root> & {
  /** The image source — an `rbxassetid://` or `rbxthumb://` URL. */
  src?: string;
  /** How long to hold the fallback back while the image loads, in milliseconds. */
  delayMs?: number;
  className?: ClassName;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type AvatarImageProps = { className?: ClassName } & PassthroughProps<ImageLabel>;
export type AvatarFallbackProps = VariantProps<typeof avatarVariants.fallback> & {
  className?: ClassName;
  Text?: string;
} & PassthroughProps<TextLabel>;

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
        className={cn(avatarVariants.root({ size: props.size, className: props.className }))}
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
      className={cn(avatarVariants.fallback({ size: props.size, className: props.className }))}
      Text={props.Text ?? ""}
      {...forwardProps(props, FALLBACK_OWN_PROPS)}
    />
  );
}
