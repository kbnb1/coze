const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export const API_BASE_URL = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1`;

export async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any;
    token?: string | null;
  } = {}
): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data as T;
}
