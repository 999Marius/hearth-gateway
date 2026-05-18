import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getPiholeStats,
  getPiholeStatus,
  getWireguardPeers,
  getWireguardStatus,
  getWireguardSummary,
  restartPihole,
  restartWireguard,
  startPihole,
  startWireguard,
  stopPihole,
  stopWireguard,
  type PiholeStats,
  type ServiceStatus,
  type WireguardPeer,
  type WireguardSummary,
} from '../api/services'

const formatTimestamp = (value?: number) => {
  if (!value) return '—'
  return new Date(value * 1000).toLocaleString()
}

export const Services = () => {
  const [wireguardStatus, setWireguardStatus] = useState<ServiceStatus | null>(
    null,
  )
  const [piholeStatus, setPiholeStatus] = useState<ServiceStatus | null>(null)
  const [wireguardSummary, setWireguardSummary] =
    useState<WireguardSummary | null>(null)
  const [wireguardPeers, setWireguardPeers] = useState<WireguardPeer[]>([])
  const [piholeStats, setPiholeStats] = useState<PiholeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        wgStatus,
        wgSummary,
        wgPeers,
        phStatus,
        phStats,
      ] = await Promise.all([
        getWireguardStatus(),
        getWireguardSummary(),
        getWireguardPeers(),
        getPiholeStatus(),
        getPiholeStats(),
      ])
      setWireguardStatus(wgStatus)
      setWireguardSummary(wgSummary)
      setWireguardPeers(wgPeers)
      setPiholeStatus(phStatus)
      setPiholeStats(phStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load services')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  const wireguardBadge = useMemo(
    () => (wireguardStatus?.active ? 'healthy' : 'offline'),
    [wireguardStatus],
  )
  const piholeBadge = useMemo(
    () => (piholeStatus?.active ? 'healthy' : 'offline'),
    [piholeStatus],
  )

  const handleAction = async (action: () => Promise<ServiceStatus>) => {
    setError(null)
    try {
      const status = await action()
      if (status.name.includes('wg-quick')) {
        setWireguardStatus(status)
      } else {
        setPiholeStatus(status)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Service control</h1>
        </div>
        <button className="button button-ghost" type="button" onClick={refresh}>
          Refresh
        </button>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="page-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">WireGuard</p>
              <h3>Secure tunnel</h3>
            </div>
            <span className={`status ${wireguardBadge}`}>
              {wireguardStatus?.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="service-grid">
            <div>
              <p className="muted">Interface</p>
              <p className="service-value">
                {wireguardSummary?.interface ?? '—'}
              </p>
            </div>
            <div>
              <p className="muted">Listen port</p>
              <p className="service-value">
                {wireguardSummary?.listen_port ?? '—'}
              </p>
            </div>
            <div>
              <p className="muted">Address</p>
              <p className="service-value">
                {wireguardSummary?.address ?? '—'}
              </p>
            </div>
            <div>
              <p className="muted">Peers</p>
              <p className="service-value">
                {wireguardSummary?.peer_count ?? 0}
              </p>
            </div>
          </div>
          <div className="panel-footer">
            <button
              className="button button-primary"
              type="button"
              disabled={loading}
              onClick={() => handleAction(startWireguard)}
            >
              Start
            </button>
            <button
              className="button button-ghost"
              type="button"
              disabled={loading}
              onClick={() => handleAction(stopWireguard)}
            >
              Stop
            </button>
            <button
              className="button button-ghost"
              type="button"
              disabled={loading}
              onClick={() => handleAction(restartWireguard)}
            >
              Restart
            </button>
          </div>
          <div className="table compact-table">
            <div className="table-row table-header">
              <span>Peer</span>
              <span>Endpoint</span>
              <span>Allowed IPs</span>
              <span>Handshake</span>
            </div>
            {wireguardPeers.map((peer) => (
              <div key={peer.public_key} className="table-row">
                <p className="table-title">{peer.public_key.slice(0, 18)}…</p>
                <p className="muted">{peer.endpoint || '—'}</p>
                <p className="muted">{peer.allowed_ips}</p>
                <p className="muted">
                  {peer.latest_handshake === 0
                    ? 'Never'
                    : formatTimestamp(peer.latest_handshake)}
                </p>
              </div>
            ))}
            {!loading && wireguardPeers.length === 0 ? (
              <p className="empty-state">No peers reported yet.</p>
            ) : null}
          </div>
        </section>

        <section className="panel panel-highlight">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Pi-hole</p>
              <h3>Ad-blocking core</h3>
            </div>
            <span className={`status ${piholeBadge}`}>
              {piholeStatus?.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="service-grid">
            <div>
              <p className="muted">Total queries</p>
              <p className="service-value">
                {piholeStats?.total_queries ?? 0}
              </p>
            </div>
            <div>
              <p className="muted">Blocked queries</p>
              <p className="service-value">
                {piholeStats?.blocked_queries ?? 0}
              </p>
            </div>
            <div>
              <p className="muted">Last update</p>
              <p className="service-value">
                {formatTimestamp(piholeStats?.updated_at)}
              </p>
            </div>
            <div>
              <p className="muted">Service unit</p>
              <p className="service-value">pihole-FTL</p>
            </div>
          </div>
          <div className="panel-footer">
            <button
              className="button button-primary"
              type="button"
              disabled={loading}
              onClick={() => handleAction(startPihole)}
            >
              Start
            </button>
            <button
              className="button button-ghost"
              type="button"
              disabled={loading}
              onClick={() => handleAction(stopPihole)}
            >
              Stop
            </button>
            <button
              className="button button-ghost"
              type="button"
              disabled={loading}
              onClick={() => handleAction(restartPihole)}
            >
              Restart
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
