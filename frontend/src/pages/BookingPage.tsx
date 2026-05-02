import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Calendar, User, CheckCircle, MapPin,
  ArrowRight, ChevronRight, Shield, Zap, Clock,
} from 'lucide-react'
import type { RentalUnit } from '../api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartment', house: 'House', villa: 'Villa',
  studio: 'Studio', condo: 'Condo', other: 'Property',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const [units, setUnits] = useState<RentalUnit[]>([])
  const [unitsLoading, setUnitsLoading] = useState(true)

  const [selectedUnit, setSelectedUnit] = useState('')
  const [guestName, setGuestName]       = useState('')
  const [startDate, setStartDate]       = useState('')
  const [endDate, setEndDate]           = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState<{
    guestName: string; unitName: string; start: string; end: string
  } | null>(null)

  const bookSectionRef = useRef<HTMLElement>(null)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/v1/rental-units?limit=3')
        const body = await res.json()
        if (res.ok) setUnits(body.data ?? [])
      } catch {
        // network error — leave empty
      } finally {
        setUnitsLoading(false)
      }
    }
    load()
  }, [])

  function scrollToBook(preselect?: string) {
    if (preselect) setSelectedUnit(preselect)
    setTimeout(() => bookSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (endDate <= startDate) { setError('Check-out must be after check-in.'); return }
    setError('')
    setSubmitting(true)
    try {
      const res  = await fetch('/api/v1/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentalUnitId: selectedUnit, guestName, startDate, endDate }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message ?? 'Booking failed. Please try again.')
      const unit = units.find(u => u._id === selectedUnit)
      setSuccess({ guestName, unitName: unit?.name ?? 'the property', start: startDate, end: endDate })
      setGuestName(''); setStartDate(''); setEndDate(''); setSelectedUnit('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Price preview
  const selectedUnitData = units.find(u => u._id === selectedUnit)
  const nights = (startDate && endDate && endDate > startDate)
    ? Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
    : 0
  const totalPrice = selectedUnitData && nights > 0 ? nights * selectedUnitData.pricePerNight : 0

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Sticky Nav ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight">StayDesk</span>
          </div>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-500">
            <button
              onClick={() => document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-teal-600 transition-colors duration-150 cursor-pointer"
            >
              Properties
            </button>
            <button
              onClick={() => scrollToBook()}
              className="hover:text-teal-600 transition-colors duration-150 cursor-pointer"
            >
              Book
            </button>
          </nav>

          <Link
            to="/login"
            className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors duration-150 flex items-center gap-1"
          >
            Manager Sign in <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="pt-16 min-h-[88vh] flex items-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d1f2d] to-teal-950">
        {/* Decorative glows */}
        <div className="absolute top-32 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 w-full">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-teal-400/15 border border-teal-400/20 text-teal-300 text-xs font-semibold rounded-full mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Instant booking — no account needed
            </span>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
              Find & Book<br />
              Your Perfect<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
                Stay
              </span>
            </h1>

            <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg">
              Browse our verified properties, pick your dates, and confirm in under a minute.
              No sign-up required.
            </p>

            <div className="flex flex-wrap gap-3 mb-12">
              <button
                onClick={() => scrollToBook()}
                className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors duration-200 cursor-pointer shadow-lg shadow-teal-500/25 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Book a Stay <ArrowRight size={16} />
              </button>
              <button
                onClick={() => document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 border border-white/15 text-slate-300 hover:text-white hover:bg-white/8 font-semibold px-7 py-3.5 rounded-xl transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                View Properties
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 text-slate-400 text-sm">
              {[
                { icon: <Zap size={13} className="text-teal-400" />, label: 'Instant confirmation' },
                { icon: <Shield size={13} className="text-teal-400" />, label: 'Verified properties' },
                { icon: <CheckCircle size={13} className="text-teal-400" />, label: 'No sign-up required' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  {icon}
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                step: '01', Icon: Building2,
                title: 'Browse Properties',
                desc: 'Explore our curated selection of apartments, houses, villas, and studios.',
              },
              {
                step: '02', Icon: Calendar,
                title: 'Pick Your Dates',
                desc: 'Choose your check-in and check-out dates and see instant availability.',
              },
              {
                step: '03', Icon: CheckCircle,
                title: 'Confirm & Stay',
                desc: 'Enter your name and submit — no account or payment details needed.',
              },
            ].map(({ step, Icon, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full tracking-wider">
                    {step}
                  </span>
                  <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                    <Icon size={18} className="text-teal-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Properties grid ─────────────────────────────────────────────────── */}
      <section id="properties" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Available Properties</h2>
              <p className="text-sm text-slate-500 mt-1">All units ready to book right now</p>
            </div>
            <button
              onClick={() => scrollToBook()}
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors duration-150 cursor-pointer"
            >
              Book now <ChevronRight size={14} />
            </button>
          </div>

          {unitsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
                  <div className="h-44 bg-slate-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-8 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : units.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">No properties available at this time.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {units.map(unit => (
                <div
                  key={unit._id}
                  onClick={() => scrollToBook(unit._id)}
                  className="group rounded-2xl overflow-hidden border border-slate-100 hover:border-teal-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  {/* Property image / gradient */}
                  <div className={`h-44 bg-gradient-to-br ${gradientFor(unit._id)} flex items-center justify-center relative`}>
                    <span className="text-white/25 text-6xl font-black select-none tracking-tight">
                      {initialsFor(unit.name)}
                    </span>
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {PROPERTY_TYPE_LABELS[unit.propertyType] ?? 'Property'}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="font-semibold text-slate-900 truncate text-[15px]">{unit.name}</h3>
                    <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs">
                      <MapPin size={11} />
                      <span className="truncate">
                        {[unit.city, unit.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                    {unit.description && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {unit.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <div>
                        <span className="text-lg font-bold text-slate-900">${unit.pricePerNight}</span>
                        <span className="text-xs text-slate-400"> / night</span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); scrollToBook(unit._id) }}
                        className="text-xs font-semibold text-teal-600 bg-teal-50 group-hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400"
                      >
                        Select →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Booking form ────────────────────────────────────────────────────── */}
      <section
        ref={bookSectionRef}
        id="book"
        className="py-16 bg-gradient-to-br from-slate-50 to-teal-50/40 border-t border-slate-100"
      >
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Reserve Your Stay</h2>
            <p className="text-sm text-slate-500 mt-1.5">No account needed — just fill in the details below.</p>
          </div>

          {success ? (
            <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-teal-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Booking Confirmed!</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                <strong className="text-slate-700">{success.guestName}</strong>'s reservation at{' '}
                <strong className="text-slate-700">{success.unitName}</strong> has been confirmed.
                <br />
                <span className="text-xs">
                  {success.start} &rarr; {success.end}
                </span>
              </p>
              <button
                onClick={() => setSuccess(null)}
                className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
              >
                Book Another Stay
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5"
            >
              {/* Guest name */}
              <div>
                <label htmlFor="guestName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Your Full Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="guestName"
                    type="text"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              {/* Property */}
              <div>
                <label htmlFor="unit" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Property
                </label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    id="unit"
                    value={selectedUnit}
                    onChange={e => setSelectedUnit(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow appearance-none bg-white cursor-pointer"
                  >
                    <option value="">Select a property…</option>
                    {units.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.name} — ${u.pricePerNight}/night
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Check-in
                  </label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="startDate"
                      type="date"
                      value={startDate}
                      min={today}
                      onChange={e => { setStartDate(e.target.value); if (endDate && e.target.value >= endDate) setEndDate('') }}
                      required
                      className="w-full pl-9 pr-2 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Check-out
                  </label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="endDate"
                      type="date"
                      value={endDate}
                      min={startDate ? (() => { const d = new Date(startDate + 'T00:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })() : today}
                      onChange={e => setEndDate(e.target.value)}
                      required
                      className="w-full pl-9 pr-2 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
              </div>

              {/* Price preview */}
              {totalPrice > 0 && (
                <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={13} className="text-teal-500" />
                    <span>{nights} night{nights !== 1 ? 's' : ''} × ${selectedUnitData?.pricePerNight}</span>
                  </div>
                  <span className="font-bold text-slate-900">${totalPrice} total</span>
                </div>
              )}

              {error && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer text-sm shadow-sm shadow-teal-200/60 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
              >
                {submitting ? 'Confirming reservation…' : 'Confirm Reservation'}
              </button>

              <p className="text-center text-xs text-slate-400">
                By booking you agree to our cancellation policy.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded flex items-center justify-center">
              <Building2 size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">StayDesk</span>
          </div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} StayDesk. All rights reserved.</p>
          <Link
            to="/login"
            className="text-xs text-slate-400 hover:text-teal-400 transition-colors duration-150 flex items-center gap-1"
          >
            Property Manager Sign In <ArrowRight size={11} />
          </Link>
        </div>
      </footer>
    </div>
  )
}
