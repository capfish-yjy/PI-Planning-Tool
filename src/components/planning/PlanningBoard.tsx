import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import type { Story } from '../../domain/planTypes'
import { usePlanStore } from '../../stores/planStore'
import { useUiStore } from '../../stores/uiStore'
import { EpicPanel } from '../epic/EpicPanel'
import { SprintBoard } from '../sprint/SprintBoard'

const DEFAULT_BACKLOG_WIDTH = 420
const MIN_BACKLOG_WIDTH = 320
const MAX_BACKLOG_WIDTH_RATIO = 0.55
const MIN_SPRINT_BOARD_WIDTH = 560
const KEYBOARD_RESIZE_STEP = 24

export const PlanningBoard = () => {
  const { assignStory, planFilePath } = usePlanStore()
  const { setError } = useUiStore()
  const containerRef = useRef<HTMLElement | null>(null)
  const [backlogWidth, setBacklogWidth] = useState(DEFAULT_BACKLOG_WIDTH)
  const [isResizing, setIsResizing] = useState(false)

  const clampBacklogWidth = (nextWidth: number) => {
    const containerWidth = containerRef.current?.clientWidth ?? 0
    if (!containerWidth) {
      return Math.max(MIN_BACKLOG_WIDTH, nextWidth)
    }

    const maxByRatio = Math.floor(containerWidth * MAX_BACKLOG_WIDTH_RATIO)
    const maxBySprint = containerWidth - MIN_SPRINT_BOARD_WIDTH
    const maxWidth = Math.max(MIN_BACKLOG_WIDTH, Math.min(maxByRatio, maxBySprint))
    return Math.min(Math.max(nextWidth, MIN_BACKLOG_WIDTH), maxWidth)
  }

  const updateBacklogWidth = (nextWidth: number) => {
    setBacklogWidth(clampBacklogWidth(nextWidth))
  }

  useEffect(() => {
    const handleResize = () => setBacklogWidth((current) => clampBacklogWidth(current))
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(
    () => () => {
      document.body.classList.remove('select-none')
    },
    []
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const story = event.active.data.current?.story as Story | undefined
    if (!story) {
      return
    }

    if (!planFilePath) {
      setError('Create a project file before planning.')
      return
    }

    const targetId = event.over?.id
    if (!targetId || targetId === 'backlog') {
      assignStory(story, null)
      return
    }

    assignStory(story, String(targetId))
  }

  const handleResizePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsResizing(true)
    document.body.classList.add('select-none')
  }

  const handleResizePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isResizing) {
      return
    }

    const containerLeft = containerRef.current?.getBoundingClientRect().left ?? 0
    updateBacklogWidth(event.clientX - containerLeft)
  }

  const handleResizePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isResizing) {
      return
    }

    const containerLeft = containerRef.current?.getBoundingClientRect().left ?? 0
    const nextWidth = clampBacklogWidth(event.clientX - containerLeft)
    event.currentTarget.releasePointerCapture(event.pointerId)
    setIsResizing(false)
    document.body.classList.remove('select-none')
    setBacklogWidth(nextWidth)
  }

  const handleResizePointerCancel = () => {
    setIsResizing(false)
    document.body.classList.remove('select-none')
  }

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return
    }

    event.preventDefault()
    const direction = event.key === 'ArrowLeft' ? -1 : 1
    const nextWidth = clampBacklogWidth(backlogWidth + direction * KEYBOARD_RESIZE_STEP)
    setBacklogWidth(nextWidth)
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <main ref={containerRef} className={`flex min-h-0 flex-1 overflow-hidden ${isResizing ? 'cursor-col-resize' : ''}`}>
        <div className="flex min-w-0 shrink-0" style={{ width: backlogWidth }}>
          <EpicPanel />
        </div>
        <button
          type="button"
          role="separator"
          aria-label="Resize backlog and sprint areas"
          aria-orientation="vertical"
          aria-valuemin={MIN_BACKLOG_WIDTH}
          aria-valuenow={Math.round(backlogWidth)}
          className={`group relative z-10 w-1.5 shrink-0 cursor-col-resize bg-slate-100 outline-none transition hover:bg-slate-300 focus:bg-slate-300 ${
            isResizing ? 'bg-slate-400' : ''
          }`}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerCancel}
          onKeyDown={handleResizeKeyDown}
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-300 group-hover:bg-slate-500" />
        </button>
        <div className="flex min-w-[560px] flex-1 overflow-hidden">
          <SprintBoard />
        </div>
      </main>
    </DndContext>
  )
}
