import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { AlertTriangle, GripVertical, Info, RotateCw, X } from 'lucide-react'
import { electronApi } from '../../api/electronApi'
import type { Story } from '../../domain/planTypes'
import { canPlanStory } from '../../domain/planningRules'
import { usePlanStore } from '../../stores/planStore'
import { useUiStore } from '../../stores/uiStore'
import { IconButton } from '../shared/Button'
import { DescriptionPopover } from '../shared/DescriptionPopover'
import { NoteIcon } from '../shared/NoteIcon'
import { NotePopover } from '../shared/NotePopover'

type StoryCardProps = {
  story: Story
  locationLabel?: string
  isPlanned?: boolean
  dragSource?: 'backlog' | 'sprint' | 'none'
  sourceSprintId?: string
  density?: 'normal' | 'compact'
  onRemoveFromSprint?: () => void
}

export const StoryCard = ({
  story,
  locationLabel,
  isPlanned = false,
  dragSource = 'backlog',
  sourceSprintId,
  density = 'normal',
  onRemoveFromSprint
}: StoryCardProps) => {
  const { configPath, refreshStories, updateStoryNote } = usePlanStore()
  const { setMessage, setError } = useUiStore()
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false)
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const disabled = !canPlanStory(story)
  const isDraggable = dragSource !== 'none'
  const isCompact = density === 'compact'
  const hasNote = Boolean(story.localNote?.trim())
  const draggableId = dragSource === 'sprint' ? `sprint:${sourceSprintId ?? 'unknown'}:${story.key}` : story.key
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: isDraggable ? draggableId : `display-${story.key}`,
    data: { story, source: dragSource, sourceSprintId },
    disabled: disabled || !isDraggable
  })

  const style = isDraggable && transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      }
    : undefined

  const refreshStory = async () => {
    setIsRefreshing(true)
    try {
      if (!configPath) {
        throw new Error('Select a Jira config file first.')
      }
      const result = await electronApi.jira.refreshIssues({ configPath, issueKeys: [story.key] })
      refreshStories(result.stories)
      setMessage(`Refreshed ${story.key}.`)
    } catch (error) {
      setError(error instanceof Error ? error.message : `Unable to refresh ${story.key}.`)
    } finally {
      setIsRefreshing(false)
    }
  }

  const openStoryInJira = async () => {
    try {
      if (!configPath) {
        throw new Error('Select a Jira config file first.')
      }
      await electronApi.jira.openIssue({ configPath, issueKey: story.key })
    } catch (error) {
      setError(error instanceof Error ? error.message : `Unable to open ${story.key}.`)
    }
  }

  return (
    <article
      ref={isDraggable ? setNodeRef : undefined}
      style={style}
      className={`relative rounded-md border bg-white shadow-sm ${isCompact ? 'p-2' : 'p-3'} ${isDragging ? 'opacity-60' : ''} ${
        disabled ? 'border-amber-300 bg-amber-50' : isPlanned ? 'border-sky-300 bg-sky-50' : 'border-slate-200'
      }`}
      {...(isDraggable ? attributes : {})}
    >
      <DescriptionPopover description={story.description} isOpen={isDescriptionOpen} onClose={() => setIsDescriptionOpen(false)} />
      <NotePopover
        note={story.localNote}
        isOpen={isNoteOpen}
        onClose={() => setIsNoteOpen(false)}
        onSave={(note) => updateStoryNote(story.key, note)}
        title={`${story.key} Note`}
      />
      <div tabIndex={0} className={`flex items-start outline-none ${isCompact ? 'gap-1.5' : 'gap-2'}`}>
        <span
          className={`flex shrink-0 items-center ${isDraggable && !disabled ? 'cursor-grab active:cursor-grabbing' : ''} ${
            isCompact ? 'h-7' : 'h-8'
          }`}
          {...(isDraggable ? listeners : {})}
        >
          <GripVertical size={isCompact ? 14 : 16} className={disabled || !isDraggable ? 'text-slate-300' : 'text-slate-400'} />
        </span>
        <div className="min-w-0 flex-1">
          <div className={`flex flex-wrap items-center ${isCompact ? 'gap-1' : 'gap-2'}`}>
            <span
              className="min-w-0 cursor-pointer font-mono text-xs font-semibold text-slate-700 underline-offset-2 hover:underline"
              onDoubleClick={openStoryInJira}
              title="Double-click to open in Jira"
            >
              {story.key}
            </span>
            <div className={`ml-auto flex shrink-0 items-center ${isCompact ? 'gap-0.5' : 'gap-1'}`}>
              <span className={`rounded bg-slate-100 text-xs text-slate-700 ${isCompact ? 'px-1.5 py-0' : 'px-2 py-0.5'}`}>
                {story.storyPoints ?? 'No estimate'}
              </span>
              <IconButton
                aria-label={`Show description for ${story.key}`}
                className={isCompact ? 'h-7 w-7' : 'h-8 w-8'}
                onClick={() => setIsDescriptionOpen((current) => !current)}
                onPointerDown={(event) => event.stopPropagation()}
                icon={<Info size={16} />}
              />
              <IconButton
                aria-label={`${hasNote ? 'Edit' : 'Add'} note for ${story.key}`}
                className={`${isCompact ? 'h-7 w-7' : 'h-8 w-8'} ${
                  hasNote ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' : ''
                }`}
                onClick={() => setIsNoteOpen((current) => !current)}
                onPointerDown={(event) => event.stopPropagation()}
                icon={<NoteIcon hasNote={hasNote} />}
              />
              <IconButton
                aria-label={`Refresh ${story.key}`}
                className={isCompact ? 'h-7 w-7' : 'h-8 w-8'}
                disabled={isRefreshing}
                onClick={refreshStory}
                onPointerDown={(event) => event.stopPropagation()}
                icon={<RotateCw size={16} className={isRefreshing ? 'animate-spin' : ''} />}
              />
              {onRemoveFromSprint ? (
                <IconButton
                  aria-label={`Remove ${story.key} from sprint`}
                  className={isCompact ? 'h-7 w-7' : 'h-8 w-8'}
                  variant="danger"
                  onClick={onRemoveFromSprint}
                  onPointerDown={(event) => event.stopPropagation()}
                  icon={<X size={16} />}
                />
              ) : null}
            </div>
          </div>
          <p
            className={`mt-1 overflow-hidden text-slate-800 ${
              isCompact
                ? 'text-xs leading-4 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]'
                : 'text-sm leading-5'
            }`}
          >
            {story.summary}
          </p>
          <div className={`flex flex-wrap items-center text-xs text-slate-500 ${isCompact ? 'mt-1 gap-1.5' : 'mt-2 gap-2'}`}>
            <span>{story.issueType}</span>
            <span>{story.status}</span>
            {locationLabel ? <span>{locationLabel}</span> : null}
            {isPlanned ? (
              <span className={`rounded bg-sky-100 font-medium text-sky-800 ${isCompact ? 'px-1.5 py-0' : 'px-2 py-0.5'}`}>
                Planned
              </span>
            ) : null}
            {disabled ? (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <AlertTriangle size={13} />
                Cannot plan
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
