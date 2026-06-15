import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, FolderOpen, Loader2, Save } from 'lucide-react'
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
  const [isProxyOpen, setIsProxyOpen] = useState(false)
  const [proxyEnabled, setProxyEnabled] = useState(false)
  const [proxyUrl, setProxyUrl] = useState('')
  const [busyAction, setBusyAction] = useState<'open' | 'new' | 'save' | 'test' | null>(null)

  const runSafely = async (actionType: NonNullable<typeof busyAction>, action: () => Promise<void>) => {
    setBusyAction(actionType)
    try {
      await action()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unexpected settings error.')
    } finally {
      setBusyAction(null)
    }
  }

  const createConfig = () =>
    runSafely('new', async () => {
      const selectedPath = await electronApi.config.selectFile('create')
      if (selectedPath) {
        setConfigPath(selectedPath)
        setMessage('Config file selected.')
      }
    })

  const openConfig = () =>
    runSafely('open', async () => {
      const selectedPath = await electronApi.config.selectFile('open')
      if (!selectedPath) {
        return
      }
      const config = await electronApi.config.load(selectedPath)
      setConfigPath(selectedPath)
      setJiraHostUrl(config.jiraHostUrl)
      setPat(config.pat)
      setProxyEnabled(Boolean(config.proxy?.enabled))
      setProxyUrl(config.proxy?.url ?? '')
      setIsProxyOpen(Boolean(config.proxy?.enabled || config.proxy?.url))
      setMessage('Config loaded.')
    })

  const buildConfig = () => ({
    jiraHostUrl,
    pat,
    proxy: proxyEnabled || proxyUrl.trim()
      ? {
          enabled: proxyEnabled,
          url: proxyUrl
        }
      : undefined
  })

  const saveConfig = () =>
    runSafely('save', async () => {
      if (!configPath) {
        throw new Error('Select or create a config file first.')
      }
      await electronApi.config.save(configPath, buildConfig())
      setMessage('Config saved.')
    })

  const testConnection = () =>
    runSafely('test', async () => {
      if (!configPath) {
        throw new Error('Select or create a config file first.')
      }
      await electronApi.config.save(configPath, buildConfig())
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
          <Button aria-label="Open config" onClick={openConfig} disabled={Boolean(busyAction)} icon={<FolderOpen size={16} />} />
          <Button onClick={createConfig} disabled={Boolean(busyAction)}>
            New
          </Button>
          <Button aria-label="Save config" onClick={saveConfig} disabled={Boolean(busyAction)} icon={<Save size={16} />} />
          <Button
            onClick={testConnection}
            disabled={Boolean(busyAction)}
            icon={busyAction === 'test' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          >
            {busyAction === 'test' ? 'Testing...' : 'Test'}
          </Button>
        </div>
      </div>
      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => setIsProxyOpen((current) => !current)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {isProxyOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Proxy Settings
        </button>
        {isProxyOpen ? (
          <div className="grid gap-3 border-t border-slate-200 p-3 lg:grid-cols-[220px_1fr]">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={proxyEnabled}
                onChange={(event) => setProxyEnabled(event.target.checked)}
                className="h-4 w-4"
              />
              Use proxy for Jira requests
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Proxy URL
              <input
                value={proxyUrl}
                onChange={(event) => setProxyUrl(event.target.value)}
                placeholder="http://proxy.company.com:8080"
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </label>
          </div>
        ) : null}
      </div>
    </section>
  )
}
