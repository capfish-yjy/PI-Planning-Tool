import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { Sprint } from '../../domain/planTypes'
import { getAllStories } from '../../domain/capacity'
import { usePlanStore } from '../../stores/planStore'
import { useUiStore } from '../../stores/uiStore'
import { Button } from '../shared/Button'
import { SprintColumn } from './SprintColumn'

type DraftSprint = Omit<Sprint, 'pointCapacity'> & {
  pointCapacity: string
}

type DraftPi = {
  startDate: string
  sprintCount: string
}

const today = () => new Date().toISOString().slice(0, 10)

const addDays = (dateValue: string, days: number) => {
  const [year, month, day] = dateValue.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  const nextYear = date.getFullYear()
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0')
  const nextDay = String(date.getDate()).padStart(2, '0')
  return `${nextYear}-${nextMonth}-${nextDay}`
}

const getNextSprintName = (sprints: Sprint[]) => {
  const existingNames = new Set(sprints.map((sprint) => sprint.name.trim()))
  let index = sprints.length + 1

  while (existingNames.has(`Sprint ${index}`)) {
    index += 1
  }

  return `Sprint ${index}`
}

const getNextSprintStartDate = (sprints: Sprint[]) => {
  const lastSprint = sprints[sprints.length - 1]
  return lastSprint?.endDate ? addDays(lastSprint.endDate, 1) : today()
}

const createSprint = (sprints: Sprint[]): DraftSprint => {
  const startDate = getNextSprintStartDate(sprints)

  return {
    id: crypto.randomUUID(),
    name: getNextSprintName(sprints),
    startDate,
    endDate: addDays(startDate, 13),
    pointCapacity: ''
  }
}

const createSprintFromPi = (sprints: Sprint[], startDate: string, index: number): Sprint => {
  const sprintPool = [...sprints, ...Array.from({ length: index }, (_, offset) => ({
    id: `draft-${offset}`,
    name: `Sprint ${sprints.length + offset + 1}`,
    startDate,
    endDate: startDate,
    pointCapacity: 0
  }))]
  const sprintStartDate = addDays(startDate, index * 14)

  return {
    id: crypto.randomUUID(),
    name: getNextSprintName(sprintPool),
    startDate: sprintStartDate,
    endDate: addDays(sprintStartDate, 13),
    pointCapacity: 0
  }
}

export const SprintBoard = () => {
  const { plan, planFilePath, addSprint } = usePlanStore()
  const { setError } = useUiStore()
  const stories = getAllStories(plan)
  const [draftSprint, setDraftSprint] = useState<DraftSprint | null>(null)
  const [draftPi, setDraftPi] = useState<DraftPi | null>(null)

  const startAddingSprint = () => {
    if (!planFilePath) {
      setError('Create a project file before planning.')
      return
    }
    setDraftPi(null)
    setDraftSprint(createSprint(plan.sprints))
  }

  const startAddingPi = () => {
    if (!planFilePath) {
      setError('Create a project file before planning.')
      return
    }
    setDraftSprint(null)
    setDraftPi({
      startDate: getNextSprintStartDate(plan.sprints),
      sprintCount: '6'
    })
  }

  const submitSprint = () => {
    if (!draftSprint) {
      return
    }

    addSprint({
      ...draftSprint,
      name: draftSprint.name.trim() || getNextSprintName(plan.sprints),
      pointCapacity: Math.max(0, Number(draftSprint.pointCapacity) || 0)
    })
    setDraftSprint(null)
  }

  const submitPi = () => {
    if (!draftPi) {
      return
    }

    const sprintCount = Math.max(1, Math.floor(Number(draftPi.sprintCount) || 0))
    const newSprints = Array.from({ length: sprintCount }, (_item, index) =>
      createSprintFromPi(plan.sprints, draftPi.startDate, index)
    )

    for (const sprint of newSprints) {
      addSprint(sprint)
    }
    setDraftPi(null)
  }

  return (
    <section className="min-w-0 overflow-auto bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">PI Sprints</h2>
        <div className="flex gap-2">
          <Button onClick={startAddingPi} variant="secondary" icon={<Plus size={16} />} disabled={Boolean(draftPi || draftSprint)}>
            PI
          </Button>
          <Button onClick={startAddingSprint} variant="primary" icon={<Plus size={16} />} disabled={Boolean(draftSprint || draftPi)}>
            Sprint
          </Button>
        </div>
      </div>
      {draftPi ? (
        <div className="mb-3 grid gap-3 rounded-md border border-slate-300 bg-slate-50 p-3 lg:grid-cols-[180px_120px_auto]">
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            PI Start Date
            <input
              type="date"
              value={draftPi.startDate}
              onChange={(event) => setDraftPi({ ...draftPi, startDate: event.target.value })}
              className="h-9 rounded-md border border-slate-300 px-2 text-sm"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Sprints
            <input
              type="number"
              min="1"
              value={draftPi.sprintCount}
              onChange={(event) => setDraftPi({ ...draftPi, sprintCount: event.target.value })}
              className="h-9 rounded-md border border-slate-300 px-2 text-sm"
            />
          </label>
          <div className="flex items-end gap-2">
            <Button onClick={submitPi} variant="primary" icon={<Plus size={16} />}>
              Add PI
            </Button>
            <Button aria-label="Cancel PI" onClick={() => setDraftPi(null)} icon={<X size={16} />} />
          </div>
        </div>
      ) : null}
      {draftSprint ? (
        <div className="mb-3 grid gap-3 rounded-md border border-slate-300 bg-slate-50 p-3 lg:grid-cols-[1fr_150px_150px_120px_auto]">
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Sprint Name
            <input
              value={draftSprint.name}
              onChange={(event) => setDraftSprint({ ...draftSprint, name: event.target.value })}
              className="h-9 rounded-md border border-slate-300 px-2 text-sm"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Start Date
            <input
              type="date"
              value={draftSprint.startDate}
              onChange={(event) =>
                setDraftSprint({
                  ...draftSprint,
                  startDate: event.target.value,
                  endDate: addDays(event.target.value, 13)
                })
              }
              className="h-9 rounded-md border border-slate-300 px-2 text-sm"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            End Date
            <input
              type="date"
              value={draftSprint.endDate}
              onChange={(event) => setDraftSprint({ ...draftSprint, endDate: event.target.value })}
              className="h-9 rounded-md border border-slate-300 px-2 text-sm"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Capacity
            <input
              type="number"
              min="0"
              value={draftSprint.pointCapacity}
              onChange={(event) => setDraftSprint({ ...draftSprint, pointCapacity: event.target.value })}
              className="h-9 rounded-md border border-slate-300 px-2 text-sm"
            />
          </label>
          <div className="flex items-end gap-2">
            <Button onClick={submitSprint} variant="primary" icon={<Plus size={16} />}>
              Add Sprint
            </Button>
            <Button aria-label="Cancel sprint" onClick={() => setDraftSprint(null)} icon={<X size={16} />} />
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {plan.sprints.map((sprint) => (
          <SprintColumn
            key={sprint.id}
            sprint={sprint}
            stories={stories.filter((story) => plan.assignments[story.key] === sprint.id)}
          />
        ))}
      </div>
    </section>
  )
}
