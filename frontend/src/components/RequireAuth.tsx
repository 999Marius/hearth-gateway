import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const RequireAuth = ({ children }: { children: ReactElement }) => {
  const { user, status } = useAuth()

  if (status === 'loading') {
    return <div className="page-shell">Loading secure session...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
