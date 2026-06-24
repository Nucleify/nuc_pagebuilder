import type { ComponentType } from 'react'

import type { PropFieldSchema } from '../config/schema_types'
import type {
  DropTargetInfo,
  PageBuilderLayoutInterface,
  PageBuilderNodeInterface,
  PageBuilderPageInterface,
  PageBuilderWidgetDefinitionInterface,
  WidgetGroup,
} from '../types/interfaces'
import type {
  PageBuilderSaveState,
  PageBuilderWidgetSourceFilter,
} from '../types/variables'

export interface NucPageBuilderTopbarProps {
  title: string
  slug: string
  lang: string
  saveState: PageBuilderSaveState
  saveLabel: string
  lastSavedLabel: string
  autosaveEnabled: boolean
  selectedPageId: number | null
  selectedPageSlug: string | null
  onTitleChange: (value: string) => void
  onSlugChange: (value: string) => void
  onAutosaveChange: (value: boolean) => void
  onSave: () => void
  onPublish: () => void
  onUndo: () => void
  onRedo: () => void
}

export interface NucPageBuilderSidebarProps {
  pages: PageBuilderPageInterface[]
  selectedPageId: number | null
  filteredWidgets: PageBuilderWidgetDefinitionInterface[]
  groupedWidgets: WidgetGroup[]
  collapsedGroups: Set<string>
  widgetSearch: string
  widgetSources: PageBuilderWidgetSourceFilter[]
  activeWidgetSource: PageBuilderWidgetSourceFilter
  onCreatePage: () => void
  onLoadPage: (pageId: number) => void
  onDeletePage: (pageId: number) => void
  onWidgetSearchChange: (value: string) => void
  onWidgetSourceChange: (value: PageBuilderWidgetSourceFilter) => void
  onToggleGroup: (key: string) => void
  onWidgetDragStart: (widgetKey: string) => void
  onAddWidget: (widgetKey: string) => void
}

export type ResolvedComponentTagFn = (
  node: PageBuilderNodeInterface
) => string | ComponentType<Record<string, unknown>>

export type ComponentPropsFn = (
  node: PageBuilderNodeInterface
) => Record<string, unknown>

export type NodeDisplayFn = (node: PageBuilderNodeInterface) => string

export type ListItemsFn = (node: PageBuilderNodeInterface) => string[]

export interface NucPageBuilderCanvasProps {
  layout: PageBuilderLayoutInterface
  selectedNodeId: string | null
  draggedNodeId: string | null
  dropTarget: DropTargetInfo | null
  resolvedComponentTag: ResolvedComponentTagFn
  componentProps: ComponentPropsFn
  widgetDisplayName: NodeDisplayFn
  nodePreviewText: NodeDisplayFn
  listItems: ListItemsFn
  onCanvasDragOver: (
    event: DragEvent,
    canvasElement: HTMLElement | null
  ) => void
  onCanvasDrop: () => void
  onCanvasDragLeave: () => void
  onNodeDragStart: (nodeId: string) => void
  onNodeDragEnd: () => void
  onSelectNode: (nodeId: string) => void
  onRemoveNode: (nodeId: string) => void
  onContainerDragOver: (payload: {
    containerId: string
    event: DragEvent
    slotName?: string
  }) => void
  onContainerDrop: (payload: { containerId: string; slotName?: string }) => void
  onContainerDragLeave: (payload: {
    containerId: string
    slotName?: string
  }) => void
}

export interface NucPageBuilderCanvasNodeProps {
  node: PageBuilderNodeInterface
  index: number
  parentId: string | null
  selectedNodeId: string | null
  draggedNodeId: string | null
  dropTarget: DropTargetInfo | null
  resolvedComponentTag: ResolvedComponentTagFn
  componentProps: ComponentPropsFn
  widgetDisplayName: NodeDisplayFn
  nodePreviewText: NodeDisplayFn
  listItems: ListItemsFn
  onNodeDragStart: (nodeId: string) => void
  onNodeDragEnd: () => void
  onSelectNode: (nodeId: string) => void
  onRemoveNode: (nodeId: string) => void
  onContainerDragOver: (payload: {
    containerId: string
    event: DragEvent
    slotName?: string
  }) => void
  onContainerDrop: (payload: { containerId: string; slotName?: string }) => void
  onContainerDragLeave: (payload: {
    containerId: string
    slotName?: string
  }) => void
}

export interface NucPageBuilderChildrenDropZoneProps {
  node: PageBuilderNodeInterface
  slotName?: string
  selectedNodeId: string | null
  draggedNodeId: string | null
  dropTarget: DropTargetInfo | null
  resolvedComponentTag: ResolvedComponentTagFn
  componentProps: ComponentPropsFn
  widgetDisplayName: NodeDisplayFn
  nodePreviewText: NodeDisplayFn
  listItems: ListItemsFn
  onNodeDragStart: (nodeId: string) => void
  onNodeDragEnd: () => void
  onSelectNode: (nodeId: string) => void
  onRemoveNode: (nodeId: string) => void
  onContainerDragOver: (payload: {
    containerId: string
    event: DragEvent
    slotName?: string
  }) => void
  onContainerDrop: (payload: { containerId: string; slotName?: string }) => void
  onContainerDragLeave: (payload: {
    containerId: string
    slotName?: string
  }) => void
}

export interface NucPageBuilderInspectorProps {
  inspectorTab: 'widget' | 'props' | 'page' | 'styles'
  pageStyleLang: 'css' | 'scss'
  pageCustomStyles: string
  layout: PageBuilderLayoutInterface
  lang: string
  selectedPageSlug: string | null
  formSlug: string
  selectedNode: PageBuilderNodeInterface | null
  selectedNodeIsContainer: boolean
  hasTextProp: boolean
  activeComponentSchema: PropFieldSchema[]
  containerPropsSchema: PropFieldSchema[]
  nativeStyleSchema: PropFieldSchema[]
  getComponentProp: (key: string) => unknown
  componentPropsJson: string
  componentJsonError: string | null
  onInspectorTabChange: (value: 'widget' | 'props' | 'page' | 'styles') => void
  onPageStyleLangChange: (value: 'css' | 'scss') => void
  onSettingChange: (key: string, value: unknown) => void
  onNodePropChange: (key: string, value: unknown) => void
  onNodeStyleChange: (key: string, value: string) => void
  onCustomStylesInput: (value: string) => void
  onSetComponentProp: (key: string, value: unknown) => void
  onSetComponentPropJson: (key: string, value: string) => void
  onComponentPropsJsonInput: (value: string) => void
  onSetRowColumns: (count: number) => void
}

export interface NucPageBuilderDialogsProps {
  confirmDeleteNodeId: string | null
  confirmDeleteNodeName: string
  confirmDeletePageId: number | null
  confirmDeletePageName: string
  onCloseNodeDialog: () => void
  onConfirmRemoveNode: () => void
  onClosePageDialog: () => void
  onConfirmDeletePage: () => void
}

export interface NucPageBuilderRenderNodeProps {
  node: PageBuilderNodeInterface
  resolveComponentTag: ResolvedComponentTagFn
  componentProps: ComponentPropsFn
}

export interface NucPageBuilderRenderProps {
  layout: PageBuilderLayoutInterface | null
}
