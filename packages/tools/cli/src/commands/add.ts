import { access } from "node:fs/promises";
import path from "node:path";
import { type FacetConfig, readConfig } from "../core/config.js";
import { FileTransaction } from "../core/fs/transaction.js";
import { logger } from "../core/logger.js";
import { ensurePackages } from "../core/pm.js";
import { findClientEntry, planProvider, providerSnippet } from "../core/project/entry.js";
import { findProjectRoot } from "../core/project/findRoot.js";
import { inspectVelaConfig } from "../core/project/velaConfig.js";
import { Prompter } from "../core/prompt.js";
import { destinationFor } from "../core/registry/destination.js";
import { loadIndex, loadItem } from "../core/registry/load.js";
import { collectDependencies, collectProviders, resolveItems } from "../core/registry/resolve.js";
import type { RegistryProvider } from "../core/registry/schema.js";
import { describeSource, resolveRegistrySource } from "../core/registry/source.js";
import { rewriteImports } from "../core/transform/rewriteImports.js";

export type AddOptions = {
  cwd?: string;
  /** Registry URL or local path, overriding facet.json and the default. */
  registry?: string;
  /** Overwrite files that already exist instead of skipping them. */
  overwrite?: boolean;
  /** Resolve and report, write nothing. */
  dryRun?: boolean;
  /** Skip the npm install step. */
  noDeps?: boolean;
  /** Answer yes to the provider-wiring prompt instead of asking. */
  yes?: boolean;
};

type PlannedFile = {
  item: string;
  path: string;
  content: string;
  exists: boolean;
};

