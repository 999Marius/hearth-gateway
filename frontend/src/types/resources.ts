export type User = {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
  is_active: boolean
  created_at: string
}

export type Device = {
  id: number
  mac_address: string
  ip: string
  hostname: string | null
  status: string
  last_seen: string | null
  created_at: string
  updated_at: string
}

export type Alert = {
  id: number
  type: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  source: string | null
  acknowledged: boolean
  acknowledged_at: string | null
  created_at: string
}

export type VPNPeer = {
  id: number
  name: string
  public_key: string
  allowed_ips: string
  is_active: boolean
  last_handshake: string | null
  created_at: string
}
