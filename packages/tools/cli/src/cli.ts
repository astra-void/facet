import { parseArgs } from "node:util";
import { add } from "./commands/add.js";
import { diff } from "./commands/diff.js";
import { doctor } from "./commands/doctor.js";
import { init } from "./commands/init.js";
import { list } from "./commands/list.js";
import { remove } from "./commands/remove.js";
import { FacetError, isUserFacing } from "./core/errors.js";
import { logger } from "./core/logger.js";

const HELP = `
  facet — copy-in UI components for roblox-ts

  Usage
    facet <command> [options]

  Commands
    init                 set up facet.json, theme tokens, and the Vela plugin
    add <names...>       copy components into the project
    remove <names...>    delete copied components
    list                 show every component in the registry
    diff [name]          show upstream changes since a component was copied
    doctor               check the project matches what components assume

  Options
    --cwd <dir>          run against another directory
    --registry <url>     read components from another registry
    --overwrite          (add) replace files that already exist
    --dry-run            (add) resolve and report, write nothing
    --no-deps            (add) skip npm install
    --force              (init) overwrite facet.json; (remove) delete anyway
    --yes, -y            (init) accept every default
    --version, -v
    --help, -h
`;

export async function run(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: {
      cwd: { type: "string" },
      registry: { type: "string" },
      overwrite: { type: "boolean" },
      "dry-run": { type: "boolean" },
      "no-deps": { type: "boolean" },
      force: { type: "boolean" },
      yes: { type: "boolean", short: "y" },
      version: { type: "boolean", short: "v" },
      help: { type: "boolean", short: "h" },
    },
  });

  const [command, ...rest] = positionals;
  const cwd = typeof values.cwd === "string" ? values.cwd : undefined;
  const registry = typeof values.registry === "string" ? values.registry : undefined;

  if (values.version === true) {
    logger.info(process.env.npm_package_version ?? "0.1.0");
    return 0;
  }

  if (command === undefined || values.help === true) {
    logger.info(HELP);
    return 0;
  }

  try {
    switch (command) {
      case "init":
        await init({
          cwd,
          registry,
          yes: values.yes === true,
          force: values.force === true,
          noDeps: values["no-deps"] === true,
        });
        break;
      case "add":
        if (rest.length === 0) {
          throw new FacetError("Nothing to add. Try `facet add button`, or `facet list` to see what exists.");
        }
        await add(rest, {
          cwd,
          registry,
          overwrite: values.overwrite === true,
          dryRun: values["dry-run"] === true,
          noDeps: values["no-deps"] === true,
        });
        break;
      case "remove":
        if (rest.length === 0) {
          throw new FacetError("Nothing to remove. Name at least one component.");
        }
        await remove(rest, { cwd, registry, force: values.force === true });
        break;
      case "list":
        await list({ registry });
        break;
      case "diff":
        await diff(rest[0], { cwd });
        break;
      case "doctor":
        await doctor({ cwd, registry });
        break;
      default:
        throw new FacetError(`Unknown command "${command}". Run \`facet --help\`.`);
    }
  } catch (error) {
    if (isUserFacing(error)) {
      logger.error(error.message);
      return 1;
    }
    throw error;
  }

  return 0;
}
