import type { FetchEpicsInput, FetchEpicsResult, RefreshIssuesInput, RefreshIssuesResult, TestConnectionInput } from '../domain/jiraTypes'
import type { JiraConfig, Plan } from '../domain/planTypes'

export type StoryMoveMenuInput = {
  storyKey: string
  currentSprintId?: string | null
  sprints: Array<{
    id: string
    name: string
  }>
}

export type ElectronApi = {
  config: {
    selectFile: (mode: 'open' | 'create') => Promise<string | null>
    load: (configPath: string) => Promise<JiraConfig>
    save: (configPath: string, config: JiraConfig) => Promise<void>
  }
  jira: {
    testConnection: (input: TestConnectionInput) => Promise<{ ok: boolean }>
    fetchEpics: (input: FetchEpicsInput) => Promise<FetchEpicsResult>
    refreshIssues: (input: RefreshIssuesInput) => Promise<RefreshIssuesResult>
    openIssue: (input: { configPath: string; issueKey: string }) => Promise<void>
  }
  files: {
    savePlan: (plan: Plan) => Promise<string | null>
    savePlanToPath: (filePath: string, plan: Plan) => Promise<void>
    openPlan: () => Promise<{ plan: Plan; filePath: string } | null>
    importCsv: () => Promise<Plan | null>
    exportCsv: (plan: Plan) => Promise<string | null>
    exportHtml: (plan: Plan, configPath?: string) => Promise<string | null>
  }
  ui: {
    showStoryMoveMenu: (input: StoryMoveMenuInput) => Promise<string | null>
  }
}

declare global {
  interface Window {
    electronApi: ElectronApi
  }
}

if (!window.electronApi) {
  throw new Error('Electron preload API is unavailable. Restart the app so the preload bridge can be loaded.')
}

export const electronApi = window.electronApi
