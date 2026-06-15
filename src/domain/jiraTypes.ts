import type { Epic, IssueKey, JiraConfig, Story } from './planTypes'

export type JiraFieldMappings = NonNullable<JiraConfig['fieldMappings']>

export type FetchEpicsInput = {
  configPath: string
  projectKey: string
  epicKeys: IssueKey[]
}

export type RefreshIssuesInput = {
  configPath: string
  issueKeys: IssueKey[]
}

export type TestConnectionInput = {
  configPath: string
}

export type FetchEpicsResult = {
  projectKey: string
  epics: Epic[]
  fieldMappings: JiraFieldMappings
}

export type RefreshIssuesResult = {
  stories: Story[]
}
