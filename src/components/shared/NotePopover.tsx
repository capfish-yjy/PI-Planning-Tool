import { useEffect, useState } from 'react'

type NotePopoverProps = {
  note?: string
  isOpen: boolean
  onClose: () => void
  onSave: (note: string) => void
  title: string
}

export const NotePopover = ({ note, isOpen, onClose, onSave, title }: NotePopoverProps) => {
  const [draft, setDraft] = useState(note ?? '')

  useEffect(() => {
    if (isOpen) {
      setDraft(note ?? '')
    }
  }, [isOpen, note])

  if (!isOpen) {
    return null
  }

  const saveAndClose = (nextNote: string) => {
    onSave(nextNote)
    onClose()
  }

  return (
    <div
      tabIndex={0}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }}
      className="pointer-events-auto absolute left-4 right-4 top-12 z-30 grid gap-2 rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-700 shadow-xl outline-none ring-slate-400 focus:ring-2"
    >
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>{title}</span>
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
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="min-h-28 resize-y rounded-md border border-slate-300 px-2 py-2 text-sm leading-5 text-slate-800 outline-none focus:border-slate-500"
        placeholder="Add a local planning note..."
        autoFocus
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          onClick={() => saveAndClose('')}
        >
          Clear
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-md bg-slate-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          onClick={() => saveAndClose(draft)}
        >
          Save
        </button>
      </div>
    </div>
  )
}
