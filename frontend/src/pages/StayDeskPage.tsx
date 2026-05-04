import { useState, useEffect, useCallback, useRef } from 'react'
import {
  CalendarCheck,
  MoreVertical,
  MapPin,
  Calendar,
  Plus,
  Pencil,
  SlidersHorizontal,
  X,
  Building2,
} from 'lucide-react'
import NewReservationModal from '../components/NewReservationModal'
import NewReservationBottomSheet from '../components/NewReservationBottomSheet'
import AddPropertyModal from '../components/AddPropertyModal'
import AddPropertyBottomSheet from '../components/AddPropertyBottomSheet'
import { api, RentalUnit, Reservation, getUnitId } from '../api'
import Sidebar from '../components/Sidebar'
import MobileHeader from '../components/MobileHeader'
import MobileBottomNav from '../components/MobileBottomNav'

type StatusType = 'Available' | 'Occupied'
type FilterType = 'all' | 'available' | 'occupied'
type PropertyModal = { mode: 'add' } | { mode: 'edit'; unit: RentalUnit } | null

interface UnitDisplay {
  _id: string
  name: string
  price: number
  address: string
  status: StatusType
  reservationCount: number
  gradient: string
  initials: string
  imageUrl?: string | null
  raw: RentalUnit
}

const GRADIENTS = [
  'from-slate-400 to-slate-600',
  'from-emerald-400 to-teal-600',
  'from-slate-600 to-slate-800',
  'from-sky-400 to-indigo-600',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-600',
  'from-violet-400 to-purple-600',
  'from-cyan-400 to-blue-600',
]

function gradientFor(id: string) {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return GRADIENTS[n % GRADIENTS.length]
}

function initialsFor(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function computeStatus(unitId: string, reservations: Reservation[]): StatusType {
  const today = new Date()
  const active = reservations.some(r => {
    if (getUnitId(r.rentalUnitId) !== unitId) return false
    return new Date(r.startDate) <= today && new Date(r.endDate) >= today
  })
  return active ? 'Occupied' : 'Available'
}

function reservationCountFor(unitId: string, reservations: Reservation[]) {
  return reservations.filter(r => getUnitId(r.rentalUnitId) === unitId).length
}

function toDisplay(u: RentalUnit, reservations: Reservation[]): UnitDisplay {
  return {
    _id: u._id,
    name: u.name,
    price: u.pricePerNight,
    address: [u.address, u.city, u.state].filter(Boolean).join(', '),
    status: computeStatus(u._id, reservations),
    reservationCount: reservationCountFor(u._id, reservations),
    gradient: gradientFor(u._id),
    initials: initialsFor(u.name),
    imageUrl: u.imageUrl,
    raw: u,
  }
}

const statusConfig: Record<StatusType, { label: string; bg: string; text: string }> = {
  Available: { label: 'Available', bg: 'bg-emerald-500/80', text: 'text-white' },
  Occupied:  { label: 'Occupied',  bg: 'bg-slate-700/80',  text: 'text-white' },
}

const statusListConfig: Record<StatusType, string> = {
  Available: 'bg-emerald-100 text-emerald-800',
  Occupied:  'bg-slate-100 text-slate-700',
}

const PROPERTY_TYPE_OPTIONS = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house',     label: 'House' },
  { value: 'villa',     label: 'Villa' },
  { value: 'studio',    label: 'Studio' },
  { value: 'condo',     label: 'Condo' },
  { value: 'other',     label: 'Other' },
]

