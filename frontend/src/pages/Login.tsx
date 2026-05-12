import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const Login = () => {
  const { user, signIn, status, error } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await signIn(username, password)
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div>
          <p className="eyebrow">Hearth Gateway</p>
          <h1>Secure access</h1>
          <p className="muted">
            Sign in to supervise device health, alerts, and VPN integrity.
          </p>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button
            className="button button-primary"
            type="submit"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Signing in...' : 'Enter console'}
          </button>
        </form>
      </div>
    </div>
  )
}
