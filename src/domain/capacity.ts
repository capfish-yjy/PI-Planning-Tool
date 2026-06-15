import type { Plan, SprintUsage } from './planTypes'

export const getAllStories = (plan: Plan) => plan.epics.flatMap((epic) => epic.stories)

export const getPlanProgress = (plan: Plan) => {
  const stories = getAllStories(plan)
  const plannedStories = stories.filter((story) => Boolean(plan.assignments[story.key]))

  return {
    totalStoryCount: stories.length,
    plannedStoryCount: plannedStories.length,
    totalStoryPoints: stories.reduce((sum, story) => sum + (story.storyPoints ?? 0), 0),
    plannedStoryPoints: plannedStories.reduce((sum, story) => sum + (story.storyPoints ?? 0), 0)
  }
}

export const getSprintUsage = (plan: Plan, sprintId: string): SprintUsage => {
  const sprint = plan.sprints.find((item) => item.id === sprintId)
  const usedPoints = getAllStories(plan)
    .filter((story) => plan.assignments[story.key] === sprintId)
    .reduce((sum, story) => sum + (story.storyPoints ?? 0), 0)

  return {
    sprintId,
    usedPoints,
    capacity: sprint?.pointCapacity ?? 0,
    isOverCapacity: Boolean(sprint && usedPoints > sprint.pointCapacity)
  }
}

export const getSprintUsages = (plan: Plan): SprintUsage[] =>
  plan.sprints.map((sprint) => getSprintUsage(plan, sprint.id))
