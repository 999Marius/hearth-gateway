import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchMe, login, logout } from '../api/auth'
import { AuthContext, type AuthState } from './authContext'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthState['user']>(null)
  const [status, setStatus] = useState<AuthState['status']>('idle')
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const profile = await fetchMe()
      setUser(profile)
      setStatus('authenticated')
    } catch (err) {
      setUser(null)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unable to fetch profile')
    }
  }, [])

  const signIn = useCallback(async (username: string, password: string) => {
    setStatus('loading')
    setError(null)
    try {
      await login({ username, password })
      await refreshProfile()
    } catch (err) {
      setUser(null)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    }
  }, [refreshProfile])

  const signOut = useCallback(() => {
    logout()
    setUser(null)
    setStatus('idle')
    setError(null)
  }, [])

  useEffect(() => {
    const hasToken = localStorage.getItem('hg_access_token')
    if (hasToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshProfile()
    }
  }, [refreshProfile])

  const value = useMemo(
    () => ({ user, status, error, signIn, signOut, refreshProfile }),
    [user, status, error, signIn, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
