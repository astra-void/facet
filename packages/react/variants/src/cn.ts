import type { ClassItem, ClassValue } from "./types";

type UnknownTable = Record<string, unknown>;

function push(out: string[], value: ClassValue) {
  if (value === undefined || value === false || value === true) {
    return;
  }

  if (typeIs(value, "string")) {
    if (value !== "") {
      out.push(value);
    }
    return;
  }

  // roblox-ts lowers arrays and records onto the same Lua table type, so the
  // first key's type is what tells them apart at runtime.
  const firstKey = next(value as unknown as UnknownTable)[0];
  if (firstKey === undefined) {
    return;
  }

  if (typeIs(firstKey, "number")) {
    for (const entry of value as ClassItem[]) {
      push(out, entry);
    }
    return;
  }

  for (const [key, enabled] of pairs(value as Record<string, boolean | undefined>)) {
    if (typeIs(key, "string") && enabled === true) {
      out.push(key);
    }
  }
}

/**
 * Flattens `ClassValue`s into a single space-separated class string.
 *
 * NOTE: unlike `tailwind-merge`, this does not resolve conflicting utilities.
 * Which of `p-2 p-4` wins is decided by Vela's resolution order, not here.
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    push(out, input);
  }
  return out.join(" ");
}
