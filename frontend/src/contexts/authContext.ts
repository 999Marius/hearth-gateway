import { createContext } from 'react'

export type AuthState = {
  user: {
    id: number
    username: string
    email: string
    role: 'admin' | 'user'
    is_active: boolean
    created_at: string
  } | null
  status: 'idle' | 'loading' | 'authenticated' | 'error'
  error: string | null
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => void
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthState | undefined>(undefined)
