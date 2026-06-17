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
  removeEpic: (epicKey: string) => void
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

const mergeStoryFromJira = (existingStory: Story | undefined, incomingStory: Story, epicKey: string): Story => ({
  ...incomingStory,
  epicKey: incomingStory.epicKey || existingStory?.epicKey || epicKey,
  localNote: existingStory?.localNote ?? incomingStory.localNote
})

const mergeEpicFromJira = (existingEpic: Epic | undefined, incomingEpic: Epic): Epic => {
  const existingStories = new Map(existingEpic?.stories.map((story) => [story.key, story]) ?? [])

  return {
    ...incomingEpic,
    localNote: existingEpic?.localNote ?? incomingEpic.localNote,
    stories: incomingEpic.stories.map((story) => mergeStoryFromJira(existingStories.get(story.key), story, incomingEpic.key))
  }
}

const ensureAssignmentsForStories = (assignments: Plan['assignments'], stories: Story[]) => {
  const nextAssignments = { ...assignments }
  for (const story of stories) {
    nextAssignments[story.key] = nextAssignments[story.key] ?? null
  }
  return nextAssignments
}

const cleanAssignmentsForActiveStories = (assignments: Plan['assignments'], activeStoryKeys: Set<string>) =>
  Object.fromEntries(Object.entries(assignments).filter(([storyKey]) => activeStoryKeys.has(storyKey)))

const getActiveStoryKeys = (epics: Epic[]) => new Set(epics.flatMap((epic) => epic.stories.map((story) => story.key)))

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
      const existingEpics = new Map(state.plan.epics.map((epic) => [epic.key, epic]))
      const mergedEpics = new Map(existingEpics)

      for (const epic of epics) {
        mergedEpics.set(epic.key, mergeEpicFromJira(existingEpics.get(epic.key), epic))
      }

      const nextEpics = [...mergedEpics.values()]
      const assignmentsWithNewStories = ensureAssignmentsForStories(state.plan.assignments, epics.flatMap((epic) => epic.stories))
      const cleanedAssignments = cleanAssignmentsForActiveStories(assignmentsWithNewStories, getActiveStoryKeys(nextEpics))

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
  removeEpic: (epicKey) =>
    set((state) => {
      const epicToRemove = state.plan.epics.find((epic) => epic.key === epicKey)
      if (!epicToRemove) {
        return state
      }

      const removedStoryKeys = new Set(epicToRemove.stories.map((story) => story.key))
      const assignments = Object.fromEntries(
        Object.entries(state.plan.assignments).filter(([storyKey]) => !removedStoryKeys.has(storyKey))
      )

      return {
        plan: touchPlan({
          ...state.plan,
          epicIds: state.plan.epicIds.filter((key) => key !== epicKey),
          epics: state.plan.epics.filter((epic) => epic.key !== epicKey),
          assignments
        })
      }
    }),
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
              return refreshed ? mergeStoryFromJira(story, refreshed, epic.key) : story
            })
          }))
        })
      }
    })
}))

export const commitmentOptions: EpicCommitment[] = ['unplanned', 'uncommitted', 'committed']
