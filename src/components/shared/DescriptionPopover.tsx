type DescriptionPopoverProps = {
  description?: string
  isOpen: boolean
  onClose: () => void
}

export const DescriptionPopover = ({ description, isOpen, onClose }: DescriptionPopoverProps) =>
  isOpen ? (
  <div
    tabIndex={0}
    onPointerDown={(event) => event.stopPropagation()}
    onClick={(event) => event.stopPropagation()}
    onKeyDown={(event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }}
    className="pointer-events-auto absolute left-4 right-4 top-12 z-20 max-h-56 overflow-auto rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-700 shadow-xl outline-none ring-slate-400 focus:ring-2"
  >
    <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span>Description</span>
      <button
        type="button"
        className="rounded px-2 py-1 text-xs normal-case tracking-normal text-slate-600 hover:bg-slate-100"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
      >
        Close
      </button>
    </div>
    <div className="whitespace-pre-wrap">{description?.trim() || 'No description available.'}</div>
  </div>
  ) : null
