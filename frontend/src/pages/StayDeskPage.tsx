import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  UserCircle,
  Settings,
  Search,
  Bell,
  MoreVertical,
  MapPin,
  Calendar,
  Plus,
  PlusCircle,
  LayoutGrid,
  Building,
  CalendarDays,
  User,
} from 'lucide-react'
import NewReservationModal from '../components/NewReservationModal'
import NewReservationBottomSheet from '../components/NewReservationBottomSheet'
import AddPropertyModal from '../components/AddPropertyModal'
import AddPropertyBottomSheet from '../components/AddPropertyBottomSheet'

type StatusType = 'Available' | 'Occupied' | 'Maintenance'
type FilterType = 'all' | 'available' | 'occupied'

interface Property {
  id: number
  name: string
  price: number
  address: string
  status: StatusType
  reservations: number
  guestCount: number
  gradient: string
  initials: string
}

const properties: Property[] = [
  {
    id: 1,
    name: 'Skyline Loft A4',
    price: 240,
    address: '1200 Market Street, San Francisco',
    status: 'Available',
    reservations: 3,
    guestCount: 2,
    gradient: 'from-slate-400 to-slate-600',
    initials: 'SL',
  },
  {
    id: 2,
    name: 'Garden Terrace Suite',
    price: 185,
    address: '450 Valencia St, San Francisco',
    status: 'Occupied',
    reservations: 5,
    guestCount: 1,
    gradient: 'from-emerald-400 to-teal-600',
    initials: 'GT',
  },
  {
    id: 3,
    name: 'The Penthouse 12B',
    price: 450,
    address: '1 Bush St, Financial District',
    status: 'Maintenance',
    reservations: 1,
    guestCount: 0,
    gradient: 'from-slate-600 to-slate-800',
    initials: 'P1',
  },
  {
    id: 4,
    name: 'Marina Bay View',
    price: 310,
    address: '300 Beach St, North Beach',
    status: 'Available',
    reservations: 8,
    guestCount: 1,
    gradient: 'from-blue-400 to-cyan-600',
    initials: 'MB',
  },
  {
    id: 5,
    name: 'Hayes Valley Studio',
    price: 160,
    address: '512 Gough St, Hayes Valley',
    status: 'Available',
    reservations: 2,
    guestCount: 1,
    gradient: 'from-amber-300 to-orange-500',
    initials: 'HV',
  },
]

// Card grid: badge overlay styling
const statusConfig: Record<StatusType, { bg: string; text: string; label: string }> = {
  Available: { bg: 'bg-white/90', text: 'text-teal-600', label: 'Available' },
  Occupied: { bg: 'bg-error-container', text: 'text-on-error-container', label: 'Occupied' },
  Maintenance: { bg: 'bg-secondary-container', text: 'text-on-secondary-container', label: 'Maintenance' },
}

// List view: pill styling
const statusListConfig: Record<StatusType, string> = {
  Available: 'bg-teal-50 text-teal-700 border border-teal-100',
  Occupied: 'bg-error-container text-on-error-container border border-error/10',
  Maintenance: 'bg-secondary-container text-on-secondary-container border border-secondary/10',
}

const avatarColors = [
  'bg-teal-200 text-teal-800',
  'bg-blue-200 text-blue-800',
  'bg-amber-200 text-amber-800',
]

