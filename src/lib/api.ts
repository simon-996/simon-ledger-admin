export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'https://ledger-api.simon996.com';

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

export async function adminGet<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: token ? { 'simon-ledger-admin': token } : undefined,
  });

  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || body.code !== 0) {
    throw new Error(body.message || '请求失败');
  }

  return body.data;
}
