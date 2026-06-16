import { useEffect, useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import type { StoryFocusRequest } from '../../domain/focusTypes'
import type { IssueKey, Sprint, Story } from '../../domain/planTypes'
import { getSprintUsage } from '../../domain/capacity'
import { usePlanStore } from '../../stores/planStore'
import { Button } from '../shared/Button'
import { StoryCard } from '../epic/StoryCard'

type SprintColumnProps = {
  sprint: Sprint
  stories: Story[]
  focusRequest: StoryFocusRequest | null
  onLocateBacklogStory: (storyKey: IssueKey) => void
}

export const SprintColumn = ({ sprint, stories, focusRequest, onLocateBacklogStory }: SprintColumnProps) => {
  const { plan, updateSprint, removeSprint, assignStory } = usePlanStore()
  const usage = getSprintUsage(plan, sprint.id)
  const { setNodeRef, isOver } = useDroppable({ id: sprint.id })
  const [capacityInput, setCapacityInput] = useState(String(sprint.pointCapacity))

  useEffect(() => {
    setCapacityInput(String(sprint.pointCapacity))
  }, [sprint.pointCapacity])

  const commitCapacity = () => {
    const nextCapacity = Math.max(0, Number(capacityInput) || 0)
    updateSprint({ ...sprint, pointCapacity: nextCapacity })
    setCapacityInput(String(nextCapacity))
  }

  return (
    <section
      ref={setNodeRef}
      className={`grid min-h-[320px] content-start gap-3 rounded-md border bg-white p-3 ${
        isOver ? 'border-slate-500 ring-2 ring-slate-300' : 'border-slate-200'
      }`}
    >
      <div className="grid gap-2">
        <div className="flex items-start justify-between gap-2">
          <input
            value={sprint.name}
            onChange={(event) => updateSprint({ ...sprint, name: event.target.value })}
            className="min-w-0 rounded border border-transparent text-sm font-semibold text-slate-900 focus:border-slate-300"
          />
          <Button
            aria-label="Delete sprint"
            variant="danger"
            onClick={() => removeSprint(sprint.id)}
            icon={<Trash2 size={15} />}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={sprint.startDate}
            onChange={(event) => updateSprint({ ...sprint, startDate: event.target.value })}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs"
          />
          <input
            type="date"
            value={sprint.endDate}
            onChange={(event) => updateSprint({ ...sprint, endDate: event.target.value })}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs"
          />
        </div>
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Point Capacity
          <input
            type="number"
            min="0"
            value={capacityInput}
            onChange={(event) => setCapacityInput(event.target.value)}
            onBlur={commitCapacity}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }
            }}
            className="h-8 rounded-md border border-slate-300 px-2"
          />
        </label>
        <div className={`flex items-center gap-2 text-sm ${usage.isOverCapacity ? 'text-red-700' : 'text-slate-600'}`}>
          {usage.isOverCapacity ? <AlertTriangle size={15} /> : null}
          {usage.usedPoints} / {usage.capacity} points
        </div>
      </div>
      <div className="grid gap-2">
        {stories.map((story) => (
          <StoryCard
            key={story.key}
            story={story}
            locationLabel={sprint.name}
            dragSource="sprint"
            sourceSprintId={sprint.id}
            focusNonce={focusRequest?.storyKey === story.key ? focusRequest.nonce : undefined}
            onLocateDoubleClick={() => onLocateBacklogStory(story.key)}
            onRemoveFromSprint={() => assignStory(story, null)}
          />
        ))}
      </div>
    </section>
  )
}
