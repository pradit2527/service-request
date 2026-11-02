// The throwaway database the e2e tests may wipe, and the checks that keep them away from the app's own.
// Plain Node: used by the Playwright config, the global setup and the unit test next to this file.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function parse(url: string): URL | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "postgresql:" || parsed.protocol === "postgres:" ? parsed : null;
  } catch {
    return null;
  }
}

const databaseName = (url: URL) => decodeURIComponent(url.pathname.replace(/^\//, ""));
const sameDatabase = (a: URL, b: URL) => a.hostname === b.hostname && (a.port || "5432") === (b.port || "5432") && databaseName(a) === databaseName(b);

/**
 * Returns `url` when it may be wiped by the e2e run, and throws otherwise. It must be a PostgreSQL address whose
 * database name contains "e2e" and that is not one of `ownUrls` (the app's own DATABASE_URL / DIRECT_URL). The
 * messages never repeat the address, so a password cannot leak into a log.
 */
export function checkE2eDatabaseUrl(url: string | undefined, ownUrls: string[]): string {
  if (!url) {
    throw new Error('Set E2E_DATABASE_URL to a throwaway PostgreSQL database whose name contains "e2e" (it is wiped on every run).');
  }
  const target = parse(url);
  if (!target) throw new Error("E2E_DATABASE_URL must be a PostgreSQL address (postgresql://user:password@host:port/database).");
  if (!/e2e/i.test(databaseName(target))) {
    throw new Error(`E2E_DATABASE_URL refused: the database "${databaseName(target)}" does not have "e2e" in its name, so it may not be a throwaway one.`);
  }
  for (const own of ownUrls) {
    const parsed = parse(own);
    if (parsed && sameDatabase(parsed, target)) {
      throw new Error("E2E_DATABASE_URL refused: it points at the app's own database (DATABASE_URL / DIRECT_URL).");
    }
  }
  return url;
}

/** DATABASE_URL and DIRECT_URL of the app, from .env and (unless told otherwise) from the environment. */
function ownDatabaseUrls(includeEnvironment: boolean): string[] {
  const found = includeEnvironment ? [process.env.DATABASE_URL, process.env.DIRECT_URL] : [];
  const file = resolve(process.cwd(), ".env");
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = /^\s*(DATABASE_URL|DIRECT_URL)\s*=\s*"?([^"#\s]*)"?/.exec(line);
      if (match) found.push(match[2]);
    }
  }
  return found.filter((value): value is string => Boolean(value));
}

/**
 * The checked E2E_DATABASE_URL; throws with a plain explanation when it is missing or unsafe. The server command
 * (which sets DATABASE_URL to this very address for the app) passes `includeEnvironment: false`, so only .env counts there.
 */
export function e2eDatabaseUrl({ includeEnvironment = true } = {}): string {
  return checkE2eDatabaseUrl(process.env.E2E_DATABASE_URL, ownDatabaseUrls(includeEnvironment));
}
