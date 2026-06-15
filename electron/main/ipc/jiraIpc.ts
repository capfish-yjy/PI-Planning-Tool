import { ipcMain, shell } from 'electron'
import type { FetchEpicsInput, RefreshIssuesInput, TestConnectionInput } from '../../../src/domain/jiraTypes'
import { loadConfig } from '../services/configService'
import { fetchEpics, refreshIssues, testConnection } from '../services/jiraReadService'

const getBrowseBaseUrl = (jiraHostUrl: string) => {
  const normalizedHost = jiraHostUrl.replace(/\/$/, '')
  return normalizedHost.endsWith('/jira') ? normalizedHost : `${normalizedHost}/jira`
}

export const registerJiraIpc = () => {
  ipcMain.handle('jira:testConnection', async (_event, input: TestConnectionInput) => {
    await testConnection(input.configPath)
    return { ok: true }
  })

  ipcMain.handle('jira:fetchEpics', async (_event, input: FetchEpicsInput) =>
    fetchEpics(input.configPath, input.projectKey, input.epicKeys)
  )

  ipcMain.handle('jira:refreshIssues', async (_event, input: RefreshIssuesInput) =>
    refreshIssues(input.configPath, input.issueKeys)
  )

  ipcMain.handle('jira:openIssue', async (_event, input: { configPath: string; issueKey: string }) => {
    const config = await loadConfig(input.configPath)
    const issueKey = input.issueKey.trim().toUpperCase()
    if (!/^[A-Z][A-Z0-9]+-\d+$/.test(issueKey)) {
      throw new Error('Invalid Jira issue key.')
    }
    await shell.openExternal(`${getBrowseBaseUrl(config.jiraHostUrl)}/browse/${encodeURIComponent(issueKey)}`)
  })
}
