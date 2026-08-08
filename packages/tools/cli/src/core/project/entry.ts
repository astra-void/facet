import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import * as parser from "@babel/parser";
import type { RegistryProvider } from "../registry/schema.js";

/**
 * Wiring a provider into the consumer's client entry.
 *
 * This is the one place Facet edits a file it did not write, and it is the case
 * the roadmap left open: `init` prints a snippet for `tsconfig.json` and
 * `vela.config.ts` rather than editing them, on the grounds that a
 * pattern-matched edit that mangles a consumer's file is worse than a snippet,
 * and that the answer is a real parser rather than a smarter regex. This is the
 * real parser.
 *
 * Two rules keep it honest:
 *
 * 1. **The parser is used for positions, never for output.** Re-printing a
 *    source file through a printer would reformat everything it
 *    touched and hand the consumer a diff they did not ask for. The AST answers
 *    *where* the render call and the imports are; the edit itself is two text
 *    splices into an otherwise byte-identical file.
 * 2. **Anything ambiguous is not edited.** Two render calls, no `PlayerGui`
 *    expression to pass, an entry that cannot be found — each one returns a
 *    reason and a snippet instead of a guess.
 */

export type EntryFile = { path: string; source: string };

export type ProviderPlan =
  /** Already wrapped — nothing to do. */
  | { kind: "present"; file: string }
  /** Ready to write: `content` is the entry file with the provider added. */
  | { kind: "ready"; file: string; content: string }
  /** Not safe to edit. `reason` says why; the caller prints `snippet`. */
  | { kind: "manual"; file?: string; reason: string };

/** Directories a source walk never has to look in. */
const SKIP_DIRECTORIES = new Set(["node_modules", "out", "include", "dist", ".git", ".vscode"]);

/** A bound, not a limit anyone should reach: an entry lives near the top of `src`. */
const MAX_FILES = 2_000;

async function collectSourceFiles(root: string, directory: string, found: string[]): Promise<void> {
  if (found.length >= MAX_FILES) {
    return;
  }

  const entries = await readdir(path.resolve(root, directory), { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRECTORIES.has(entry.name)) {
        await collectSourceFiles(root, relative, found);
      }
    } else if (entry.name.endsWith(".tsx")) {
      found.push(relative);
    }
  }
}

/**
 * Babel's AST is plain objects with `start`/`end` offsets and no parent links,
 * which is all this file needs — and it costs 5 MB rather than the 24 MB of a
 * whole compiler. `typescript` was the obvious first reach and the wrong one:
 * roblox-ts pins `typescript` to an exact version, so a caret range here is a
 * second copy in every project rather than a shared one.
 */
type Node = { type: string; start: number; end: number } & Record<string, unknown>;

/**
 * The file's `Program`, or nothing when it does not parse.
 *
 * `errorRecovery` keeps most of a half-typed file usable, and the `catch` is
 * for the rest: this runs over somebody's working tree, and a `.tsx` mid-edit
 * two directories away from the entry must not take `facet add` down with it.
 *
 * `.program` rather than the `File` wrapper — the wrapper also carries the
 * comment and error arrays, and walking those is work with no answers in it.
 */
function parse(file: EntryFile): Node | undefined {
  try {
    return parser.parse(file.source, {
      sourceType: "module",
      errorRecovery: true,
      plugins: ["typescript", "jsx"],
    }).program as unknown as Node;
  } catch {
    return undefined;
  }
}

function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

/** Depth-first over every node, with the parent chain the AST does not carry. */
function eachNode(node: Node, visit: (node: Node, parent: Node | undefined) => void, parent?: Node): void {
  visit(node, parent);

  for (const value of Object.values(node)) {
    if (isNode(value)) {
      eachNode(value, visit, node);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (isNode(item)) {
          eachNode(item, visit, node);
        }
      }
    }
  }
}

function textOf(file: EntryFile, node: Node): string {
  return file.source.slice(node.start, node.end);
}

