import { api } from './http'
import type { Alert } from '../types/resources'

export type AlertCreate = {
  type: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  source?: string | null
  acknowledged?: boolean
}

export type AlertUpdate = Partial<AlertCreate>

export const listAlerts = () => api.get<Alert[]>('/api/v1/alerts')

export const createAlert = (payload: AlertCreate) =>
  api.post<Alert>('/api/v1/alerts', payload)

export const updateAlert = (id: number, payload: AlertUpdate) =>
  api.patch<Alert>(`/api/v1/alerts/${id}`, payload)

export const deleteAlert = (id: number) => api.delete(`/api/v1/alerts/${id}`)
