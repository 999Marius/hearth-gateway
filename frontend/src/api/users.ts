import { api } from './http'
import type { User } from '../types/resources'

export type UserCreate = {
  username: string
  email: string
  password: string
  role: 'admin' | 'user'
  is_active: boolean
}

export type UserUpdate = {
  username?: string
  email?: string
  password?: string
  role?: 'admin' | 'user'
  is_active?: boolean
}

export const listUsers = () => api.get<User[]>('/api/v1/users')

export const createUser = (payload: UserCreate) =>
  api.post<User>('/api/v1/users', payload)

export const updateUser = (id: number, payload: UserUpdate) =>
  api.patch<User>(`/api/v1/users/${id}`, payload)

export const deleteUser = (id: number) => api.delete(`/api/v1/users/${id}`)