/**
 * The `x.render(...)` calls in a file.
 *
 * Matched on the method name rather than on tracing `createRoot` back to its
 * import: `@rbxts/react-roblox` is one of several ways to get a root, and a
 * consumer who wrapped it in their own helper still writes `.render(`. Two
 * matches means the file mounts more than one tree, which is a thing to ask
 * about rather than resolve.
 */
function renderCalls(program: Node): Node[] {
  const calls: Node[] = [];

  eachNode(program, (node) => {
    if (node.type !== "CallExpression") {
      return;
    }
    const callee = node.callee;
    if (!isNode(callee) || callee.type !== "MemberExpression") {
      return;
    }
    const property = callee.property;
    if (!isNode(property) || property.type !== "Identifier" || property.name !== "render") {
      return;
    }
    if ((node.arguments as unknown[]).length > 0) {
      calls.push(node);
    }
  });

  return calls;
}

/**
 * An expression for the local player's `PlayerGui`, as the entry already spells
 * it.
 *
 * A React tree on the client always has one — it is what the root mounts into
 * or what `createPortal` targets — so reusing it beats synthesizing a second
 * lookup and an `@rbxts/services` import beside it. A variable name is
 * preferred over the call it came from: shorter, and it is the expression the
 * consumer already reads as "the PlayerGui".
 *
 * A file with no such expression is left alone. Writing the lookup would mean
 * editing or adding an import declaration as well, and a client that never
 * names its `PlayerGui` is unusual enough that a snippet is the better answer.
 */
function findPlayerGui(file: EntryFile, program: Node): string | undefined {
  let call: string | undefined;
  let name: string | undefined;

  eachNode(program, (node, parent) => {
    if (node.type !== "CallExpression") {
      return;
    }
    const callee = node.callee;
    if (!isNode(callee) || callee.type !== "MemberExpression") {
      return;
    }
    const property = callee.property;
    if (!isNode(property) || property.type !== "Identifier" || property.name !== "WaitForChild") {
      return;
    }

    const args = node.arguments as unknown[];
    const argument = args[0];
    if (args.length !== 1 || !isNode(argument) || argument.type !== "StringLiteral" || argument.value !== "PlayerGui") {
      return;
    }

    call ??= textOf(file, node);

    if (name === undefined && parent?.type === "VariableDeclarator") {
      const declared = parent.id;
      if (isNode(declared) && declared.type === "Identifier" && typeof declared.name === "string") {
        name = declared.name;
      }
    }
  });

  return name ?? call;
}

/** Whether the file already imports `name` from `specifier`. */
function importsBinding(program: Node, specifier: string, name: string): boolean {
  let found = false;

  eachNode(program, (node) => {
    if (node.type !== "ImportDeclaration") {
      return;
    }
    const source = node.source;
    if (!isNode(source) || source.value !== specifier) {
      return;
    }
    for (const element of node.specifiers as unknown[]) {
      if (isNode(element) && element.type === "ImportSpecifier") {
        const local = element.imported;
        if (isNode(local) && (local.name === name || local.value === name)) {
          found = true;
        }
      }
    }
  });

  return found;
}

/** The offset just past the last import, where a new one can be inserted. */
function afterLastImport(program: Node): number {
  let end = 0;
  for (const statement of program.body as unknown[]) {
    if (isNode(statement) && statement.type === "ImportDeclaration") {
      end = statement.end;
    }
  }
  return end;
}

/** The leading whitespace of the line `offset` falls on. */
function indentAt(source: string, offset: number): string {
  const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
  return /^[\t ]*/.exec(source.slice(lineStart, offset))?.[0] ?? "";
}

