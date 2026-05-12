import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export const AppLayout = () => {
  const { user, signOut } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">HG</span>
          <div>
            <p className="brand-title">Hearth Gateway</p>
            <p className="brand-sub">Secure operations</p>
          </div>
        </div>

        <nav className="nav">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link${isActive ? ' is-active' : ''}`
            }
          >
            Overview
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `nav-link${isActive ? ' is-active' : ''}`
            }
          >
            Users
          </NavLink>
          <NavLink
            to="/devices"
            className={({ isActive }) =>
              `nav-link${isActive ? ' is-active' : ''}`
            }
          >
            Devices
          </NavLink>
          <NavLink
            to="/alerts"
            className={({ isActive }) =>
              `nav-link${isActive ? ' is-active' : ''}`
            }
          >
            Alerts
          </NavLink>
          <NavLink
            to="/vpn-peers"
            className={({ isActive }) =>
              `nav-link${isActive ? ' is-active' : ''}`
            }
          >
            VPN peers
          </NavLink>
        </nav>

        <div className="sidebar-card">
          <p className="eyebrow">Current operator</p>
          <h3>{user?.username ?? 'Unknown'}</h3>
          <p className="muted">{user?.email ?? 'No email provided'}</p>
          <button className="button button-ghost" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <Outlet />
      </div>
    </div>
  )
}