async function exists(candidate: string): Promise<boolean> {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

/**
 * Turns the requested names into the exact set of files to write, with `~/`
 * imports already rewritten for where each file lands.
 */
export async function planAdd(
  root: string,
  config: FacetConfig,
  names: string[],
  options: AddOptions,
): Promise<{
  files: PlannedFile[];
  dependencies: string[];
  tokens: string[];
  providers: RegistryProvider[];
  source: string;
}> {
  const source = resolveRegistrySource({ registry: options.registry ?? config.registry });
  const index = await loadIndex(source);
  const entries = resolveItems(index, names);

  const files: PlannedFile[] = [];
  for (const entry of entries) {
    const payload = await loadItem(source, entry.name);
    for (const file of payload.files) {
      const destination = destinationFor(config, file);
      files.push({
        item: entry.name,
        path: destination.path,
        content: rewriteImports(file.content, config, destination.dir),
        exists: await exists(path.resolve(root, destination.path)),
      });
    }
  }

  const { dependencies, tokens } = collectDependencies(entries);
  return { files, dependencies, tokens, providers: collectProviders(entries), source: describeSource(source) };
}

/**
 * Asks before touching the entry file, and only when there is somebody to ask.
 *
 * `--yes` writes it; a non-interactive run without `--yes` does not, and says
 * so as `unasked` rather than as a refusal — stdin not being a terminal is not
 * consent, and it is also not the consumer having declined.
 */
async function askToWire(message: string, options: AddOptions): Promise<"yes" | "no" | "unasked"> {
  if (options.yes === true) {
    return "yes";
  }
  if (process.stdin.isTTY !== true) {
    return "unasked";
  }

  const prompter = new Prompter(false);
  try {
    return (await prompter.confirm(message, true)) ? "yes" : "no";
  } finally {
    prompter.close();
  }
}

function reportManually(provider: RegistryProvider, reason: string): void {
  logger.break();
  logger.warn(`${provider.name} is not wired up: ${reason}`);
  logger.dim(`  ${provider.reason}`);
  logger.break();
  logger.dim(providerSnippet(provider));
  logger.break();
}

/**
 * Wraps the client entry in every provider the install set declares.
 *
 * Reported rather than written whenever the entry is missing, ambiguous, or
 * lacks something the provider needs — see `core/project/entry.ts` for why the
 * bar for editing is that high.
 */
async function wireProviders(root: string, providers: RegistryProvider[], options: AddOptions): Promise<void> {
  if (providers.length === 0) {
    return;
  }

  const entries = await findClientEntry(root);
  const found = entries[0];
  if (entries.length !== 1 || found === undefined) {
    for (const provider of providers) {
      reportManually(
        provider,
        entries.length === 0
          ? "no file under src/ mounts a React tree"
          : `${entries.length} files under src/ mount a React tree (${entries.map((entry) => entry.path).join(", ")})`,
      );
    }
    return;
  }

  // Re-read between providers: the second one has to wrap the file the first
  // one just rewrote, not the copy this started with.
  let entry = found;

  for (const provider of providers) {
    const plan = planProvider(entry, provider);

    if (plan.kind === "present") {
      logger.dim(`  ${provider.name} is already in ${plan.file}`);
      continue;
    }

    if (plan.kind === "manual") {
      reportManually(provider, plan.reason);
      continue;
    }

    logger.break();
    logger.info(`${provider.name} has to wrap your app — ${provider.reason}`);

    const consent = await askToWire(`Add it to ${plan.file}?`, options);
    if (consent === "no") {
      reportManually(provider, `${plan.file} left alone, because you said no`);
      continue;
    }
    if (consent === "unasked") {
      reportManually(provider, "nothing here to ask, and this is not a file to edit unasked — `--yes` writes it");
      continue;
    }

    const transaction = new FileTransaction(root);
    transaction.add(plan.file, plan.content);
    await transaction.commit();
    entry = { path: plan.file, source: plan.content };
    logger.success(`wrapped ${plan.file} in ${provider.name}`);
  }
}

export async function add(names: string[], options: AddOptions = {}): Promise<void> {
  const root = await findProjectRoot(options.cwd);
  const config = await readConfig(root);

  const { files, dependencies, tokens, providers, source } = await planAdd(root, config, names, options);

  const writing = options.overwrite === true ? files : files.filter((file) => !file.exists);
  const skipped = options.overwrite === true ? [] : files.filter((file) => file.exists);

  logger.break();
  for (const file of writing) {
    logger.step(`${file.exists ? "overwrite" : "write"}  ${file.path}`);
  }
  for (const file of skipped) {
    logger.dim(`  exists     ${file.path}`);
  }

  if (options.dryRun === true) {
    logger.break();
    logger.dim(`  registry: ${source}`);
    logger.dim(`  dependencies: ${dependencies.join(", ") || "none"}`);
    logger.dim(`  providers: ${providers.map((provider) => provider.name).join(", ") || "none"}`);
    logger.break();
    logger.info("Nothing written (--dry-run).");
    return;
  }

  if (writing.length === 0) {
    logger.break();
    logger.info("Everything requested is already here. Pass --overwrite to replace it.");
    return;
  }

  const transaction = new FileTransaction(root);
  for (const file of writing) {
    transaction.add(file.path, file.content);
  }
  await transaction.commit();

  logger.break();
  logger.success(`Wrote ${writing.length} file${writing.length === 1 ? "" : "s"}.`);

  if (options.noDeps !== true) {
    await ensurePackages(root, dependencies);
  }

  // Without Facet's tokens in the Vela theme, the copied classes compile to
  // Vela diagnostics on a file the consumer never wrote. Say so here rather
  // than letting the next build be the messenger.
  const vela = await inspectVelaConfig(root, config);
  if (vela.kind !== "wired" && tokens.length > 0) {
    logger.break();
    logger.warn(`${config.velaConfig} does not use facetTheme. These components need these tokens:`);
    logger.dim(`  ${tokens.join(", ")}`);
    logger.dim("  Run `facet doctor` for the fix.");
  }

  if (skipped.length > 0) {
    logger.break();
    logger.dim(`  ${skipped.length} file(s) left alone because they already exist. --overwrite replaces them.`);
  }

  // Last, because it is the one step that asks a question and edits a file the
  // consumer wrote — nothing should scroll past it.
  await wireProviders(root, providers, options);
}
