import { tokenStore } from './tokenStore'

export interface RentalUnit {
  _id: string
  name: string
  address: string
  city: string
  state: string
  postalCode: string
  pricePerNight: number
  propertyType: 'apartment' | 'house' | 'villa' | 'studio' | 'condo' | 'other'
  description?: string
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface Reservation {
  _id: string
  rentalUnitId: RentalUnit | string  // populated in list, plain id after create
  guestName: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

export interface DashboardSummary {
  total_units: number
  active_reservations: number
  occupancy_rate: number
  checkins_today: number
  checkouts_today: number
}

export interface DashboardGridDay {
  date: string
  reservation: { id: string; guest_name: string } | null
}

export interface DashboardGridRow {
  property_id: string
  days: DashboardGridDay[]
}

export interface DashboardProperty {
  id: string
  name: string
  bookings: { id: string; guest_name: string; start_date: string; end_date: string }[]
}

export interface WeeklyAvailabilityResponse {
  summary: DashboardSummary
  week_range: { start_date: string; end_date: string }
  properties: DashboardProperty[]
  grid: DashboardGridRow[]
}

export interface MonthlyAvailabilitySummary extends DashboardSummary {
  checkins_this_month: number
  checkouts_this_month: number
}

export interface MonthRange {
  year: number
  month: number
  start_date: string
  end_date: string
  total_days: number
}

export interface MonthlyAvailabilityResponse {
  summary: MonthlyAvailabilitySummary
  month_range: MonthRange
  properties: DashboardProperty[]
  grid: DashboardGridRow[]
}

export interface User {
  _id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export function getUnitId(rentalUnitId: RentalUnit | string): string {
  return typeof rentalUnitId === 'string' ? rentalUnitId : rentalUnitId._id
}

export function getUnitName(rentalUnitId: RentalUnit | string): string {
  return typeof rentalUnitId === 'string' ? rentalUnitId : rentalUnitId.name
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

const BASE = BASE_URL

async function request(path: string, init?: RequestInit, retryOn401 = true): Promise<Response> {
  const token = tokenStore.get()
  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${BASE}${path}`, { ...init, headers })

  if (res.status === 401 && retryOn401 && !path.startsWith('/auth/')) {
    const body = await res.clone().json().catch(() => ({}))
    try {
      const refreshRes = await request('/auth/refresh', { method: 'POST' }, false)
      const refreshBody = await refreshRes.json()
      tokenStore.set(refreshBody.data.accessToken)
      return request(path, init, false)
    } catch {
      tokenStore.set(null)
      tokenStore.expire()
      throw new Error(body.message ?? 'Session expired. Please log in again.')
    }
  }

  return res
}

async function apiFetch<T>(path: string, init?: RequestInit, retryOn401 = true): Promise<T> {
  const res = await request(path, init, retryOn401)
  const body = await res.json()
  if (!res.ok) throw new Error(body.message ?? res.statusText)
  return body.data as T
}

async function apiFetchPaged<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  init?: RequestInit,
): Promise<Paginated<T>> {
  const qs = new URLSearchParams()
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== '') qs.set(k, String(v))
    }
  }
  const url = qs.size ? `${path}?${qs}` : path
  const res = await request(url, init)
  const body = await res.json()
  if (!res.ok) throw new Error(body.message ?? res.statusText)
  return { data: body.data as T[], meta: body.meta as PaginationMeta }
}

export const api = {
  dashboard: {
    weeklyAvailability: async (params: { start_date: string; end_date?: string; property_id?: string }) => {
      const qs = new URLSearchParams({ start_date: params.start_date })
      if (params.end_date)    qs.set('end_date',    params.end_date)
      if (params.property_id) qs.set('property_id', params.property_id)
      const res = await request(`/dashboard/weekly-availability?${qs}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.message ?? res.statusText)
      return body as WeeklyAvailabilityResponse
    },
    monthlyAvailability: async (params: { month: string }) => {
      const res = await request(`/dashboard/monthly-availability?month=${params.month}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.message ?? res.statusText)
      return body as MonthlyAvailabilityResponse
    },
  },
  auth: {
    register: (body: { name: string; email: string; password: string }) =>
      apiFetch<{ user: User; accessToken: string }>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      apiFetch<{ user: User; accessToken: string }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    refresh: () =>
      apiFetch<{ accessToken: string }>('/auth/refresh', { method: 'POST' }, false),
    logout: async () => {
      await apiFetch<Record<string, unknown>>('/auth/logout', { method: 'POST' }, false)
    },
    me: () => apiFetch<User>('/auth/me'),
  },
  rentalUnits: {
    list: (params?: { page?: number; limit?: number }) =>
      apiFetchPaged<RentalUnit>('/rental-units', params),
    create: (form: FormData) =>
      apiFetch<RentalUnit>('/rental-units', { method: 'POST', body: form }),
    update: (id: string, form: FormData) =>
      apiFetch<RentalUnit>(`/rental-units/${id}`, { method: 'PUT', body: form }),
  },
  reservations: {
    list: (params?: { page?: number; limit?: number; rentalUnitId?: string; startDate?: string; endDate?: string }) =>
      apiFetchPaged<Reservation>('/reservations', params),
    create: (body: { rentalUnitId: string; guestName: string; startDate: string; endDate: string }) =>
      apiFetch<Reservation>('/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    update: (id: string, body: { rentalUnitId?: string; guestName?: string; startDate?: string; endDate?: string }) =>
      apiFetch<Reservation>(`/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    delete: (id: string) => apiFetch<Reservation>(`/reservations/${id}`, { method: 'DELETE' }),
  },
}
