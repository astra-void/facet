import { readFile } from "node:fs/promises";
import path from "node:path";

export type TransformerState = "present" | "absent" | "unreadable";

export const TRANSFORMER_SNIPPET = `{
  "compilerOptions": {
    "plugins": [{ "transform": "vela-rbxts/transformer" }]
  }
}`;

/**
 * Checks whether `vela-rbxts/transformer` is registered in the project's
 * tsconfig.
 *
 * A textual check, not a parse: roblox-ts tsconfigs are routinely JSONC, and
 * `JSON.parse` would reject the comments while a comment-preserving rewrite is
 * a bigger commitment than this is worth. Without the transformer every
 * `className` a Facet component sets is silently inert, so the check earns its
 * place even though the fix is manual.
 */
export async function inspectTransformer(root: string, tsconfigPath = "tsconfig.json"): Promise<TransformerState> {
  try {
    const source = await readFile(path.resolve(root, tsconfigPath), "utf8");
    return source.includes("vela-rbxts/transformer") ? "present" : "absent";
  } catch {
    return "unreadable";
  }
}
