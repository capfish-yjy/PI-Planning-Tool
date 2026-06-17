import { DEFAULT_PROJECT_KEY } from './defaults'

export type IssueKey = string
export type SprintId = string

export type EpicCommitment = 'committed' | 'uncommitted' | 'unplanned'

export type Story = {
  key: IssueKey
  summary: string
  description?: string
  localNote?: string
  issueType: string
  status: string
  storyPoints: number | null
  epicKey: string
  stale?: boolean
}

export type Epic = {
  key: IssueKey
  summary: string
  description?: string
  localNote?: string
  priorityWeight: number
  commitment: EpicCommitment
  stories: Story[]
}

export type Sprint = {
  id: SprintId
  name: string
  startDate: string
  endDate: string
  pointCapacity: number
}

export type Plan = {
  version: 1
  projectKey: string
  epicIds: IssueKey[]
  epics: Epic[]
  sprints: Sprint[]
  assignments: Record<IssueKey, SprintId | null>
  updatedAt: string
}

export type JiraConfig = {
  jiraHostUrl: string
  pat: string
  proxy?: {
    enabled: boolean
    url: string
  }
  fieldMappings?: {
    storyPointsFieldId?: string
    epicLinkFieldId?: string
    numericalPriorityFieldId?: string
    commitmentFieldId?: string
  }
}

export type SprintUsage = {
  sprintId: SprintId
  usedPoints: number
  capacity: number
  isOverCapacity: boolean
}

export const createEmptyPlan = (): Plan => ({
  version: 1,
  projectKey: DEFAULT_PROJECT_KEY,
  epicIds: [],
  epics: [],
  sprints: [],
  assignments: {},
  updatedAt: new Date().toISOString()
})
