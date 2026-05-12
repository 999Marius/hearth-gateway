import { api, tokenStorage } from './http'
import type { AuthUser, TokenPair } from '../types/auth'

type LoginPayload = {
  username: string
  password: string
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? 'http://localhost:8000'

export const login = async (payload: LoginPayload): Promise<TokenPair> => {
  const form = new URLSearchParams()
  form.set('username', payload.username)
  form.set('password', payload.password)
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  if (!response.ok) {
    const data = (await response.json()) as { detail?: string }
    throw new Error(data.detail ?? 'Unable to sign in')
  }

  const data = (await response.json()) as TokenPair
  tokenStorage.setTokens(data.access_token, data.refresh_token)
  return data
}

export const fetchMe = () => api.get<AuthUser>('/api/v1/auth/me')

export const logout = () => {
  tokenStorage.clear()
}
