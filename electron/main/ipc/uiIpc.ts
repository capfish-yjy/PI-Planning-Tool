import { BrowserWindow, Menu, ipcMain } from 'electron'
import type { StoryMoveMenuInput } from '../types/ipc'

export const registerUiIpc = () => {
  ipcMain.handle('ui:showStoryMoveMenu', async (event, input: StoryMoveMenuInput) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) {
      return null
    }

    const targets = input.sprints.filter((sprint) => sprint.id !== input.currentSprintId)
    if (targets.length === 0) {
      return null
    }

    return new Promise<string | null>((resolve) => {
      let didSelect = false
      const menu = Menu.buildFromTemplate([
        {
          label: 'Move to',
          submenu: targets.map((sprint) => ({
            label: sprint.name,
            click: () => {
              didSelect = true
              resolve(sprint.id)
            }
          }))
        }
      ])

      menu.popup({
        window,
        callback: () => {
          if (!didSelect) {
            resolve(null)
          }
        }
      })
    })
  })
}
