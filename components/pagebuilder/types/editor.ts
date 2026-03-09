import type {
  PageBuilderWidgetDefinitionInterface,
  PageBuilderWidgetSourceType,
} from '.'

export type PageBuilderSaveState = 'idle' | 'saving' | 'saved' | 'error'

export type PageBuilderWidgetSourceFilter = 'all' | PageBuilderWidgetSourceType

export interface WidgetGroup {
  key: string
  label: string
  icon: string
  widgets: PageBuilderWidgetDefinitionInterface[]
}

export interface DropTargetInfo {
  parentId: string | null
  index: number
  slotName?: string
}
