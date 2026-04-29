import { useState, useEffect } from 'react'
import { X, ChevronDown, CloudUpload, Upload, Loader2 } from 'lucide-react'
import { useModalTransition } from '../hooks/useModalTransition'
import { api, RentalUnit } from '../api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editUnit?: RentalUnit
}

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-outline bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm'

const labelCls = 'block text-[11px] font-semibold text-secondary uppercase tracking-widest mb-2'

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'studio', label: 'Studio' },
  { value: 'house', label: 'House' },
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

export default function AddPropertyBottomSheet({ isOpen, onClose, onSuccess, editUnit }: Props) {
  const { mounted, visible } = useModalTransition(isOpen, 320)
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
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <form
        onSubmit={handleSubmit}
        className={`relative bg-surface-container-lowest w-full rounded-t-[24px] shadow-2xl flex flex-col max-h-[90dvh]
          transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3 shrink-0">
          <div className="w-12 h-1.5 bg-surface-variant rounded-full" />
        </div>

        {/* Sheet header */}
        <div className="px-4 pb-4 border-b border-outline-variant shrink-0">
          <h2 className="text-[24px] font-semibold leading-tight tracking-tight text-on-surface">
            {isEdit ? 'Edit Property' : 'Add New Property'}
          </h2>
          <p className="text-sm text-secondary mt-1">
            {isEdit ? 'Update the details for this rental unit.' : 'Fill in the details to list a new unit.'}
          </p>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          <div>
            <label className={labelCls}>Property Name</label>
            <input required type="text" placeholder="e.g. Waterfront Penthouse" className={inputCls} value={form.name} onChange={set('name')} />
          </div>

          <div>
            <label className={labelCls}>Property Type</label>
            <div className="relative">
              <select className={`${inputCls} appearance-none pr-10 cursor-pointer`} value={form.propertyType} onChange={set('propertyType')}>
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Street Address</label>
              <input required type="text" placeholder="123 Operational Way" className={inputCls} value={form.address} onChange={set('address')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input required type="text" placeholder="San Francisco" className={inputCls} value={form.city} onChange={set('city')} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input required type="text" placeholder="CA" className={inputCls} value={form.state} onChange={set('state')} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Zip</label>
              <input required type="text" placeholder="94103" className={inputCls} value={form.postalCode} onChange={set('postalCode')} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Pricing Per Night ($)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-medium text-sm">$</span>
              <input required type="number" min="0.01" step="0.01" placeholder="0.00" className={`${inputCls} pl-8`} value={form.pricePerNight} onChange={set('pricePerNight')} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} placeholder="Describe the workspace and amenities..." className={`${inputCls} resize-none`} value={form.description} onChange={set('description')} />
          </div>

          <div>
            <label className={labelCls}>Property Image</label>
            {filePreviewUrl ?? (isEdit ? editUnit?.imageUrl : null) ? (
              <div className="relative rounded-xl overflow-hidden border border-outline-variant">
                <img
                  src={(filePreviewUrl ?? editUnit?.imageUrl)!}
                  alt="Property preview"
                  className="w-full h-44 object-cover"
                />
                {/* Hover overlay — tap to replace */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/50 active:bg-black/50 transition-colors duration-200 cursor-pointer group">
                  <div className="text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Upload size={20} className="mx-auto mb-1" />
                    <span className="text-sm font-medium">Replace image</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files?.[0] ?? null)} />
                </label>
                {filePreviewUrl && (
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    aria-label="Remove selected image"
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:bg-white transition-colors duration-200 cursor-pointer shadow-sm"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-xl p-8 bg-surface-container-low hover:bg-surface-container transition-colors duration-200 cursor-pointer group">
                <CloudUpload size={28} className="text-primary mb-2 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium text-on-surface">Click to upload or drag and drop</span>
                <span className="text-xs text-secondary mt-1">PNG, JPG or WEBP (Max 5MB)</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{submitError}</p>
          )}

          <div className="h-4" />
        </div>

        {/* Sticky footer */}
        <div className="px-4 pt-3 pb-6 bg-white border-t border-outline-variant shrink-0">
          <button type="button" onClick={onClose} className="w-full text-center py-2.5 text-sm text-secondary font-medium hover:text-primary transition-colors duration-200 cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-container text-on-primary py-4 rounded-xl text-[18px] font-semibold shadow-lg transition-colors duration-200 cursor-pointer focus:outline-none active:scale-[0.98] mt-1 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Property'}
          </button>
        </div>
      </form>
    </div>
  )
}
