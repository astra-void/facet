import { readFile } from "node:fs/promises";
import path from "node:path";
import { FacetError } from "../errors.js";
import type { RegistryIndex, RegistryItemPayload } from "./schema.js";
import { describeSource, type RegistrySource } from "./source.js";

const FETCH_TIMEOUT_MS = 15_000;

async function readLocal<T>(file: string, what: string): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (cause) {
    throw new FacetError(`Could not read ${what} at ${file}.`, { cause });
  }
}

async function readRemote<T>(url: string, what: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
  } catch (cause) {
    throw new FacetError(`Could not reach the registry at ${url}. Check your connection.`, { cause });
  }

  // A 404 on an item is a user typo; a 404 on the index means the registry moved.
  if (response.status === 404) {
    throw new FacetError(`${what} was not found at ${url}.`);
  }
  if (!response.ok) {
    throw new FacetError(`The registry returned ${response.status} for ${url}.`);
  }

  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new FacetError(`The registry returned something that is not JSON at ${url}.`, { cause });
  }
}

function locate(source: RegistrySource, file: string): string {
  return source.kind === "dir" ? path.join(source.dir, file) : `${source.baseUrl}/${file}`;
}

async function read<T>(source: RegistrySource, file: string, what: string): Promise<T> {
  const at = locate(source, file);
  return source.kind === "dir" ? readLocal<T>(at, what) : readRemote<T>(at, what);
}

export async function loadIndex(source: RegistrySource): Promise<RegistryIndex> {
  const index = await read<RegistryIndex>(source, "index.json", "the registry index");

  if (index.version !== 1) {
    throw new FacetError(
      `The registry at ${describeSource(source)} is format version ${index.version}, which this CLI does not understand. Upgrade facet-ui.`,
    );
  }

  return index;
}

export async function loadItem(source: RegistrySource, name: string): Promise<RegistryItemPayload> {
  return read<RegistryItemPayload>(source, `${name}.json`, `Component "${name}"`);
}
