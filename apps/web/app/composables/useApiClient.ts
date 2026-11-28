export function useApiClient() {
  const config = useRuntimeConfig();
  const nativePlatform = useNativePlatform();
  const baseUrl = nativePlatform.resolveApiBaseUrl(String(config.public.apiBaseUrl || '/api/v1'));

  async function request<T>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
      query?: Record<string, string | number | undefined>;
      body?: unknown;
      bearerToken?: string | null;
      userId?: string | null;
    } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      'X-App-Source': nativePlatform.isNative() ? 'SGSK-Wealth-Capacitor' : 'SGSK-Wealth-Client',
    };
    if (options.bearerToken) {
      headers.Authorization = `Bearer ${options.bearerToken}`;
    }
    if (options.userId) {
      headers['x-user-id'] = options.userId;
    }

    return await $fetch<T>(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      query: options.query,
      body: options.body as Record<string, unknown> | undefined,
      headers,
      timeout: 15000,
    });
  }

  return { request, baseUrl };
}