function GuestAvatars({ count }: { count: number }) {
  if (count === 0) {
    return (
      <div className="flex -space-x-2">
        <div className="w-6 h-6 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center">
          <span className="text-[8px] font-bold text-slate-300">N/A</span>
        </div>
      </div>
    )
  }
  const shown = Math.min(count, 2)
  const extra = count - shown
  return (
    <div className="flex -space-x-2">
      {Array.from({ length: shown }).map((_, i) => (
        <div
          key={i}
          className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold ${avatarColors[i % avatarColors.length]}`}
        >
          {String.fromCharCode(65 + i)}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
          <span className="text-[8px] font-bold text-slate-500">+{extra}</span>
        </div>
      )}
    </div>
  )
}

// ─── Desktop card grid item ───────────────────────────────────────────────────
function PropertyCard({ property }: { property: Property }) {
  const status = statusConfig[property.status]
  return (
    <div className="group bg-white border border-outline-variant rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300 cursor-pointer">
      <div className="relative h-48">
        <div className={`w-full h-full bg-gradient-to-br ${property.gradient} flex items-center justify-center`}>
          <span className="text-white text-4xl font-bold opacity-40">{property.initials}</span>
        </div>
        <button
          aria-label="More options"
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-full cursor-pointer hover:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <MoreVertical size={16} className="text-slate-600" />
        </button>
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
          <GuestAvatars count={property.guestCount} />
          <span className="bg-primary-fixed-dim/30 text-on-primary-fixed-variant px-2 py-1 rounded-full text-[11px] font-semibold tracking-wide flex items-center gap-1">
            <Calendar size={12} />
            {property.reservations} {property.reservations === 1 ? 'Reservation' : 'Reservations'}
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
function UnitListItem({ property }: { property: Property }) {
  return (
    <div className="bg-white border border-slate-200 rounded p-4 flex items-center gap-4 shadow-card hover:shadow-card-hover transition-shadow duration-200 cursor-pointer">
      {/* Thumbnail */}
      <div className={`w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-gradient-to-br ${property.gradient} flex items-center justify-center`}>
        <span className="text-white text-xl font-bold opacity-40">{property.initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[18px] leading-snug text-on-surface truncate">{property.name}</h3>
        <p className="text-xs text-on-surface-variant truncate mt-0.5">{property.address}</p>
      </div>

      {/* Status pill + menu */}
      <div className="flex items-center gap-3 shrink-0">
        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide hidden sm:block ${statusListConfig[property.status]}`}>
          {property.status.toUpperCase()}
        </span>
        <button
          aria-label="More options"
          className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  )
}

// ─── Navigation config ────────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: false, to: '/' },
  { icon: Building2, label: 'Units', active: true, to: '/' },
  { icon: CalendarCheck, label: 'Reservations', active: false, to: '/reservations' },
]

const bottomNavItems = [
  { icon: LayoutGrid, label: 'Dashboard', active: false, to: '/' },
  { icon: Building, label: 'Units', active: true, to: '/' },
  { icon: CalendarDays, label: 'Booking', active: false, to: '/reservations' },
  { icon: User, label: 'Profile', active: false, to: '#' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StayDeskPage() {
  const [reservationOpen, setReservationOpen] = useState(false)
  const [propertyOpen, setPropertyOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const availableCount = properties.filter(p => p.status === 'Available').length
  const occupiedCount = properties.filter(p => p.status === 'Occupied').length

  const filterChips: { key: FilterType; label: string }[] = [
    { key: 'all', label: `ALL UNITS (${properties.length})` },
    { key: 'available', label: `AVAILABLE (${availableCount})` },
    { key: 'occupied', label: `OCCUPIED (${occupiedCount})` },
  ]

  const filteredProperties = properties.filter(p => {
    if (activeFilter === 'available') return p.status === 'Available'
    if (activeFilter === 'occupied') return p.status === 'Occupied'
    return true
  })

  return (
    <>
    <div className="min-h-screen bg-surface font-sans animate-page-enter">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[260px] bg-[#0F172A] border-r border-slate-800 z-40">
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-container rounded flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">StayDesk</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">Management</p>
          </div>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1" aria-label="Main navigation">
          {navItems.map(({ icon: Icon, label, active, to }) => (
            <Link
              key={label}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded transition-colors duration-200 cursor-pointer ${
                active
                  ? 'bg-teal-600/10 text-teal-400 border-l-4 border-teal-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800 space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer">
            <UserCircle size={18} />
            <span className="text-sm">Profile</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer">
            <Settings size={18} />
            <span className="text-sm">Settings</span>
          </a>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="flex md:hidden justify-between items-center px-4 h-16 fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <span className="text-lg font-black text-primary">StayDesk</span>
        <div className="flex items-center gap-4">
          <button aria-label="Search" className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded">
            <Search size={20} className="text-slate-600" />
          </button>
          <button aria-label="Notifications" className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded">
            <Bell size={20} className="text-slate-600" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 border border-slate-200 flex items-center justify-center cursor-pointer">
            <span className="text-white text-xs font-bold">JD</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-[260px] pt-20 md:pt-0 min-h-screen pb-24 md:pb-8 px-4 md:px-0">
        <div className="max-w-[1280px] mx-auto md:px-6 pt-2 md:pt-12">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-12">
            <div>
              <div className="hidden md:flex items-center gap-2 mb-1">
                <span className="text-primary font-bold uppercase tracking-widest text-[10px]">Operations</span>
              </div>
              <h2 className="text-[32px] font-bold leading-tight tracking-tight text-on-surface">Rental Units</h2>
              <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                Manage your property portfolio and availability.
              </p>
            </div>

            {/* Desktop: two buttons side by side */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <button
                onClick={() => setReservationOpen(true)}
                className="border border-primary text-primary hover:bg-teal-50 px-5 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 whitespace-nowrap text-sm"
              >
                <CalendarCheck size={16} />
                <span>New Reservation</span>
              </button>
              <button
                onClick={() => setPropertyOpen(true)}
                className="bg-primary hover:bg-primary-container text-white px-5 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 whitespace-nowrap text-sm"
              >
                <Plus size={16} />
                <span>Add Unit</span>
              </button>
            </div>
          </div>

          {/* Mobile: full-width Add Unit CTA */}
          <button
            onClick={() => setPropertyOpen(true)}
            className="md:hidden w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-white py-4 rounded-lg font-bold text-base transition-colors duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary mb-5"
          >
            <PlusCircle size={20} />
            Add Unit
          </button>

          {/* Filter chips — shown on mobile, hidden on desktop */}
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

          {/* Mobile: list view */}
          <div className="md:hidden space-y-2">
            {filteredProperties.map(property => (
              <UnitListItem key={property.id} property={property} />
            ))}
          </div>

          {/* Desktop: card grid */}
          <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
            <div onClick={() => setPropertyOpen(true)}>
              <NewListingCard />
            </div>
          </div>

        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 w-full md:hidden flex justify-around items-center h-16 bg-white border-t border-slate-200 z-40 shadow-mobile-nav"
        aria-label="Mobile navigation"
      >
        {bottomNavItems.map(({ icon: Icon, label, active, to }) => (
          <Link
            key={label}
            to={to}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors duration-200 cursor-pointer ${
              active ? 'text-primary' : 'text-slate-400'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>

    </div>

      {/* Overlays rendered outside the animated wrapper so their fixed positioning
          is relative to the viewport, not the transformed parent element */}
      <NewReservationModal isOpen={reservationOpen} onClose={() => setReservationOpen(false)} />
      <NewReservationBottomSheet isOpen={reservationOpen} onClose={() => setReservationOpen(false)} />
      <AddPropertyModal isOpen={propertyOpen} onClose={() => setPropertyOpen(false)} />
      <AddPropertyBottomSheet isOpen={propertyOpen} onClose={() => setPropertyOpen(false)} />
    </>
  )
}
