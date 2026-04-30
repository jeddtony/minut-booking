import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  Pencil,
  Trash2,
  LogOut,
} from 'lucide-react'
import NewReservationModal from '../components/NewReservationModal'
import NewReservationBottomSheet from '../components/NewReservationBottomSheet'
import { api, RentalUnit, Reservation, PaginationMeta, getUnitId, getUnitName } from '../api'
import { useAuth } from '../context/AuthContext'

type ReservationStatus = 'Active' | 'Confirmed' | 'Completed'
type ReservationModal = { mode: 'new' } | { mode: 'edit'; reservation: Reservation } | null

interface ReservationItem {
  _id: string
  guest: string
  initials: string
  avatarCls: string
  unit: string
  checkIn: string
  checkOut: string
  status: ReservationStatus
  raw: Reservation
}

const statusStyles: Record<ReservationStatus, string> = {
  Active:    'bg-primary text-on-primary',
  Confirmed: 'bg-secondary-container text-on-secondary-container',
  Completed: 'bg-surface-variant text-on-surface-variant',
}

const AVATAR_CLS = [
  'bg-secondary-container text-on-secondary-container',
  'bg-primary-fixed text-on-primary-fixed',
  'bg-tertiary-fixed text-on-tertiary-fixed',
  'bg-surface-container-highest text-on-surface-variant',
]

function avatarColorFor(name: string): string {
  const n = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_CLS[n % AVATAR_CLS.length]
}

function initialsFor(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function deriveStatus(startDate: string, endDate: string): ReservationStatus {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (end < now) return 'Completed'
  if (start <= now) return 'Active'
  return 'Confirmed'
}

function toItem(r: Reservation): ReservationItem {
  return {
    _id: r._id,
    guest: r.guestName,
    initials: initialsFor(r.guestName),
    avatarCls: avatarColorFor(r.guestName),
    unit: getUnitName(r.rentalUnitId),
    checkIn: formatDate(r.startDate),
    checkOut: formatDate(r.endDate),
    status: deriveStatus(r.startDate, r.endDate),
    raw: r,
  }
}

function monthlyCapacity(reservations: Reservation[], totalUnits: number): number {
  if (totalUnits === 0) return 0
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const occupied = new Set(
    reservations
      .filter(r => new Date(r.startDate) <= monthEnd && new Date(r.endDate) >= monthStart)
      .map(r => getUnitId(r.rentalUnitId))
  )
  return Math.round((occupied.size / totalUnits) * 100)
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${statusStyles[status]}`}>
      {status}
    </span>
  )
}

// ─── Action menu (shared between card and table row) ─────────────────────────
function ReservationMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function close() { setOpen(false); setConfirmDelete(false) }

  return (
    <div className="relative">
      <button
        aria-label="More options"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); setConfirmDelete(false) }}
        className="text-on-surface-variant hover:text-primary transition-colors duration-200 cursor-pointer p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[1]" onClick={close} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-[2] min-w-[160px] py-1">
            {!confirmDelete ? (
              <>
                <button
                  onClick={() => { onEdit(); close() }}
                  className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors duration-150 cursor-pointer flex items-center gap-2"
                >
                  <Pencil size={13} className="text-on-surface-variant" />
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 cursor-pointer flex items-center gap-2"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </>
            ) : (
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-on-surface mb-0.5">Delete reservation?</p>
                <p className="text-xs text-on-surface-variant mb-3">This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onDelete(); close() }}
                    className="flex-1 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded transition-colors duration-150 cursor-pointer"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-1.5 text-xs font-semibold border border-outline-variant text-on-surface rounded hover:bg-surface-container transition-colors duration-150 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Mobile card ──────────────────────────────────────────────────────────────
function ReservationCard({ r, onEdit, onDelete }: { r: ReservationItem; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-card hover:border-primary/40 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm border-2 border-surface-container shrink-0 ${r.avatarCls}`}>
            {r.initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-[18px] font-semibold leading-snug text-on-surface truncate">{r.guest}</h3>
            <div className="flex items-center gap-1.5 text-on-surface-variant text-sm mt-0.5">
              <Building size={14} className="shrink-0" />
              <span className="truncate">{r.unit}</span>
            </div>
          </div>
        </div>
        <ReservationMenu onEdit={onEdit} onDelete={onDelete} />
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/50">
        <span className="text-sm font-medium text-on-surface">{r.checkIn} — {r.checkOut}</span>
        <StatusBadge status={r.status} />
      </div>
    </div>
  )
}

