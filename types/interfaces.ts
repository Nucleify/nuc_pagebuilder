import type {
  PageBuilderStatusType,
  PageBuilderWidgetSourceType,
  PageBuilderWidgetType,
} from 'nucleify'

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

export interface PageBuilderWidgetDefinitionInterface {
  key: string
  label: string
  source: PageBuilderWidgetSourceType
  type: PageBuilderWidgetType
  componentTag?: string
  defaultProps: Record<string, unknown>
  acceptsChildren?: boolean
  slots?: string[]
}

export interface PageBuilderNodeInterface {
  id: string
  type: 'widget'
  widgetType: PageBuilderWidgetType
  props: Record<string, unknown>
  styles: Record<string, string>
  children: PageBuilderNodeInterface[]
  slot?: string
}

export interface PageBuilderLayoutInterface {
  id: string
  type: 'page'
  settings: Record<string, unknown>
  children: PageBuilderNodeInterface[]
}

export interface PageBuilderVersionInterface {
  id: number
  page_id: number
  version: number
  layout_json: PageBuilderLayoutInterface
  checksum: string
  is_published: boolean
  created_by: number
  created_at: string
  updated_at: string
}

export interface PageBuilderPageInterface {
  id: number
  user_id: number
  title: string
  slug: string
  status: PageBuilderStatusType
  meta_json: Record<string, unknown> | null
  published_version_id: number | null
  published_version?: PageBuilderVersionInterface
  versions?: PageBuilderVersionInterface[]
  created_at: string
  updated_at: string
}