function attributesFor(provider: RegistryProvider, playerGui: string): string {
  return Object.entries(provider.props ?? {})
    .map(([prop, value]) => {
      // `WaitForChild` is typed as returning `Instance`, so the cast is what
      // makes the wiring compile — in the reused-variable case too, because the
      // variable is that call's result.
      const expression = value === "player-gui" ? `${playerGui} as BasePlayerGui` : playerGui;
      return ` ${prop}={${expression}}`;
    })
    .join("");
}

/** The lines to paste by hand, for every path where editing is refused. */
export function providerSnippet(provider: RegistryProvider, playerGui = "playerGui"): string {
  return `import { ${provider.name} } from "${provider.package}";

// wrap whatever you render:
<${provider.name}${attributesFor(provider, playerGui)}>
  {/* your app */}
</${provider.name}>`;
}

/**
 * Finds the file that mounts the React tree.
 *
 * Everything under `src` with a `.tsx` extension is parsed and the ones that
 * call `.render(` are kept. One match is the entry; several means the project
 * mounts more than one tree and the CLI has no basis for picking.
 */
export async function findClientEntry(root: string, sourceDir = "src"): Promise<EntryFile[]> {
  const candidates: string[] = [];
  await collectSourceFiles(root, sourceDir, candidates);

  const entries: EntryFile[] = [];
  for (const candidate of candidates) {
    let source: string;
    try {
      source = await readFile(path.resolve(root, candidate), "utf8");
    } catch {
      continue;
    }
    // Cheap gate before parsing every `.tsx` in the project.
    if (!source.includes(".render(")) {
      continue;
    }
    const program = parse({ path: candidate, source });
    if (program !== undefined && renderCalls(program).length > 0) {
      entries.push({ path: candidate, source });
    }
  }

  return entries;
}

/**
 * What to do about `provider` in `entry`: nothing, a rewritten file, or a
 * reason it has to be done by hand.
 */
export function planProvider(entry: EntryFile, provider: RegistryProvider): ProviderPlan {
  const program = parse(entry);
  if (program === undefined) {
    return { kind: "manual", file: entry.path, reason: `${entry.path} does not parse — nothing here is safe to edit` };
  }

  if (importsBinding(program, provider.package, provider.name)) {
    return { kind: "present", file: entry.path };
  }

  const calls = renderCalls(program);
  const call = calls[0];
  if (calls.length !== 1 || call === undefined) {
    return {
      kind: "manual",
      file: entry.path,
      reason: `${entry.path} has ${calls.length} render calls — which tree to wrap is your call`,
    };
  }

  const needsPlayerGui = Object.values(provider.props ?? {}).includes("player-gui");
  const playerGui = findPlayerGui(entry, program);
  if (needsPlayerGui && playerGui === undefined) {
    return {
      kind: "manual",
      file: entry.path,
      reason: `${entry.path} never names a PlayerGui, so there is nothing to pass as the portal target`,
    };
  }

  const argument = (call.arguments as unknown[])[0];
  if (!isNode(argument)) {
    return { kind: "manual", file: entry.path, reason: `${entry.path} renders nothing this could wrap` };
  }

  const { start, end } = argument;
  const indent = indentAt(entry.source, start);
  const open = `<${provider.name}${attributesFor(provider, playerGui ?? "")}>`;

  // The argument's own text, pushed in one level and put between the tags. Its
  // first line starts mid-line, so it is the one that needs the full indent.
  const [head = "", ...rest] = entry.source.slice(start, end).split("\n");
  const body = [`${indent}  ${head}`, ...rest.map((line) => (line.trim() === "" ? line : `  ${line}`))].join("\n");
  const wrapped = `${open}\n${body}\n${indent}</${provider.name}>`;

  const importLine = `import { ${provider.name} } from "${provider.package}";`;
  const importAt = afterLastImport(program);

  const content =
    entry.source.slice(0, importAt) +
    (importAt === 0 ? `${importLine}\n\n` : `\n${importLine}`) +
    entry.source.slice(importAt, start) +
    wrapped +
    entry.source.slice(end);

  return { kind: "ready", file: entry.path, content };
}
