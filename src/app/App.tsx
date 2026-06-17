import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileInput, FolderOpen, Info, Save, X } from 'lucide-react'
import { electronApi } from '../api/electronApi'
import { getPlanProgress } from '../domain/capacity'
import { usePlanStore } from '../stores/planStore'
import { useUiStore } from '../stores/uiStore'
import { NewPlanPanel } from '../components/planning/NewPlanPanel'
import { PlanningBoard } from '../components/planning/PlanningBoard'
import { SettingsPanel } from '../components/settings/SettingsPanel'
import { Button } from '../components/shared/Button'

const SUCCESS_NOTIFICATION_TIMEOUT_MS = 2500

export const App = () => {
  const { plan, setPlan, planFilePath, setPlanFilePath, configPath } = usePlanStore()
  const { message, error, setMessage, setError, clearStatus } = useUiStore()
  const planProgress = useMemo(() => getPlanProgress(plan), [plan])
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const lastAutoSavedPayload = useRef('')
  const planFileName = useMemo(() => planFilePath.split(/[\\/]/).pop() || '', [planFilePath])

  useEffect(() => {
    if (!planFilePath) {
      setAutoSaveStatus('idle')
      return
    }

    const payload = JSON.stringify(plan)
    if (payload === lastAutoSavedPayload.current) {
      return
    }

    setAutoSaveStatus('saving')
    const timeoutId = window.setTimeout(async () => {
      try {
        await electronApi.files.savePlanToPath(planFilePath, plan)
        lastAutoSavedPayload.current = payload
        setAutoSaveStatus('saved')
      } catch (autoSaveError) {
        setAutoSaveStatus('failed')
        setError(autoSaveError instanceof Error ? autoSaveError.message : 'Autosave failed.')
      }
    }, 1000)

    return () => window.clearTimeout(timeoutId)
  }, [plan, planFilePath, setError])

  useEffect(() => {
    if (!message) {
      return
    }

    const timeoutId = window.setTimeout(clearStatus, SUCCESS_NOTIFICATION_TIMEOUT_MS)
    return () => window.clearTimeout(timeoutId)
  }, [message, clearStatus])

  const runFileAction = async (action: () => Promise<string | null | void>, success: string) => {
    try {
      const filePath = await action()
      if (filePath !== null) {
        setMessage(filePath ? `${success}: ${filePath}` : success)
      }
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : 'Unexpected file operation error.')
    }
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">PI Planning Assistant</h1>
          <span className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-within:bg-slate-100">
            <Info size={17} aria-hidden="true" />
            <span className="pointer-events-none absolute left-0 top-9 z-10 hidden w-72 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 shadow-lg group-hover:block group-focus-within:block">
              Jira read-only planning. Local JSON and CSV output only.
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              runFileAction(async () => {
                const filePath = await electronApi.files.savePlan(plan)
                if (filePath) {
                  setPlanFilePath(filePath)
                  lastAutoSavedPayload.current = JSON.stringify(plan)
                }
                return filePath
              }, 'Project file created')
            }
            icon={<Save size={16} />}
          >
            Create Project File
          </Button>
          <Button
            onClick={() =>
              runFileAction(async () => {
                const openedProject = await electronApi.files.openPlan()
                if (openedProject) {
                  setPlan(openedProject.plan)
                  setPlanFilePath(openedProject.filePath)
                  lastAutoSavedPayload.current = JSON.stringify(openedProject.plan)
                  return 'opened'
                }
                return null
              }, 'Plan opened')
            }
            icon={<FolderOpen size={16} />}
          >
            Open JSON
          </Button>
          <Button
            onClick={() =>
              runFileAction(async () => {
                const importedPlan = await electronApi.files.importCsv()
                if (importedPlan) {
                  setPlan(importedPlan)
                  return 'imported'
                }
                return null
              }, 'CSV imported')
            }
            icon={<FileInput size={16} />}
          >
            Import CSV
          </Button>
          <Button
            onClick={() => runFileAction(() => electronApi.files.exportCsv(plan), 'CSV exported')}
            icon={<Download size={16} />}
          >
            Export CSV
          </Button>
          <Button
            onClick={() => runFileAction(() => electronApi.files.exportHtml(plan, configPath || undefined), 'HTML exported')}
            icon={<Download size={16} />}
          >
            Export HTML
          </Button>
        </div>
      </header>
      <SettingsPanel />
      <NewPlanPanel />
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-slate-200 bg-white px-6 py-2 text-sm text-slate-600">
        <span>Project file: {planFileName || 'No project file selected'}</span>
        <span>
          {autoSaveStatus === 'saving'
            ? 'Autosaving...'
            : autoSaveStatus === 'saved'
              ? 'Autosaved'
              : autoSaveStatus === 'failed'
                ? 'Autosave failed'
                : ''}
        </span>
        <span>Project: {plan.projectKey || 'Not imported'}</span>
        <span>Epics: {plan.epics.length}</span>
        <span>Stories: {planProgress.totalStoryCount}</span>
        <span>Story Points: {planProgress.totalStoryPoints}</span>
        <span>
          Planned Points: {planProgress.plannedStoryPoints}/{planProgress.totalStoryPoints}
        </span>
        <span>
          Planned Stories: {planProgress.plannedStoryCount}/{planProgress.totalStoryCount}
        </span>
        <span>Sprints: {plan.sprints.length}</span>
      </div>
      {message ? (
        <div className="flex items-center justify-between gap-4 border-b border-green-200 bg-green-50 px-6 py-2 text-sm text-green-800">
          <span className="min-w-0 truncate">{message}</span>
          <button
            type="button"
            aria-label="Close notification"
            onClick={clearStatus}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-green-100"
          >
            <X size={15} />
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="flex items-center justify-between gap-4 border-b border-red-200 bg-red-50 px-6 py-2 text-sm text-red-800">
          <span className="min-w-0 truncate">{error}</span>
          <button
            type="button"
            aria-label="Close notification"
            onClick={clearStatus}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-red-100"
          >
            <X size={15} />
          </button>
        </div>
      ) : null}
      <PlanningBoard />
    </div>
  )
}
