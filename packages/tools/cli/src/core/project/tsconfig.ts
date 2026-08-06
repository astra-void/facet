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

export type AliasPathState = "declared" | "absent" | "unreadable";

/**
 * Whether the project's tsconfig declares a `paths` entry that could resolve an
 * import specifier copied components use, such as `shared/ui`.
 *
 * Only asked about a project that set an `import` in `facet.json` — the default
 * is relative imports, which need no `paths` at all. Textual for the same
 * reason as `inspectTransformer`: the file is routinely JSONC. It looks for the
 * specifier itself and for the wildcard keys that would cover it, so
 * `"shared/ui"`, `"shared/ui/*"` and `"shared/*"` all count.
 */
export async function inspectAliasPath(
  root: string,
  specifier: string,
  tsconfigPath = "tsconfig.json",
): Promise<AliasPathState> {
  let source: string;
  try {
    source = await readFile(path.resolve(root, tsconfigPath), "utf8");
  } catch {
    return "unreadable";
  }

  const segments = specifier.split("/");
  const candidates = [`"${specifier}"`, `"${specifier}/*"`];
  for (let depth = 1; depth < segments.length; depth += 1) {
    candidates.push(`"${segments.slice(0, depth).join("/")}/*"`);
  }

  return candidates.some((candidate) => source.includes(candidate)) ? "declared" : "absent";
}
