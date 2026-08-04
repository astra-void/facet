import { access } from "node:fs/promises";
import type { FacetBase, FacetMode } from "@facet-ui/theme";
import { CONFIG_FILENAME, configPath, DEFAULT_CONFIG, type FacetConfig, writeConfig } from "../core/config.js";
import { FacetError } from "../core/errors.js";
import { FileTransaction } from "../core/fs/transaction.js";
import { logger } from "../core/logger.js";
import { ensurePackages } from "../core/pm.js";
import { findProjectRoot } from "../core/project/findRoot.js";
import { inspectTransformer, TRANSFORMER_SNIPPET } from "../core/project/tsconfig.js";
import { inspectVelaConfig } from "../core/project/velaConfig.js";
import { createPrompter } from "../core/prompt.js";
import { add } from "./add.js";

export type InitOptions = {
  cwd?: string;
  /** Skip prompts and take every default. */
  yes?: boolean;
  /** Overwrite an existing facet.json. */
  force?: boolean;
  /** Skip every package install. */
  noDeps?: boolean;
  registry?: string;
};

/** Needed to build the project, not to run it — only `vela.config.ts` imports them. */
// Vela is pinned to a floor, not left open: registry components lean on
// families Vela only resolves on the computed-className path — `w-fit` and
// `font-<weight>` from 0.7.0, `opacity-*`, `whitespace-*` and `leading-*` from
// 0.8.0. Below the floor they compile and then quietly do nothing.
const BUILD_DEPENDENCIES = ["@facet-ui/theme", "vela-rbxts@^0.9.0"];

async function exists(candidate: string): Promise<boolean> {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function askConfig(yes: boolean): Promise<FacetConfig> {
  const prompter = createPrompter(yes);

  try {
    const base = await prompter.select<FacetBase>(
      "Neutral ramp",
      [
        { value: "zinc", label: "zinc" },
        { value: "slate", label: "slate" },
        { value: "stone", label: "stone" },
        { value: "neutral", label: "neutral" },
      ],
      DEFAULT_CONFIG.theme.base,
    );

    const mode = await prompter.select<FacetMode>(
      "Mode",
      [
        { value: "dark", label: "dark" },
        { value: "light", label: "light" },
      ],
      DEFAULT_CONFIG.theme.mode,
    );

    const ui = await prompter.text("Components directory", DEFAULT_CONFIG.aliases.ui.dir);
    const lib = await prompter.text("Helpers directory", DEFAULT_CONFIG.aliases.lib.dir);
    const hooks = await prompter.text("Hooks directory", DEFAULT_CONFIG.aliases.hooks.dir);

    // Blank means relative imports, which need no tsconfig `paths` and so work
    // in any roblox-ts project. An alias is the better experience where the
    // project already has one, but it is not something to assume.
    const alias = await prompter.text("Import alias for those directories (blank for relative imports)", "");
    const importFor = (dir: string) => (alias === "" ? undefined : `${alias}/${dir.split("/").pop() ?? dir}`);

    return {
      ...DEFAULT_CONFIG,
      theme: { base, mode },
      aliases: {
        ui: { dir: ui, import: importFor(ui) },
        lib: { dir: lib, import: importFor(lib) },
        hooks: { dir: hooks, import: importFor(hooks) },
      },
    };
  } finally {
    prompter.close();
  }
}

export async function init(options: InitOptions = {}): Promise<void> {
  const root = await findProjectRoot(options.cwd);

  if ((await exists(configPath(root))) && options.force !== true) {
    throw new FacetError(`${CONFIG_FILENAME} already exists in ${root}. Pass --force to start over.`);
  }

  logger.break();
  logger.info(`  Setting up Facet in ${root}`);
  logger.break();

  const config = await askConfig(options.yes === true);
  await writeConfig(root, config);
  logger.success(`wrote ${CONFIG_FILENAME}`);

  // Only ever created, never rewritten — see `inspectVelaConfig`.
  const vela = await inspectVelaConfig(root, config);
  if (vela.kind === "missing") {
    const transaction = new FileTransaction(root);
    transaction.add(config.velaConfig, vela.content);
    await transaction.commit();
    logger.success(`wrote ${config.velaConfig}`);
  } else if (vela.kind === "wired") {
    logger.success(`${config.velaConfig} already supplies Facet's tokens`);
  }

  if (options.noDeps !== true) {
    await ensurePackages(root, BUILD_DEPENDENCIES, { dev: true });
  }

  // Every component imports `~/lib/utils`, so it is part of being set up rather
  // than something to discover on the first failed build.
  await add(["utils"], { cwd: root, registry: options.registry, noDeps: options.noDeps });

  const transformer = await inspectTransformer(root);

  logger.break();
  if (vela.kind === "unwired") {
    logger.warn(`${config.velaConfig} exists but does not use facetTheme. Add:`);
    logger.break();
    logger.dim(vela.snippet);
    logger.break();
  }
  if (transformer === "absent") {
    logger.warn("tsconfig.json does not register the Vela transformer. Without it every class is inert. Add:");
    logger.break();
    logger.dim(TRANSFORMER_SNIPPET);
    logger.break();
  }
  if (transformer === "unreadable") {
    logger.warn("Could not read tsconfig.json — check the Vela transformer is registered yourself.");
  }

  logger.success("Facet is set up. Add a component with `facet add button`.");
  logger.break();
}
