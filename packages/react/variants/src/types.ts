/**
 * Mirrors Vela's `ClassValue` exactly.
 *
 * Exactness matters, not similarity: Vela augments `React.Attributes` with
 * `className`, and TypeScript intersects `React.Attributes` into every
 * component's props — so `props.className` inside a Facet component carries
 * Vela's type no matter what the component declared. A narrower mirror simply
 * fails to accept it.
 */
export type ClassDictionary = Record<string, boolean | null | undefined>;

export type ClassValue = string | number | boolean | null | undefined | ClassDictionary | ClassValue[];

/**
 * What may sit inside an array *we* build.
 *
 * Lua tables cannot hold `nil` without leaving a hole, so roblox-ts refuses both
 * `undefined` and `null` as element types — they are the same value at runtime.
 * Accepting them on the way in is fine; we just never store them.
 */
export type ClassItem = string | number | boolean | ClassDictionary | ClassValue[];
