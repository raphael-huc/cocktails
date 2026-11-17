import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type DirectusClient = {
  get<T>(path: string, query?: Record<string, unknown>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
  /** Deletes one item, or with a body (`{ query }` or a list of keys) several. */
  delete(path: string, body?: unknown): Promise<void>;
  /** Fetches a file and discards it: used to make Directus generate an image. */
  download(path: string): Promise<void>;
};

/**
 * Connection settings come from the environment:
 *   DIRECTUS_URL    defaults to http://localhost:8055
 *   DIRECTUS_TOKEN  a token allowed to write the catalog
 *
 * Without DIRECTUS_TOKEN, the admin token of the sibling huc-back checkout is
 * used, the same way its own scripts do. That is a local development
 * convenience: set DIRECTUS_TOKEN explicitly anywhere else.
 */
export async function createDirectusClient(): Promise<DirectusClient> {
  const baseUrl = process.env.DIRECTUS_URL ?? "http://localhost:8055";
  const token = process.env.DIRECTUS_TOKEN ?? (await readLocalAdminToken());

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`${method} ${path} failed with status ${response.status}: ${text}`);
    }
    return (text ? JSON.parse(text).data : undefined) as T;
  }

  return {
    get: (path, query = {}) => request("GET", `${path}${toQueryString(query)}`),
    post: (path, body) => request("POST", path, body),
    patch: (path, body) => request("PATCH", path, body),
    delete: (path, body) => request("DELETE", path, body),
    download: async (path) => {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`GET ${path} failed with status ${response.status}`);
      await response.arrayBuffer();
    },
  };
}

function toQueryString(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    params.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

async function readLocalAdminToken(): Promise<string> {
  const envFile = join(import.meta.dirname, "../../../../../huc-back/.env");
  let content: string;
  try {
    content = await readFile(envFile, "utf8");
  } catch {
    throw new Error(`Set DIRECTUS_TOKEN: no huc-back/.env found at ${envFile}`);
  }
  const token = /^ADMIN_TOKEN=(.+)$/m.exec(content)?.[1]?.trim();
  if (!token) throw new Error("Set DIRECTUS_TOKEN: huc-back/.env has no ADMIN_TOKEN");
  return token;
}
