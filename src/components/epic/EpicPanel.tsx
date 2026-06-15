import { useState, type ChangeEvent } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { ChevronDown, ChevronRight, Info, RotateCw, Trash2 } from 'lucide-react'
import { electronApi } from '../../api/electronApi'
import { commitmentOptions, usePlanStore } from '../../stores/planStore'
import { getEpicPlanningColor, isEpicFullyPlanned, sortEpicsByPriority } from '../../domain/planningRules'
import { useUiStore } from '../../stores/uiStore'
import { IconButton } from '../shared/Button'
import { DescriptionPopover } from '../shared/DescriptionPopover'
import { NoteIcon } from '../shared/NoteIcon'
import { NotePopover } from '../shared/NotePopover'
import { StoryCard } from './StoryCard'

const colorClasses = {
  green: 'border-green-400 bg-green-50',
  red: 'border-red-400 bg-red-50',
  neutral: 'border-slate-200 bg-white'
}

export const EpicPanel = () => {
  const { plan, configPath, importEpics, updateEpic, removeEpic, updateEpicNote } = usePlanStore()
  const { setMessage, setError } = useUiStore()
  const { setNodeRef, isOver } = useDroppable({ id: 'backlog' })
  const sortedEpics = sortEpicsByPriority(plan.epics)
  const [collapsedEpicKeys, setCollapsedEpicKeys] = useState<Set<string>>(new Set())
  const [descriptionEpicKey, setDescriptionEpicKey] = useState<string | null>(null)
  const [noteEpicKey, setNoteEpicKey] = useState<string | null>(null)
  const [refreshingEpicKey, setRefreshingEpicKey] = useState<string | null>(null)

  const toggleEpic = (epicKey: string) => {
    setCollapsedEpicKeys((current) => {
      const next = new Set(current)
      if (next.has(epicKey)) {
        next.delete(epicKey)
      } else {
        next.add(epicKey)
      }
      return next
    })
  }

  const refreshEpic = async (epicKey: string) => {
    setRefreshingEpicKey(epicKey)
    try {
      if (!configPath) {
        throw new Error('Select a Jira config file first.')
      }
      const result = await electronApi.jira.fetchEpics({
        configPath,
        projectKey: plan.projectKey,
        epicKeys: [epicKey]
      })
      importEpics(result.projectKey, result.epics)
      setMessage(`Refreshed ${epicKey}.`)
    } catch (error) {
      setError(error instanceof Error ? error.message : `Unable to refresh ${epicKey}.`)
    } finally {
      setRefreshingEpicKey(null)
    }
  }

  const openEpicInJira = async (epicKey: string) => {
    try {
      if (!configPath) {
        throw new Error('Select a Jira config file first.')
      }
      await electronApi.jira.openIssue({ configPath, issueKey: epicKey })
    } catch (error) {
      setError(error instanceof Error ? error.message : `Unable to open ${epicKey}.`)
    }
  }

  const deleteEpic = (epicKey: string) => {
    const epic = plan.epics.find((item) => item.key === epicKey)
    const plannedStoryCount = epic?.stories.filter((story) => Boolean(plan.assignments[story.key])).length ?? 0
    const suffix =
      plannedStoryCount > 0
        ? ` This will also remove ${plannedStoryCount} planned ${plannedStoryCount === 1 ? 'story' : 'stories'} from sprints.`
        : ''

    if (!window.confirm(`Remove ${epicKey} from this project?${suffix}`)) {
      return
    }

    removeEpic(epicKey)
    setDescriptionEpicKey((current) => (current === epicKey ? null : current))
    setNoteEpicKey((current) => (current === epicKey ? null : current))
    setCollapsedEpicKeys((current) => {
      const next = new Set(current)
      next.delete(epicKey)
      return next
    })
    setMessage(`Removed ${epicKey}.`)
  }

  return (
    <section
      ref={setNodeRef}
      className={`min-h-0 flex-1 overflow-auto border-r border-slate-200 bg-slate-50 p-3 ${isOver ? 'ring-2 ring-slate-400' : ''}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Epic Backlog</h2>
        <span className="text-xs text-slate-500">{sortedEpics.length} epics</span>
      </div>
      <div className="grid gap-2">
        {sortedEpics.map((epic) => {
          const color = getEpicPlanningColor(epic, plan.assignments)
          const backlogStories = epic.stories.filter((story) => !plan.assignments[story.key])
          const isCollapsed = collapsedEpicKeys.has(epic.key)
          const isDescriptionOpen = descriptionEpicKey === epic.key
          const isNoteOpen = noteEpicKey === epic.key
          const isComplete = isEpicFullyPlanned(epic, plan.assignments)
          const isRefreshing = refreshingEpicKey === epic.key
          const hasNote = Boolean(epic.localNote?.trim())
          return (
            <article key={epic.key} className={`relative rounded-md border p-2 ${colorClasses[color]}`}>
              <DescriptionPopover description={epic.description} isOpen={isDescriptionOpen} onClose={() => setDescriptionEpicKey(null)} />
              <NotePopover
                note={epic.localNote}
                isOpen={isNoteOpen}
                onClose={() => setNoteEpicKey(null)}
                onSave={(note) => updateEpicNote(epic.key, note)}
                title={`${epic.key} Note`}
              />
              <div className="grid gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <IconButton
                        aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${epic.key}`}
                        className="h-7 w-7"
                        onClick={() => toggleEpic(epic.key)}
                        icon={isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      />
                      <h3
                        className="cursor-pointer font-mono text-sm font-semibold text-slate-900 underline-offset-2 hover:underline"
                        onDoubleClick={() => openEpicInJira(epic.key)}
                        title="Double-click to open in Jira"
                      >
                        {epic.key}
                      </h3>
                      {isComplete ? (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                          Complete
                        </span>
                      ) : null}
                      <IconButton
                        aria-label={`Show description for ${epic.key}`}
                        className="h-7 w-7"
                        onClick={() => setDescriptionEpicKey(isDescriptionOpen ? null : epic.key)}
                        icon={<Info size={16} />}
                      />
                      <IconButton
                        aria-label={`${hasNote ? 'Edit' : 'Add'} note for ${epic.key}`}
                        className={`h-7 w-7 ${
                          hasNote ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' : ''
                        }`}
                        onClick={() => setNoteEpicKey(isNoteOpen ? null : epic.key)}
                        icon={<NoteIcon hasNote={hasNote} />}
                      />
                      <IconButton
                        aria-label={`Refresh ${epic.key}`}
                        className="h-7 w-7"
                        disabled={isRefreshing}
                        onClick={() => refreshEpic(epic.key)}
                        icon={<RotateCw size={16} className={isRefreshing ? 'animate-spin' : ''} />}
                      />
                      <IconButton
                        aria-label={`Remove ${epic.key}`}
                        className="h-7 w-7"
                        variant="danger"
                        onClick={() => deleteEpic(epic.key)}
                        icon={<Trash2 size={16} />}
                      />
                    </div>
                    <p
                      className="cursor-pointer overflow-hidden text-xs leading-4 text-slate-700 underline-offset-2 hover:underline [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                      onDoubleClick={() => openEpicInJira(epic.key)}
                      title="Double-click to open in Jira"
                    >
                      {epic.summary}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{backlogStories.length}/{epic.stories.length} backlog</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1 text-xs font-medium text-slate-600">
                    Priority Weight
                    <div className="flex h-7 items-center rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700">
                      {epic.priorityWeight}
                    </div>
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-slate-600">
                    Commitment
                    <select
                      value={epic.commitment}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                        updateEpic(epic.key, { commitment: event.target.value as typeof epic.commitment })
                      }
                      className="h-7 rounded-md border border-slate-300 px-2 text-xs"
                    >
                      {commitmentOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              {isCollapsed ? null : (
                <div className="mt-2 grid gap-1.5">
                  {epic.stories.map((story) => {
                    const assignedSprintId = plan.assignments[story.key]
                    const assignedSprint = plan.sprints.find((sprint) => sprint.id === assignedSprintId)
                    return (
                      <StoryCard
                        key={story.key}
                        story={story}
                        isPlanned={Boolean(assignedSprint)}
                        dragSource="backlog"
                        density="compact"
                        locationLabel={assignedSprint ? assignedSprint.name : undefined}
                      />
                    )
                  })}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
