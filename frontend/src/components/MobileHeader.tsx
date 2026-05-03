import { Search, Bell } from 'lucide-react'

export default function MobileHeader() {
  return (
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
  )
}