// ─── Shared card menu ─────────────────────────────────────────────────────────
function CardMenu({ onEdit }: { onEdit: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        aria-label="More options"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full cursor-pointer hover:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <MoreVertical size={16} className="text-slate-600" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[1]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-[2] min-w-[130px] py-1">
            <button
              onClick={() => { onEdit(); setOpen(false) }}
              className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors duration-150 cursor-pointer flex items-center gap-2"
            >
              <Pencil size={13} className="text-on-surface-variant" />
              Edit
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function ListMenu({ onEdit }: { onEdit: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        aria-label="More options"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[1]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-[2] min-w-[130px] py-1">
            <button
              onClick={() => { onEdit(); setOpen(false) }}
              className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors duration-150 cursor-pointer flex items-center gap-2"
            >
              <Pencil size={13} className="text-on-surface-variant" />
              Edit
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Guest avatars ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['bg-teal-400', 'bg-sky-400', 'bg-indigo-400']

function GuestAvatars({ count }: { count: number }) {
  const show = Math.min(count, 3)
  const extra = count - show
  if (count === 0) return <span className="text-xs text-on-surface-variant">No reservations</span>
  return (
    <div className="flex -space-x-2">
      {Array.from({ length: show }).map((_, i) => (
        <div key={i} className={`w-6 h-6 rounded-full border-2 border-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`} />
      ))}
      {extra > 0 && (
        <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
          <span className="text-[8px] font-bold text-slate-500">+{extra}</span>
        </div>
      )}
    </div>
  )
}

// ─── Desktop card ─────────────────────────────────────────────────────────────
function PropertyCard({ property, onEdit }: { property: UnitDisplay; onEdit: () => void }) {
  const status = statusConfig[property.status]
  return (
    <div className="group bg-white border border-outline-variant rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300 cursor-pointer">
      <div className="relative h-48">
        {property.imageUrl
          ? <img src={property.imageUrl} alt={property.name} className="w-full h-full object-cover" />
          : (
            <div className={`w-full h-full bg-gradient-to-br ${property.gradient} flex items-center justify-center`}>
              <span className="text-white text-4xl font-bold opacity-40">{property.initials}</span>
            </div>
          )
        }
        <div className="absolute top-3 right-3">
          <CardMenu onEdit={onEdit} />
        </div>
        <div className="absolute bottom-3 left-3">
          <span className={`${status.bg} backdrop-blur-sm ${status.text} font-bold px-2 py-1 rounded text-[10px] uppercase tracking-wide`}>
            {status.label}
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-[18px] leading-snug text-on-surface">{property.name}</h3>
          <span className="text-primary font-bold text-sm whitespace-nowrap ml-2">${property.price}/night</span>
        </div>
        <p className="text-on-surface-variant text-sm flex items-center gap-1 mb-6">
          <MapPin size={14} className="shrink-0" />
          {property.address}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <GuestAvatars count={property.reservationCount} />
          <span className="bg-primary-fixed-dim/30 text-on-primary-fixed-variant px-2 py-1 rounded-full text-[11px] font-semibold tracking-wide flex items-center gap-1">
            <Calendar size={12} />
            {property.reservationCount} {property.reservationCount === 1 ? 'Reservation' : 'Reservations'}
          </span>
        </div>
      </div>
    </div>
  )
}

function NewListingCard() {
  return (
    <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl min-h-[380px] hover:border-primary hover:bg-teal-50/20 transition-all duration-200 cursor-pointer group">
      <div className="text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-100 transition-colors duration-200">
          <Plus size={20} className="text-slate-400 group-hover:text-primary transition-colors duration-200" />
        </div>
        <p className="text-slate-600 font-semibold">New Listing</p>
        <p className="text-slate-400 text-xs mt-1">Add a property to your portfolio</p>
      </div>
    </div>
  )
}

// ─── Mobile list row ──────────────────────────────────────────────────────────
function UnitListItem({ property, onEdit }: { property: UnitDisplay; onEdit: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-stretch">
        <div className="w-24 flex-shrink-0">
          {property.imageUrl
            ? <img src={property.imageUrl} alt={property.name} className="w-full h-full object-cover" />
            : (
              <div className={`w-full h-full bg-gradient-to-br ${property.gradient} flex items-center justify-center`}>
                <span className="text-white text-2xl font-bold opacity-40">{property.initials}</span>
              </div>
            )
          }
        </div>

        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3 className="font-semibold text-[15px] leading-snug text-on-surface truncate">{property.name}</h3>
              <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5 truncate">
                <MapPin size={11} className="shrink-0" />
                {property.address}
              </p>
            </div>
            <ListMenu onEdit={onEdit} />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-primary font-bold text-sm">
              ${property.price}<span className="text-[11px] font-normal text-on-surface-variant">/night</span>
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${statusListConfig[property.status]}`}>
              {property.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-card animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded p-4 animate-pulse flex items-center gap-4">
      <div className="w-16 h-16 rounded bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StayDeskPage() {
  const [reservationOpen, setReservationOpen] = useState(false)
  const [propertyModal, setPropertyModal] = useState<PropertyModal>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [displayUnits, setDisplayUnits] = useState<UnitDisplay[]>([])
  const [rawUnits, setRawUnits] = useState<RentalUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Server-side filter state
  const [filterCity, setFilterCity]                 = useState('')
  const [filterState, setFilterState]               = useState('')
  const [filterPropertyType, setFilterPropertyType] = useState('')
  const [filterMinPrice, setFilterMinPrice]         = useState('')
  const [filterMaxPrice, setFilterMaxPrice]         = useState('')
  const [showFilters, setShowFilters]               = useState(false)

  const hasActiveFilters = !!(filterCity || filterState || filterPropertyType || filterMinPrice || filterMaxPrice)

  function clearFilters() {
    setFilterCity(''); setFilterState(''); setFilterPropertyType('')
    setFilterMinPrice(''); setFilterMaxPrice('')
  }

  const fetchData = useCallback(async (
    city = '', state = '', propertyType = '', minPrice = '', maxPrice = ''
  ) => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: units }, { data: reservations }] = await Promise.all([
        api.rentalUnits.list({
          limit: 100,
          ...(city         && { city }),
          ...(state        && { state }),
          ...(propertyType && { propertyType }),
          ...(minPrice     && { minPrice: Number(minPrice) }),
          ...(maxPrice     && { maxPrice: Number(maxPrice) }),
        }),
        api.reservations.list({ limit: 500 }),
      ])
      setRawUnits(units)
      setDisplayUnits(units.map(u => toDisplay(u, reservations)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load units')
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce filter changes — text inputs don't fire on every keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchData(filterCity, filterState, filterPropertyType, filterMinPrice, filterMaxPrice)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filterCity, filterState, filterPropertyType, filterMinPrice, filterMaxPrice, fetchData])

  const availableCount = displayUnits.filter(u => u.status === 'Available').length
  const occupiedCount  = displayUnits.filter(u => u.status === 'Occupied').length

  const filterChips: { key: FilterType; label: string }[] = [
    { key: 'all',       label: `ALL UNITS (${displayUnits.length})` },
    { key: 'available', label: `AVAILABLE (${availableCount})` },
    { key: 'occupied',  label: `OCCUPIED (${occupiedCount})` },
  ]

  const filteredUnits = displayUnits.filter(u => {
    if (activeFilter === 'available') return u.status === 'Available'
    if (activeFilter === 'occupied')  return u.status === 'Occupied'
    return true
  })

  const editUnit = propertyModal?.mode === 'edit' ? propertyModal.unit : undefined

  return (
    <>
    <div className="min-h-screen bg-surface font-sans animate-page-enter">

      <Sidebar />

      <MobileHeader />

      {/* Main Content */}
      <main className="md:ml-[260px] pt-20 md:pt-0 min-h-screen pb-24 md:pb-8 px-4 md:px-0">
        <div className="max-w-[1280px] mx-auto md:px-6 pt-2 md:pt-12">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-12">
            <div>
              <div className="hidden md:flex items-center gap-2 mb-1">
                <span className="text-primary font-bold uppercase tracking-widest text-[10px]">Operations</span>
              </div>
              <h2 className="text-2xl md:text-[32px] font-bold leading-tight tracking-tight text-on-surface">Rental Units</h2>
              <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                Manage your property portfolio and availability.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-3 shrink-0">
              <button
                onClick={() => setReservationOpen(true)}
                className="border border-primary text-primary hover:bg-teal-50 px-5 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 whitespace-nowrap text-sm"
              >
                <CalendarCheck size={16} />
                <span>New Reservation</span>
              </button>
              <button
                onClick={() => setPropertyModal({ mode: 'add' })}
                className="bg-primary hover:bg-primary-container text-white px-5 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 whitespace-nowrap text-sm"
              >
                <Plus size={16} />
                <span>Add Unit</span>
              </button>
            </div>
          </div>

          {/* ── Filter bar ─────────────────────────────────────────────── */}
          {/* Desktop: always visible */}
          <div className="hidden md:flex items-center gap-3 mb-8 flex-wrap">
            <input
              type="text"
              placeholder="City"
              value={filterCity}
              onChange={e => setFilterCity(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-36 transition-shadow"
            />
            <input
              type="text"
              placeholder="State"
              value={filterState}
              onChange={e => setFilterState(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-36 transition-shadow"
            />
            <select
              value={filterPropertyType}
              onChange={e => setFilterPropertyType(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white cursor-pointer transition-shadow"
            >
              <option value="">All types</option>
              {PROPERTY_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400 font-medium">$</span>
              <input
                type="number"
                placeholder="Min price"
                value={filterMinPrice}
                min={0}
                onChange={e => setFilterMinPrice(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-28 transition-shadow"
              />
              <span className="text-xs text-slate-400">–</span>
              <input
                type="number"
                placeholder="Max price"
                value={filterMaxPrice}
                min={0}
                onChange={e => setFilterMaxPrice(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-28 transition-shadow"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150 cursor-pointer"
              >
                <X size={14} /> Clear filters
              </button>
            )}
          </div>

          {/* Mobile: action buttons */}
          <div className="md:hidden flex gap-3 mb-5">
            <button
              onClick={() => setReservationOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 border border-primary text-primary hover:bg-teal-50 py-3 rounded-xl font-semibold text-sm transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <CalendarCheck size={16} />
              New Booking
            </button>
            <button
              onClick={() => setPropertyModal({ mode: 'add' })}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-white py-3 rounded-xl font-semibold text-sm transition-colors duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Plus size={16} />
              Add Unit
            </button>
          </div>

          {/* Mobile: filter toggle + collapsible panel */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-wide transition-colors duration-200 cursor-pointer border focus:outline-none focus:ring-2 focus:ring-primary ${
                hasActiveFilters
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal size={13} />
              Filters{hasActiveFilters ? ` (${[filterCity, filterState, filterPropertyType, filterMinPrice, filterMaxPrice].filter(Boolean).length})` : ''}
            </button>

            {showFilters && (
              <div className="mt-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Stockholm"
                      value={filterCity}
                      onChange={e => setFilterCity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">State</label>
                    <input
                      type="text"
                      placeholder="e.g. California"
                      value={filterState}
                      onChange={e => setFilterState(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Property Type</label>
                  <select
                    value={filterPropertyType}
                    onChange={e => setFilterPropertyType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  >
                    <option value="">All types</option>
                    {PROPERTY_TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Price Range (per night)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min $"
                      value={filterMinPrice}
                      min={0}
                      onChange={e => setFilterMinPrice(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="text-slate-400 text-sm">–</span>
                    <input
                      type="number"
                      placeholder="Max $"
                      value={filterMaxPrice}
                      min={0}
                      onChange={e => setFilterMaxPrice(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150 cursor-pointer border border-red-200"
                  >
                    <X size={14} /> Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Filter chips — mobile only */}
          <div className="md:hidden flex items-center gap-3 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            {filterChips.map(({ key, label }) => {
              const isActive = activeFilter === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-semibold tracking-wide transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                    isActive
                      ? 'bg-surface-container-high text-on-surface'
                      : 'bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Error state */}
          {error && (
            <div className="text-center py-16">
              <p className="text-on-surface-variant mb-4">{error}</p>
              <button onClick={() => fetchData(filterCity, filterState, filterPropertyType, filterMinPrice, filterMaxPrice)} className="text-primary text-sm font-medium hover:underline cursor-pointer">Try again</button>
            </div>
          )}

          {/* Empty state */}
          {!error && !loading && filteredUnits.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 size={24} className="text-slate-400" />
              </div>
              <p className="font-semibold text-on-surface mb-1">No units found</p>
              <p className="text-sm text-on-surface-variant mb-4">
                {hasActiveFilters ? 'Try adjusting your filters.' : 'Add your first rental unit to get started.'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-primary text-sm font-medium hover:underline cursor-pointer">
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Mobile: list view */}
          {!error && (
            <div className="md:hidden space-y-3">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <ListSkeleton key={i} />)
                : filteredUnits.map(u => (
                  <UnitListItem
                    key={u._id}
                    property={u}
                    onEdit={() => setPropertyModal({ mode: 'edit', unit: u.raw })}
                  />
                ))
              }
            </div>
          )}

          {/* Desktop: card grid */}
          {!error && (
            <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
                : (
                  <>
                    {filteredUnits.map(u => (
                      <PropertyCard
                        key={u._id}
                        property={u}
                        onEdit={() => setPropertyModal({ mode: 'edit', unit: u.raw })}
                      />
                    ))}
                    <div onClick={() => setPropertyModal({ mode: 'add' })} className="cursor-pointer">
                      <NewListingCard />
                    </div>
                  </>
                )
              }
            </div>
          )}

        </div>
      </main>

      <MobileBottomNav />

    </div>

      <NewReservationModal       isOpen={reservationOpen}       onClose={() => setReservationOpen(false)} units={rawUnits} onSuccess={() => fetchData(filterCity, filterState, filterPropertyType, filterMinPrice, filterMaxPrice)} />
      <NewReservationBottomSheet isOpen={reservationOpen}       onClose={() => setReservationOpen(false)} units={rawUnits} onSuccess={() => fetchData(filterCity, filterState, filterPropertyType, filterMinPrice, filterMaxPrice)} />
      <AddPropertyModal          isOpen={propertyModal !== null} onClose={() => setPropertyModal(null)}   onSuccess={() => fetchData(filterCity, filterState, filterPropertyType, filterMinPrice, filterMaxPrice)} editUnit={editUnit} />
      <AddPropertyBottomSheet    isOpen={propertyModal !== null} onClose={() => setPropertyModal(null)}   onSuccess={() => fetchData(filterCity, filterState, filterPropertyType, filterMinPrice, filterMaxPrice)} editUnit={editUnit} />
    </>
  )
}
