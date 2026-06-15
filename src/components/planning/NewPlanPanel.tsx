import { useEffect, useState } from 'react'
import { DownloadCloud, Loader2, RefreshCw } from 'lucide-react'
import { electronApi } from '../../api/electronApi'
import { usePlanStore } from '../../stores/planStore'
import { useUiStore } from '../../stores/uiStore'
import { Button } from '../shared/Button'

const parseTicketNumbers = (value: string, projectKey: string) =>
  Array.from(new Set(value
    .split(/[\s,，;；]+/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
    .map((item) => {
      const browseMatch = item.match(/\/BROWSE\/([A-Z][A-Z0-9]+-\d+)/)
      if (browseMatch) {
        return browseMatch[1]
      }

      if (/^[A-Z][A-Z0-9]+-\d+$/.test(item)) {
        return item
      }

      const numberMatch = item.match(/\d+/)
      return numberMatch ? `${projectKey}-${numberMatch[0]}` : item
    })))

export const NewPlanPanel = () => {
  const { plan, configPath, planFilePath, setProjectKey: saveProjectKey, importEpics } = usePlanStore()
  const { setMessage, setError } = useUiStore()
  const [projectKey, setProjectKey] = useState(plan.projectKey)
  const [ticketNumbers, setTicketNumbers] = useState('')
  const [busyAction, setBusyAction] = useState<'import' | 'refresh' | null>(null)

  useEffect(() => {
    setProjectKey(plan.projectKey)
  }, [plan.projectKey])

  const runSafely = async (busyType: 'import' | 'refresh', action: () => Promise<void>) => {
    setBusyAction(busyType)
    try {
      await action()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unexpected Jira error.')
    } finally {
      setBusyAction(null)
    }
  }

  const fetchEpics = () =>
    runSafely('import', async () => {
      if (!planFilePath) {
        throw new Error('Create a project file before planning.')
      }
      if (!configPath) {
        throw new Error('Select a Jira config file first.')
      }
      const normalizedProjectKey = (plan.projectKey || projectKey).trim().toUpperCase()
      if (!normalizedProjectKey) {
        throw new Error('Set the project key once before importing Epic tickets.')
      }
      const keys = parseTicketNumbers(ticketNumbers, normalizedProjectKey)
      if (keys.length === 0) {
        throw new Error('At least one Epic ticket number is required.')
      }
      saveProjectKey(normalizedProjectKey)
      const result = await electronApi.jira.fetchEpics({ configPath, projectKey: normalizedProjectKey, epicKeys: keys })
      importEpics(result.projectKey, result.epics)
      setTicketNumbers('')
      setMessage(`Imported ${result.epics.length} epics from Jira read-only APIs.`)
    })

  const refresh = () =>
    runSafely('refresh', async () => {
      if (!configPath) {
        throw new Error('Select a Jira config file first.')
      }
      const normalizedProjectKey = (plan.projectKey || projectKey).trim().toUpperCase()
      if (!normalizedProjectKey) {
        throw new Error('Set the project key once before refreshing.')
      }
      const epicKeys = plan.epicIds.length > 0 ? plan.epicIds : plan.epics.map((epic) => epic.key)
      if (epicKeys.length === 0) {
        throw new Error('Import epics before refreshing.')
      }
      const result = await electronApi.jira.fetchEpics({ configPath, projectKey: normalizedProjectKey, epicKeys })
      importEpics(result.projectKey, result.epics)
      setMessage(`Refreshed ${result.epics.length} epics and their stories from Jira. Local sprint assignments were preserved.`)
    })

  return (
    <section className="border-b border-slate-200 bg-slate-50 px-6 py-4">
      <div className="grid gap-3 lg:grid-cols-[180px_1fr_auto]">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Project Key
          <input
            value={projectKey}
            onChange={(event) => setProjectKey(event.target.value.toUpperCase())}
            onBlur={() => {
              if (projectKey.trim()) {
                saveProjectKey(projectKey.trim().toUpperCase())
              }
            }}
            placeholder="E3AUDEDM"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm uppercase"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Epic Ticket Numbers
          <input
            value={ticketNumbers}
            onChange={(event) => setTicketNumbers(event.target.value)}
            placeholder="18519, 18520 or E3AUDEDM-18519"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
        </label>
        <div className="flex items-end gap-2">
          <Button
            onClick={fetchEpics}
            disabled={Boolean(busyAction)}
            variant="primary"
            icon={busyAction === 'import' ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
          >
            {busyAction === 'import' ? 'Importing' : 'Import'}
          </Button>
          <Button
            onClick={refresh}
            disabled={Boolean(busyAction)}
            icon={busyAction === 'refresh' ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          >
            {busyAction === 'refresh' ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
      </div>
    </section>
  )
}
