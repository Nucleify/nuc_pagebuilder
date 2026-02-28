import {
  type Component,
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue'
import { useRoute } from 'vue-router'

import { apiRequest } from 'atomic'

import * as AtomicAtom from '../../../../../nuxt/atomic/atom'
import * as AtomicMolecule from '../../../../../nuxt/atomic/molecule'
import * as AtomicOrganism from '../../../../../nuxt/atomic/organism'
import { COMPONENT_PROPS_SCHEMA } from '../config/component_props_schema'
import { PAGE_BUILDER_WIDGETS } from '../constants'
import type {
  PageBuilderLayoutInterface,
  PageBuilderNodeInterface,
  PageBuilderPageInterface,
  PageBuilderSaveState,
  PageBuilderWidgetSourceFilter,
  WidgetGroup,
} from '../types'
import {
  buildLocalAtomicComponents,
  getComponentProps,
  listItems,
  nodePreviewText,
  resolveComponentTag,
  widgetDisplayName,
} from './components'
import { createLayout, createNode } from './layout'
import { buildGroupedWidgets } from './widgets'

export function usePagebuilderEditor() {
  const route = useRoute()
  const lang = computed(() => String(route.params.lang ?? 'en'))
  const baseUrl = computed(() => `${apiUrl()}/page-builder`)
  const instance = getCurrentInstance()
  const localAtomicComponents = buildLocalAtomicComponents({
    ...AtomicAtom,
    ...AtomicMolecule,
    ...AtomicOrganism,
  })

  const pages = ref<PageBuilderPageInterface[]>([])
  const selectedPageId = ref<number | null>(null)
  const selectedPageSlug = ref<string | null>(null)
  const draggedWidget = ref<string | null>(null)
  const draggedNodeId = ref<string | null>(null)
  const dropTargetIndex = ref<number | null>(null)
  const autoScrollTimer = ref<ReturnType<typeof setInterval> | null>(null)
  const selectedNodeId = ref<string | null>(null)
  const confirmDeleteNodeId = ref<string | null>(null)
  const confirmDeletePageId = ref<number | null>(null)
  const widgetSearch = ref('')
  const activeWidgetSource = ref<PageBuilderWidgetSourceFilter>('all')
  const collapsedGroups = ref<Set<string>>(
    new Set(['Native', 'Atom', 'Molecule', 'Organism', 'Templates', 'Sections'])
  )
  const saveState = ref<PageBuilderSaveState>('idle')
  const componentJsonError = ref<string | null>(null)
  const lastSavedAt = ref<Date | null>(null)
  const dirtySinceLastSave = ref(false)
  const suppressAutosave = ref(false)
  const autosaveTimer = ref<ReturnType<typeof setTimeout> | null>(null)
  const autosaveEnabled = ref(true)
  const layout = reactive<PageBuilderLayoutInterface>(createLayout())
  const pageStyleLang = ref<'css' | 'scss'>('css')
  const pageCustomStyles = ref('')
  const inspectorTab = ref<'widget' | 'page' | 'styles'>('widget')
  const undoStack = ref<string[]>([])
  const redoStack = ref<string[]>([])

  const form = reactive({
    title: '',
    slug: '',
  })

  const selectedNode = computed<PageBuilderNodeInterface | null>(() => {
    if (!selectedNodeId.value) {
      return null
    }
    return (
      layout.children.find((node) => node.id === selectedNodeId.value) ?? null
    )
  })

  const widgetSources = computed<PageBuilderWidgetSourceFilter[]>(() => [
    'all',
    'native',
    'atomic',
    'templates',
    'sections',
  ])

  const filteredWidgets = computed(() => {
    const query = widgetSearch.value.trim().toLowerCase()
    return PAGE_BUILDER_WIDGETS.filter((widget) => {
      const sourceMatch =
        activeWidgetSource.value === 'all' ||
        widget.source === activeWidgetSource.value
      const textMatch =
        query.length === 0 ||
        widget.label.toLowerCase().includes(query) ||
        widget.key.toLowerCase().includes(query)
      return sourceMatch && textMatch
    })
  })

  const groupedWidgets = computed<WidgetGroup[]>(() => {
    return buildGroupedWidgets(filteredWidgets.value)
  })

  function toggleGroup(key: string): void {
    const s = new Set(collapsedGroups.value)
    if (s.has(key)) s.delete(key)
    else s.add(key)
    collapsedGroups.value = s
  }

  const saveLabel = computed(() => {
    if (saveState.value === 'saving') return 'Saving...'
    if (saveState.value === 'saved') return 'Saved'
    if (saveState.value === 'error') return 'Autosave error'
    return dirtySinceLastSave.value ? 'Unsaved changes' : 'Ready'
  })

  const lastSavedLabel = computed(() => {
    if (!lastSavedAt.value) return ''
    return lastSavedAt.value.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  })

  const hasTextProp = computed(() => {
    const type = selectedNode.value?.widgetType
    return (
      type === 'heading' ||
      type === 'text' ||
      type === 'button' ||
      type === 'quote'
    )
  })

  const componentPropsJson = computed(() => {
    if (!selectedNode.value || selectedNode.value.widgetType !== 'component') {
      return '{}'
    }
    const componentProps = selectedNode.value.props.componentProps
    try {
      return JSON.stringify(componentProps ?? {}, null, 2)
    } catch {
      return '{}'
    }
  })

  const activeComponentSchema = computed(() => {
    if (!selectedNode.value || selectedNode.value.widgetType !== 'component') {
      return []
    }
    const tag = String(selectedNode.value.props.componentTag ?? '').trim()
    return COMPONENT_PROPS_SCHEMA[tag] ?? []
  })

  function getComponentProp(key: string): unknown {
    if (!selectedNode.value) return undefined
    const props = selectedNode.value.props.componentProps
    if (props && typeof props === 'object') {
      return (props as Record<string, unknown>)[key]
    }
    return undefined
  }

  function setComponentProp(key: string, value: unknown): void {
    if (!selectedNode.value) return
    let props = selectedNode.value.props.componentProps
    if (!props || typeof props !== 'object') props = {}
    ;(props as Record<string, unknown>)[key] = value
    selectedNode.value.props.componentProps = props
    dirtySinceLastSave.value = true
  }

  function setComponentPropJson(key: string, raw: string): void {
    try {
      const parsed = JSON.parse(raw)
      setComponentProp(key, parsed)
      componentJsonError.value = null
    } catch {
      componentJsonError.value = `Invalid JSON for "${key}"`
    }
  }

  watch(
    () => form.title,
    (value) => {
      if (!form.slug && value) {
        form.slug = value.toLowerCase().trim().replace(/\s+/g, '-')
      }
    }
  )

  onMounted(async () => {
    await fetchPages()
    await loadUserPreferences()
    window.addEventListener('keydown', onKeyboardShortcut)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyboardShortcut)
    if (autosaveTimer.value) clearTimeout(autosaveTimer.value)
    stopAutoScroll()
  })

  async function loadUserPreferences(): Promise<void> {
    try {
      const prefs = await apiRequest<Record<string, unknown>>(
        `${baseUrl.value}/preferences`
      )
      if (prefs && typeof prefs === 'object') {
        autosaveEnabled.value =
          (prefs as Record<string, unknown>).autosave !== false
      }
    } catch {
      // Ignore – default stays true
    }
  }

  async function saveUserPreferences(): Promise<void> {
    try {
      await apiRequest(`${baseUrl.value}/preferences`, 'PUT', {
        preferences: { autosave: autosaveEnabled.value },
      })
    } catch {
      // Silent fail
    }
  }

  watch(autosaveEnabled, () => {
    saveUserPreferences()
  })

  async function fetchPages(): Promise<void> {
    const response = await apiRequest<{ data: PageBuilderPageInterface[] }>(
      `${baseUrl.value}/pages`
    )
    pages.value = extractData<PageBuilderPageInterface[]>(response) ?? []
  }

  async function loadPage(id: number): Promise<void> {
    const response = await apiRequest<{ data: PageBuilderPageInterface }>(
      `${baseUrl.value}/pages/${id}`
    )
    const page = extractData<PageBuilderPageInterface>(response)
    if (!page) return

    suppressAutosave.value = true
    selectedPageId.value = page.id
    selectedPageSlug.value = page.slug
    form.title = page.title
    form.slug = page.slug

    const pageVersions = Array.isArray(page.versions)
      ? page.versions
      : ((
          page as { versions?: { data?: PageBuilderPageInterface['versions'] } }
        ).versions?.data ?? [])

    const selectedLayout =
      pageVersions?.[0]?.layout_json ?? page.published_version?.layout_json
    replaceLayout(selectedLayout ?? createLayout())
    dirtySinceLastSave.value = false
    saveState.value = 'idle'
    setTimeout(() => {
      suppressAutosave.value = false
    }, 0)
  }

  async function createPage(): Promise<void> {
    const nextTitle = form.title || `New page ${pages.value.length + 1}`
    const response = await apiRequest<{ page: PageBuilderPageInterface }>(
      `${baseUrl.value}/pages`,
      'POST',
      {
        title: nextTitle,
        slug: form.slug || nextTitle.toLowerCase().replace(/\s+/g, '-'),
      }
    )

    const page = extractData<PageBuilderPageInterface>(response)
    if (!page) {
      await fetchPages()
      return
    }

    await fetchPages()
    await loadPage(page.id)
  }

  async function saveDraft(): Promise<void> {
    if (!selectedPageId.value) return
    saveState.value = 'saving'
    try {
      await apiRequest(
        `${baseUrl.value}/pages/${selectedPageId.value}/draft`,
        'POST',
        {
          layout_json: layout,
        }
      )
      dirtySinceLastSave.value = false
      lastSavedAt.value = new Date()
      saveState.value = 'saved'
    } catch {
      saveState.value = 'error'
    }
  }

  async function publishPage(): Promise<void> {
    if (!selectedPageId.value) return
    await saveDraft()
    await apiRequest(
      `${baseUrl.value}/pages/${selectedPageId.value}/publish`,
      'POST'
    )
    await apiRequest(`${baseUrl.value}/pages/${selectedPageId.value}`, 'PUT', {
      title: form.title,
      slug: form.slug,
      status: 'published',
      meta_json: {
        metaTitle: layout.settings.metaTitle ?? '',
        metaDescription: layout.settings.metaDescription ?? '',
        ogImage: layout.settings.ogImage ?? '',
      },
    })
    selectedPageSlug.value = form.slug
    await fetchPages()
  }

  function onWidgetDragStart(widgetKey: string): void {
    draggedWidget.value = widgetKey
    draggedNodeId.value = null
    dropTargetIndex.value = null
  }

  function onCanvasDragOver(
    event: DragEvent,
    canvas: HTMLElement | null
  ): void {
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

    const nodeEls = canvas.querySelectorAll<HTMLElement>('[data-node-index]')
    let targetIndex = layout.children.length

    for (let index = 0; index < nodeEls.length; index++) {
      const el = nodeEls[index]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      const idx = Number(el.dataset.nodeIndex)
      if (mouseY < midY) {
        targetIndex = idx
        break
      }
    }
    dropTargetIndex.value = targetIndex
  }

  function onCanvasDragLeave(): void {
    dropTargetIndex.value = null
    stopAutoScroll()
  }

  function onCanvasDrop(): void {
    stopAutoScroll()
    const target = dropTargetIndex.value ?? layout.children.length
    if (draggedNodeId.value) {
      moveDraggedNodeToIndex(target)
      resetNodeDragState()
      return
    }
    if (draggedWidget.value) {
      insertWidgetAt(draggedWidget.value, target)
      draggedWidget.value = null
      dropTargetIndex.value = null
    }
  }

  function startAutoScroll(speed: number): void {
    stopAutoScroll()
    autoScrollTimer.value = setInterval(() => {
      window.scrollBy({ top: speed })
    }, 16)
  }

  function stopAutoScroll(): void {
    if (autoScrollTimer.value) {
      clearInterval(autoScrollTimer.value)
      autoScrollTimer.value = null
    }
  }

  function addWidget(widgetKey: string): void {
    insertWidgetAt(widgetKey, layout.children.length)
  }

  function insertWidgetAt(widgetKey: string, index: number): void {
    pushUndo()
    const node = createNode(widgetKey)
    layout.children.splice(index, 0, node)
    selectedNodeId.value = node.id
  }

  function selectNode(nodeId: string): void {
    selectedNodeId.value = nodeId
  }

  function onNodeDragStart(nodeId: string): void {
    draggedNodeId.value = nodeId
    dropTargetIndex.value = null
    draggedWidget.value = null
  }

  function onNodeDragEnd(): void {
    stopAutoScroll()
    resetNodeDragState()
  }

  function onNodePropChange(key: string, value: unknown): void {
    if (!selectedNode.value) return
    selectedNode.value.props[key] = value
    dirtySinceLastSave.value = true
  }

  function onComponentPropsJsonInput(value: string): void {
    if (!selectedNode.value || selectedNode.value.widgetType !== 'component') {
      return
    }
    try {
      const parsed = JSON.parse(value)
      selectedNode.value.props.componentProps =
        parsed && typeof parsed === 'object' ? parsed : {}
      componentJsonError.value = null
    } catch {
      componentJsonError.value = 'Invalid JSON format.'
    }
  }

  function onCustomStylesInput(value: string): void {
    pageCustomStyles.value = value
    layout.settings.customStyles = value
    layout.settings.styleLang = pageStyleLang.value
    dirtySinceLastSave.value = true
  }

  function onSettingChange(key: string, value: unknown): void {
    layout.settings[key] = value
    dirtySinceLastSave.value = true
  }

  watch(pageStyleLang, (langValue) => {
    layout.settings.styleLang = langValue
    dirtySinceLastSave.value = true
  })

  const MAX_UNDO = 50

  function pushUndo(): void {
    undoStack.value.push(
      JSON.stringify({ children: layout.children, settings: layout.settings })
    )
    if (undoStack.value.length > MAX_UNDO) undoStack.value.shift()
    redoStack.value = []
  }

  function undo(): void {
    const snapshot = undoStack.value.pop()
    if (!snapshot) return
    redoStack.value.push(
      JSON.stringify({ children: layout.children, settings: layout.settings })
    )
    const parsed = JSON.parse(snapshot)
    layout.children = parsed.children ?? []
    layout.settings = parsed.settings ?? {}
    pageCustomStyles.value = String(layout.settings.customStyles ?? '')
    pageStyleLang.value = layout.settings.styleLang === 'scss' ? 'scss' : 'css'
    dirtySinceLastSave.value = true
  }

  function redo(): void {
    const snapshot = redoStack.value.pop()
    if (!snapshot) return
    undoStack.value.push(
      JSON.stringify({ children: layout.children, settings: layout.settings })
    )
    const parsed = JSON.parse(snapshot)
    layout.children = parsed.children ?? []
    layout.settings = parsed.settings ?? {}
    pageCustomStyles.value = String(layout.settings.customStyles ?? '')
    pageStyleLang.value = layout.settings.styleLang === 'scss' ? 'scss' : 'css'
    dirtySinceLastSave.value = true
  }

  function resolvedComponentTag(
    node: PageBuilderNodeInterface
  ): string | Component {
    return resolveComponentTag(
      node,
      localAtomicComponents,
      instance?.appContext.components ?? {}
    )
  }

  function componentProps(
    node: PageBuilderNodeInterface
  ): Record<string, unknown> {
    return getComponentProps(node)
  }

  function nodeWidgetDisplayName(node: PageBuilderNodeInterface): string {
    return widgetDisplayName(node, PAGE_BUILDER_WIDGETS)
  }

  function moveDraggedNodeToIndex(targetIndex: number): void {
    if (!draggedNodeId.value) return
    const fromIndex = layout.children.findIndex(
      (node) => node.id === draggedNodeId.value
    )
    if (fromIndex < 0) return

    pushUndo()
    const [movedNode] = layout.children.splice(fromIndex, 1)
    if (!movedNode) return

    const normalizedIndex =
      fromIndex < targetIndex ? targetIndex - 1 : targetIndex
    const boundedIndex = Math.max(
      0,
      Math.min(normalizedIndex, layout.children.length)
    )

    layout.children.splice(boundedIndex, 0, movedNode)
    selectedNodeId.value = movedNode.id
    dirtySinceLastSave.value = true
  }

  function resetNodeDragState(): void {
    draggedNodeId.value = null
    dropTargetIndex.value = null
  }

  function removeNode(nodeId: string): void {
    confirmDeleteNodeId.value = nodeId
  }

  const confirmDeleteNodeName = computed(() => {
    if (!confirmDeleteNodeId.value) return ''
    const node = layout.children.find((n) => n.id === confirmDeleteNodeId.value)
    return node ? nodeWidgetDisplayName(node) : ''
  })

  function confirmRemoveNode(): void {
    const nodeId = confirmDeleteNodeId.value
    confirmDeleteNodeId.value = null
    if (!nodeId) return

    const index = layout.children.findIndex((node) => node.id === nodeId)
    if (index < 0) return

    pushUndo()
    layout.children.splice(index, 1)
    if (selectedNodeId.value === nodeId) selectedNodeId.value = null
    dirtySinceLastSave.value = true
  }

  const confirmDeletePageName = computed(() => {
    if (!confirmDeletePageId.value) return ''
    const page = pages.value.find((p) => p.id === confirmDeletePageId.value)
    return page?.title ?? ''
  })

  async function confirmDeletePage(): Promise<void> {
    const pageId = confirmDeletePageId.value
    confirmDeletePageId.value = null
    if (!pageId) return

    try {
      await apiRequest(`${baseUrl.value}/pages/${pageId}`, 'DELETE')
    } catch {
      // silent
    }

    if (selectedPageId.value === pageId) {
      selectedPageId.value = null
      selectedPageSlug.value = null
      selectedNodeId.value = null
      Object.assign(layout, createLayout())
      form.title = ''
      form.slug = ''
    }

    await fetchPages()
  }

  function extractData<T>(response: unknown): T | null {
    let current: unknown = response
    for (let depth = 0; depth < 4; depth++) {
      if (!current || typeof current !== 'object') break
      if ('page' in current) {
        current = (current as { page: unknown }).page
        continue
      }
      if ('data' in current) {
        current = (current as { data: unknown }).data
        continue
      }
      break
    }
    return (current as T) ?? null
  }

  function replaceLayout(nextLayout: PageBuilderLayoutInterface): void {
    layout.id = nextLayout.id
    layout.type = nextLayout.type
    layout.settings = nextLayout.settings
    layout.children = nextLayout.children ?? []
    selectedNodeId.value = null
    pageCustomStyles.value = String(layout.settings.customStyles ?? '')
    pageStyleLang.value = layout.settings.styleLang === 'scss' ? 'scss' : 'css'
  }

  function scheduleAutosave(): void {
    if (
      !selectedPageId.value ||
      suppressAutosave.value ||
      !autosaveEnabled.value
    ) {
      return
    }
    dirtySinceLastSave.value = true
    saveState.value = 'idle'
    if (autosaveTimer.value) clearTimeout(autosaveTimer.value)
    autosaveTimer.value = setTimeout(async () => {
      await saveDraft()
    }, 1100)
  }

  function onKeyboardShortcut(event: KeyboardEvent): void {
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
  }

  watch(
    [() => form.title, () => form.slug, () => layout.children],
    () => {
      scheduleAutosave()
    },
    { deep: true }
  )

  return {
    activeComponentSchema,
    activeWidgetSource,
    addWidget,
    autosaveEnabled,
    collapsedGroups,
    componentJsonError,
    componentProps,
    componentPropsJson,
    confirmDeleteNodeId,
    confirmDeleteNodeName,
    confirmDeletePage,
    confirmDeletePageId,
    confirmDeletePageName,
    confirmRemoveNode,
    createPage,
    draggedNodeId,
    dropTargetIndex,
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
    nodePreviewText,
    nodeWidgetDisplayName,
    onCanvasDragLeave,
    onCanvasDragOver,
    onCanvasDrop,
    onComponentPropsJsonInput,
    onCustomStylesInput,
    onNodeDragEnd,
    onNodeDragStart,
    onNodePropChange,
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
    selectedPageId,
    selectedPageSlug,
    setComponentProp,
    setComponentPropJson,
    toggleGroup,
    undo,
    widgetSearch,
    widgetSources,
  }
}
