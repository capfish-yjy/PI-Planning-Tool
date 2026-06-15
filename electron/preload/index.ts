import { contextBridge, ipcRenderer } from 'electron'
import type { ConfigSelectMode, ElectronApi } from '../main/types/ipc'
import type { FetchEpicsInput, RefreshIssuesInput, TestConnectionInput } from '../../src/domain/jiraTypes'
import type { JiraConfig, Plan } from '../../src/domain/planTypes'

const electronApi: ElectronApi = {
  config: {
    selectFile: (mode: ConfigSelectMode) => ipcRenderer.invoke('config:selectFile', mode),
    load: (configPath: string) => ipcRenderer.invoke('config:load', configPath),
    save: (configPath: string, config: JiraConfig) => ipcRenderer.invoke('config:save', configPath, config)
  },
  jira: {
    testConnection: (input: TestConnectionInput) => ipcRenderer.invoke('jira:testConnection', input),
    fetchEpics: (input: FetchEpicsInput) => ipcRenderer.invoke('jira:fetchEpics', input),
    refreshIssues: (input: RefreshIssuesInput) => ipcRenderer.invoke('jira:refreshIssues', input),
    openIssue: (input: { configPath: string; issueKey: string }) => ipcRenderer.invoke('jira:openIssue', input)
  },
  files: {
    savePlan: (plan: Plan) => ipcRenderer.invoke('file:savePlan', plan),
    savePlanToPath: (filePath: string, plan: Plan) => ipcRenderer.invoke('file:savePlanToPath', filePath, plan),
    openPlan: () => ipcRenderer.invoke('file:openPlan'),
    importCsv: () => ipcRenderer.invoke('file:importCsv'),
    exportCsv: (plan: Plan) => ipcRenderer.invoke('file:exportCsv', plan),
    exportHtml: (plan: Plan, configPath?: string) => ipcRenderer.invoke('file:exportHtml', plan, configPath)
  }
}

contextBridge.exposeInMainWorld('electronApi', electronApi)
