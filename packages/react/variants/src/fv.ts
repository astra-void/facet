import { cn } from "./cn";
import type { ClassItem, ClassValue } from "./types";

/**
 * `null` and `undefined` are both `nil` here, and neither can be stored in a Lua
 * array without leaving a hole — so one `typeIs` narrows out both.
 */
function isClassItem(value: ClassValue): value is ClassItem {
  return !typeIs(value, "nil");
}

export type VariantShape = Record<string, Record<string, ClassValue>>;

/** The prop object a recipe accepts: one optional key per variant axis. */
export type VariantSelection<Variants extends VariantShape> = {
  [Axis in keyof Variants]?: keyof Variants[Axis] & string;
};

export type CompoundVariant<Variants extends VariantShape> = VariantSelection<Variants> & {
  className: ClassValue;
};

export type VariantConfig<Variants extends VariantShape> = {
  variants?: Variants;
  defaultVariants?: VariantSelection<Variants>;
  compoundVariants?: CompoundVariant<Variants>[];
};

/** Props accepted by a component whose classes come from `recipe`. */
export type VariantProps<Recipe> = Recipe extends (selection?: infer Selection) => string
  ? NonNullable<Selection>
  : never;

type SelectionRecord = Record<string, string | undefined>;

function matchesCompound<Variants extends VariantShape>(
  compound: CompoundVariant<Variants>,
  resolved: SelectionRecord,
): boolean {
  for (const [axis, expected] of pairs(compound as unknown as SelectionRecord)) {
    if (!typeIs(axis, "string") || axis === "className") {
      continue;
    }
    if (!typeIs(expected, "string")) {
      continue;
    }
    if (resolved[axis] !== expected) {
      return false;
    }
  }
  return true;
}

/**
 * `fv` — facet variants. The cva-shaped recipe builder: takes a base class
 * string plus variant axes, returns a resolver from a variant selection to a
 * flat className.
 *
 * Recipes are pure string composition. They hold no theme values of their own —
 * every token they name (`bg-primary`, `text-muted-foreground`, ...) is resolved
 * by Vela at compile time from the consumer's `vela.config.ts`.
 */
export function fv<const Variants extends VariantShape>(base: ClassValue, config?: VariantConfig<Variants>) {
  return (selection?: VariantSelection<Variants> & { className?: ClassValue }): string => {
    const resolved: SelectionRecord = {};

    const defaults = config?.defaultVariants;
    if (defaults !== undefined) {
      for (const [axis, value] of pairs(defaults as unknown as SelectionRecord)) {
        if (typeIs(axis, "string") && typeIs(value, "string")) {
          resolved[axis] = value;
        }
      }
    }

    if (selection !== undefined) {
      for (const [axis, value] of pairs(selection as unknown as SelectionRecord)) {
        if (typeIs(axis, "string") && typeIs(value, "string") && axis !== "className") {
          resolved[axis] = value;
        }
      }
    }

    // Typed as ClassItem, not ClassValue: an undefined recipe slot is dropped
    // rather than stored, because a Lua array with a hole in it is not an array.
    const classes: ClassItem[] = [];
    if (isClassItem(base)) {
      classes.push(base);
    }

    const variants = config?.variants;
    if (variants !== undefined) {
      const variantsRecord = variants as unknown as Record<string, Record<string, ClassValue>>;
      for (const [axis, options] of pairs(variantsRecord)) {
        if (!typeIs(axis, "string")) {
          continue;
        }
        const picked = resolved[axis];
        if (picked === undefined) {
          continue;
        }
        const option = options[picked];
        if (isClassItem(option)) {
          classes.push(option);
        }
      }
    }

    const compounds = config?.compoundVariants;
    if (compounds !== undefined) {
      for (const compound of compounds) {
        if (matchesCompound(compound, resolved) && isClassItem(compound.className)) {
          classes.push(compound.className);
        }
      }
    }

    // Consumer className lands last so it can override recipe output.
    const consumerClassName = selection?.className;
    if (isClassItem(consumerClassName)) {
      classes.push(consumerClassName);
    }

    return cn(...classes);
  };
}
