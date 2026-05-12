import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  createDevice,
  deleteDevice,
  listDevices,
  updateDevice,
} from '../api/devices'
import type { Device } from '../types/resources'

const emptyForm = {
  mac_address: '',
  ip: '',
  hostname: '',
  status: 'offline',
  last_seen: '',
}

export const Devices = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  const loadDevices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listDevices()
      setDevices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load devices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDevices()
  }, [loadDevices])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const payload = {
      mac_address: form.mac_address,
      ip: form.ip,
      hostname: form.hostname || null,
      status: form.status,
      last_seen: form.last_seen || null,
    }
    try {
      if (editingId) {
        const updated = await updateDevice(editingId, payload)
        setDevices((prev) =>
          prev.map((device) => (device.id === updated.id ? updated : device)),
        )
      } else {
        const created = await createDevice(payload)
        setDevices((prev) => [created, ...prev])
      }
      setForm(emptyForm)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save device')
    }
  }

  const handleEdit = (device: Device) => {
    setForm({
      mac_address: device.mac_address,
      ip: device.ip,
      hostname: device.hostname ?? '',
      status: device.status,
      last_seen: device.last_seen ?? '',
    })
    setEditingId(device.id)
  }

  const handleDelete = async (device: Device) => {
    setError(null)
    try {
      await deleteDevice(device.id)
      setDevices((prev) => prev.filter((item) => item.id !== device.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete device')
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>Device registry</h1>
        </div>
        <button className="button button-ghost" type="button" onClick={loadDevices}>
          Refresh
        </button>
      </header>

      <div className="page-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Fleet</p>
              <h3>Managed devices</h3>
            </div>
            <span className="pill">{devices.length} total</span>
          </div>
          {loading ? <p className="muted">Loading devices...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="table">
            <div className="table-row table-header">
              <span>Device</span>
              <span>Status</span>
              <span>Last seen</span>
              <span>Actions</span>
            </div>
            {devices.map((device) => (
              <div key={device.id} className="table-row">
                <div>
                  <p className="table-title">{device.hostname || 'Unnamed'}</p>
                  <p className="muted">
                    {device.ip} · {device.mac_address}
                  </p>
                </div>
                <span className="chip">{device.status}</span>
                <span className="muted">
                  {device.last_seen ? new Date(device.last_seen).toLocaleString() : '—'}
                </span>
                <div className="table-actions">
                  <button
                    className="button button-ghost"
                    type="button"
                    onClick={() => handleEdit(device)}
                  >
                    Edit
                  </button>
                  <button
                    className="button button-ghost"
                    type="button"
                    onClick={() => handleDelete(device)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {!loading && devices.length === 0 ? (
              <p className="empty-state">No devices enrolled yet.</p>
            ) : null}
          </div>
        </section>

        <section className="panel panel-highlight">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Enrollment</p>
              <h3>{editingId ? 'Update device' : 'Register device'}</h3>
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
              <span>MAC address</span>
              <input
                type="text"
                value={form.mac_address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, mac_address: event.target.value }))
                }
                required
              />
            </label>
            <label className="field">
              <span>IP address</span>
              <input
                type="text"
                value={form.ip}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, ip: event.target.value }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Hostname</span>
              <input
                type="text"
                value={form.hostname}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, hostname: event.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value }))
                }
              >
                <option value="offline">Offline</option>
                <option value="online">Online</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>
            <label className="field">
              <span>Last seen</span>
              <input
                type="datetime-local"
                value={form.last_seen}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, last_seen: event.target.value }))
                }
              />
            </label>
            <button className="button button-primary" type="submit">
              {editingId ? 'Save changes' : 'Register device'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
