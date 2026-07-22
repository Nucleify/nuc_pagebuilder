'use client'

import { useParams } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'

import {
  createPageBuilderPage,
  deletePageBuilderPage,
  fetchPageBuilderPages,
  fetchPageBuilderPreferences,
  loadPageBuilderPage,
  publishPageBuilderPage,
  savePageBuilderDraft,
  savePageBuilderPreferences,
} from './api'

import { COMPONENT_PROPS_SCHEMA } from '../config/component_props_schema'
import { AD_TYPE_OPTIONS } from '../config/editor'
import {
  CONTAINER_PROPS_SCHEMA,
  NATIVE_WIDGET_STYLE_SCHEMA,
} from '../config/style_schema'
import { PAGE_BUILDER_WIDGETS } from '../config/widget_registry'
import type {
  DropTargetInfo,
  PageBuilderLayoutInterface,
  PageBuilderNodeInterface,
  PageBuilderPageInterface,
  WidgetGroup,
} from '../types/interfaces'
import type {
  PageBuilderSaveState,
  PageBuilderWidgetSourceFilter,
} from '../types/variables'
import {
  buildLocalAtomicComponentsReact,
  extractPropsSchemaReact,
  mergeSchemas,
  resolveComponentTagReact,
} from '../utils/components.react'
import {
  getComponentProps,
  listItems,
  nodePreviewText,
  toPascalCase,
  widgetDisplayName,
} from '../utils/components_shared'
import {
  createLayout,
  createNode,
  findNodeById,
  findParentOfNode,
  getSlotChildren,
  insertAtSlotIndex,
  nodeAcceptsChildren,
  removeNodeById,
  setRowColumns,
} from '../utils/layout'
import { buildGroupedWidgets } from '../utils/widgets'

const MAX_UNDO = 50

