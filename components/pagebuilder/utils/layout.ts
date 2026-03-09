import type {
  PageBuilderLayoutInterface,
  PageBuilderNodeInterface,
} from 'nucleify'

import {
  CONTAINER_WIDGET_TYPES,
  PAGE_BUILDER_WIDGETS,
} from '../config/widget_registry'

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createLayout(): PageBuilderLayoutInterface {
  return {
    id: createId(),
    type: 'page',
    settings: {},
    children: [],
  }
}

function createColumn(): PageBuilderNodeInterface {
  return {
    id: createId(),
    type: 'widget',
    widgetType: 'column',
    props: { gap: '16px' },
    styles: {},
    children: [],
  }
}

export function createNode(widgetKey: string): PageBuilderNodeInterface {
  const widget = PAGE_BUILDER_WIDGETS.find((item) => item.key === widgetKey)
  const type = widget?.type ?? 'text'

  const baseProps =
    type === 'component'
      ? {
          componentTag: widget?.componentTag ?? 'div',
          componentProps: { adType: 'main', ...(widget?.defaultProps ?? {}) },
        }
      : (widget?.defaultProps ?? {})

  const node: PageBuilderNodeInterface = {
    id: createId(),
    type: 'widget',
    widgetType: type,
    props: baseProps,
    styles: {},
    children: [],
  }

  if (type === 'row') {
    const columnCount = Number(baseProps.columns ?? 3)
    for (let i = 0; i < columnCount; i++) {
      node.children.push(createColumn())
    }
  }

  return node
}

export function setRowColumns(
  row: PageBuilderNodeInterface,
  count: number
): void {
  const current = row.children.length
  if (count > current) {
    for (let i = current; i < count; i++) {
      row.children.push(createColumn())
    }
  } else if (count < current) {
    row.children.splice(count)
  }
}

export function isContainerType(widgetType: string): boolean {
  return CONTAINER_WIDGET_TYPES.has(widgetType)
}

export function nodeAcceptsChildren(node: PageBuilderNodeInterface): boolean {
  if (CONTAINER_WIDGET_TYPES.has(node.widgetType)) return true
  if (node.widgetType !== 'component') return false
  const tag = String(node.props.componentTag ?? '').trim()
  const widget = PAGE_BUILDER_WIDGETS.find(
    (w) => w.componentTag === tag || w.key === tag
  )
  return widget?.acceptsChildren === true
}

export function getWidgetSlots(
  node: PageBuilderNodeInterface
): string[] | undefined {
  if (node.widgetType !== 'component') return undefined
  const tag = String(node.props.componentTag ?? '').trim()
  const widget = PAGE_BUILDER_WIDGETS.find(
    (w) => w.componentTag === tag || w.key === tag
  )
  return widget?.slots
}

export function getSlotChildren(
  node: PageBuilderNodeInterface,
  slotName: string
): PageBuilderNodeInterface[] {
  return node.children.filter((c) => (c.slot ?? 'default') === slotName)
}

export function insertAtSlotIndex(
  parentChildren: PageBuilderNodeInterface[],
  slotName: string | undefined,
  index: number,
  child: PageBuilderNodeInterface
): void {
  child.slot = slotName
  if (!slotName) {
    parentChildren.splice(index, 0, child)
    return
  }

  let slotCount = 0
  for (let i = 0; i <= parentChildren.length; i++) {
    if (slotCount === index) {
      parentChildren.splice(i, 0, child)
      return
    }
    if (
      i < parentChildren.length &&
      (parentChildren[i].slot ?? 'default') === slotName
    ) {
      slotCount++
    }
  }
  parentChildren.push(child)
}

export function findNodeById(
  nodes: PageBuilderNodeInterface[],
  id: string
): PageBuilderNodeInterface | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children.length > 0) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

export function findParentOfNode(
  nodes: PageBuilderNodeInterface[],
  id: string
): { parent: PageBuilderNodeInterface[]; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) return { parent: nodes, index: i }
    if (nodes[i].children.length > 0) {
      const found = findParentOfNode(nodes[i].children, id)
      if (found) return found
    }
  }
  return null
}

export function removeNodeById(
  nodes: PageBuilderNodeInterface[],
  id: string
): boolean {
  const result = findParentOfNode(nodes, id)
  if (!result) return false
  result.parent.splice(result.index, 1)
  return true
}

export function insertNodeAt(
  nodes: PageBuilderNodeInterface[],
  parentId: string | null,
  index: number,
  node: PageBuilderNodeInterface
): boolean {
  if (!parentId) {
    nodes.splice(index, 0, node)
    return true
  }
  const parent = findNodeById(nodes, parentId)
  if (!parent) return false
  parent.children.splice(index, 0, node)
  return true
}
