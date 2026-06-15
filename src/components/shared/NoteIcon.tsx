import { StickyNote } from 'lucide-react'

type NoteIconProps = {
  hasNote: boolean
}

export const NoteIcon = ({ hasNote }: NoteIconProps) => (
  <span className="relative inline-flex h-4 w-4 items-center justify-center">
    <StickyNote size={16} />
    {hasNote ? (
      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white bg-amber-500" />
    ) : null}
  </span>
)
