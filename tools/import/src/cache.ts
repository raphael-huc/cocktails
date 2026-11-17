import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const CACHE_DIR = join(import.meta.dirname, "..", ".cache");

/**
 * Downloads a JSON document once and reuses the copy on disk afterwards, so
 * that working on the import does not hammer the sources. Delete the file
 * (or the whole `.cache` folder) to fetch fresh data.
 */
export async function fetchJsonCached(url: string, cacheKey: string): Promise<unknown> {
  const file = join(CACHE_DIR, cacheKey);

  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    // Not cached yet.
  }

  const response = await fetchPolitely(url);
  const text = await response.text();
  // An empty body is how some APIs answer "nothing found".
  const data: unknown = text.trim() ? JSON.parse(text) : null;

  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2));
  return data;
}

const MAX_ATTEMPTS = 6;

/** Waits and retries when the server asks us to slow down (HTTP 429). */
async function fetchPolitely(url: string): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url);
    if (response.ok) return response;

    if (response.status !== 429 || attempt === MAX_ATTEMPTS) {
      throw new Error(`GET ${url} failed with status ${response.status}`);
    }
    const retryAfter = Number(response.headers.get("retry-after"));
    const seconds = retryAfter > 0 ? retryAfter : 5 * attempt;
    console.log(`  rate limited, waiting ${seconds}s…`);
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }
}

export async function writeCacheFile(name: string, data: unknown): Promise<string> {
  const file = join(CACHE_DIR, name);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2));
  return file;
}
