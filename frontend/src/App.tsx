import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { AppLayout } from './components/layout/AppLayout'
import { Alerts } from './pages/Alerts'
import { Dashboard } from './pages/Dashboard'
import { Devices } from './pages/Devices'
import { Login } from './pages/Login'
import { Users } from './pages/Users'
import { VpnPeers } from './pages/VpnPeers'

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="devices" element={<Devices />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="vpn-peers" element={<VpnPeers />} />
      </Route>
    </Routes>
  </BrowserRouter>
)

export default App
