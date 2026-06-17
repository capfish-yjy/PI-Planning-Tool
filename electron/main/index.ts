import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'
import { registerConfigIpc } from './ipc/configIpc'
import { registerFileIpc } from './ipc/fileIpc'
import { registerJiraIpc } from './ipc/jiraIpc'
import { registerUiIpc } from './ipc/uiIpc'

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1040,
    minHeight: 720,
    title: 'PI Planning Assistant',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerConfigIpc()
  registerJiraIpc()
  registerFileIpc()
  registerUiIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  app.quit()
})
