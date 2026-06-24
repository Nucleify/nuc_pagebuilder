export type PageBuilderStatusType = 'draft' | 'published' | 'archived'

export type PageBuilderWidgetType =
  | 'heading'
  | 'text'
  | 'button'
  | 'image'
  | 'video'
  | 'divider'
  | 'spacer'
  | 'html'
  | 'list'
  | 'quote'
  | 'code'
  | 'component'
  | 'container'
  | 'row'
  | 'column'
  | 'section'

export type PageBuilderWidgetSourceType =
  | 'native'
  | 'atomic'
  | 'templates'
  | 'sections'

export type PageBuilderSaveState = 'idle' | 'saving' | 'saved' | 'error'

export type PageBuilderWidgetSourceFilter = 'all' | PageBuilderWidgetSourceType
