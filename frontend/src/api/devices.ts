import { api } from './http'
import type { Device } from '../types/resources'

export type DeviceCreate = {
  mac_address: string
  ip: string
  hostname?: string | null
  status?: string
  last_seen?: string | null
}

export type DeviceUpdate = Partial<DeviceCreate>

export const listDevices = () => api.get<Device[]>('/api/v1/devices')

export const createDevice = (payload: DeviceCreate) =>
  api.post<Device>('/api/v1/devices', payload)

export const updateDevice = (id: number, payload: DeviceUpdate) =>
  api.patch<Device>(`/api/v1/devices/${id}`, payload)

export const deleteDevice = (id: number) => api.delete(`/api/v1/devices/${id}`)
