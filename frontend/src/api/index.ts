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

export function getUnitId(rentalUnitId: RentalUnit | string): string {
  return typeof rentalUnitId === 'string' ? rentalUnitId : rentalUnitId._id
}

export function getUnitName(rentalUnitId: RentalUnit | string): string {
  return typeof rentalUnitId === 'string' ? rentalUnitId : rentalUnitId.name
}

const BASE = '/api/v1'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  const body = await res.json()
  if (!res.ok) throw new Error(body.message ?? res.statusText)
  return body.data as T
}

export const api = {
  rentalUnits: {
    list: () => apiFetch<RentalUnit[]>('/rental-units'),
    create: (form: FormData) =>
      apiFetch<RentalUnit>('/rental-units', { method: 'POST', body: form }),
    update: (id: string, form: FormData) =>
      apiFetch<RentalUnit>(`/rental-units/${id}`, { method: 'PUT', body: form }),
  },
  reservations: {
    list: () => apiFetch<Reservation[]>('/reservations'),
    create: (body: { rentalUnitId: string; guestName: string; startDate: string; endDate: string }) =>
      apiFetch<Reservation>('/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
  },
}
