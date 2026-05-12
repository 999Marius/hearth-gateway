import { api, tokenStorage } from './http'
import type { AuthUser, TokenPair } from '../types/auth'

type LoginPayload = {
  username: string
  password: string
}

export const login = async (payload: LoginPayload): Promise<TokenPair> => {
  const data = await api.post<TokenPair>('/api/v1/auth/login', payload)
  tokenStorage.setTokens(data.access_token, data.refresh_token)
  return data
}

export const fetchMe = () => api.get<AuthUser>('/api/v1/auth/me')

export const logout = () => {
  tokenStorage.clear()
}