export function usePagebuilderEditor() {
  const params = useParams()
  const lang = useMemo(() => String(params?.lang ?? 'en'), [params?.lang])
  const baseUrl = '/page-builder'

  const localAtomicComponents = useMemo(
    () => buildLocalAtomicComponentsReact(),
    []
  )

  const layoutRef = useRef<PageBuilderLayoutInterface>(createLayout())
  const [layoutVersion, bumpLayout] = useReducer((n: number) => n + 1, 0)

  const [pages, setPages] = useState<PageBuilderPageInterface[]>([])
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null)
  const [selectedPageSlug, setSelectedPageSlug] = useState<string | null>(null)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTargetInfo | null>(null)
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [confirmDeleteNodeId, setConfirmDeleteNodeId] = useState<string | null>(
    null
  )
  const [confirmDeletePageId, setConfirmDeletePageId] = useState<number | null>(
    null
  )
  const [widgetSearch, setWidgetSearch] = useState('')
  const [activeWidgetSource, setActiveWidgetSource] =
    useState<PageBuilderWidgetSourceFilter>('all')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () =>
      new Set([
        'Native',
        'Atom',
        'Molecule',
        'Organism',
        'Templates',
        'Sections',
      ])
  )
  const [saveState, setSaveState] = useState<PageBuilderSaveState>('idle')
  const [componentJsonError, setComponentJsonError] = useState<string | null>(
    null
  )
  const [componentPropsJsonDraft, setComponentPropsJsonDraft] = useState('{}')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [dirtySinceLastSave, setDirtySinceLastSave] = useState(false)
  const suppressAutosave = useRef(false)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [autosaveEnabled, setAutosaveEnabled] = useState(true)
  const [pageStyleLang, setPageStyleLang] = useState<'css' | 'scss'>('css')
  const [pageCustomStyles, setPageCustomStyles] = useState('')
  const [inspectorTab, setInspectorTab] = useState<
    'widget' | 'props' | 'page' | 'styles'
  >('widget')
  const undoStack = useRef<string[]>([])
  const redoStack = useRef<string[]>([])

  const [form, setForm] = useState({ title: '', slug: '' })

  const layout = layoutRef.current

  const notifyLayoutChange = useCallback(() => {
    bumpLayout()
  }, [])

  const selectedNode = useMemo<PageBuilderNodeInterface | null>(() => {
    if (!selectedNodeId) return null
    return findNodeById(layoutRef.current.children, selectedNodeId)
  }, [selectedNodeId, layoutVersion])

  const widgetSources = useMemo<PageBuilderWidgetSourceFilter[]>(
    () => ['all', 'native', 'atomic', 'templates', 'sections'],
    []
  )

  const filteredWidgets = useMemo(() => {
    const query = widgetSearch.trim().toLowerCase()
    return PAGE_BUILDER_WIDGETS.filter((widget) => {
      const sourceMatch =
        activeWidgetSource === 'all' || widget.source === activeWidgetSource
      const textMatch =
        query.length === 0 ||
        widget.label.toLowerCase().includes(query) ||
        widget.key.toLowerCase().includes(query)
      return sourceMatch && textMatch
    })
  }, [widgetSearch, activeWidgetSource])

  const groupedWidgets = useMemo<WidgetGroup[]>(
    () => buildGroupedWidgets(filteredWidgets),
    [filteredWidgets]
  )

  const toggleGroup = useCallback((key: string): void => {
    setCollapsedGroups((prev) => {
      const s = new Set(prev)
      if (s.has(key)) s.delete(key)
      else s.add(key)
      return s
    })
  }, [])

  const saveLabel = useMemo(() => {
    if (saveState === 'saving') return 'Saving...'
    if (saveState === 'saved') return 'Saved'
    if (saveState === 'error') return 'Autosave error'
    return dirtySinceLastSave ? 'Unsaved changes' : 'Ready'
  }, [saveState, dirtySinceLastSave])

  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) return ''
    return lastSavedAt.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [lastSavedAt])

  const hasTextProp = useMemo(() => {
    const type = selectedNode?.widgetType
    return (
      type === 'heading' ||
      type === 'text' ||
      type === 'button' ||
      type === 'quote'
    )
  }, [selectedNode, layoutVersion])

  const selectedNodeIsContainer = useMemo(() => {
    if (!selectedNode) return false
    return nodeAcceptsChildren(selectedNode)
  }, [selectedNode, layoutVersion])

  const componentPropsJson = useMemo(() => {
    if (!selectedNode || selectedNode.widgetType !== 'component') {
      return '{}'
    }
    const cProps = selectedNode.props.componentProps
    try {
      return JSON.stringify(cProps ?? {}, null, 2)
    } catch {
      return '{}'
    }
  }, [selectedNode, layoutVersion])

  // Keep an editable draft so the textarea doesn't "fight" the user while typing
  // (intermediate JSON is often invalid during edits).
  useEffect(() => {
    setComponentPropsJsonDraft(componentPropsJson)
    setComponentJsonError(null)
  }, [componentPropsJson, selectedNodeId])

  const activeComponentSchema = useMemo(() => {
    if (!selectedNode || selectedNode.widgetType !== 'component') {
      return []
    }
    const tag = String(selectedNode.props.componentTag ?? '').trim()
    const manualSchema = COMPONENT_PROPS_SCHEMA[tag] ?? []

    const component =
      localAtomicComponents[tag] ?? localAtomicComponents[toPascalCase(tag)]
    if (!component) return manualSchema

    const autoSchema = extractPropsSchemaReact()
    const merged = mergeSchemas(autoSchema, manualSchema)
    return merged.map((field) =>
      field.key === 'nuiType'
        ? {
            ...field,
            type: 'select' as const,
            label: 'Ad Type',
            options: [...AD_TYPE_OPTIONS],
          }
        : field
    )
  }, [selectedNode, localAtomicComponents])

  const containerPropsSchema = CONTAINER_PROPS_SCHEMA
  const nativeStyleSchema = NATIVE_WIDGET_STYLE_SCHEMA

  const getComponentProp = useCallback(
    (key: string): unknown => {
      if (!selectedNode) return undefined
      const props = selectedNode.props.componentProps
      if (props && typeof props === 'object') {
        return (props as Record<string, unknown>)[key]
      }
      return undefined
    },
    [selectedNode, layoutVersion]
  )

  const setComponentProp = useCallback(
    (key: string, value: unknown): void => {
      if (!selectedNode) return
      let props = selectedNode.props.componentProps
      if (!props || typeof props !== 'object') props = {}
      ;(props as Record<string, unknown>)[key] = value
      selectedNode.props.componentProps = props
      setDirtySinceLastSave(true)
      notifyLayoutChange()
    },
    [selectedNode, notifyLayoutChange]
  )

  const setComponentPropJson = useCallback(
    (key: string, raw: string): void => {
      try {
        const parsed = JSON.parse(raw)
        setComponentProp(key, parsed)
        setComponentJsonError(null)
      } catch {
        setComponentJsonError(`Invalid JSON for "${key}"`)
      }
    },
    [setComponentProp]
  )

  useEffect(() => {
    if (!form.slug && form.title) {
      setForm((prev) => ({
        ...prev,
        slug: form.title.toLowerCase().trim().replace(/\s+/g, '-'),
      }))
    }
  }, [form.title, form.slug])

  const loadUserPreferences = useCallback(async (): Promise<void> => {
    const prefs = await fetchPageBuilderPreferences(baseUrl)
    if (prefs) {
      setAutosaveEnabled(prefs.autosave !== false)
    }
  }, [])

  const saveUserPreferences = useCallback(async (): Promise<void> => {
    await savePageBuilderPreferences(baseUrl, autosaveEnabled)
  }, [autosaveEnabled])

  useEffect(() => {
    saveUserPreferences()
  }, [autosaveEnabled, saveUserPreferences])

  const fetchPages = useCallback(async (): Promise<void> => {
    setPages(await fetchPageBuilderPages(baseUrl))
  }, [])

  const replaceLayout = useCallback(
    (nextLayout: PageBuilderLayoutInterface): void => {
      layoutRef.current = {
        ...nextLayout,
        children: nextLayout.children ?? [],
        settings: { ...nextLayout.settings },
      }
      setSelectedNodeId(null)
      setPageCustomStyles(String(layoutRef.current.settings.customStyles ?? ''))
      setPageStyleLang(
        layoutRef.current.settings.styleLang === 'scss' ? 'scss' : 'css'
      )
      notifyLayoutChange()
    },
    [notifyLayoutChange]
  )

  const loadPage = useCallback(
    async (id: number): Promise<void> => {
      const page = await loadPageBuilderPage(baseUrl, id)
      if (!page) return

      suppressAutosave.current = true
      setSelectedPageId(page.id)
      setSelectedPageSlug(page.slug)
      setForm({ title: page.title, slug: page.slug })

      const pageVersions = Array.isArray(page.versions)
        ? page.versions
        : ((
            page as {
              versions?: { data?: PageBuilderPageInterface['versions'] }
            }
          ).versions?.data ?? [])

      const selectedLayout =
        pageVersions?.[0]?.layout_json ?? page.published_version?.layout_json
      replaceLayout(selectedLayout ?? createLayout())
      setDirtySinceLastSave(false)
      setSaveState('idle')
      setTimeout(() => {
        suppressAutosave.current = false
      }, 0)
    },
    [replaceLayout]
  )

  const createPage = useCallback(async (): Promise<void> => {
    const nextTitle = form.title || `New page ${pages.length + 1}`
    const page = await createPageBuilderPage(baseUrl, {
      title: nextTitle,
      slug: form.slug || nextTitle.toLowerCase().replace(/\s+/g, '-'),
    })
    if (!page) {
      await fetchPages()
      return
    }

    await fetchPages()
    await loadPage(page.id)
  }, [form.title, form.slug, pages.length, fetchPages, loadPage])

  const saveDraft = useCallback(async (): Promise<void> => {
    if (!selectedPageId) return
    setSaveState('saving')
    try {
      await savePageBuilderDraft(baseUrl, selectedPageId, layoutRef.current)
      setDirtySinceLastSave(false)
      setLastSavedAt(new Date())
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }, [selectedPageId])

  const publishPage = useCallback(async (): Promise<void> => {
    if (!selectedPageId) return
    await saveDraft()
    await publishPageBuilderPage(baseUrl, selectedPageId, {
      title: form.title,
      slug: form.slug,
      meta_json: {
        metaTitle: layoutRef.current.settings.metaTitle ?? '',
        metaDescription: layoutRef.current.settings.metaDescription ?? '',
        ogImage: layoutRef.current.settings.ogImage ?? '',
      },
    })
    setSelectedPageSlug(form.slug)
    await fetchPages()
  }, [selectedPageId, saveDraft, form.title, form.slug, fetchPages])

  const onWidgetDragStart = useCallback((widgetKey: string): void => {
    setDraggedWidget(widgetKey)
    setDraggedNodeId(null)
    setDropTarget(null)
  }, [])

  const stopAutoScroll = useCallback((): void => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current)
      autoScrollTimer.current = null
    }
  }, [])

  const startAutoScroll = useCallback(
    (speed: number): void => {
      stopAutoScroll()
      autoScrollTimer.current = setInterval(() => {
        window.scrollBy({ top: speed })
      }, 16)
    },
    [stopAutoScroll]
  )

  const resetDragState = useCallback((): void => {
    setDraggedNodeId(null)
    setDropTarget(null)
  }, [])

  const pushUndo = useCallback((): void => {
    undoStack.current.push(
      JSON.stringify({
        children: layoutRef.current.children,
        settings: layoutRef.current.settings,
      })
    )
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift()
    redoStack.current = []
  }, [])

  const insertWidgetAtTarget = useCallback(
    (widgetKey: string, target: DropTargetInfo): void => {
      pushUndo()
      const node = createNode(widgetKey)
      const currentLayout = layoutRef.current

      if (!target.parentId) {
        currentLayout.children.splice(target.index, 0, node)
      } else {
        const parent = findNodeById(currentLayout.children, target.parentId)
        if (parent) {
          if (target.slotName) {
            insertAtSlotIndex(
              parent.children,
              target.slotName,
              target.index,
              node
            )
          } else {
            parent.children.splice(target.index, 0, node)
          }
        }
      }

      setSelectedNodeId(node.id)
      setDirtySinceLastSave(true)
      notifyLayoutChange()
    },
    [pushUndo, notifyLayoutChange]
  )

  const moveNodeToTarget = useCallback(
    (nodeId: string, target: DropTargetInfo): void => {
      const result = findParentOfNode(layoutRef.current.children, nodeId)
      if (!result) return

      pushUndo()
      const [movedNode] = result.parent.splice(result.index, 1)
      if (!movedNode) return

      if (!target.parentId) {
        const isSameParent = result.parent === layoutRef.current.children
        let adjustedIndex = target.index
        if (isSameParent && result.index < target.index) {
          adjustedIndex = Math.max(0, target.index - 1)
        }
        layoutRef.current.children.splice(adjustedIndex, 0, movedNode)
      } else {
        const parent = findNodeById(layoutRef.current.children, target.parentId)
        if (parent) {
          if (target.slotName) {
            insertAtSlotIndex(
              parent.children,
              target.slotName,
              target.index,
              movedNode
            )
          } else {
            const isSameParent = parent.children === result.parent
            let adjustedIndex = target.index
            if (isSameParent && result.index < target.index) {
              adjustedIndex = Math.max(0, target.index - 1)
            }
            parent.children.splice(adjustedIndex, 0, movedNode)
          }
        }
      }

      setSelectedNodeId(movedNode.id)
      setDirtySinceLastSave(true)
      notifyLayoutChange()
    },
    [pushUndo, notifyLayoutChange]
  )

  const onCanvasDragOver = useCallback(
    (event: DragEvent, canvas: HTMLElement | null): void => {
      if (!canvas) return
      const canvasRect = canvas.getBoundingClientRect()
      const edgeZone = 60
      const mouseY = event.clientY

      if (mouseY < canvasRect.top + edgeZone) {
        const intensity = 1 - (mouseY - canvasRect.top) / edgeZone
        startAutoScroll(-Math.max(8, intensity * 28))
      } else if (mouseY > canvasRect.bottom - edgeZone) {
        const intensity = 1 - (canvasRect.bottom - mouseY) / edgeZone
        startAutoScroll(Math.max(8, intensity * 28))
      } else {
        stopAutoScroll()
      }

      // NOTE: In React we wrap each node with an extra <div key={...}>.
      // Do not rely on direct-child selectors here.
      const nodeEls = canvas.querySelectorAll<HTMLElement>(
        '[data-node-index][data-parent-id="root"]'
      )
      let targetIndex = layoutRef.current.children.length

      for (let i = 0; i < nodeEls.length; i++) {
        const el = nodeEls[i]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        const idx = Number(el.dataset.nodeIndex)
        if (mouseY < midY) {
          targetIndex = idx
          break
        }
      }

      setDropTarget({ parentId: null, index: targetIndex })
    },
    [startAutoScroll, stopAutoScroll]
  )

  const onCanvasDragLeave = useCallback((): void => {
    setDropTarget((prev) => (prev?.parentId === null ? null : prev))
    stopAutoScroll()
  }, [stopAutoScroll])

  const onCanvasDrop = useCallback((): void => {
    stopAutoScroll()
    const target = dropTarget ?? {
      parentId: null,
      index: layoutRef.current.children.length,
    }

    if (draggedNodeId) {
      moveNodeToTarget(draggedNodeId, target)
      resetDragState()
      return
    }

    if (draggedWidget) {
      insertWidgetAtTarget(draggedWidget, target)
      setDraggedWidget(null)
      setDropTarget(null)
    }
  }, [
    stopAutoScroll,
    dropTarget,
    draggedNodeId,
    draggedWidget,
    moveNodeToTarget,
    resetDragState,
    insertWidgetAtTarget,
  ])

  const onContainerDragOver = useCallback(
    (payload: {
      containerId: string
      event: DragEvent
      slotName?: string
    }): void => {
      const container = findNodeById(
        layoutRef.current.children,
        payload.containerId
      )
      if (!container) return

      const slotSelector = payload.slotName
        ? `[data-container-id="${payload.containerId}"][data-slot-name="${payload.slotName}"]`
        : `[data-container-id="${payload.containerId}"]`
      const containerEl = document.querySelector(
        slotSelector
      ) as HTMLElement | null

      const slotChildren = payload.slotName
        ? getSlotChildren(container, payload.slotName)
        : container.children

      if (!containerEl) {
        setDropTarget({
          parentId: payload.containerId,
          index: slotChildren.length,
          slotName: payload.slotName,
        })
        return
      }

      // NOTE: In React each child is wrapped with an extra <div>.
      // Target only *direct* children of this container by matching parent-id.
      const nodeEls = containerEl.querySelectorAll<HTMLElement>(
        `[data-node-id][data-parent-id="${payload.containerId}"]`
      )
      const mouseY = payload.event.clientY
      let targetIndex = slotChildren.length

      for (let i = 0; i < nodeEls.length; i++) {
        const el = nodeEls[i]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        const idx = Number(el.dataset.nodeIndex)
        if (mouseY < midY) {
          targetIndex = Number.isFinite(idx) ? idx : i
          break
        }
      }

      setDropTarget({
        parentId: payload.containerId,
        index: targetIndex,
        slotName: payload.slotName,
      })
    },
    []
  )

  const onContainerDrop = useCallback(
    (payload: { containerId: string; slotName?: string }): void => {
      const target = dropTarget ?? {
        parentId: payload.containerId,
        index: 0,
        slotName: payload.slotName,
      }

      if (draggedNodeId) {
        moveNodeToTarget(draggedNodeId, target)
        resetDragState()
        return
      }

      if (draggedWidget) {
        insertWidgetAtTarget(draggedWidget, target)
        setDraggedWidget(null)
        setDropTarget(null)
      }
    },
    [
      dropTarget,
      draggedNodeId,
      draggedWidget,
      moveNodeToTarget,
      resetDragState,
      insertWidgetAtTarget,
    ]
  )

  const onContainerDragLeave = useCallback(
    (payload: { containerId: string; slotName?: string }): void => {
      setDropTarget((prev) => {
        if (
          prev?.parentId === payload.containerId &&
          prev?.slotName === payload.slotName
        ) {
          return null
        }
        return prev
      })
    },
    []
  )

  const addWidget = useCallback(
    (widgetKey: string): void => {
      insertWidgetAtTarget(widgetKey, {
        parentId: null,
        index: layoutRef.current.children.length,
      })
    },
    [insertWidgetAtTarget]
  )

  const selectNode = useCallback((nodeId: string): void => {
    setSelectedNodeId(nodeId)
  }, [])

  const onNodeDragStart = useCallback((nodeId: string): void => {
    setDraggedNodeId(nodeId)
    setDropTarget(null)
    setDraggedWidget(null)
  }, [])

  const onNodeDragEnd = useCallback((): void => {
    stopAutoScroll()
    resetDragState()
  }, [stopAutoScroll, resetDragState])

  const onNodePropChange = useCallback(
    (key: string, value: unknown): void => {
      if (!selectedNode) return
      selectedNode.props[key] = value
      setDirtySinceLastSave(true)
      notifyLayoutChange()
    },
    [selectedNode, notifyLayoutChange]
  )

  const onNodeStyleChange = useCallback(
    (key: string, value: string): void => {
      if (!selectedNode) return
      if (value) {
        selectedNode.styles[key] = value
      } else {
        delete selectedNode.styles[key]
      }
      setDirtySinceLastSave(true)
      notifyLayoutChange()
    },
    [selectedNode, notifyLayoutChange]
  )

  const onComponentPropsJsonInput = useCallback(
    (value: string): void => {
      setComponentPropsJsonDraft(value)
      if (!selectedNode || selectedNode.widgetType !== 'component') {
        return
      }
      try {
        const parsed = JSON.parse(value)
        selectedNode.props.componentProps =
          parsed && typeof parsed === 'object' ? parsed : {}
        setComponentJsonError(null)
        setDirtySinceLastSave(true)
        notifyLayoutChange()
      } catch {
        setComponentJsonError('Invalid JSON format.')
      }
    },
    [selectedNode, notifyLayoutChange]
  )

  const onCustomStylesInput = useCallback(
    (value: string): void => {
      setPageCustomStyles(value)
      layoutRef.current.settings.customStyles = value
      layoutRef.current.settings.styleLang = pageStyleLang
      setDirtySinceLastSave(true)
      notifyLayoutChange()
    },
    [pageStyleLang, notifyLayoutChange]
  )

  const onSettingChange = useCallback(
    (key: string, value: unknown): void => {
      layoutRef.current.settings[key] = value
      setDirtySinceLastSave(true)
      notifyLayoutChange()
    },
    [notifyLayoutChange]
  )

  useEffect(() => {
    layoutRef.current.settings.styleLang = pageStyleLang
    setDirtySinceLastSave(true)
  }, [pageStyleLang])

  const undo = useCallback((): void => {
    const snapshot = undoStack.current.pop()
    if (!snapshot) return
    redoStack.current.push(
      JSON.stringify({
        children: layoutRef.current.children,
        settings: layoutRef.current.settings,
      })
    )
    const parsed = JSON.parse(snapshot)
    layoutRef.current.children = parsed.children ?? []
    layoutRef.current.settings = parsed.settings ?? {}
    setPageCustomStyles(String(layoutRef.current.settings.customStyles ?? ''))
    setPageStyleLang(
      layoutRef.current.settings.styleLang === 'scss' ? 'scss' : 'css'
    )
    setDirtySinceLastSave(true)
    notifyLayoutChange()
  }, [notifyLayoutChange])

  const redo = useCallback((): void => {
    const snapshot = redoStack.current.pop()
    if (!snapshot) return
    undoStack.current.push(
      JSON.stringify({
        children: layoutRef.current.children,
        settings: layoutRef.current.settings,
      })
    )
    const parsed = JSON.parse(snapshot)
    layoutRef.current.children = parsed.children ?? []
    layoutRef.current.settings = parsed.settings ?? {}
    setPageCustomStyles(String(layoutRef.current.settings.customStyles ?? ''))
    setPageStyleLang(
      layoutRef.current.settings.styleLang === 'scss' ? 'scss' : 'css'
    )
    setDirtySinceLastSave(true)
    notifyLayoutChange()
  }, [notifyLayoutChange])

  const resolvedComponentTag = useCallback(
    (node: PageBuilderNodeInterface) => {
      return resolveComponentTagReact(node, localAtomicComponents, {})
    },
    [localAtomicComponents]
  )

  const componentProps = useCallback(
    (node: PageBuilderNodeInterface): Record<string, unknown> => {
      return getComponentProps(node)
    },
    []
  )

  const nodeWidgetDisplayName = useCallback(
    (node: PageBuilderNodeInterface): string => {
      return widgetDisplayName(node, PAGE_BUILDER_WIDGETS)
    },
    []
  )

  const removeNode = useCallback((nodeId: string): void => {
    setConfirmDeleteNodeId(nodeId)
  }, [])

  const confirmDeleteNodeName = useMemo(() => {
    if (!confirmDeleteNodeId) return ''
    const node = findNodeById(layoutRef.current.children, confirmDeleteNodeId)
    return node ? nodeWidgetDisplayName(node) : ''
  }, [confirmDeleteNodeId, layoutVersion, nodeWidgetDisplayName])

  const confirmRemoveNode = useCallback((): void => {
    const nodeId = confirmDeleteNodeId
    setConfirmDeleteNodeId(null)
    if (!nodeId) return

    pushUndo()
    removeNodeById(layoutRef.current.children, nodeId)
    if (selectedNodeId === nodeId) setSelectedNodeId(null)
    setDirtySinceLastSave(true)
    notifyLayoutChange()
  }, [confirmDeleteNodeId, selectedNodeId, pushUndo, notifyLayoutChange])

  const confirmDeletePageName = useMemo(() => {
    if (!confirmDeletePageId) return ''
    const page = pages.find((p) => p.id === confirmDeletePageId)
    return page?.title ?? ''
  }, [confirmDeletePageId, pages])

  const confirmDeletePage = useCallback(async (): Promise<void> => {
    const pageId = confirmDeletePageId
    setConfirmDeletePageId(null)
    if (!pageId) return

    try {
      await deletePageBuilderPage(baseUrl, pageId)
    } catch {
      // silent
    }

    if (selectedPageId === pageId) {
      setSelectedPageId(null)
      setSelectedPageSlug(null)
      setSelectedNodeId(null)
      replaceLayout(createLayout())
      setForm({ title: '', slug: '' })
    }

    await fetchPages()
  }, [confirmDeletePageId, selectedPageId, replaceLayout, fetchPages])

  const scheduleAutosave = useCallback((): void => {
    if (!selectedPageId || suppressAutosave.current || !autosaveEnabled) {
      return
    }
    setDirtySinceLastSave(true)
    setSaveState('idle')
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(async () => {
      await saveDraft()
    }, 1100)
  }, [selectedPageId, autosaveEnabled, saveDraft])

  const onSetRowColumns = useCallback(
    (count: number): void => {
      if (!selectedNode || selectedNode.widgetType !== 'row') return
      pushUndo()
      setRowColumns(selectedNode, count)
      setDirtySinceLastSave(true)
      notifyLayoutChange()
    },
    [selectedNode, pushUndo, notifyLayoutChange]
  )

  const onKeyboardShortcut = useCallback(
    (event: KeyboardEvent): void => {
      const mod = event.ctrlKey || event.metaKey
      if (!mod) return
      const key = event.key.toLowerCase()
      if (key === 's') {
        event.preventDefault()
        void saveDraft()
      } else if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if (key === 'z' && event.shiftKey) {
        event.preventDefault()
        redo()
      } else if (key === 'y') {
        event.preventDefault()
        redo()
      }
    },
    [saveDraft, undo, redo]
  )

  useEffect(() => {
    void fetchPages()
    void loadUserPreferences()
    window.addEventListener('keydown', onKeyboardShortcut)
    return () => {
      window.removeEventListener('keydown', onKeyboardShortcut)
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      stopAutoScroll()
    }
  }, [fetchPages, loadUserPreferences, onKeyboardShortcut, stopAutoScroll])

  useEffect(() => {
    scheduleAutosave()
  }, [form.title, form.slug, layout.children, scheduleAutosave])

  return {
    activeComponentSchema,
    activeWidgetSource,
    addWidget,
    autosaveEnabled,
    collapsedGroups,
    componentJsonError,
    componentProps,
    componentPropsJson: componentPropsJsonDraft,
    confirmDeleteNodeId,
    confirmDeleteNodeName,
    confirmDeletePage,
    confirmDeletePageId,
    confirmDeletePageName,
    confirmRemoveNode,
    containerPropsSchema,
    createPage,
    draggedNodeId,
    dropTarget,
    filteredWidgets,
    form,
    getComponentProp,
    groupedWidgets,
    hasTextProp,
    inspectorTab,
    lang,
    lastSavedLabel,
    layout,
    listItems,
    loadPage,
    nativeStyleSchema,
    nodePreviewText,
    nodeWidgetDisplayName,
    onCanvasDragLeave,
    onCanvasDragOver,
    onCanvasDrop,
    onComponentPropsJsonInput,
    onContainerDragLeave,
    onContainerDragOver,
    onContainerDrop,
    onCustomStylesInput,
    onNodeDragEnd,
    onNodeDragStart,
    onNodePropChange,
    onNodeStyleChange,
    onSetRowColumns,
    onSettingChange,
    onWidgetDragStart,
    pageCustomStyles,
    pageStyleLang,
    pages,
    publishPage,
    redo,
    removeNode,
    resolvedComponentTag,
    saveDraft,
    saveLabel,
    saveState,
    selectNode,
    selectedNode,
    selectedNodeId,
    selectedNodeIsContainer,
    selectedPageId,
    selectedPageSlug,
    setActiveWidgetSource,
    setAutosaveEnabled,
    setCollapsedGroups,
    setComponentProp,
    setComponentPropJson,
    setConfirmDeleteNodeId,
    setConfirmDeletePageId,
    setForm,
    setInspectorTab,
    setPageStyleLang,
    setWidgetSearch,
    toggleGroup,
    undo,
    widgetSearch,
    widgetSources,
  }
}
