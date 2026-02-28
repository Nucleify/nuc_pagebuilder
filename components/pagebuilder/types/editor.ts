import type {
  PageBuilderWidgetDefinitionInterface,
  PageBuilderWidgetSourceType,
} from './index'

export type PageBuilderSaveState = 'idle' | 'saving' | 'saved' | 'error'

export type PageBuilderWidgetSourceFilter = 'all' | PageBuilderWidgetSourceType

export interface WidgetGroup {
  key: string
  label: string
  icon: string
  widgets: PageBuilderWidgetDefinitionInterface[]
}
