import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Building, CalendarDays, User } from 'lucide-react'

const NAV_ITEMS = [
  { Icon: LayoutGrid,   label: 'Dashboard', to: '/dashboard' },
  { Icon: Building,     label: 'Units',     to: '/units' },
  { Icon: CalendarDays, label: 'Booking',   to: '/reservations' },
  { Icon: User,         label: 'Profile',   to: '#' },
]

export default function MobileBottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 w-full md:hidden bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 shadow-mobile-nav"
    >
      {NAV_ITEMS.map(({ Icon, label, to }) => {
        const active = pathname === to
        return (
          <Link
            key={label}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded ${
              active ? 'text-primary' : 'text-slate-400'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
