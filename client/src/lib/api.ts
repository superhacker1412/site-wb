const DEFAULT_API_BASE = "http://localhost:4000/api/v1";

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || DEFAULT_API_BASE;
export const API_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const API_MESSAGE_MAP: Array<{ pattern: RegExp; text: string }> = [
  { pattern: /invalid credentials|wrong password|password incorrect|login failed/i, text: "Login yoki parol noto'g'ri." },
  { pattern: /user not found|record not found|not found/i, text: "So'ralgan ma'lumot topilmadi." },
  { pattern: /unauthorized|not authenticated|invalid token|token expired|jwt/i, text: "Sessiya tugagan yoki ruxsat yo'q. Qayta kiring." },
  { pattern: /forbidden|insufficient permissions|access denied/i, text: "Bu amal uchun sizda ruxsat yo'q." },
  { pattern: /validation|invalid input|invalid request|zod/i, text: "Kiritilgan ma'lumotlar noto'g'ri." },
  { pattern: /already exists|duplicate|unique constraint/i, text: "Bu ma'lumot allaqachon mavjud." },
  { pattern: /archived|inactive account|user is archived/i, text: "Bu akkaunt arxivlangan." },
  { pattern: /csrf/i, text: "Xavfsizlik tekshiruvi muvaffaqiyatsiz. Sahifani yangilang." },
  { pattern: /too many requests|rate limit/i, text: "So'rovlar soni oshib ketdi. Birozdan keyin qayta urinib ko'ring." },
  { pattern: /payload too large|file too large|too large/i, text: "Fayl hajmi ruxsat etilgan limitdan oshdi." },
  { pattern: /internal server error|server error/i, text: "Serverda xatolik yuz berdi. Keyinroq qayta urinib ko'ring." },
];

function detailsToMessage(details: unknown): string | null {
  if (!Array.isArray(details)) return null;
  const first = details[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object") {
    const record = first as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
  }
  return null;
}

function localizeApiErrorMessage(message: string, status: number, details?: unknown): string {
  const detailsMessage = detailsToMessage(details);
  const source = (detailsMessage || message || "").trim();
  if (source) {
    for (const entry of API_MESSAGE_MAP) {
      if (entry.pattern.test(source)) {
        return entry.text;
      }
    }
  }

  if (status >= 500) return "Serverda xatolik yuz berdi. Keyinroq qayta urinib ko'ring.";
  if (status === 404) return "So'ralgan ma'lumot topilmadi.";
  if (status === 403) return "Bu amal uchun sizda ruxsat yo'q.";
  if (status === 401) return "Sessiya tugagan yoki ruxsat yo'q. Qayta kiring.";
  if (status === 400) return "Kiritilgan ma'lumotlar noto'g'ri.";
  if (status === 409) return "Bu ma'lumot allaqachon mavjud.";
  if (status === 413) return "Fayl hajmi ruxsat etilgan limitdan oshdi.";
  return source || "So'rov bajarilmadi.";
}

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function isMutatingMethod(method: string): boolean {
  const normalized = method.toUpperCase();
  return normalized === "POST" || normalized === "PUT" || normalized === "PATCH" || normalized === "DELETE";
}

async function tryRefreshSession(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return response.ok;
  } catch {
    return false;
  }
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  retryOnAuthError?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = options.method || "GET";
  const headers: Record<string, string> = { ...(options.headers || {}) };
  const mutating = isMutatingMethod(method);

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  if (mutating) {
    const csrf = getCookie("csrf_token");
    if (csrf) headers["x-csrf-token"] = csrf;
  }

  const execute = async () =>
    fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers,
      body,
    });

  let response = await execute();

  if (
    response.status === 401 &&
    options.retryOnAuthError !== false &&
    !path.startsWith("/auth/login") &&
    !path.startsWith("/auth/register") &&
    !path.startsWith("/auth/refresh")
  ) {
    const refreshed = await tryRefreshSession();
    if (refreshed) response = await execute();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const rawMessage = typeof data?.message === "string" ? data.message : "";
    const localizedMessage = localizeApiErrorMessage(rawMessage, response.status, data?.details);
    throw new ApiError(localizedMessage, response.status, data?.details);
  }

  return data as T;
}

export function toAssetUrl(pathValue?: string | null): string {
  if (!pathValue) return "";
  if (/^https?:\/\//i.test(pathValue)) return pathValue;
  if (pathValue.startsWith("/")) return `${API_ORIGIN}${pathValue}`;
  return `${API_ORIGIN}/${pathValue}`;
}
