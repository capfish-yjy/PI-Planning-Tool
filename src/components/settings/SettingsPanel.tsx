import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, FolderOpen, Loader2, Save, Settings } from 'lucide-react'
import { electronApi } from '../../api/electronApi'
import type { JiraConfig } from '../../domain/planTypes'
import { usePlanStore } from '../../stores/planStore'
import { useUiStore } from '../../stores/uiStore'
import { DEFAULT_JIRA_HOST_URL } from '../../domain/defaults'
import { Button } from '../shared/Button'

export const SettingsPanel = () => {
  const { configPath, setConfigPath } = usePlanStore()
  const { setMessage, setError } = useUiStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [lastTestStatus, setLastTestStatus] = useState<'not-tested' | 'verified'>('not-tested')
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
      setIsSettingsOpen(true)
      setError(error instanceof Error ? error.message : 'Unexpected settings error.')
    } finally {
      setBusyAction(null)
    }
  }

  const resetTestStatus = () => setLastTestStatus('not-tested')

  const updateJiraHostUrl = (value: string) => {
    setJiraHostUrl(value)
    resetTestStatus()
  }

  const updatePat = (value: string) => {
    setPat(value)
    resetTestStatus()
  }

  const updateProxyEnabled = (value: boolean) => {
    setProxyEnabled(value)
    resetTestStatus()
  }

  const updateProxyUrl = (value: string) => {
    setProxyUrl(value)
    resetTestStatus()
  }

  const displayJiraHost = () => {
    try {
      return new URL(jiraHostUrl).host
    } catch {
      return jiraHostUrl.trim() || DEFAULT_JIRA_HOST_URL
    }
  }

  const createConfig = () =>
    runSafely('new', async () => {
      const selectedPath = await electronApi.config.selectFile('create')
      if (selectedPath) {
        setConfigPath(selectedPath)
        setIsSettingsOpen(true)
        resetTestStatus()
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
      setIsSettingsOpen(true)
      resetTestStatus()
      setMessage('Config loaded.')
    })

  const buildConfig = (): JiraConfig => ({
    jiraHostUrl,
    pat,
    proxy: {
      enabled: proxyEnabled,
      url: proxyUrl
    }
  })

  const saveConfig = () =>
    runSafely('save', async () => {
      if (!configPath) {
        throw new Error('Select or create a config file first.')
      }
      await electronApi.config.save(configPath, buildConfig())
      setIsSettingsOpen(false)
      setMessage('Config saved.')
    })

  const testConnection = () =>
    runSafely('test', async () => {
      if (!configPath) {
        throw new Error('Select or create a config file first.')
      }
      await electronApi.config.save(configPath, buildConfig())
      await electronApi.jira.testConnection({ configPath })
      setLastTestStatus('verified')
      setIsSettingsOpen(false)
      setMessage('Jira connection verified.')
    })

  return (
    <section className="border-b border-slate-200 bg-white px-6 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-sm text-slate-600">
          {configPath ? (
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium text-slate-800">Jira: {displayJiraHost()}</span>
              <span>Config selected</span>
              <span>{proxyEnabled ? 'Proxy on' : 'Proxy off'}</span>
              <span>Last test: {lastTestStatus === 'verified' ? 'verified' : 'not tested'}</span>
            </div>
          ) : (
            <span className="font-medium text-slate-700">No Jira config selected</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsSettingsOpen((current) => !current)}
            disabled={Boolean(busyAction)}
            icon={<Settings size={16} />}
          >
            {configPath ? 'Settings' : 'Set up Jira'}
          </Button>
          <Button
            onClick={testConnection}
            disabled={Boolean(busyAction)}
            icon={busyAction === 'test' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          >
            {busyAction === 'test' ? 'Testing...' : 'Test'}
          </Button>
        </div>
      </div>
      {isSettingsOpen ? (
        <div className="mt-3">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Jira Host URL
              <input
                value={jiraHostUrl}
                onChange={(event) => updateJiraHostUrl(event.target.value)}
                placeholder={DEFAULT_JIRA_HOST_URL}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Personal Access Token
              <input
                value={pat}
                onChange={(event) => updatePat(event.target.value)}
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
              <Button
                aria-label="Open config"
                onClick={openConfig}
                disabled={Boolean(busyAction)}
                icon={<FolderOpen size={16} />}
              />
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
                    onChange={(event) => updateProxyEnabled(event.target.checked)}
                    className="h-4 w-4"
                  />
                  Use proxy for Jira requests
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Proxy URL
                  <input
                    value={proxyUrl}
                    onChange={(event) => updateProxyUrl(event.target.value)}
                    placeholder="http://proxy.company.com:8080"
                    className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                  />
                </label>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