// ─── Desktop table row ────────────────────────────────────────────────────────
function ReservationTableRow({ r, alt, onEdit, onDelete }: { r: ReservationItem; alt: boolean; onEdit: () => void; onDelete: () => void }) {
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
      <td className="px-6 py-4 text-sm text-on-surface-variant">{r.unit}</td>
      <td className="px-6 py-4 text-sm text-on-surface">{r.checkIn}</td>
      <td className="px-6 py-4 text-sm text-on-surface">{r.checkOut}</td>
      <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
      <td className="px-6 py-4 text-right">
        <ReservationMenu onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-card animate-pulse flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-200 rounded w-1/3" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReservationsPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const [reservationModal, setReservationModal] = useState<ReservationModal>(null)
  const [items, setItems] = useState<ReservationItem[]>([])
  const [rawUnits, setRawUnits] = useState<RentalUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [capacity, setCapacity] = useState(0)
  const [arrivingToday, setArrivingToday] = useState(0)
  const [departingToday, setDepartingToday] = useState(0)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [filterUnit, setFilterUnit] = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')

  const PAGE_LIMIT = 10

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const thisMonthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const fetchData = useCallback(async (
    p: number,
    rentalUnitId: string,
    startDate: string,
    endDate: string,
  ) => {
    setLoading(true)
    try {
      const [{ data: units }, { data: reservations, meta }] = await Promise.all([
        api.rentalUnits.list({ limit: 100 }),
        api.reservations.list({
          page: p,
          limit: PAGE_LIMIT,
          ...(rentalUnitId ? { rentalUnitId } : {}),
          ...(startDate    ? { startDate }    : {}),
          ...(endDate      ? { endDate }      : {}),
        }),
      ])
      setRawUnits(units)
      setItems(reservations.map(toItem))
      setMeta(meta)
      setCapacity(monthlyCapacity(reservations, units.length))

      const todayStr = new Date().toDateString()
      setArrivingToday(reservations.filter(r => new Date(r.startDate).toDateString() === todayStr).length)
      setDepartingToday(reservations.filter(r => new Date(r.endDate).toDateString() === todayStr).length)
    } catch {
      // silently fail — UI shows empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(page, filterUnit, filterStart, filterEnd)
  }, [page, filterUnit, filterStart, filterEnd, fetchData])

  function goToPage(p: number) {
    if (meta && (p < 1 || p > meta.totalPages)) return
    setPage(p)
  }

  function applyUnitFilter(id: string) {
    setFilterUnit(id)
    setPage(1)
  }

  function applyThisMonth() {
    setFilterStart(thisMonthStart)
    setFilterEnd(thisMonthEnd)
    setPage(1)
  }

  function applyDateFilter(field: 'start' | 'end', value: string) {
    if (field === 'start') setFilterStart(value)
    else setFilterEnd(value)
    setPage(1)
  }

  async function deleteReservation(id: string) {
    try {
      await api.reservations.delete(id)
      const newPage = items.length === 1 && page > 1 ? page - 1 : page
      setPage(newPage)
      if (newPage === page) fetchData(page, filterUnit, filterStart, filterEnd)
    } catch {
      // TODO: surface error toast
    }
  }

  const editReservation = reservationModal?.mode === 'edit' ? reservationModal.reservation : undefined

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
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <LogOut size={18} />
              <span className="text-sm">Sign out</span>
            </button>
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
                {/* Date range */}
                <div className="flex items-center gap-1.5 bg-white border border-outline-variant rounded-lg px-3 py-2 shadow-sm">
                  <CalendarDays size={15} className="text-on-surface-variant shrink-0" />
                  <input
                    type="date"
                    aria-label="From date"
                    value={filterStart}
                    onChange={e => applyDateFilter('start', e.target.value)}
                    className="text-sm text-on-surface bg-transparent focus:outline-none cursor-pointer"
                  />
                  <span className="text-on-surface-variant text-xs px-1">→</span>
                  <input
                    type="date"
                    aria-label="To date"
                    value={filterEnd}
                    onChange={e => applyDateFilter('end', e.target.value)}
                    className="text-sm text-on-surface bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={applyThisMonth}
                  className="text-xs font-semibold text-primary hover:text-primary-container border border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-2.5 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary whitespace-nowrap"
                >
                  This Month
                </button>

                {/* Unit filter */}
                <div className="relative">
                  <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  <select
                    value={filterUnit}
                    onChange={e => applyUnitFilter(e.target.value)}
                    className="appearance-none pl-8 pr-8 py-2.5 bg-white border border-outline-variant rounded-lg text-sm font-medium text-on-surface shadow-sm hover:bg-surface-container-low transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Units</option>
                    {rawUnits.map(u => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                </div>

                <button
                  onClick={() => setReservationModal({ mode: 'new' })}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Plus size={16} />
                  New Reservation
                </button>
              </div>

              {/* Mobile: filter row */}
              <div className="flex md:hidden flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1 bg-white border border-outline-variant rounded-lg px-2.5 py-2">
                    <CalendarDays size={14} className="text-on-surface-variant shrink-0" />
                    <input
                      type="date"
                      aria-label="From date"
                      value={filterStart}
                      onChange={e => applyDateFilter('start', e.target.value)}
                      className="text-xs text-on-surface bg-transparent focus:outline-none cursor-pointer w-full"
                    />
                  </div>
                  <span className="text-on-surface-variant text-xs">→</span>
                  <div className="flex items-center gap-1.5 flex-1 bg-white border border-outline-variant rounded-lg px-2.5 py-2">
                    <CalendarDays size={14} className="text-on-surface-variant shrink-0" />
                    <input
                      type="date"
                      aria-label="To date"
                      value={filterEnd}
                      onChange={e => applyDateFilter('end', e.target.value)}
                      className="text-xs text-on-surface bg-transparent focus:outline-none cursor-pointer w-full"
                    />
                  </div>
                  <button
                    onClick={applyThisMonth}
                    className="text-xs font-semibold text-primary border border-primary/30 bg-primary/5 rounded-lg px-2.5 py-2 cursor-pointer focus:outline-none whitespace-nowrap"
                  >
                    This Month
                  </button>
                </div>
                <div className="relative">
                  <Building size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  <select
                    value={filterUnit}
                    onChange={e => applyUnitFilter(e.target.value)}
                    className="appearance-none w-full pl-7 pr-6 py-2 bg-white border border-outline-variant rounded-lg text-sm font-medium text-on-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Units</option>
                    {rawUnits.map(u => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 12-col grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left: cards (mobile) + table (desktop) */}
              <div className="lg:col-span-8">

                {/* Mobile card list */}
                <div className="md:hidden space-y-3">
                  {loading
                    ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
                    : items.length === 0
                      ? <p className="text-center py-12 text-on-surface-variant text-sm">No reservations yet.</p>
                      : items.map(r => (
                        <ReservationCard
                          key={r._id}
                          r={r}
                          onEdit={() => setReservationModal({ mode: 'edit', reservation: r.raw })}
                          onDelete={() => deleteReservation(r._id)}
                        />
                      ))
                  }
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
                        {loading
                          ? Array.from({ length: 4 }).map((_, i) => (
                            <tr key={i} className={i % 2 === 1 ? 'bg-surface-container-lowest' : ''}>
                              {Array.from({ length: 6 }).map((__, j) => (
                                <td key={j} className="px-6 py-4">
                                  <div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: j === 0 ? '140px' : '80px' }} />
                                </td>
                              ))}
                            </tr>
                          ))
                          : items.length === 0
                            ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                                  No reservations yet. Click <strong>New Reservation</strong> to get started.
                                </td>
                              </tr>
                            )
                            : items.map((r, i) => (
                              <ReservationTableRow
                                key={r._id}
                                r={r}
                                alt={i % 2 === 1}
                                onEdit={() => setReservationModal({ mode: 'edit', reservation: r.raw })}
                                onDelete={() => deleteReservation(r._id)}
                              />
                            ))
                        }
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {meta && (
                    <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
                      <p className="text-xs text-on-surface-variant">
                        {meta.total === 0
                          ? 'No reservations'
                          : `Showing ${(page - 1) * PAGE_LIMIT + 1}–${Math.min(page * PAGE_LIMIT, meta.total)} of ${meta.total}`}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => goToPage(page - 1)}
                          disabled={page <= 1}
                          aria-label="Previous page"
                          className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={15} />
                        </button>
                        {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                          .reduce<(number | '…')[]>((acc, p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…')
                            acc.push(p)
                            return acc
                          }, [])
                          .map((p, i) =>
                            p === '…'
                              ? <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-on-surface-variant text-sm">…</span>
                              : <button
                                  key={p}
                                  onClick={() => goToPage(p as number)}
                                  aria-label={`Page ${p}`}
                                  aria-current={page === p ? 'page' : undefined}
                                  className={`w-8 h-8 flex items-center justify-center rounded border text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150 ${
                                    page === p
                                      ? 'border-primary bg-primary text-on-primary'
                                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                                  }`}
                                >
                                  {p}
                                </button>
                          )}
                        <button
                          onClick={() => goToPage(page + 1)}
                          disabled={page >= meta.totalPages}
                          aria-label="Next page"
                          className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Right: stats sidebar */}
              <div className="lg:col-span-4 space-y-4">

                <div className="bg-primary text-on-primary p-6 rounded-xl shadow-lg flex flex-col justify-between h-48">
                  <div>
                    <TrendingUp size={20} className="mb-3 opacity-90" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Monthly Capacity</p>
                  </div>
                  <div>
                    <div className="text-[40px] font-bold leading-none">{capacity}%</div>
                    <p className="text-xs opacity-90 mt-1">Units with active reservations this month</p>
                  </div>
                </div>

                <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-card">
                  <h3 className="text-[18px] font-semibold text-on-surface mb-5">Quick Summary</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Arriving Today',    value: arrivingToday },
                      { label: 'Departing Today',   value: departingToday },
                      { label: 'Total Reservations', value: items.length },
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
            { icon: LayoutGrid,   label: 'Dashboard', active: false, to: '/' },
            { icon: Building,     label: 'Units',     active: false, to: '/' },
            { icon: CalendarDays, label: 'Booking',   active: true,  to: '/reservations' },
            { icon: User,         label: 'Profile',   active: false, to: '#' },
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

      {/* FAB — mobile only */}
      <button
        onClick={() => setReservationModal({ mode: 'new' })}
        aria-label="New reservation"
        className="fixed bottom-20 right-6 md:hidden w-14 h-14 bg-primary hover:bg-primary-container text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all duration-200 z-40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <Plus size={24} />
      </button>

      <NewReservationModal
        isOpen={reservationModal !== null}
        onClose={() => setReservationModal(null)}
        units={rawUnits}
        onSuccess={() => fetchData(page, filterUnit, filterStart, filterEnd)}
        editReservation={editReservation}
      />
      <NewReservationBottomSheet
        isOpen={reservationModal !== null}
        onClose={() => setReservationModal(null)}
        units={rawUnits}
        onSuccess={() => fetchData(page, filterUnit, filterStart, filterEnd)}
        editReservation={editReservation}
      />
    </>
  )
}
