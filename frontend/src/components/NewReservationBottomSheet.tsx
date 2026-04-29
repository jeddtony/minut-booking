import { useState, useEffect } from 'react'
import { X, User, Building2, CalendarDays, ChevronDown, Loader2 } from 'lucide-react'
import { useModalTransition } from '../hooks/useModalTransition'
import { api, RentalUnit } from '../api'

interface Props {
  isOpen: boolean
  onClose: () => void
  units: RentalUnit[]
  onSuccess: () => void
}

const EMPTY_FORM = { guestName: '', rentalUnitId: '', startDate: '', endDate: '' }

export default function NewReservationBottomSheet({ isOpen, onClose, units, onSuccess }: Props) {
  const { mounted, visible } = useModalTransition(isOpen, 320)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM)
      setSubmitError(null)
    }
  }, [isOpen])

  if (!mounted) return null

  function set(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      await api.reservations.create({
        rentalUnitId: form.rentalUnitId,
        guestName: form.guestName,
        startDate: form.startDate,
        endDate: form.endDate,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create reservation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-[#171d1c]/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <form
        onSubmit={handleSubmit}
        className={`relative bg-white rounded-t-[32px] w-full p-8 shadow-2xl transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[24px] font-semibold leading-tight tracking-tight text-on-surface">New Reservation</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-surface-container transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary">
            <X size={18} className="text-on-surface-variant" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block ml-1">Guest Name</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <input
                required
                type="text"
                placeholder="e.g. John Smith"
                className="w-full pl-12 pr-4 py-4 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                value={form.guestName}
                onChange={set('guestName')}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block ml-1">Rental Unit</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <select
                required
                value={form.rentalUnitId}
                onChange={set('rentalUnitId')}
                className="w-full pl-12 pr-4 py-4 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="" disabled>Select a property unit</option>
                {units.map(u => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block ml-1">Check-in</label>
              <div className="relative">
                <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  required
                  type="date"
                  className="w-full pl-12 pr-2 py-4 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  value={form.startDate}
                  onChange={set('startDate')}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block ml-1">Check-out</label>
              <div className="relative">
                <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  required
                  type="date"
                  className="w-full pl-12 pr-2 py-4 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  value={form.endDate}
                  onChange={set('endDate')}
                />
              </div>
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{submitError}</p>
          )}

          <div className="pt-4 flex flex-col items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-on-primary py-4 rounded-xl text-[18px] font-semibold shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-[0.98] transition-all duration-200 cursor-pointer focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              {submitting ? 'Saving…' : 'Save Reservation'}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-200 cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
