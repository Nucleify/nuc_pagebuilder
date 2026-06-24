import type { PageBuilderNodeInterface, PageBuilderWidgetType } from 'nucleify'

const containerTypes: ReadonlySet<PageBuilderWidgetType> = new Set([
  'container',
  'row',
  'column',
  'section',
])

export function isContainerType(type: PageBuilderWidgetType): boolean {
  return containerTypes.has(type)
}

export function nodeAcceptsChildren(node: PageBuilderNodeInterface): boolean {
  if (isContainerType(node.widgetType)) return true
  if (node.widgetType !== 'component') return false
  return Boolean((node.props as Record<string, unknown>)?.acceptsChildren)
}

export function getWidgetSlots(node: PageBuilderNodeInterface): string[] {
  if (isContainerType(node.widgetType)) return ['default']
  if (node.widgetType !== 'component') return []

  const slots = (node.props as Record<string, unknown>)?.slots
  return Array.isArray(slots) ? slots.map((s) => String(s)).filter(Boolean) : []
}
