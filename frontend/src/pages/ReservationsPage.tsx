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
  MoreHorizontal,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building,
  TrendingUp,
  Plus,
  LayoutGrid,
  User,
  ListFilter,
} from 'lucide-react'
import NewReservationModal from '../components/NewReservationModal'
import NewReservationBottomSheet from '../components/NewReservationBottomSheet'

type ReservationStatus = 'Active' | 'Confirmed' | 'Upcoming' | 'Pending' | 'Completed'

interface Reservation {
  id: number
  guest: string
  initials: string
  avatarCls: string
  unit: string
  unitShort: string
  checkIn: string
  checkOut: string
  status: ReservationStatus
}

const reservations: Reservation[] = [
  {
    id: 1,
    guest: 'Julian Alexander',
    initials: 'JA',
    avatarCls: 'bg-secondary-container text-on-secondary-container',
    unit: 'Penthouse Suite • Unit 402',
    unitShort: 'Penthouse Suite',
    checkIn: 'Oct 12, 2023',
    checkOut: 'Oct 18, 2023',
    status: 'Active',
  },
  {
    id: 2,
    guest: 'Sarah Mitchell',
    initials: 'SM',
    avatarCls: 'bg-primary-fixed text-on-primary-fixed',
    unit: 'Garden Loft • Unit 105',
    unitShort: 'Garden Loft',
    checkIn: 'Oct 14, 2023',
    checkOut: 'Oct 21, 2023',
    status: 'Confirmed',
  },
  {
    id: 3,
    guest: 'David Chen',
    initials: 'DC',
    avatarCls: 'bg-tertiary-fixed text-on-tertiary-fixed',
    unit: 'Skyline Studio • Unit 901',
    unitShort: 'Skyline Studio',
    checkIn: 'Oct 15, 2023',
    checkOut: 'Oct 16, 2023',
    status: 'Pending',
  },
  {
    id: 4,
    guest: 'Elena Rodriguez',
    initials: 'ER',
    avatarCls: 'bg-surface-container-highest text-on-surface-variant',
    unit: 'Urban Suite • Unit 203',
    unitShort: 'Urban Suite',
    checkIn: 'Oct 18, 2023',
    checkOut: 'Oct 25, 2023',
    status: 'Confirmed',
  },
]

const statusStyles: Record<ReservationStatus, string> = {
  Active:    'bg-primary text-on-primary',
  Confirmed: 'bg-secondary-container text-on-secondary-container',
  Upcoming:  'bg-secondary-fixed text-on-secondary-fixed',
  Pending:   'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Completed: 'bg-surface-variant text-on-surface-variant',
}

function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${statusStyles[status]}`}>
      {status}
    </span>
  )
}

// ─── Mobile card ──────────────────────────────────────────────────────────────
function ReservationCard({ r }: { r: Reservation }) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-all duration-200 cursor-pointer">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm border-2 border-surface-container shrink-0 ${r.avatarCls}`}>
          {r.initials}
        </div>
        <div>
          <h3 className="text-[18px] font-semibold leading-snug text-on-surface">{r.guest}</h3>
          <div className="flex items-center gap-1.5 text-on-surface-variant text-sm mt-0.5">
            <Building size={14} className="shrink-0" />
            <span>{r.unit}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
        <span className="text-sm font-medium text-on-surface">{r.checkIn} — {r.checkOut}</span>
        <StatusBadge status={r.status} />
      </div>
    </div>
  )
}

