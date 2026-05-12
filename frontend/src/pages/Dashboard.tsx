const metrics = [
  { label: 'Active devices', value: '128', delta: '+12%' },
  { label: 'Critical alerts', value: '3', delta: '−2' },
  { label: 'VPN peers', value: '46', delta: '+4' },
  { label: 'Admin uptime', value: '99.98%', delta: '30d' },
]

const activity = [
  {
    title: 'Alert acknowledged',
    meta: 'Hearth Edge · Critical',
    time: '2 min ago',
    tone: 'critical',
  },
  {
    title: 'New device enrolled',
    meta: 'MAC 8C:2D:AA:19:7F:61',
    time: '12 min ago',
    tone: 'info',
  },
  {
    title: 'VPN peer rotated',
    meta: 'Gateway East · Key refresh',
    time: '41 min ago',
    tone: 'warning',
  },
  {
    title: 'User role updated',
    meta: 'm.kensley → admin',
    time: '1 hr ago',
    tone: 'neutral',
  },
]

const devices = [
  { name: 'Hearth Edge', status: 'Healthy', ip: '10.20.18.21' },
  { name: 'Transit Relay', status: 'Monitoring', ip: '10.20.18.77' },
  { name: 'Northbridge', status: 'Offline', ip: '10.20.18.12' },
]

export const Dashboard = () => (
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
              <span>{metric.value}</span>
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
            {activity.map((item) => (
              <li key={item.title} className={`timeline-item ${item.tone}`}>
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
            <span className="pill">3 monitored</span>
          </div>
          <div className="device-list">
            {devices.map((device) => (
              <div key={device.name} className="device-card">
                <div>
                  <p className="device-name">{device.name}</p>
                  <p className="muted">{device.ip}</p>
                </div>
                <span className={`status ${device.status.toLowerCase()}`}>
                  {device.status}
                </span>
              </div>
            ))}
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
