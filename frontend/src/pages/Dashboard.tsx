import { useEffect, useMemo, useState } from 'react'
import { listAlerts } from '../api/alerts'
import { listDevices } from '../api/devices'
import { listUsers } from '../api/users'
import { listVPNPeers } from '../api/vpnPeers'
import type { Alert, Device, User, VPNPeer } from '../types/resources'

type ActivityItem = {
  title: string
  meta: string
  time: string
  tone: 'critical' | 'warning' | 'info' | 'neutral'
}

const toRelativeTime = (value: string | null) => {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  const minutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return `${days} d ago`
}

const toDeviceStatus = (status: string) => {
  const normalized = status.toLowerCase()
  if (normalized === 'online') return 'Healthy'
  if (normalized === 'maintenance') return 'Monitoring'
  if (normalized === 'offline') return 'Offline'
  return status
}

export const Dashboard = () => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [peers, setPeers] = useState<VPNPeer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [alertData, deviceData, userData, peerData] = await Promise.all([
          listAlerts(),
          listDevices(),
          listUsers(),
          listVPNPeers(),
        ])
        setAlerts(alertData)
        setDevices(deviceData)
        setUsers(userData)
        setPeers(peerData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const metrics = useMemo(() => {
    const criticalAlerts = alerts.filter(
      (alert) => alert.severity === 'critical' && !alert.acknowledged,
    )
    const activeDevices = devices.filter(
      (device) => device.status.toLowerCase() === 'online',
    )
    return [
      {
        label: 'Active devices',
        value: activeDevices.length.toString(),
        delta: `${devices.length} total`,
      },
      {
        label: 'Critical alerts',
        value: criticalAlerts.length.toString(),
        delta: `${alerts.length} total`,
      },
      {
        label: 'VPN peers',
        value: peers.length.toString(),
        delta: `${peers.filter((peer) => peer.is_active).length} active`,
      },
      {
        label: 'Users',
        value: users.length.toString(),
        delta: `${users.filter((user) => user.is_active).length} active`,
      },
    ]
  }, [alerts, devices, peers, users])

  const activity = useMemo<ActivityItem[]>(() => {
    const alertItems = alerts.slice(0, 2).map((alert) => ({
      title: alert.acknowledged ? 'Alert acknowledged' : 'Alert opened',
      meta: `${alert.type} · ${alert.severity}`,
      time: toRelativeTime(alert.created_at),
      tone: alert.severity,
    }))
    const deviceItems = devices.slice(0, 1).map((device) => ({
      title: 'Device enrolled',
      meta: device.hostname ?? device.mac_address,
      time: toRelativeTime(device.created_at),
      tone: 'info' as const,
    }))
    const userItems = users.slice(0, 1).map((user) => ({
      title: 'User added',
      meta: `${user.username} · ${user.role}`,
      time: toRelativeTime(user.created_at),
      tone: 'neutral' as const,
    }))
    const peerItems = peers.slice(0, 1).map((peer) => ({
      title: 'VPN peer updated',
      meta: peer.name,
      time: toRelativeTime(peer.created_at),
      tone: 'warning' as const,
    }))
    return [...alertItems, ...deviceItems, ...peerItems, ...userItems].slice(0, 4)
  }, [alerts, devices, users, peers])

  const priorityDevices = useMemo(
    () =>
      devices
        .slice()
        .sort((a, b) => (b.last_seen ?? '').localeCompare(a.last_seen ?? ''))
        .slice(0, 3),
    [devices],
  )

  return (
    <>
    <header className="topbar">
      <div>
        <p className="eyebrow">Welcome back</p>
        <h1>Security posture at a glance</h1>
      </div>
      <div className="topbar-actions">
        <button className="button button-ghost" type="button">
          Generate report
        </button>
        <button className="button button-primary" type="button">
          New alert rule
        </button>
      </div>
    </header>

        <main className="content">
          {error ? <p className="form-error">{error}</p> : null}
          <section className="hero">
        <div>
          <p className="eyebrow">Risk summary</p>
          <h2>Premium-grade visibility across every gateway.</h2>
          <p className="lead">
            Track device health, respond to escalations, and keep VPN peers
            aligned with the latest security posture.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" type="button">
              View live alerts
            </button>
            <button className="button button-ghost" type="button">
              Sync device inventory
            </button>
          </div>
        </div>
        <div className="hero-panel">
          <p className="eyebrow">Live shield</p>
          <div className="shield">
            <div className="shield-core">
              <span>99.98%</span>
              <p>Policy adherence</p>
            </div>
            <div className="shield-ring"></div>
          </div>
          <div className="shield-meta">
            <span>8 policies updated today</span>
            <span>0 anomalies pending</span>
          </div>
        </div>
      </section>

      <section className="metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <p className="eyebrow">{metric.label}</p>
            <div className="metric-value">
              <span>{loading ? '—' : metric.value}</span>
              <span className="metric-delta">{metric.delta}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Activity</p>
              <h3>Operational timeline</h3>
            </div>
            <button className="button button-ghost" type="button">
              View all
            </button>
          </div>
          <ul className="timeline">
            {loading ? (
              <li className="timeline-item neutral">
                <div>
                  <p className="timeline-title">Loading activity…</p>
                  <p className="muted">Fetching live operations</p>
                </div>
                <span className="timeline-time">—</span>
              </li>
            ) : null}
            {!loading && activity.length === 0 ? (
              <li className="timeline-item neutral">
                <div>
                  <p className="timeline-title">No activity yet</p>
                  <p className="muted">Recent updates will appear here.</p>
                </div>
                <span className="timeline-time">—</span>
              </li>
            ) : null}
            {activity.map((item) => (
              <li key={`${item.title}-${item.time}`} className={`timeline-item ${item.tone}`}>
                <div>
                  <p className="timeline-title">{item.title}</p>
                  <p className="muted">{item.meta}</p>
                </div>
                <span className="timeline-time">{item.time}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel panel-highlight">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Device health</p>
              <h3>Priority gateways</h3>
            </div>
            <span className="pill">{priorityDevices.length} monitored</span>
          </div>
          <div className="device-list">
            {priorityDevices.map((device) => {
              const displayStatus = toDeviceStatus(device.status)
              return (
                <div key={device.id} className="device-card">
                  <div>
                    <p className="device-name">{device.hostname || 'Unnamed device'}</p>
                    <p className="muted">{device.ip}</p>
                  </div>
                  <span className={`status ${displayStatus.toLowerCase()}`}>
                    {displayStatus}
                  </span>
                </div>
              )
            })}
            {!loading && priorityDevices.length === 0 ? (
              <p className="empty-state">No devices enrolled yet.</p>
            ) : null}
          </div>
          <div className="panel-footer">
            <button className="button button-primary" type="button">
              Run diagnostics
            </button>
            <button className="button button-ghost" type="button">
              Export
            </button>
          </div>
        </article>
      </section>
    </main>
  </>
  )
}
