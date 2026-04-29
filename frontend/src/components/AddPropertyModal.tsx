import { useState, useEffect } from 'react'
import { X, ChevronDown, Upload, Loader2 } from 'lucide-react'
import { useModalTransition } from '../hooks/useModalTransition'
import { api, RentalUnit } from '../api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editUnit?: RentalUnit
}

const inputCls =
  'w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white'

const labelCls = 'block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5'

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'villa', label: 'Villa' },
  { value: 'condo', label: 'Condo' },
  { value: 'other', label: 'Other' },
]

const EMPTY_FORM = {
  name: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  pricePerNight: '',
  propertyType: 'apartment',
  description: '',
}

function formFromUnit(u: RentalUnit) {
  return {
    name: u.name,
    address: u.address ?? '',
    city: u.city ?? '',
    state: u.state ?? '',
    postalCode: u.postalCode ?? '',
    pricePerNight: String(u.pricePerNight ?? ''),
    propertyType: u.propertyType ?? 'apartment',
    description: u.description ?? '',
  }
}

export default function AddPropertyModal({ isOpen, onClose, onSuccess, editUnit }: Props) {
  const { mounted, visible } = useModalTransition(isOpen, 220)
  const [form, setForm] = useState(EMPTY_FORM)
  const [image, setImage] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM)
    } else {
      setForm(editUnit ? formFromUnit(editUnit) : EMPTY_FORM)
    }
    setImage(null)
    setSubmitError(null)
  }, [isOpen, editUnit])

  useEffect(() => {
    if (!image) { setFilePreviewUrl(null); return }
    const url = URL.createObjectURL(image)
    setFilePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  if (!mounted) return null

  const isEdit = Boolean(editUnit)

  function set(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('address', form.address)
      fd.append('city', form.city)
      fd.append('state', form.state)
      fd.append('postalCode', form.postalCode)
      fd.append('pricePerNight', form.pricePerNight)
      fd.append('propertyType', form.propertyType)
      if (form.description) fd.append('description', form.description)
      if (image) fd.append('image', image)

      if (isEdit && editUnit) {
        await api.rentalUnits.update(editUnit._id, fd)
      } else {
        await api.rentalUnits.create(fd)
      }

      onSuccess()
      onClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save property')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={`hidden md:flex fixed inset-0 z-[60] items-center justify-center p-4
        transition-opacity duration-200 ease-out
        ${visible ? 'opacity-100' : 'opacity-0'}
        bg-slate-900/40 backdrop-blur-sm`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-[640px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col
          transition-all duration-200 ease-out
          ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-[0.97]'}`}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-[24px] font-semibold leading-tight tracking-tight text-on-surface">
              {isEdit ? 'Edit Property' : 'Add New Property'}
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              {isEdit ? 'Update the details for this rental unit.' : 'Enter the details of your new rental unit below.'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary shrink-0 ml-4">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 max-h-[calc(100vh-240px)]">
          <div>
            <label className={labelCls}>Property Name</label>
            <input required type="text" placeholder="e.g. Sunset Heights Penthouse" className={inputCls} value={form.name} onChange={set('name')} />
          </div>

          <div>
            <label className={labelCls}>Street Address</label>
            <input required type="text" placeholder="123 Property Lane" className={inputCls} value={form.address} onChange={set('address')} />
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <label className={labelCls}>City</label>
              <input required type="text" placeholder="City" className={inputCls} value={form.city} onChange={set('city')} />
            </div>
            <div className="col-span-3">
              <label className={labelCls}>State</label>
              <input required type="text" placeholder="ST" className={inputCls} value={form.state} onChange={set('state')} />
            </div>
            <div className="col-span-3">
              <label className={labelCls}>Zip</label>
              <input required type="text" placeholder="00000" className={inputCls} value={form.postalCode} onChange={set('postalCode')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Pricing per night</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                <input required type="number" min="0.01" step="0.01" placeholder="0.00" className={`${inputCls} pl-7`} value={form.pricePerNight} onChange={set('pricePerNight')} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Property Type</label>
              <div className="relative">
                <select className={`${inputCls} appearance-none pr-8 cursor-pointer`} value={form.propertyType} onChange={set('propertyType')}>
                  {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} placeholder="Provide a detailed overview of the unit's features and amenities..." className={`${inputCls} resize-none`} value={form.description} onChange={set('description')} />
          </div>

          <div>
            <label className={labelCls}>Property Image</label>
            {filePreviewUrl ?? (isEdit ? editUnit?.imageUrl : null) ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={(filePreviewUrl ?? editUnit?.imageUrl)!}
                  alt="Property preview"
                  className="w-full h-48 object-cover"
                />
                {/* Hover overlay — click to replace */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/50 transition-colors duration-200 cursor-pointer group">
                  <div className="text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Upload size={20} className="mx-auto mb-1" />
                    <span className="text-sm font-medium">Replace image</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files?.[0] ?? null)} />
                </label>
                {/* Clear newly selected file (returns to existing image) */}
                {filePreviewUrl && (
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    aria-label="Remove selected image"
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:bg-white transition-colors duration-200 cursor-pointer shadow-sm"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 hover:bg-slate-100 hover:border-primary transition-colors duration-200 cursor-pointer group">
                <Upload size={32} className="text-slate-300 group-hover:text-primary transition-colors duration-200 mb-2" />
                <p className="text-sm font-medium text-on-surface">Drop your photo here, or <span className="text-primary font-semibold">browse</span></p>
                <p className="text-xs text-on-surface-variant mt-1">Supports: JPG, PNG, WEBP (Max 5MB)</p>
                <input type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{submitError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-slate-200 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white rounded-lg text-sm font-semibold shadow-sm transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Property'}
          </button>
        </div>
      </form>
    </div>
  )
}
