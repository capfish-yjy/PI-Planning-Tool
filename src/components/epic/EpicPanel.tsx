import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Info, RotateCw, Search, Trash2 } from 'lucide-react'
import { electronApi } from '../../api/electronApi'
import type { StoryFocusRequest } from '../../domain/focusTypes'
import type { IssueKey } from '../../domain/planTypes'
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

type EpicPanelProps = {
  focusRequest: StoryFocusRequest | null
  onLocateSprintStory: (storyKey: IssueKey) => void
}

export const EpicPanel = ({ focusRequest, onLocateSprintStory }: EpicPanelProps) => {
  const { plan, configPath, importEpics, updateEpic, removeEpic, updateEpicNote, assignStory } = usePlanStore()
  const { setMessage, setError } = useUiStore()
  const { setNodeRef, isOver } = useDroppable({ id: 'backlog' })
  const sortedEpics = sortEpicsByPriority(plan.epics)
  const epicRefs = useRef<Record<IssueKey, HTMLElement | null>>({})
  const searchNonceRef = useRef(0)
  const [collapsedEpicKeys, setCollapsedEpicKeys] = useState<Set<string>>(new Set())
  const allEpicsCollapsed = sortedEpics.length > 0 && sortedEpics.every((epic) => collapsedEpicKeys.has(epic.key))
  const [searchValue, setSearchValue] = useState('')
  const [focusedEpicKey, setFocusedEpicKey] = useState<IssueKey | null>(null)
  const [searchStoryFocus, setSearchStoryFocus] = useState<{ storyKey: IssueKey; nonce: number } | null>(null)
  const [descriptionEpicKey, setDescriptionEpicKey] = useState<string | null>(null)
  const [noteEpicKey, setNoteEpicKey] = useState<string | null>(null)
  const [refreshingEpicKey, setRefreshingEpicKey] = useState<string | null>(null)

  useEffect(() => {
    if (!focusRequest) {
      return
    }

    const targetEpic = plan.epics.find((epic) => epic.stories.some((story) => story.key === focusRequest.storyKey))
    if (!targetEpic || !collapsedEpicKeys.has(targetEpic.key)) {
      return
    }

    setCollapsedEpicKeys((current) => {
      const next = new Set(current)
      next.delete(targetEpic.key)
      return next
    })
  }, [collapsedEpicKeys, focusRequest, plan.epics])

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

  const toggleAllEpics = () => {
    setCollapsedEpicKeys(allEpicsCollapsed ? new Set() : new Set(sortedEpics.map((epic) => epic.key)))
  }

  const normalizeSearchKey = (value: string) => {
    const normalized = value.trim().toUpperCase()
    if (!normalized) {
      return ''
    }

    if (/^[A-Z][A-Z0-9]+-\d+$/.test(normalized)) {
      return normalized
    }

    const numberMatch = normalized.match(/\d+/)
    return numberMatch && plan.projectKey ? `${plan.projectKey.toUpperCase()}-${numberMatch[0]}` : normalized
  }

  const focusEpic = (epicKey: IssueKey) => {
    setFocusedEpicKey(epicKey)
    window.setTimeout(() => {
      epicRefs.current[epicKey]?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
    }, 0)
    window.setTimeout(() => setFocusedEpicKey((current) => (current === epicKey ? null : current)), 1800)
  }

  const focusStory = (storyKey: IssueKey, epicKey: IssueKey) => {
    setCollapsedEpicKeys((current) => {
      const next = new Set(current)
      next.delete(epicKey)
      return next
    })
    searchNonceRef.current += 1
    setSearchStoryFocus({ storyKey, nonce: searchNonceRef.current })
  }

  const searchBacklogTicket = () => {
    const targetKey = normalizeSearchKey(searchValue)
    if (!targetKey) {
      return
    }

    const targetEpic = sortedEpics.find((epic) => epic.key.toUpperCase() === targetKey)
    if (targetEpic) {
      focusEpic(targetEpic.key)
      return
    }

    for (const epic of sortedEpics) {
      const targetStory = epic.stories.find((story) => story.key.toUpperCase() === targetKey)
      if (targetStory) {
        focusStory(targetStory.key, epic.key)
        return
      }
    }

    setError('Ticket not found in imported backlog.')
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      searchBacklogTicket()
    }
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
      className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden border-r border-slate-200 bg-slate-50 p-3 ${isOver ? 'ring-2 ring-slate-400' : ''}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Epic Backlog</h2>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">{sortedEpics.length} epics</span>
          <IconButton
            aria-label={allEpicsCollapsed ? 'Expand all epics' : 'Collapse all epics'}
            title={allEpicsCollapsed ? 'Expand all epics' : 'Collapse all epics'}
            className="h-7 w-7"
            disabled={sortedEpics.length === 0}
            onClick={toggleAllEpics}
            icon={allEpicsCollapsed ? <ChevronsUpDown size={16} /> : <ChevronsDownUp size={16} />}
          />
        </div>
      </div>
      <div className="mb-2 flex items-center gap-1.5">
        <input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search ticket number or key"
          className="h-8 min-w-0 flex-1 rounded-md border border-slate-300 px-2 text-xs text-slate-800 placeholder:text-slate-400"
        />
        <IconButton
          aria-label="Search imported backlog ticket"
          title="Search imported backlog ticket"
          className="h-8 w-8"
          onClick={searchBacklogTicket}
          icon={<Search size={16} />}
        />
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
          const isEpicFocused = focusedEpicKey === epic.key
          return (
            <article
              key={epic.key}
              ref={(node) => {
                epicRefs.current[epic.key] = node
              }}
              className={`relative rounded-md border p-2 ${
                isEpicFocused ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-300' : colorClasses[color]
              }`}
            >
              <DescriptionPopover description={epic.description} isOpen={isDescriptionOpen} onClose={() => setDescriptionEpicKey(null)} />
              <NotePopover
                note={epic.localNote}
                isOpen={isNoteOpen}
                onClose={() => setNoteEpicKey(null)}
                onSave={(note) => updateEpicNote(epic.key, note)}
                title={`${epic.key} Note`}
              />
              <div className="grid gap-1.5">
                <div className="grid gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <IconButton
                      aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${epic.key}`}
                      className="h-7 w-7"
                      onClick={() => toggleEpic(epic.key)}
                      icon={isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    />
                    <h3
                      className="min-w-0 cursor-pointer font-mono text-sm font-semibold text-slate-900 underline-offset-2 hover:underline"
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
                    <span className="ml-auto text-xs text-slate-500">{backlogStories.length}/{epic.stories.length} backlog</span>
                  </div>
                  <p
                    className="cursor-pointer overflow-hidden text-xs leading-4 text-slate-700 underline-offset-2 hover:underline [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                    onDoubleClick={() => openEpicInJira(epic.key)}
                    title="Double-click to open in Jira"
                  >
                    {epic.summary}
                  </p>
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
                        currentSprintId={assignedSprintId}
                        moveMenuSprints={plan.sprints}
                        onMoveToSprint={(sprintId) => assignStory(story, sprintId)}
                        focusNonce={
                          searchStoryFocus?.storyKey === story.key
                            ? searchStoryFocus.nonce
                            : focusRequest?.storyKey === story.key
                              ? focusRequest.nonce
                              : undefined
                        }
                        onLocateDoubleClick={assignedSprint ? () => onLocateSprintStory(story.key) : undefined}
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
