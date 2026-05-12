const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? 'http://localhost:8000'

const ACCESS_TOKEN_KEY = 'hg_access_token'
const REFRESH_TOKEN_KEY = 'hg_refresh_token'

export const tokenStorage = {
  getAccess() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  getRefresh() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  setTokens(access: string, refresh: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

type FetchOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown
  headers?: Record<string, string>
}

const parseError = async (response: Response): Promise<string> => {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const data = (await response.json()) as { detail?: string }
    return data.detail ?? 'Request failed'
  }
  return response.statusText || 'Request failed'
}

const request = async <T>(
  path: string,
  options: FetchOptions = {},
  allowRefresh = true,
): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const token = tokenStorage.getAccess()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401 && allowRefresh) {
    const refreshed = await refreshToken()
    if (refreshed) {
      return request(path, options, false)
    }
  }

  if (!response.ok) {
    const message = await parseError(response)
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

const refreshToken = async (): Promise<boolean> => {
  const refresh = tokenStorage.getRefresh()
  if (!refresh) {
    return false
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  })

  if (!response.ok) {
    tokenStorage.clear()
    return false
  }

  const data = (await response.json()) as {
    access_token: string
    refresh_token: string
  }
  tokenStorage.setTokens(data.access_token, data.refresh_token)
  return true
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
}