// ─── Desktop table row ────────────────────────────────────────────────────────
function ReservationRow({ r, alt }: { r: Reservation; alt: boolean }) {
  return (
    <tr className={`${alt ? 'bg-surface-container-lowest' : ''} hover:bg-surface-container-lowest transition-colors duration-150`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${r.avatarCls}`}>
            {r.initials}
          </div>
          <span className="text-sm font-medium text-on-surface">{r.guest}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-on-surface-variant">{r.unitShort}</td>
      <td className="px-6 py-4 text-sm text-on-surface">{r.checkIn}</td>
      <td className="px-6 py-4 text-sm text-on-surface">{r.checkOut}</td>
      <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
      <td className="px-6 py-4 text-right">
        <button
          aria-label="More options"
          className="text-on-surface-variant hover:text-primary transition-colors duration-200 cursor-pointer p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <MoreHorizontal size={18} />
        </button>
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReservationsPage() {
  const [reservationOpen, setReservationOpen] = useState(false)

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
            <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded transition-colors duration-200 cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800/50">
              <LayoutDashboard size={18} />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded transition-colors duration-200 cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800/50">
              <Building2 size={18} />
              <span className="text-sm font-medium">Units</span>
            </Link>
            <Link to="/reservations" className="flex items-center gap-3 px-3 py-2 rounded transition-colors duration-200 cursor-pointer bg-teal-600/10 text-teal-400 border-l-4 border-teal-500" aria-current="page">
              <CalendarCheck size={18} />
              <span className="text-sm font-medium">Reservations</span>
            </Link>
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
        <main className="md:ml-[260px] pt-20 md:pt-0 min-h-screen pb-28 md:pb-12 px-4 md:px-0">
          <div className="max-w-[1280px] mx-auto md:px-8 pt-4 md:pt-12">

            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
              <div>
                <h2 className="text-[32px] font-bold leading-tight tracking-tight text-on-surface">Reservations</h2>
                <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                  Manage upcoming guest arrivals and current stays.
                </p>
              </div>

              {/* Desktop controls */}
              <div className="hidden md:flex flex-wrap items-center gap-3 shrink-0">
                <button className="flex items-center gap-2 bg-white border border-outline-variant rounded-lg px-4 py-2.5 shadow-sm hover:bg-surface-container-low transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary">
                  <CalendarDays size={15} className="text-on-surface-variant" />
                  <span className="text-sm font-medium text-on-surface">Oct 12 – Oct 28, 2023</span>
                  <ChevronDown size={15} className="text-on-surface-variant" />
                </button>
                <button className="flex items-center gap-2 bg-white border border-outline-variant rounded-lg px-4 py-2.5 shadow-sm hover:bg-surface-container-low transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary">
                  <Building size={15} className="text-on-surface-variant" />
                  <span className="text-sm font-medium text-on-surface">All Units</span>
                  <ChevronDown size={15} className="text-on-surface-variant" />
                </button>
                <button
                  onClick={() => setReservationOpen(true)}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Plus size={16} />
                  New Reservation
                </button>
              </div>

              {/* Mobile: filter button */}
              <div className="flex md:hidden">
                <button className="flex items-center gap-2 px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container transition-colors duration-200 cursor-pointer shadow-sm">
                  <ListFilter size={15} className="text-on-surface-variant" />
                  Filter
                </button>
              </div>
            </div>

            {/* 12-col grid: reservations + stats sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left column: cards (mobile) + table (desktop) */}
              <div className="lg:col-span-8">

                {/* Mobile card list */}
                <div className="md:hidden space-y-3">
                  {reservations.map(r => (
                    <ReservationCard key={r.id} r={r} />
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block bg-white rounded-xl border border-outline-variant shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant">
                          {['Guest Name', 'Rental Unit', 'Check-in', 'Check-out', 'Status', 'Action'].map((h, i) => (
                            <th
                              key={h}
                              className={`px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {reservations.map((r, i) => (
                          <ReservationRow key={r.id} r={r} alt={i % 2 === 1} />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
                    <p className="text-xs text-on-surface-variant">
                      Showing {reservations.length} of 124 reservations
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary">
                        <ChevronLeft size={15} />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant bg-primary text-on-primary text-sm font-medium cursor-pointer">
                        1
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors duration-200 text-sm font-medium cursor-pointer">
                        2
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary">
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right column: stats sidebar */}
              <div className="lg:col-span-4 space-y-4">

                {/* Monthly Capacity */}
                <div className="bg-primary text-on-primary p-6 rounded-xl shadow-lg flex flex-col justify-between h-48">
                  <div>
                    <TrendingUp size={20} className="mb-3 opacity-90" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Monthly Capacity</p>
                  </div>
                  <div>
                    <div className="text-[40px] font-bold leading-none">84%</div>
                    <p className="text-xs opacity-90 mt-1">+12% from last month</p>
                  </div>
                </div>

                {/* Quick Summary */}
                <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-card">
                  <h3 className="text-[18px] font-semibold text-on-surface mb-5">Quick Summary</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Arriving Today', value: 12 },
                      { label: 'Departing Today', value: 8 },
                      { label: 'New Bookings', value: 24 },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-sm text-on-surface-variant">{label}</span>
                        <span className="text-sm font-bold text-on-surface">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav
          className="fixed bottom-0 left-0 w-full md:hidden flex justify-around items-center h-16 bg-white border-t border-slate-200 z-40 shadow-mobile-nav"
          aria-label="Mobile navigation"
        >
          {[
            { icon: LayoutGrid, label: 'Dashboard', active: false, to: '/' },
            { icon: Building, label: 'Units', active: false, to: '/' },
            { icon: CalendarDays, label: 'Booking', active: true, to: '/reservations' },
            { icon: User, label: 'Profile', active: false, to: '#' },
          ].map(({ icon: Icon, label, active, to }) => (
            <Link
              key={label}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors duration-200 cursor-pointer ${active ? 'text-primary' : 'text-slate-400'}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </nav>

      </div>

      {/* FAB — mobile only, outside animated wrapper to avoid stacking context */}
      <button
        onClick={() => setReservationOpen(true)}
        aria-label="New reservation"
        className="fixed bottom-20 right-6 md:hidden w-14 h-14 bg-primary hover:bg-primary-container text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all duration-200 z-40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <Plus size={24} />
      </button>

      {/* Reservation overlays — outside animated wrapper */}
      <NewReservationModal isOpen={reservationOpen} onClose={() => setReservationOpen(false)} />
      <NewReservationBottomSheet isOpen={reservationOpen} onClose={() => setReservationOpen(false)} />
    </>
  )
}
