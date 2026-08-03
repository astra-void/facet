/**
 * Structurally compatible with Vela's `ClassValue`, redeclared here so the
 * package carries no dependency on the Vela toolchain.
 *
 * Split into two names on purpose: Lua tables cannot hold `nil` without leaving
 * a hole, so roblox-ts refuses `undefined` as an array element type. `ClassItem`
 * is what may sit *inside* an array; `ClassValue` adds the `undefined` that a
 * `className?:` prop needs.
 */
export type ClassDictionary = Record<string, boolean | undefined>;

export type ClassItem = string | boolean | ClassDictionary | ClassItem[];

export type ClassValue = ClassItem | undefined;
