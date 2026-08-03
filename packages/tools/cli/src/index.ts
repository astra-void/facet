#!/usr/bin/env node
import { run } from "./cli.js";
import { logger } from "./core/logger.js";

run(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    logger.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack !== undefined && process.env.FACET_DEBUG !== undefined) {
      logger.dim(error.stack);
    }
    process.exitCode = 1;
  });

export { run } from "./cli.js";
export type { FacetConfig } from "./core/config.js";
export type { Registry, RegistryIndex, RegistryItem } from "./core/registry/schema.js";
