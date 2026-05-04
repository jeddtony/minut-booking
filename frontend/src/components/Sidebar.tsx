import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, CalendarCheck, MessageSquareText,
  UserCircle, Settings, LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { Icon: LayoutDashboard, label: 'Dashboard',   to: '/dashboard' },
  { Icon: Building2,       label: 'Units',        to: '/units' },
  { Icon: CalendarCheck,   label: 'Reservations', to: '/reservations' },
  { Icon: MessageSquareText, label: 'Assist',     to: '/suggest' },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const navigate   = useNavigate()
  const { pathname } = useLocation()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[260px] bg-[#0F172A] border-r border-slate-800 z-40">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-container rounded flex items-center justify-center shrink-0">
          <Building2 size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight leading-none">StayDesk</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 mt-6 px-3 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ Icon, label, to }) => {
          const active = pathname === to
          return (
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
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer"
        >
          <UserCircle size={18} />
          <span className="text-sm">Profile</span>
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer"
        >
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
  )
}
