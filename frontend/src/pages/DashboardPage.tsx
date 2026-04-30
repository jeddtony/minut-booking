import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, CalendarCheck, UserCircle, Settings,
  Search, Bell, TrendingUp, Clock, LogIn, LogOut, Plus,
  LayoutGrid, Building, CalendarDays, User, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { api, DashboardGridDay, WeeklyAvailabilityResponse } from '../api'
import { useAuth } from '../context/AuthContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSundayOfWeek(d: Date): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() - copy.getDay())
  copy.setHours(0, 0, 0, 0)
  return copy
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatWeekRange(start: string, endExclusive: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(endExclusive + 'T00:00:00')
  e.setDate(e.getDate() - 1) // make inclusive
  const months = ['January','February','March','April','May','June','July',
                  'August','September','October','November','December']
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${months[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`
  }
  return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`
}

function formatDayHeader(dateStr: string): { name: string; num: number } {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    name: ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()],
    num: d.getDate(),
  }
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
  const n = id.split('').reduce((a, c) => a + c.codePointAt(0)!, 0)
  return GRADIENTS[n % GRADIENTS.length]
}

function initialsFor(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ─── Span builder ─────────────────────────────────────────────────────────────

type Span =
  | { type: 'empty'; length: number }
  | { type: 'reservation'; id: string; guestName: string; length: number }

function daysToSpans(days: DashboardGridDay[]): Span[] {
  const spans: Span[] = []
  let i = 0
  while (i < days.length) {
    const { reservation } = days[i]
    if (!reservation) {
      let len = 0
      while (i < days.length && !days[i].reservation) { len++; i++ }
      spans.push({ type: 'empty', length: len })
    } else {
      const resId = reservation.id
      let len = 0
      while (i < days.length && days[i].reservation?.id === resId) { len++; i++ }
      spans.push({ type: 'reservation', id: resId, guestName: reservation.guest_name, length: len })
    }
  }
  return spans
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CalendarRowProps {
  readonly days: DashboardGridDay[]
  readonly today: string
}

function CalendarRow({ days, today }: CalendarRowProps) {
  if (days.every(d => !d.reservation)) {
    return (
      <div className="col-span-7 flex items-center justify-center italic text-on-surface-variant/40 text-xs p-4 border-l border-outline-variant">
        No bookings scheduled for this week
      </div>
    )
  }

  return (
    <>
      {daysToSpans(days).map((span, idx) => {
        if (span.type === 'empty') {
          return Array.from({ length: span.length }, (_, k) => {
            const dayIdx = days.findIndex((_, di) => {
              let acc = 0
              for (let s = 0; s < idx; s++) acc += (span.type === 'empty' ? (days[s].reservation ? 0 : 1) : 0)
              return di === acc + k
            })
            const dateStr = dayIdx >= 0 ? days[dayIdx]?.date : undefined
            const isToday = dateStr === today
            return (
              <div
                key={`empty-${idx}-${k}`}
                className={`border-l border-outline-variant${isToday ? ' bg-primary/5' : ''}`}
              />
            )
          })
        }
        return (
          <div
            key={`res-${span.id}-${idx}`}
            style={{ gridColumn: `span ${span.length} / span ${span.length}` }}
            className="p-2 relative border-l border-outline-variant"
          >
            <div className="absolute inset-y-2 left-2 right-2 rounded-lg bg-primary text-on-primary px-3 flex items-center gap-2 shadow-sm">
              <User size={13} className="shrink-0" />
              <span className="text-xs font-bold truncate">{span.guestName}</span>
            </div>
          </div>
        )
      })}
    </>
  )
}

function StatSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-card animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="w-5 h-5 bg-slate-200 rounded" />
      </div>
      <div className="h-9 w-16 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-20 bg-slate-200 rounded" />
    </div>
  )
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const sideNavItems = [
  { Icon: LayoutDashboard, label: 'Dashboard',   to: '/dashboard', active: true  },
  { Icon: Building2,       label: 'Units',        to: '/',          active: false },
  { Icon: CalendarCheck,   label: 'Reservations', to: '/reservations', active: false },
]

const bottomNavItems = [
  { Icon: LayoutGrid,   label: 'Dashboard', to: '/dashboard', active: true  },
  { Icon: Building,     label: 'Units',     to: '/',          active: false },
  { Icon: CalendarDays, label: 'Booking',   to: '/reservations', active: false },
  { Icon: User,         label: 'Profile',   to: '#',          active: false },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [weekStart, setWeekStart] = useState(() => toDateStr(getSundayOfWeek(new Date())))
  const [data, setData] = useState<WeeklyAvailabilityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [calView, setCalView] = useState<'weekly' | 'monthly'>('weekly')

  const today = toDateStr(new Date())

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const result = await api.dashboard.weeklyAvailability({ start_date: weekStart })
        if (!cancelled) setData(result)
      } catch {
        // keep previous data on error — network glitch shouldn't wipe the grid
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [weekStart])

  function prevWeek() {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() - 7)
    setWeekStart(toDateStr(d))
  }

  function nextWeek() {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() + 7)
    setWeekStart(toDateStr(d))
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  // Build property lookup for names/gradients
  const propertyMap = Object.fromEntries(
    (data?.properties ?? []).map(p => [p.id, { name: p.name, gradient: gradientFor(p.id), initials: initialsFor(p.name) }])
  )

  const weekLabel = data
    ? formatWeekRange(data.week_range.start_date, data.week_range.end_date)
    : '—'

  const dayHeaders = data?.grid[0]?.days.map(d => formatDayHeader(d.date)) ?? []

  const summary = data?.summary

  return (
    <div className="min-h-screen bg-surface font-sans animate-page-enter">

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
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
          {sideNavItems.map(({ Icon, label, to, active }) => (
            <Link
              key={label}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded transition-colors duration-200 cursor-pointer ${
                active
                  ? 'bg-teal-600/10 text-teal-400 border-l-4 border-teal-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800 space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer">
            <UserCircle size={18} /><span className="text-sm">Profile</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer">
            <Settings size={18} /><span className="text-sm">Settings</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <LogOut size={18} /><span className="text-sm">Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ────────────────────────────────────────────────── */}
      <header className="flex md:hidden justify-between items-center px-4 h-16 fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <span className="text-lg font-black text-primary">StayDesk</span>
        <div className="flex items-center gap-4">
          <button aria-label="Search" className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded">
            <Search size={20} className="text-slate-600" />
          </button>
          <button aria-label="Notifications" className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded">
            <Bell size={20} className="text-slate-600" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">JD</span>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="md:ml-[260px] pt-20 md:pt-10 pb-24 md:pb-10 px-4 md:px-0 min-h-screen">
        <div className="max-w-[1280px] mx-auto md:px-8">

          {/* KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {loading && !data ? (
              <>
                <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
              </>
            ) : (
              <>
                <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-card flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Total Units</p>
                    <Building2 size={20} className="text-primary" />
                  </div>
                  <div className="mt-4">
                    <p className="text-[32px] font-bold leading-none tracking-tight text-on-surface">{summary?.total_units ?? '—'}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-primary">
                      <TrendingUp size={13} />
                      <span>Active units</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-card flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Active Reservations</p>
                    <CalendarCheck size={20} className="text-primary" />
                  </div>
                  <div className="mt-4">
                    <p className="text-[32px] font-bold leading-none tracking-tight text-on-surface">{summary?.active_reservations ?? '—'}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-primary">
                      <TrendingUp size={13} />
                      <span>{summary ? `${Math.round(summary.occupancy_rate * 100)}% occupancy` : '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-card flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Check-ins Today</p>
                    <LogIn size={20} className="text-secondary" />
                  </div>
                  <div className="mt-4">
                    <p className="text-[32px] font-bold leading-none tracking-tight text-on-surface">
                      {summary?.checkins_today.toString().padStart(2, '0') ?? '—'}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-on-surface-variant">
                      <Clock size={13} />
                      <span>{summary?.checkins_today === 0 ? 'None today' : `${summary?.checkins_today} guest${summary?.checkins_today !== 1 ? 's' : ''} arriving`}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-card flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Check-outs Today</p>
                    <LogOut size={20} className="text-tertiary" />
                  </div>
                  <div className="mt-4">
                    <p className="text-[32px] font-bold leading-none tracking-tight text-on-surface">
                      {summary?.checkouts_today.toString().padStart(2, '0') ?? '—'}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-on-surface-variant">
                      <Clock size={13} />
                      <span>{summary?.checkouts_today === 0 ? 'None today' : `${summary?.checkouts_today} guest${summary?.checkouts_today !== 1 ? 's' : ''} departing`}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Weekly Availability */}
          <div className="bg-white rounded-xl border border-outline-variant shadow-card overflow-hidden">
            {/* Panel header */}
            <div className="px-6 py-4 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-semibold text-on-surface">Weekly Availability</h2>
                <p className="text-sm text-on-surface-variant mt-0.5">{weekLabel}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Week navigation */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevWeek}
                    aria-label="Previous week"
                    className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={nextWeek}
                    aria-label="Next week"
                    className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
                {/* View toggle */}
                <div className="flex items-center bg-surface-container p-1 rounded-lg">
                  <button
                    onClick={() => setCalView('weekly')}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer focus:outline-none ${
                      calView === 'weekly' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setCalView('monthly')}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer focus:outline-none ${
                      calView === 'monthly' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>

            {calView !== 'weekly' ? (
              <div className="flex items-center justify-center py-20 text-on-surface-variant text-sm">
                Monthly view coming soon
              </div>
            ) : loading && !data ? (
              <div className="p-8 space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  {/* Day headers */}
                  <div className="grid grid-cols-[200px_repeat(7,1fr)] border-b border-outline-variant bg-surface-container-low">
                    <div className="px-4 py-3 text-sm font-semibold text-on-surface border-r border-outline-variant">
                      Property Unit
                    </div>
                    {dayHeaders.map((d, i) => {
                      const dateStr = data?.grid[0]?.days[i]?.date
                      const isToday = dateStr === today
                      return (
                        <div
                          key={i}
                          className={`px-2 py-3 text-center border-r border-outline-variant last:border-r-0 ${isToday ? 'bg-primary/5' : ''}`}
                        >
                          <span className={`block text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                            {d.name}
                          </span>
                          <span className={`text-lg font-semibold ${isToday ? 'text-primary' : 'text-on-surface'}`}>
                            {d.num}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Unit rows */}
                  <div className="divide-y divide-outline-variant">
                    {data?.grid.map(row => {
                      const prop = propertyMap[row.property_id]
                      return (
                        <div key={row.property_id} className="grid grid-cols-[200px_repeat(7,1fr)] min-h-[80px]">
                          <div className="px-4 py-3 border-r border-outline-variant flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${prop?.gradient ?? 'from-slate-300 to-slate-500'} flex items-center justify-center shrink-0`}>
                              <span className="text-white text-xs font-bold">{prop?.initials ?? '?'}</span>
                            </div>
                            <span className="text-sm font-semibold text-on-surface leading-snug line-clamp-2">
                              {prop?.name ?? row.property_id}
                            </span>
                          </div>
                          <CalendarRow days={row.days} today={today} />
                        </div>
                      )
                    })}

                    {data?.grid.length === 0 && (
                      <div className="col-span-full py-16 text-center text-on-surface-variant text-sm">
                        No properties to display
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── New Reservation FAB ───────────────────────────────────────────── */}
      <Link
        to="/reservations"
        className="fixed bottom-20 right-5 md:bottom-8 md:right-8 bg-primary hover:bg-primary-container text-on-primary pl-4 pr-5 py-3.5 rounded-full shadow-lg flex items-center gap-2 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 z-40"
        aria-label="New reservation"
      >
        <Plus size={18} />
        <span className="text-sm font-semibold hidden sm:inline">New Reservation</span>
      </Link>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────────── */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 w-full md:hidden bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 shadow-mobile-nav"
      >
        {bottomNavItems.map(({ Icon, label, to, active }) => (
          <Link
            key={label}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded ${
              active ? 'text-primary' : 'text-slate-400'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
