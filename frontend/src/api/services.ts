import { api } from './http'

export type ServiceStatus = {
  name: string
  active: boolean
  enabled: boolean
  active_state: string
}

export type WireguardSummary = {
  interface: string
  listen_port: string | null
  address: string | null
  peer_count: number
}

export type WireguardPeer = {
  public_key: string
  endpoint: string
  allowed_ips: string
  latest_handshake: number
  transfer_rx: number
  transfer_tx: number
  persistent_keepalive: number
}

export type PiholeStats = {
  total_queries: number
  blocked_queries: number
  updated_at: number
}

export const getWireguardStatus = () =>
  api.get<ServiceStatus>('/api/v1/services/wireguard/status')
export const startWireguard = () =>
  api.post<ServiceStatus>('/api/v1/services/wireguard/start')
export const stopWireguard = () =>
  api.post<ServiceStatus>('/api/v1/services/wireguard/stop')
export const restartWireguard = () =>
  api.post<ServiceStatus>('/api/v1/services/wireguard/restart')
export const getWireguardSummary = () =>
  api.get<WireguardSummary>('/api/v1/services/wireguard/summary')
export const getWireguardPeers = () =>
  api.get<WireguardPeer[]>('/api/v1/services/wireguard/peers')

export const getPiholeStatus = () =>
  api.get<ServiceStatus>('/api/v1/services/pihole/status')
export const startPihole = () =>
  api.post<ServiceStatus>('/api/v1/services/pihole/start')
export const stopPihole = () =>
  api.post<ServiceStatus>('/api/v1/services/pihole/stop')
export const restartPihole = () =>
  api.post<ServiceStatus>('/api/v1/services/pihole/restart')
export const getPiholeStats = () =>
  api.get<PiholeStats>('/api/v1/services/pihole/stats')
