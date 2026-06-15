import { create } from 'zustand'
import type { Epic, EpicCommitment, Plan, Sprint, Story } from '../domain/planTypes'
import { assignStoryToSprint } from '../domain/planningRules'
import { createEmptyPlan } from '../domain/planTypes'

type PlanStore = {
  plan: Plan
  configPath: string
  planFilePath: string
  setConfigPath: (configPath: string) => void
  setPlanFilePath: (planFilePath: string) => void
  setPlan: (plan: Plan) => void
  setProjectKey: (projectKey: string) => void
  importEpics: (projectKey: string, epics: Epic[]) => void
  updateEpic: (epicKey: string, update: Partial<Pick<Epic, 'commitment'>>) => void
  updateEpicNote: (epicKey: string, note: string) => void
  updateStoryNote: (storyKey: string, note: string) => void
  addSprint: (sprint: Sprint) => void
  updateSprint: (sprint: Sprint) => void
  removeSprint: (sprintId: string) => void
  assignStory: (story: Story, sprintId: string | null) => void
  refreshStories: (stories: Story[]) => void
}

const touchPlan = (plan: Plan): Plan => ({ ...plan, updatedAt: new Date().toISOString() })

const normalizeNote = (note: string) => {
  const trimmed = note.trim()
  return trimmed ? trimmed : undefined
}

export const usePlanStore = create<PlanStore>((set) => ({
  plan: createEmptyPlan(),
  configPath: '',
  planFilePath: '',
  setConfigPath: (configPath) => set({ configPath }),
  setPlanFilePath: (planFilePath) => set({ planFilePath }),
  setPlan: (plan) => set({ plan }),
  setProjectKey: (projectKey) =>
    set((state) => ({
      plan: touchPlan({
        ...state.plan,
        projectKey: projectKey.toUpperCase()
      })
    })),
  importEpics: (projectKey, epics) =>
    set((state) => {
      const assignments = { ...state.plan.assignments }
      for (const story of epics.flatMap((epic) => epic.stories)) {
        assignments[story.key] = assignments[story.key] ?? null
      }
      const existingEpics = new Map(state.plan.epics.map((epic) => [epic.key, epic]))
      const mergedEpics = new Map(existingEpics)

      for (const epic of epics) {
        const existingEpic = existingEpics.get(epic.key)
        const existingStories = new Map(existingEpic?.stories.map((story) => [story.key, story]) ?? [])
        mergedEpics.set(epic.key, {
          ...epic,
          commitment: existingEpic?.commitment ?? epic.commitment,
          localNote: existingEpic?.localNote ?? epic.localNote,
          stories: epic.stories.map((story) => ({
            ...story,
            localNote: existingStories.get(story.key)?.localNote ?? story.localNote
          }))
        })
      }

      const nextEpics = [...mergedEpics.values()]
      const activeStoryKeys = new Set(nextEpics.flatMap((epic) => epic.stories.map((story) => story.key)))
      const cleanedAssignments = Object.fromEntries(
        Object.entries(assignments).filter(([storyKey]) => activeStoryKeys.has(storyKey))
      )

      return {
        plan: touchPlan({
          ...state.plan,
          projectKey: state.plan.projectKey || projectKey,
          epicIds: nextEpics.map((epic) => epic.key),
          epics: nextEpics,
          assignments: cleanedAssignments
        })
      }
    }),
  updateEpic: (epicKey, update) =>
    set((state) => ({
      plan: touchPlan({
        ...state.plan,
        epics: state.plan.epics.map((epic) => (epic.key === epicKey ? { ...epic, ...update } : epic))
      })
    })),
  updateEpicNote: (epicKey, note) =>
    set((state) => ({
      plan: touchPlan({
        ...state.plan,
        epics: state.plan.epics.map((epic) =>
          epic.key === epicKey ? { ...epic, localNote: normalizeNote(note) } : epic
        )
      })
    })),
  updateStoryNote: (storyKey, note) =>
    set((state) => ({
      plan: touchPlan({
        ...state.plan,
        epics: state.plan.epics.map((epic) => ({
          ...epic,
          stories: epic.stories.map((story) =>
            story.key === storyKey ? { ...story, localNote: normalizeNote(note) } : story
          )
        }))
      })
    })),
  addSprint: (sprint) =>
    set((state) => ({
      plan: touchPlan({
        ...state.plan,
        sprints: [...state.plan.sprints, sprint]
      })
    })),
  updateSprint: (sprint) =>
    set((state) => ({
      plan: touchPlan({
        ...state.plan,
        sprints: state.plan.sprints.map((item) => (item.id === sprint.id ? sprint : item))
      })
    })),
  removeSprint: (sprintId) =>
    set((state) => ({
      plan: touchPlan({
        ...state.plan,
        sprints: state.plan.sprints.filter((sprint) => sprint.id !== sprintId),
        assignments: Object.fromEntries(
          Object.entries(state.plan.assignments).map(([storyKey, assignedSprintId]) => [
            storyKey,
            assignedSprintId === sprintId ? null : assignedSprintId
          ])
        )
      })
    })),
  assignStory: (story, sprintId) =>
    set((state) => ({
      plan: touchPlan({
        ...state.plan,
        assignments: assignStoryToSprint(state.plan.assignments, story, sprintId)
      })
    })),
  refreshStories: (stories) =>
    set((state) => {
      const refreshedByKey = new Map(stories.map((story) => [story.key, story]))
      return {
        plan: touchPlan({
          ...state.plan,
          epics: state.plan.epics.map((epic) => ({
            ...epic,
            stories: epic.stories.map((story) => {
              const refreshed = refreshedByKey.get(story.key)
              return refreshed
                ? { ...story, ...refreshed, epicKey: story.epicKey || epic.key, localNote: story.localNote }
                : story
            })
          }))
        })
      }
    })
}))

export const commitmentOptions: EpicCommitment[] = ['unplanned', 'uncommitted', 'committed']
