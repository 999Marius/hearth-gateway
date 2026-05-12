import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createAlert, deleteAlert, listAlerts, updateAlert } from '../api/alerts'
import type { Alert } from '../types/resources'

type AlertForm = {
  type: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  source: string
  acknowledged: boolean
}

const emptyForm: AlertForm = {
  type: '',
  severity: 'info',
  message: '',
  source: '',
  acknowledged: false,
}

export const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  const loadAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listAlerts()
      setAlerts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load alerts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAlerts()
  }, [loadAlerts])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const payload = {
      type: form.type,
      severity: form.severity,
      message: form.message,
      source: form.source || null,
      acknowledged: form.acknowledged,
    }
    try {
      if (editingId) {
        const updated = await updateAlert(editingId, payload)
        setAlerts((prev) =>
          prev.map((alert) => (alert.id === updated.id ? updated : alert)),
        )
      } else {
        const created = await createAlert(payload)
        setAlerts((prev) => [created, ...prev])
      }
      setForm(emptyForm)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save alert')
    }
  }

  const handleEdit = (alert: Alert) => {
    setForm({
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      source: alert.source ?? '',
      acknowledged: alert.acknowledged,
    })
    setEditingId(alert.id)
  }

  const handleDelete = async (alert: Alert) => {
    setError(null)
    try {
      await deleteAlert(alert.id)
      setAlerts((prev) => prev.filter((item) => item.id !== alert.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete alert')
    }
  }

  const handleAcknowledge = async (alert: Alert) => {
    setError(null)
    try {
      const updated = await updateAlert(alert.id, { acknowledged: true })
      setAlerts((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to acknowledge alert')
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Detection</p>
          <h1>Alert intelligence</h1>
        </div>
        <button className="button button-ghost" type="button" onClick={loadAlerts}>
          Refresh
        </button>
      </header>

      <div className="page-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Stream</p>
              <h3>Live alerts</h3>
            </div>
            <span className="pill">{alerts.length} total</span>
          </div>
          {loading ? <p className="muted">Loading alerts...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="table">
            <div className="table-row table-header">
              <span>Alert</span>
              <span>Severity</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {alerts.map((alert) => (
              <div key={alert.id} className="table-row">
                <div>
                  <p className="table-title">{alert.type}</p>
                  <p className="muted">{alert.message}</p>
                </div>
                <span className={`chip chip-${alert.severity}`}>
                  {alert.severity}
                </span>
                <span className={`status ${alert.acknowledged ? 'healthy' : 'offline'}`}>
                  {alert.acknowledged ? 'Acknowledged' : 'Open'}
                </span>
                <div className="table-actions">
                  {!alert.acknowledged ? (
                    <button
                      className="button button-ghost"
                      type="button"
                      onClick={() => handleAcknowledge(alert)}
                    >
                      Acknowledge
                    </button>
                  ) : null}
                  <button
                    className="button button-ghost"
                    type="button"
                    onClick={() => handleEdit(alert)}
                  >
                    Edit
                  </button>
                  <button
                    className="button button-ghost"
                    type="button"
                    onClick={() => handleDelete(alert)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {!loading && alerts.length === 0 ? (
              <p className="empty-state">No alerts in the stream.</p>
            ) : null}
          </div>
        </section>

        <section className="panel panel-highlight">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Signal</p>
              <h3>{editingId ? 'Update alert' : 'Create alert'}</h3>
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
              <span>Type</span>
              <input
                type="text"
                value={form.type}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, type: event.target.value }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Severity</span>
              <select
                value={form.severity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    severity: event.target.value as 'info' | 'warning' | 'critical',
                  }))
                }
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <label className="field">
              <span>Message</span>
              <textarea
                value={form.message}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, message: event.target.value }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Source</span>
              <input
                type="text"
                value={form.source}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, source: event.target.value }))
                }
              />
            </label>
            <label className="field field-inline">
              <span>Acknowledged</span>
              <input
                type="checkbox"
                checked={form.acknowledged}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, acknowledged: event.target.checked }))
                }
              />
            </label>
            <button className="button button-primary" type="submit">
              {editingId ? 'Save changes' : 'Create alert'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
