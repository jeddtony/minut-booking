import { ChevronDown, CloudUpload } from 'lucide-react'
import { useModalTransition } from '../hooks/useModalTransition'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-outline bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm'

const labelCls = 'block text-[11px] font-semibold text-secondary uppercase tracking-widest mb-2'

export default function AddPropertyBottomSheet({ isOpen, onClose }: Props) {
  const { mounted, visible } = useModalTransition(isOpen, 320)
  if (!mounted) return null

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`relative bg-surface-container-lowest w-full rounded-t-[24px] shadow-2xl flex flex-col max-h-[90dvh]
          transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3 shrink-0">
          <div className="w-12 h-1.5 bg-surface-variant rounded-full" />
        </div>

        {/* Sheet header */}
        <div className="px-4 pb-4 border-b border-outline-variant shrink-0">
          <h2 className="text-[24px] font-semibold leading-tight tracking-tight text-on-surface">Add New Property</h2>
          <p className="text-sm text-secondary mt-1">Fill in the details to list a new unit.</p>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          <div>
            <label className={labelCls}>Property Name</label>
            <input type="text" placeholder="e.g. Waterfront Penthouse" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Property Type</label>
            <div className="relative">
              <select className={`${inputCls} appearance-none pr-10 cursor-pointer`}>
                <option>Apartment</option>
                <option>Studio</option>
                <option>House</option>
                <option>Villa</option>
                <option>Condo</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Street Address</label>
              <input type="text" placeholder="123 Operational Way" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input type="text" placeholder="San Francisco" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input type="text" placeholder="CA" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Zip</label>
              <input type="text" placeholder="94103" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Pricing Per Night ($)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-medium text-sm">$</span>
              <input type="number" placeholder="0.00" className={`${inputCls} pl-8`} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} placeholder="Describe the workspace and amenities..." className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>Property Images</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-xl p-8 bg-surface-container-low hover:bg-surface-container transition-colors duration-200 cursor-pointer group">
              <CloudUpload size={28} className="text-primary mb-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-sm font-medium text-on-surface">Click to upload or drag and drop</span>
              <span className="text-xs text-secondary mt-1">PNG, JPG or WEBP (Max 5MB)</span>
              <input type="file" accept="image/*" multiple className="hidden" />
            </label>
          </div>

          <div className="h-4" />
        </div>

        {/* Sticky footer */}
        <div className="px-4 pt-3 pb-6 bg-white border-t border-outline-variant shrink-0">
          <button type="button" onClick={onClose} className="w-full text-center py-2.5 text-sm text-secondary font-medium hover:text-primary transition-colors duration-200 cursor-pointer">
            Cancel
          </button>
          <button type="button" className="w-full bg-primary hover:bg-primary-container text-on-primary py-4 rounded-xl text-[18px] font-semibold shadow-lg transition-colors duration-200 cursor-pointer focus:outline-none active:scale-[0.98] mt-1">
            Add Property
          </button>
        </div>
      </div>
    </div>
  )
}
