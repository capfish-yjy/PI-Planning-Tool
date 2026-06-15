import { dialog, ipcMain } from 'electron'
import type { ConfigSelectMode } from '../types/ipc'
import { loadConfig, saveConfig } from '../services/configService'

export const registerConfigIpc = () => {
  ipcMain.handle('config:selectFile', async (_event, mode: ConfigSelectMode) => {
    if (mode === 'create') {
      const result = await dialog.showSaveDialog({
        title: 'Create Jira Config',
        defaultPath: 'jira-config.json',
        filters: [{ name: 'JSON', extensions: ['json'] }]
      })
      return result.canceled ? null : result.filePath
    }

    const result = await dialog.showOpenDialog({
      title: 'Open Jira Config',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('config:load', async (_event, configPath: string) => loadConfig(configPath))
  ipcMain.handle('config:save', async (_event, configPath: string, config) => saveConfig(configPath, config))
}
