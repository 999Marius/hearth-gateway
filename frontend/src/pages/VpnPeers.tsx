import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  createVPNPeer,
  deleteVPNPeer,
  listVPNPeers,
  updateVPNPeer,
} from '../api/vpnPeers'
import type { VPNPeer } from '../types/resources'

const emptyForm = {
  name: '',
  public_key: '',
  allowed_ips: '',
  is_active: true,
  last_handshake: '',
}

export const VpnPeers = () => {
  const [peers, setPeers] = useState<VPNPeer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  const loadPeers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listVPNPeers()
      setPeers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load VPN peers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPeers()
  }, [loadPeers])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const payload = {
      name: form.name,
      public_key: form.public_key,
      allowed_ips: form.allowed_ips,
      is_active: form.is_active,
      last_handshake: form.last_handshake || null,
    }
    try {
      if (editingId) {
        const updated = await updateVPNPeer(editingId, payload)
        setPeers((prev) =>
          prev.map((peer) => (peer.id === updated.id ? updated : peer)),
        )
      } else {
        const created = await createVPNPeer(payload)
        setPeers((prev) => [created, ...prev])
      }
      setForm(emptyForm)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save VPN peer')
    }
  }

  const handleEdit = (peer: VPNPeer) => {
    setForm({
      name: peer.name,
      public_key: peer.public_key,
      allowed_ips: peer.allowed_ips,
      is_active: peer.is_active,
      last_handshake: peer.last_handshake ?? '',
    })
    setEditingId(peer.id)
  }

  const handleDelete = async (peer: VPNPeer) => {
    setError(null)
    try {
      await deleteVPNPeer(peer.id)
      setPeers((prev) => prev.filter((item) => item.id !== peer.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete VPN peer')
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Connectivity</p>
          <h1>VPN peer management</h1>
        </div>
        <button className="button button-ghost" type="button" onClick={loadPeers}>
          Refresh
        </button>
      </header>

      <div className="page-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Peers</p>
              <h3>Secure channels</h3>
            </div>
            <span className="pill">{peers.length} total</span>
          </div>
          {loading ? <p className="muted">Loading VPN peers...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="table">
            <div className="table-row table-header">
              <span>Peer</span>
              <span>Status</span>
              <span>Last handshake</span>
              <span>Actions</span>
            </div>
            {peers.map((peer) => (
              <div key={peer.id} className="table-row">
                <div>
                  <p className="table-title">{peer.name}</p>
                  <p className="muted">{peer.allowed_ips}</p>
                </div>
                <span className={`status ${peer.is_active ? 'healthy' : 'offline'}`}>
                  {peer.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="muted">
                  {peer.last_handshake
                    ? new Date(peer.last_handshake).toLocaleString()
                    : '—'}
                </span>
                <div className="table-actions">
                  <button
                    className="button button-ghost"
                    type="button"
                    onClick={() => handleEdit(peer)}
                  >
                    Edit
                  </button>
                  <button
                    className="button button-ghost"
                    type="button"
                    onClick={() => handleDelete(peer)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {!loading && peers.length === 0 ? (
              <p className="empty-state">No VPN peers configured.</p>
            ) : null}
          </div>
        </section>

        <section className="panel panel-highlight">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Provision</p>
              <h3>{editingId ? 'Update peer' : 'Add VPN peer'}</h3>
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
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Public key</span>
              <input
                type="text"
                value={form.public_key}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, public_key: event.target.value }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Allowed IPs</span>
              <input
                type="text"
                value={form.allowed_ips}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, allowed_ips: event.target.value }))
                }
                required
              />
            </label>
            <label className="field field-inline">
              <span>Active</span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, is_active: event.target.checked }))
                }
              />
            </label>
            <label className="field">
              <span>Last handshake</span>
              <input
                type="datetime-local"
                value={form.last_handshake}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    last_handshake: event.target.value,
                  }))
                }
              />
            </label>
            <button className="button button-primary" type="submit">
              {editingId ? 'Save changes' : 'Add peer'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
