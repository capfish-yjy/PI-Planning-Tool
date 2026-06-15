import { dialog, ipcMain } from 'electron'
import type { Plan } from '../../../src/domain/planTypes'
import { exportPlanCsv, exportPlanHtml, importPlanCsv } from '../services/csvExportService'
import { loadConfig } from '../services/configService'
import { loadPlanFile, savePlanFile } from '../services/planFileService'

export const registerFileIpc = () => {
  ipcMain.handle('file:savePlan', async (_event, plan: Plan) => {
    const result = await dialog.showSaveDialog({
      title: 'Create Project File',
      defaultPath: `${plan.projectKey || 'pi-plan'}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) {
      return null
    }

    await savePlanFile(result.filePath, {
      ...plan,
      updatedAt: new Date().toISOString()
    })
    return result.filePath
  })

  ipcMain.handle('file:savePlanToPath', async (_event, filePath: string, plan: Plan) => {
    await savePlanFile(filePath, {
      ...plan,
      updatedAt: new Date().toISOString()
    })
  })

  ipcMain.handle('file:openPlan', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Open PI Plan',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePaths[0]) {
      return null
    }

    return {
      plan: await loadPlanFile(result.filePaths[0]),
      filePath: result.filePaths[0]
    }
  })

  ipcMain.handle('file:importCsv', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import PI Plan CSV',
      properties: ['openFile'],
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })
    if (result.canceled || !result.filePaths[0]) {
      return null
    }

    return importPlanCsv(result.filePaths[0])
  })

  ipcMain.handle('file:exportCsv', async (_event, plan: Plan) => {
    const result = await dialog.showSaveDialog({
      title: 'Export PI Plan CSV',
      defaultPath: `${plan.projectKey || 'pi-plan'}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })
    if (result.canceled || !result.filePath) {
      return null
    }

    await exportPlanCsv(result.filePath, plan)
    return result.filePath
  })

  ipcMain.handle('file:exportHtml', async (_event, plan: Plan, configPath?: string) => {
    const result = await dialog.showSaveDialog({
      title: 'Export PI Plan HTML',
      defaultPath: `${plan.projectKey || 'pi-plan'}-readable.html`,
      filters: [{ name: 'HTML', extensions: ['html'] }]
    })
    if (result.canceled || !result.filePath) {
      return null
    }

    const jiraHostUrl = configPath ? (await loadConfig(configPath)).jiraHostUrl : undefined
    await exportPlanHtml(result.filePath, plan, jiraHostUrl)
    return result.filePath
  })
}
