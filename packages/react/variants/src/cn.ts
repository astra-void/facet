import type { ClassValue } from "./types";

type UnknownTable = Record<string, unknown>;

/**
 * Positive type tests rather than a chain of `!== undefined`: roblox-ts collapses
 * `null` and `undefined` onto the same `nil`, so testing for what we *accept* is
 * both shorter and free of narrowing surprises. Anything unrecognised — booleans,
 * nil — is simply dropped.
 */
function push(out: string[], value: ClassValue) {
  if (typeIs(value, "string")) {
    if (value !== "") {
      out.push(value);
    }
    return;
  }

  if (typeIs(value, "number")) {
    out.push(tostring(value));
    return;
  }

  if (!typeIs(value, "table")) {
    return;
  }

  // roblox-ts lowers arrays and records onto the same Lua table type, so the
  // first key's type is what tells them apart at runtime.
  const firstKey = next(value as unknown as UnknownTable)[0];
  if (firstKey === undefined) {
    return;
  }

  if (typeIs(firstKey, "number")) {
    for (const entry of value as ClassValue[]) {
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
