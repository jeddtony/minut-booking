import { X, User, Building2, CalendarDays, ChevronDown, Info } from 'lucide-react'
import { useModalTransition } from '../hooks/useModalTransition'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function NewReservationModal({ isOpen, onClose }: Props) {
  const { mounted, visible } = useModalTransition(isOpen, 220)
  if (!mounted) return null

  return (
    <div
      className={`hidden md:flex fixed inset-0 z-[60] items-center justify-center p-4
        transition-opacity duration-200 ease-out
        ${visible ? 'opacity-100' : 'opacity-0'}
        bg-[#171d1c]/40 backdrop-blur-sm`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`w-full max-w-[520px] bg-white rounded-xl shadow-popover border border-slate-200 overflow-hidden flex flex-col
          transition-all duration-200 ease-out
          ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-[0.97]'}`}
      >
        {/* Header */}
        <div className="px-6 py-6 flex justify-between items-start border-b border-slate-100">
          <div>
            <h2 className="text-[24px] font-semibold leading-tight tracking-tight text-slate-900">New Reservation</h2>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">Initialize a new guest stay and select available units.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary shrink-0 ml-4"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form className="p-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Guest Name</label>
            <div className="relative group">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-200" />
              <input type="text" placeholder="e.g. Jonathan Doe" className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Rental Unit</label>
            <div className="relative group">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-200" />
              <select defaultValue="" className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer">
                <option value="" disabled>Select an available unit</option>
                <option value="skyline-402">Skyline Lofts — Unit 402</option>
                <option value="garden-115">Garden Suites — Unit 115</option>
                <option value="harbor-301">Harbor View — Unit 301</option>
                <option value="pinnacle-12">Pinnacle Heights — Unit 12</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Check-in Date</label>
              <div className="relative group">
                <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-200" />
                <input type="date" className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Check-out Date</label>
              <div className="relative group">
                <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-200" />
                <input type="date" className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-teal-50 border border-teal-100 rounded-lg flex gap-3 items-start">
            <Info size={16} className="text-teal-600 shrink-0 mt-0.5" />
            <p className="text-xs text-teal-800 leading-relaxed">Selected unit is professionally cleaned and ready for occupancy. Booking confirmation will be sent to the owner immediately.</p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-row-reverse gap-3">
          <button type="button" className="bg-primary hover:bg-primary-container text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95">
            Save Reservation
          </button>
          <button type="button" onClick={onClose} className="text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-300 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
