import { cookies } from "next/headers";

const BACKEND_DEFAULT = "http://localhost:5291";

function getBackendBaseUrl(): string {
  const base = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL || BACKEND_DEFAULT;
  return base.replace(/\/+$/, "");
}

async function getCookieHeader(): Promise<string> {
  try {
    const cookieStore = await cookies();
    return cookieStore
      .getAll()
      .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
      .join("; ");
  } catch {
    return "";
  }
}

export class BackendError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BackendError";
  }

  get isUnauthorized() { return this.status === 401; }
  get isNotFound()     { return this.status === 404; }
  get isServerError()  { return this.status >= 500; }
  get isOffline()      { return this.status === 0; }
}

async function parseError(res: Response): Promise<BackendError> {
  try {
    const payload = await res.json();
    const msg =
      (typeof payload?.error === "string" && payload.error.trim()) ||
      (typeof payload?.message === "string" && payload.message.trim()) ||
      res.statusText ||
      `Request failed (${res.status})`;
    return new BackendError(res.status, msg);
  } catch {
    return new BackendError(res.status, res.statusText || `Request failed (${res.status})`);
  }
}

export async function backendGetJson<T>(path: string): Promise<T> {
  const url = `${getBackendBaseUrl()}${path}`;
  const cookie = await getCookieHeader();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: cookie ? { cookie } : undefined,
      cache: "no-store",
    });
  } catch {
    throw new BackendError(0, "Cannot reach the backend server. Please ensure it is running.");
  }

  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export async function backendSendJson<T>(
  path: string,
  method: "POST" | "DELETE",
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const url = `${getBackendBaseUrl()}${path}`;
  const cookie = await getCookieHeader();

  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(cookie ? { cookie } : {}),
    ...(extraHeaders ?? {}),
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new BackendError(0, "Cannot reach the backend server. Please ensure it is running.");
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    if (typeof payload === "string") {
      throw new BackendError(res.status, payload || `Request failed (${res.status})`);
    }
    const msg =
      (typeof payload?.error === "string" && payload.error.trim()) ||
      (typeof payload?.message === "string" && payload.message.trim()) ||
      `Request failed (${res.status})`;
    throw new BackendError(res.status, msg);
  }

  return payload as T;
}
