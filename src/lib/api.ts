import type { AdminToken } from './types';

export const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? 'https://ledger-api.simon996.com'
).replace(/\/+$/, '');

const tokenStorageKey = 'simon-ledger-admin-token';
const DEFAULT_TIMEOUT_MS = 15000;

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function readAdminToken(): AdminToken | null {
  const raw = window.localStorage.getItem(tokenStorageKey);
  if (!raw) return null;
  try {
    const token = JSON.parse(raw) as AdminToken;
    if (!token.name || !token.value) return null;
    return token;
  } catch {
    return null;
  }
}

export function saveAdminToken(token: AdminToken) {
  window.localStorage.setItem(tokenStorageKey, JSON.stringify(token));
}

export function clearAdminToken() {
  window.localStorage.removeItem(tokenStorageKey);
}

type AdminQuery = Record<string, string | number | boolean | null | undefined>;

type AdminRequestOptions = RequestInit & {
  timeoutMs?: number;
};

export async function adminGet<T>(
  path: string,
  query?: AdminQuery,
  options: AdminRequestOptions = {},
): Promise<T> {
  const url = new URL(toRequestUrl(path));
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return adminRequest<T>(url.toString(), { method: 'GET', ...options });
}

export async function adminPost<T>(path: string, data?: unknown): Promise<T> {
  return adminRequest<T>(path, {
    method: 'POST',
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}

export async function adminRequest<T>(
  path: string,
  options: AdminRequestOptions = {},
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, body, ...init } = options;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');
  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const token = readAdminToken();
  if (token) {
    requestHeaders.set(token.name, token.value);
  }

  let response: Response;
  try {
    response = await fetch(toRequestUrl(path), {
      ...init,
      body,
      signal: controller.signal,
      headers: requestHeaders,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('请求超时，请稍后重试');
    }
    throw new ApiError('网络连接失败，请检查 API 地址或网络状态');
  } finally {
    window.clearTimeout(timeout);
  }

  const envelope = await parseEnvelope<T>(response);
  if (!response.ok || envelope.code !== 0) {
    throw new ApiError(
      envelope.message || '请求失败',
      response.status,
      envelope.code,
    );
  }

  return envelope.data;
}

function toRequestUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new ApiError('响应格式不正确', response.status);
  }

  try {
    return (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError('响应解析失败', response.status);
  }
}
