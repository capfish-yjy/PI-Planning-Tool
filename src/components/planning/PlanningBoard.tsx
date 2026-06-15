import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import type { Story } from '../../domain/planTypes'
import { usePlanStore } from '../../stores/planStore'
import { useUiStore } from '../../stores/uiStore'
import { EpicPanel } from '../epic/EpicPanel'
import { SprintBoard } from '../sprint/SprintBoard'

export const PlanningBoard = () => {
  const { assignStory, planFilePath } = usePlanStore()
  const { setError } = useUiStore()

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

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <main className="grid min-h-0 flex-1 grid-cols-[420px_1fr]">
        <EpicPanel />
        <SprintBoard />
      </main>
    </DndContext>
  )
}
