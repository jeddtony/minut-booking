import { useState, useEffect } from 'react'
import { X, User, Building2, CalendarDays, ChevronDown, Info, Loader2 } from 'lucide-react'
import { useModalTransition } from '../hooks/useModalTransition'
import { api, RentalUnit, Reservation, getUnitId } from '../api'

interface Props {
  isOpen: boolean
  onClose: () => void
  units: RentalUnit[]
  onSuccess: () => void
  editReservation?: Reservation
}

const EMPTY_FORM = { guestName: '', rentalUnitId: '', startDate: '', endDate: '' }

function formFromReservation(r: Reservation) {
  return {
    guestName: r.guestName,
    rentalUnitId: getUnitId(r.rentalUnitId),
    startDate: r.startDate.slice(0, 10),
    endDate: r.endDate.slice(0, 10),
  }
}

export default function NewReservationModal({ isOpen, onClose, units, onSuccess, editReservation }: Props) {
  const { mounted, visible } = useModalTransition(isOpen, 220)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM)
    } else {
      setForm(editReservation ? formFromReservation(editReservation) : EMPTY_FORM)
    }
    setSubmitError(null)
  }, [isOpen, editReservation])

  if (!mounted) return null

  const isEdit = Boolean(editReservation)

  function set(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (isEdit && editReservation) {
        await api.reservations.update(editReservation._id, {
          rentalUnitId: form.rentalUnitId,
          guestName: form.guestName,
          startDate: form.startDate,
          endDate: form.endDate,
        })
      } else {
        await api.reservations.create({
          rentalUnitId: form.rentalUnitId,
          guestName: form.guestName,
          startDate: form.startDate,
          endDate: form.endDate,
        })
      }
      onSuccess()
      onClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save reservation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={`hidden md:flex fixed inset-0 z-[60] items-center justify-center p-4
        transition-opacity duration-200 ease-out
        ${visible ? 'opacity-100' : 'opacity-0'}
        bg-[#171d1c]/40 backdrop-blur-sm`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-[520px] bg-white rounded-xl shadow-popover border border-slate-200 overflow-hidden flex flex-col
          transition-all duration-200 ease-out
          ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-[0.97]'}`}
      >
        {/* Header */}
        <div className="px-6 py-6 flex justify-between items-start border-b border-slate-100">
          <div>
            <h2 className="text-[24px] font-semibold leading-tight tracking-tight text-slate-900">
              {isEdit ? 'Edit Reservation' : 'New Reservation'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {isEdit ? 'Update the guest or stay details below.' : 'Initialize a new guest stay and select available units.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary shrink-0 ml-4"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Guest Name</label>
            <div className="relative group">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-200" />
              <input
                required
                type="text"
                placeholder="e.g. Jonathan Doe"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                value={form.guestName}
                onChange={set('guestName')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Rental Unit</label>
            <div className="relative group">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-200" />
              <select
                required
                value={form.rentalUnitId}
                onChange={set('rentalUnitId')}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
              >
                <option value="" disabled>Select an available unit</option>
                {units.map(u => (
                  <option key={u._id} value={u._id}>{u.name} — {u.address}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Check-in Date</label>
              <div className="relative group">
                <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-200" />
                <input
                  required
                  type="date"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  value={form.startDate}
                  onChange={set('startDate')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Check-out Date</label>
              <div className="relative group">
                <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-200" />
                <input
                  required
                  type="date"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  value={form.endDate}
                  onChange={set('endDate')}
                />
              </div>
            </div>
          </div>

          {!isEdit && (
            <div className="p-4 bg-teal-50 border border-teal-100 rounded-lg flex gap-3 items-start">
              <Info size={16} className="text-teal-600 shrink-0 mt-0.5" />
              <p className="text-xs text-teal-800 leading-relaxed">Selected unit is professionally cleaned and ready for occupancy. Booking confirmation will be sent to the owner immediately.</p>
            </div>
          )}

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{submitError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-row-reverse gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary hover:bg-primary-container text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Reservation'}
          </button>
          <button type="button" onClick={onClose} className="text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-300 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
