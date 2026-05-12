export type TokenPair = {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

export type AuthUser = {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
  is_active: boolean
  created_at: string
}
