import { useState } from 'react'
import { CheckCircle2, FolderOpen, Save } from 'lucide-react'
import { electronApi } from '../../api/electronApi'
import { usePlanStore } from '../../stores/planStore'
import { useUiStore } from '../../stores/uiStore'
import { DEFAULT_JIRA_HOST_URL } from '../../domain/defaults'
import { Button } from '../shared/Button'

export const SettingsPanel = () => {
  const { configPath, setConfigPath } = usePlanStore()
  const { setMessage, setError } = useUiStore()
  const [jiraHostUrl, setJiraHostUrl] = useState(DEFAULT_JIRA_HOST_URL)
  const [pat, setPat] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const runSafely = async (action: () => Promise<void>) => {
    setIsBusy(true)
    try {
      await action()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unexpected settings error.')
    } finally {
      setIsBusy(false)
    }
  }

  const createConfig = () =>
    runSafely(async () => {
      const selectedPath = await electronApi.config.selectFile('create')
      if (selectedPath) {
        setConfigPath(selectedPath)
        setMessage('Config file selected.')
      }
    })

  const openConfig = () =>
    runSafely(async () => {
      const selectedPath = await electronApi.config.selectFile('open')
      if (!selectedPath) {
        return
      }
      const config = await electronApi.config.load(selectedPath)
      setConfigPath(selectedPath)
      setJiraHostUrl(config.jiraHostUrl)
      setPat(config.pat)
      setMessage('Config loaded.')
    })

  const saveConfig = () =>
    runSafely(async () => {
      if (!configPath) {
        throw new Error('Select or create a config file first.')
      }
      await electronApi.config.save(configPath, { jiraHostUrl, pat })
      setMessage('Config saved.')
    })

  const testConnection = () =>
    runSafely(async () => {
      if (!configPath) {
        throw new Error('Select or create a config file first.')
      }
      await electronApi.config.save(configPath, { jiraHostUrl, pat })
      await electronApi.jira.testConnection({ configPath })
      setMessage('Jira connection verified.')
    })

  return (
    <section className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Jira Host URL
          <input
            value={jiraHostUrl}
            onChange={(event) => setJiraHostUrl(event.target.value)}
            placeholder={DEFAULT_JIRA_HOST_URL}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Personal Access Token
          <input
            value={pat}
            onChange={(event) => setPat(event.target.value)}
            type="password"
            placeholder="Stored only in config file"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Config File
          <input value={configPath} readOnly className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        </label>
        <div className="flex items-end gap-2">
          <Button aria-label="Open config" onClick={openConfig} disabled={isBusy} icon={<FolderOpen size={16} />} />
          <Button onClick={createConfig} disabled={isBusy}>
            New
          </Button>
          <Button aria-label="Save config" onClick={saveConfig} disabled={isBusy} icon={<Save size={16} />} />
          <Button onClick={testConnection} disabled={isBusy} icon={<CheckCircle2 size={16} />}>
            Test
          </Button>
        </div>
      </div>
    </section>
  )
}
