import type { FetchEpicsInput, FetchEpicsResult, RefreshIssuesInput, RefreshIssuesResult, TestConnectionInput } from '../../../src/domain/jiraTypes'
import type { JiraConfig, Plan } from '../../../src/domain/planTypes'

export type ConfigSelectMode = 'open' | 'create'

export type StoryMoveMenuSprint = {
  id: string
  name: string
}

export type StoryMoveMenuInput = {
  storyKey: string
  currentSprintId?: string | null
  sprints: StoryMoveMenuSprint[]
}

export type ConfigApi = {
  selectFile: (mode: ConfigSelectMode) => Promise<string | null>
  load: (configPath: string) => Promise<JiraConfig>
  save: (configPath: string, config: JiraConfig) => Promise<void>
}

export type JiraApi = {
  testConnection: (input: TestConnectionInput) => Promise<{ ok: boolean }>
  fetchEpics: (input: FetchEpicsInput) => Promise<FetchEpicsResult>
  refreshIssues: (input: RefreshIssuesInput) => Promise<RefreshIssuesResult>
  openIssue: (input: { configPath: string; issueKey: string }) => Promise<void>
}

export type FileApi = {
  savePlan: (plan: Plan) => Promise<string | null>
  savePlanToPath: (filePath: string, plan: Plan) => Promise<void>
  openPlan: () => Promise<{ plan: Plan; filePath: string } | null>
  importCsv: () => Promise<Plan | null>
  exportCsv: (plan: Plan) => Promise<string | null>
  exportHtml: (plan: Plan, configPath?: string) => Promise<string | null>
}

export type UiApi = {
  showStoryMoveMenu: (input: StoryMoveMenuInput) => Promise<string | null>
}

export type ElectronApi = {
  config: ConfigApi
  jira: JiraApi
  files: FileApi
  ui: UiApi
}
