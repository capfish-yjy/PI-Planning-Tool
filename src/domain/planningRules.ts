import type { Epic, Plan, SprintId, Story } from './planTypes'

export const canPlanStory = (story: Story) => story.storyPoints !== null

export const isEpicFullyPlanned = (epic: Epic, assignments: Plan['assignments']) =>
  epic.stories.length > 0 && epic.stories.every((story) => Boolean(assignments[story.key]))

export const getEpicPlanningColor = (epic: Epic, assignments: Plan['assignments']) => {
  const allStoriesPlanned = isEpicFullyPlanned(epic, assignments)

  if (allStoriesPlanned) {
    return 'green'
  }

  if (epic.commitment === 'committed') {
    return 'red'
  }

  return 'neutral'
}

export const sortEpicsByPriority = (epics: Epic[]) =>
  [...epics].sort((left, right) => right.priorityWeight - left.priorityWeight)

export const assignStoryToSprint = (
  assignments: Plan['assignments'],
  story: Story,
  sprintId: SprintId | null
) => {
  if (!canPlanStory(story) && sprintId !== null) {
    return assignments
  }

  return {
    ...assignments,
    [story.key]: sprintId
  }
}
