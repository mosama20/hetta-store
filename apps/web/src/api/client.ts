export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '' && envUrl !== '/api' && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }

  if (typeof window !== 'undefined') {
    // Local desktop dev on Vite port 5173
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost && window.location.port === '5173') {
      return `http://${window.location.hostname}:4000/api`;
    }
    // Mobile browsers, local network WiFi, Vercel serverless, or production domains
    return '/api';
  }

  return 'http://localhost:4000/api';
}

const API_BASE_URL = getApiBaseUrl();

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let accessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('fs_access_token') : null;
let refreshToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('fs_refresh_token') : null;

export function setTokens(access: string | null, refresh?: string | null) {
  accessToken = access;
  if (typeof window !== 'undefined') {
    if (access) {
      localStorage.setItem('fs_access_token', access);
    } else {
      localStorage.removeItem('fs_access_token');
    }

    if (refresh !== undefined) {
      refreshToken = refresh;
      if (refresh) {
        localStorage.setItem('fs_refresh_token', refresh);
      } else {
        localStorage.removeItem('fs_refresh_token');
      }
    }
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const currentRefresh = getRefreshToken();
  if (!currentRefresh) return false;

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefresh }),
      });

      if (!res.ok) {
        setTokens(null, null);
        return false;
      }

      const json = await res.json();
      const data = json.data || json;
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      setTokens(null, null);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized token refresh
    if (response.status === 401 && refreshToken && !endpoint.includes('/auth/')) {
      const refreshed = await tryRefreshToken();
      if (refreshed && accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        });
        if (retryResponse.ok) {
          const json = await retryResponse.json();
          return json.data !== undefined ? json.data : json;
        }
      }
    }

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorCode = 'HTTP_ERROR';
      let errorDetails: unknown = undefined;

      try {
        const errorJson = await response.json();
        if (errorJson.error) {
          errorMsg = errorJson.error.message || errorMsg;
          errorCode = errorJson.error.code || errorCode;
          errorDetails = errorJson.error.details;
        } else if (errorJson.message) {
          errorMsg = Array.isArray(errorJson.message)
            ? errorJson.message.join(', ')
            : errorJson.message;
        }
      } catch {
        // Body wasn't JSON
      }

      throw new ApiError(response.status, errorMsg, errorCode, errorDetails);
    }

    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      0,
      err instanceof Error ? err.message : 'Network error or service unavailable',
      'NETWORK_ERROR',
      err,
    );
  }
}

