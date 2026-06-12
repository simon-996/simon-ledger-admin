export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'https://ledger-api.simon996.com';

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

type AdminRequestOptions = {
  token?: string;
  timeoutMs?: number;
};

export async function adminGet<T>(
  path: string,
  options: AdminRequestOptions = {},
): Promise<T> {
  return adminRequest<T>(path, { method: 'GET', ...options });
}

export async function adminRequest<T>(
  path: string,
  options: RequestInit & AdminRequestOptions = {},
): Promise<T> {
  const { token, timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...init } = options;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');
  if (token) {
    requestHeaders.set('simon-ledger-admin', token);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
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

  const body = await parseEnvelope<T>(response);
  if (!response.ok || body.code !== 0) {
    throw new ApiError(body.message || '请求失败', response.status, body.code);
  }

  return body.data;
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
