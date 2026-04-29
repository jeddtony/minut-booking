import { X, User, Building2, CalendarDays, ChevronDown } from 'lucide-react'
import { useModalTransition } from '../hooks/useModalTransition'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function NewReservationBottomSheet({ isOpen, onClose }: Props) {
  const { mounted, visible } = useModalTransition(isOpen, 320)
  if (!mounted) return null

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-[#171d1c]/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`relative bg-white rounded-t-[32px] w-full p-8 shadow-2xl transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[24px] font-semibold leading-tight tracking-tight text-on-surface">New Reservation</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-surface-container transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary">
            <X size={18} className="text-on-surface-variant" />
          </button>
        </div>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block ml-1">Guest Name</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <input type="text" placeholder="e.g. John Smith" className="w-full pl-12 pr-4 py-4 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block ml-1">Rental Unit</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <select className="w-full pl-12 pr-4 py-4 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none cursor-pointer">
                <option>Select a property unit</option>
                <option>Penthouse Suite — Building A</option>
                <option>Garden Studio — Building B</option>
                <option>Urban Loft — Building C</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block ml-1">Check-in</label>
              <div className="relative">
                <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input type="date" className="w-full pl-12 pr-2 py-4 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block ml-1">Check-out</label>
              <div className="relative">
                <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input type="date" className="w-full pl-12 pr-2 py-4 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col items-center gap-4">
            <button type="submit" className="w-full bg-primary text-on-primary py-4 rounded-xl text-[18px] font-semibold shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-[0.98] transition-all duration-200 cursor-pointer focus:outline-none">
              Save Reservation
            </button>
            <button type="button" onClick={onClose} className="text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-200 cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
