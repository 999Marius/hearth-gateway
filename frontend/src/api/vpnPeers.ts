import { api } from './http'
import type { VPNPeer } from '../types/resources'

export type VPNPeerCreate = {
  name: string
  public_key: string
  allowed_ips: string
  is_active?: boolean
  last_handshake?: string | null
}

export type VPNPeerUpdate = Partial<VPNPeerCreate>

export const listVPNPeers = () => api.get<VPNPeer[]>('/api/v1/vpn-peers')

export const createVPNPeer = (payload: VPNPeerCreate) =>
  api.post<VPNPeer>('/api/v1/vpn-peers', payload)

export const updateVPNPeer = (id: number, payload: VPNPeerUpdate) =>
  api.patch<VPNPeer>(`/api/v1/vpn-peers/${id}`, payload)

export const deleteVPNPeer = (id: number) => api.delete(`/api/v1/vpn-peers/${id}`)
