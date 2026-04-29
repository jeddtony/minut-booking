import { X, ChevronDown, Upload } from 'lucide-react'
import { useModalTransition } from '../hooks/useModalTransition'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const inputCls =
  'w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white'

const labelCls = 'block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5'

export default function AddPropertyModal({ isOpen, onClose }: Props) {
  const { mounted, visible } = useModalTransition(isOpen, 220)
  if (!mounted) return null

  return (
    <div
      className={`hidden md:flex fixed inset-0 z-[60] items-center justify-center p-4
        transition-opacity duration-200 ease-out
        ${visible ? 'opacity-100' : 'opacity-0'}
        bg-slate-900/40 backdrop-blur-sm`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`w-full max-w-[640px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col
          transition-all duration-200 ease-out
          ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-[0.97]'}`}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-[24px] font-semibold leading-tight tracking-tight text-on-surface">Add New Property</h2>
            <p className="text-xs text-on-surface-variant mt-1">Enter the details of your new rental unit below.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary shrink-0 ml-4">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 max-h-[calc(100vh-240px)]">
          <div>
            <label className={labelCls}>Property Name</label>
            <input type="text" placeholder="e.g. Sunset Heights Penthouse" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Street Address</label>
            <input type="text" placeholder="123 Property Lane" className={inputCls} />
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <label className={labelCls}>City</label>
              <input type="text" placeholder="City" className={inputCls} />
            </div>
            <div className="col-span-3">
              <label className={labelCls}>State</label>
              <input type="text" placeholder="ST" className={inputCls} />
            </div>
            <div className="col-span-3">
              <label className={labelCls}>Zip</label>
              <input type="text" placeholder="00000" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Pricing per night</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                <input type="number" placeholder="0.00" className={`${inputCls} pl-7`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Property Type</label>
              <div className="relative">
                <select className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
                  <option>Apartment</option>
                  <option>House</option>
                  <option>Studio</option>
                  <option>Villa</option>
                  <option>Condo</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} placeholder="Provide a detailed overview of the unit's features and amenities..." className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>Property Images</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 hover:bg-slate-100 hover:border-primary transition-colors duration-200 cursor-pointer group">
              <Upload size={32} className="text-slate-300 group-hover:text-primary transition-colors duration-200 mb-2" />
              <p className="text-sm font-medium text-on-surface">Drop your photos here, or <span className="text-primary font-semibold">browse</span></p>
              <p className="text-xs text-on-surface-variant mt-1">Supports: JPG, PNG, WEBP (Max 5MB per file)</p>
              <input type="file" accept="image/*" multiple className="hidden" />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-slate-200 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary">
            Cancel
          </button>
          <button type="button" className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white rounded-lg text-sm font-semibold shadow-sm transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98]">
            Add Property
          </button>
        </div>
      </div>
    </div>
  )
}
