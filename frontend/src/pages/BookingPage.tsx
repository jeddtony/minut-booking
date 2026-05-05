import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Building2, Calendar, User, CheckCircle, MapPin,
  ArrowRight, Clock, LayoutDashboard, CalendarCheck, TrendingUp,
} from 'lucide-react'
import type { RentalUnit } from '../api'
import { BASE_URL } from '../api'

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
  const [searchParams] = useSearchParams()
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`${BASE_URL}/rental-units?limit=3`)
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

  // Pre-select unit from ?unitId query param once units are loaded
  useEffect(() => {
    if (unitsLoading) return
    const unitId = searchParams.get('unitId')
    if (unitId) scrollToBook(unitId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitsLoading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (endDate <= startDate) { setError('Check-out must be after check-in.'); return }
    setError('')
    setSubmitting(true)
    try {
      const res  = await fetch(`${BASE_URL}/reservations`, {
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

  const selectedUnitData = units.find(u => u._id === selectedUnit)
  const nights = (startDate && endDate && endDate > startDate)
    ? Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
    : 0
  const totalPrice = selectedUnitData && nights > 0 ? nights * selectedUnitData.pricePerNight : 0

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f5faf8', color: '#171d1c' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 bg-[#f5faf8]/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={22} className="text-primary" />
            StayDesk
          </div>

          <nav className="hidden md:flex gap-8">
            <button
              onClick={() => document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-slate-600 hover:text-primary transition-colors text-sm font-medium cursor-pointer"
            >
              Properties
            </button>
            <button
              onClick={() => scrollToBook()}
              className="text-slate-600 hover:text-primary transition-colors text-sm font-medium cursor-pointer"
            >
              Book
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-slate-600 text-sm font-medium px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Log In
            </Link>
            <button
              onClick={() => scrollToBook()}
              className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              Book a Stay
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-on-surface leading-tight tracking-tight">
              Find & Book Your<br />Perfect Stay
            </h1>
            <p className="text-base text-on-surface-variant max-w-xl leading-relaxed">
              Browse our verified properties, pick your dates, and confirm in under a minute.
              No sign-up or account required.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => scrollToBook()}
                className="bg-primary text-white font-semibold text-base px-8 py-4 rounded-xl shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Book a Stay
              </button>
              <button
                onClick={() => document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 text-primary font-medium text-sm px-4 py-2 hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
              >
                View Properties <ArrowRight size={15} />
              </button>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {['bg-teal-400', 'bg-sky-400', 'bg-indigo-400'].map((c, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-white ${c}`} />
                ))}
              </div>
              <p className="text-sm text-on-surface-variant">Trusted by 2,000+ guests</p>
            </div>
          </div>

          {/* Dashboard image */}
          <div className="relative hidden lg:block">
            <div className="bg-white border border-outline-variant rounded-xl overflow-hidden"
              style={{ boxShadow: '0px 12px 24px rgba(15,23,42,0.10)' }}>
              <img
                src="/hero-property.jpg"
                alt="Luxury rental property"
                className="w-full h-auto"
              />
            </div>
            {/* Floating stat card */}
            <div className="absolute -bottom-5 -left-6 bg-white p-4 rounded-xl border border-slate-100 hidden md:flex items-center gap-3"
              style={{ boxShadow: '0px 8px 20px rgba(15,23,42,0.10)' }}>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <TrendingUp size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Instant Booking</p>
                <p className="text-[17px] font-semibold text-on-surface leading-tight">No sign-up needed</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trusted By ────────────────────────────────────────────────────── */}
        <section className="bg-surface-container-low py-12">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-[11px] font-semibold text-on-surface-variant mb-8 uppercase tracking-widest">
              Why guests choose StayDesk
            </p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16">
              {[
                { label: 'Instant Confirmation', sub: 'Booking confirmed right away' },
                { label: 'No Account Required', sub: 'Skip the sign-up hassle' },
                { label: 'Verified Properties', sub: 'Curated and quality-checked' },
                { label: '2,000+ Stays Booked', sub: 'Trusted by guests worldwide' },
              ].map(({ label, sub }) => (
                <div key={label} className="text-center">
                  <p className="text-base font-semibold text-on-surface">{label}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Simple Booking, Every Time</h2>
            <p className="text-sm text-on-surface-variant max-w-xl mx-auto leading-relaxed">
              Three steps is all it takes — no account, no credit card, no complexity.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                Icon: Building2,
                step: '01',
                title: 'Browse Properties',
                desc: 'Explore our curated apartments, houses, villas, and studios across top locations.',
              },
              {
                Icon: Calendar,
                step: '02',
                title: 'Pick Your Dates',
                desc: 'Choose check-in and check-out dates and see your total price instantly.',
              },
              {
                Icon: CheckCircle,
                step: '03',
                title: 'Confirm & Stay',
                desc: 'Enter your name and submit — your reservation is confirmed immediately.',
              },
            ].map(({ Icon, step, title, desc }) => (
              <div
                key={step}
                className="p-8 bg-white border border-outline-variant rounded-xl hover:border-primary transition-colors group"
                style={{ boxShadow: '0px 4px 12px rgba(15,23,42,0.04)' }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full tracking-wider">
                    {step}
                  </span>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary transition-colors">
                    <Icon size={20} className="text-primary group-hover:text-white transition-colors" />
                  </div>
                </div>
                <h3 className="text-[18px] font-semibold text-on-surface mb-3">{title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Properties ────────────────────────────────────────────────────── */}
        <section id="properties" className="bg-surface-container py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-on-surface mb-2 tracking-tight">
                  Your Portfolio, Ready to Book
                </h2>
                <p className="text-sm text-on-surface-variant max-w-xl leading-relaxed">
                  Every unit ready for instant reservation — no waitlists, no middlemen.
                </p>
              </div>
              <button
                onClick={() => scrollToBook()}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
              >
                Book Now
              </button>
            </div>

            {unitsLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden border border-outline-variant animate-pulse"
                    style={{ boxShadow: '0px 4px 12px rgba(15,23,42,0.04)' }}>
                    <div className="h-48 bg-slate-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                      <div className="h-8 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : units.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-14 h-14 bg-white border border-outline-variant rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Building2 size={24} className="text-on-surface-variant" />
                </div>
                <p className="text-sm text-on-surface-variant">No properties available at this time.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {units.map(unit => (
                  <div
                    key={unit._id}
                    onClick={() => scrollToBook(unit._id)}
                    className="bg-white rounded-xl overflow-hidden border border-outline-variant hover:border-primary transition-colors group cursor-pointer"
                    style={{ boxShadow: '0px 4px 12px rgba(15,23,42,0.04)' }}
                  >
                    <div className="h-48 overflow-hidden">
                      {unit.imageUrl ? (
                        <img
                          src={unit.imageUrl}
                          alt={unit.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${gradientFor(unit._id)} flex items-center justify-center`}>
                          <span className="text-white/25 text-6xl font-black select-none tracking-tight">
                            {initialsFor(unit.name)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="text-[18px] font-semibold text-on-surface leading-snug">{unit.name}</h4>
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ml-2">
                          {PROPERTY_TYPE_LABELS[unit.propertyType] ?? 'Property'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <MapPin size={13} className="shrink-0" />
                        <span className="text-sm truncate">
                          {[unit.city, unit.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <div>
                          <span className="text-lg font-bold text-on-surface">${unit.pricePerNight}</span>
                          <span className="text-xs text-on-surface-variant"> / night</span>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); scrollToBook(unit._id) }}
                          className="text-xs font-semibold text-primary bg-primary/10 group-hover:bg-primary group-hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
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

        {/* ── CTA Banner ────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="bg-primary rounded-3xl p-12 lg:p-20 relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-3xl font-bold text-white leading-snug">
                Ready to reserve your perfect stay?
              </h2>
              <p className="text-base text-white/75 leading-relaxed">
                No account required. Just pick a property, choose your dates, and confirm — it takes under a minute.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => scrollToBook()}
                  className="bg-white text-primary font-semibold text-base px-10 py-4 rounded-xl shadow-lg hover:bg-primary-fixed transition-all cursor-pointer active:scale-95"
                >
                  Book Now
                </button>
                <button
                  onClick={() => document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-white text-white font-semibold text-base px-10 py-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                >
                  View Properties
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Booking Form ──────────────────────────────────────────────────── */}
        <section
          ref={bookSectionRef}
          id="book"
          className="py-16 bg-surface-container-low border-t border-slate-100"
        >
          <div className="max-w-xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                <CalendarCheck size={12} />
                Instant Booking
              </span>
              <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Reserve Your Stay</h2>
              <p className="text-sm text-on-surface-variant mt-2">No account needed — fill in the details below.</p>
            </div>

            {success ? (
              <div className="bg-white rounded-2xl border border-outline-variant p-8 text-center"
                style={{ boxShadow: '0px 4px 12px rgba(15,23,42,0.06)' }}>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={32} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-on-surface mb-2">Booking Confirmed!</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  <strong className="text-on-surface">{success.guestName}</strong>'s reservation at{' '}
                  <strong className="text-on-surface">{success.unitName}</strong> has been confirmed.
                  <br />
                  <span className="text-xs">{success.start} → {success.end}</span>
                </p>
                <button
                  onClick={() => setSuccess(null)}
                  className="bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  Book Another Stay
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-outline-variant p-6 sm:p-8 space-y-5"
                style={{ boxShadow: '0px 4px 12px rgba(15,23,42,0.06)' }}
              >
                {/* Guest name */}
                <div>
                  <label htmlFor="guestName" className="block text-sm font-semibold text-on-surface mb-1.5">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    <input
                      id="guestName"
                      type="text"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      placeholder="e.g. Jane Smith"
                      required
                      className="w-full pl-9 pr-4 py-2.5 border border-outline-variant rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>

                {/* Property */}
                <div>
                  <label htmlFor="unit" className="block text-sm font-semibold text-on-surface mb-1.5">
                    Property
                  </label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    <select
                      id="unit"
                      value={selectedUnit}
                      onChange={e => setSelectedUnit(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow appearance-none bg-white cursor-pointer"
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
                    <label htmlFor="startDate" className="block text-sm font-semibold text-on-surface mb-1.5">
                      Check-in
                    </label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                      <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        min={today}
                        onChange={e => { setStartDate(e.target.value); if (endDate && e.target.value >= endDate) setEndDate('') }}
                        required
                        className="w-full pl-9 pr-2 py-2.5 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-semibold text-on-surface mb-1.5">
                      Check-out
                    </label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                      <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        min={startDate ? (() => { const d = new Date(startDate + 'T00:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })() : today}
                        onChange={e => setEndDate(e.target.value)}
                        required
                        className="w-full pl-9 pr-2 py-2.5 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                      />
                    </div>
                  </div>
                </div>

                {/* Price preview */}
                {totalPrice > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Clock size={13} className="text-primary" />
                      <span>{nights} night{nights !== 1 ? 's' : ''} × ${selectedUnitData?.pricePerNight}</span>
                    </div>
                    <span className="font-bold text-on-surface">${totalPrice} total</span>
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
                  className="w-full bg-primary hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all cursor-pointer text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  {submitting ? 'Confirming reservation…' : 'Confirm Reservation'}
                </button>

                <p className="text-center text-xs text-on-surface-variant">
                  By booking you agree to our cancellation policy.
                </p>
              </form>
            )}
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="w-full border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start gap-10">
          <div className="space-y-4 max-w-xs">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Building2 size={20} className="text-primary" />
              StayDesk
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Instant property bookings — no account, no hassle. Find your perfect stay in seconds.
            </p>
            <div className="flex gap-3">
              <LayoutDashboard size={18} className="text-slate-400 hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">Browse</p>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer"
                  >
                    Properties
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToBook()}
                    className="text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer"
                  >
                    Book a Stay
                  </button>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">Company</p>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">Legal</p>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Terms of Service</a></li>
                <li>
                  <Link to="/login" className="text-sm text-slate-500 hover:text-primary transition-colors">
                    Manager Sign In
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-5 border-t border-slate-100">
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} StayDesk. Precision in Property Management.</p>
        </div>
      </footer>

    </div>
  )
}
