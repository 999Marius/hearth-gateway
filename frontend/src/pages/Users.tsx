import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createUser, deleteUser, listUsers, updateUser } from '../api/users'
import type { User } from '../types/resources'

type UserForm = {
  username: string
  email: string
  role: 'admin' | 'user'
  is_active: boolean
  password: string
}

const emptyForm: UserForm = {
  username: '',
  email: '',
  role: 'user',
  is_active: true,
  password: '',
}

export const Users = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listUsers()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers()
  }, [loadUsers])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      if (editingId) {
        const payload: {
          username?: string
          email?: string
          role?: 'admin' | 'user'
          is_active?: boolean
          password?: string
        } = {
          username: form.username,
          email: form.email,
          role: form.role,
          is_active: form.is_active,
        }
        if (form.password.trim()) {
          payload.password = form.password
        }
        const updated = await updateUser(editingId, payload)
        setUsers((prev) =>
          prev.map((user) => (user.id === updated.id ? updated : user)),
        )
      } else {
        const created = await createUser(form)
        setUsers((prev) => [created, ...prev])
      }
      setForm(emptyForm)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save user')
    }
  }

  const handleEdit = (user: User) => {
    setForm({
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      password: '',
    })
    setEditingId(user.id)
  }

  const handleDelete = async (user: User) => {
    setError(null)
    try {
      await deleteUser(user.id)
      setUsers((prev) => prev.filter((item) => item.id !== user.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete user')
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Identity</p>
          <h1>User operations</h1>
        </div>
        <button className="button button-ghost" type="button" onClick={loadUsers}>
          Refresh
        </button>
      </header>

      <div className="page-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Registry</p>
              <h3>Active users</h3>
            </div>
            <span className="pill">{users.length} total</span>
          </div>
          {loading ? <p className="muted">Loading users...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="table">
            <div className="table-row table-header">
              <span>User</span>
              <span>Role</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {users.map((user) => (
              <div key={user.id} className="table-row">
                <div>
                  <p className="table-title">{user.username}</p>
                  <p className="muted">{user.email}</p>
                </div>
                <span className="chip">{user.role}</span>
                <span className={`status ${user.is_active ? 'healthy' : 'offline'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="table-actions">
                  <button
                    className="button button-ghost"
                    type="button"
                    onClick={() => handleEdit(user)}
                  >
                    Edit
                  </button>
                  <button
                    className="button button-ghost"
                    type="button"
                    onClick={() => handleDelete(user)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {!loading && users.length === 0 ? (
              <p className="empty-state">No users registered yet.</p>
            ) : null}
          </div>
        </section>

        <section className="panel panel-highlight">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Access</p>
              <h3>{editingId ? 'Update user' : 'Create user'}</h3>
            </div>
            {editingId ? (
              <button
                className="button button-ghost"
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
              >
                Clear
              </button>
            ) : null}
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Username</span>
              <input
                type="text"
                value={form.username}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, username: event.target.value }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder={editingId ? 'Leave blank to keep' : ''}
                required={!editingId}
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    role: event.target.value as 'admin' | 'user',
                  }))
                }
              >
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </label>
            <label className="field field-inline">
              <span>Active</span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    is_active: event.target.checked,
                  }))
                }
              />
            </label>
            <button className="button button-primary" type="submit">
              {editingId ? 'Save changes' : 'Create user'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
