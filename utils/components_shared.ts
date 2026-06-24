import { getWidgetGroup } from './widgets'

import { GROUP_ICONS, WIDGET_DISPLAY_NAMES } from '../config/editor'
import type { PropFieldSchema } from '../config/schema_types'
import type {
  PageBuilderNodeInterface,
  PageBuilderWidgetDefinitionInterface,
} from '../types/interfaces'

export function shouldIncludeProp(key: string): boolean {
  if (key.startsWith('on') && key.length > 2 && key[2] === key[2].toUpperCase())
    return false
  return true
}

export function camelToLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
}

export function mergeSchemas(
  autoSchema: PropFieldSchema[],
  overrides: PropFieldSchema[]
): PropFieldSchema[] {
  if (overrides.length === 0) return autoSchema
  if (autoSchema.length === 0) return overrides

  const overrideKeys = new Set(overrides.map((o) => o.key))
  const merged = [...overrides]

  for (const field of autoSchema) {
    if (!overrideKeys.has(field.key)) {
      merged.push(field)
    }
  }

  return merged
}

export function componentTag(node: PageBuilderNodeInterface): string {
  return String(node.props.componentTag ?? 'div').trim()
}

export function toPascalCase(tag: string): string {
  return tag
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function getComponentProps(
  node: PageBuilderNodeInterface
): Record<string, unknown> {
  const props = node.props.componentProps
  if (props && typeof props === 'object') {
    return props as Record<string, unknown>
  }

  return {}
}

export function componentGroupIcon(
  tag: string,
  widgets: PageBuilderWidgetDefinitionInterface[]
): string {
  if (tag.startsWith('nuc-section-')) return GROUP_ICONS['Sections'] ?? '📁'
  if (tag.startsWith('nuc-')) return GROUP_ICONS['Templates'] ?? '🧩'

  const definition = widgets.find((widget) => widget.componentTag === tag)
  if (definition) {
    const group = getWidgetGroup(definition)
    return GROUP_ICONS[group] ?? '⚛'
  }

  return '⚛'
}

export function widgetDisplayName(
  node: PageBuilderNodeInterface,
  widgets: PageBuilderWidgetDefinitionInterface[]
): string {
  if (node.widgetType === 'component') {
    const tag = componentTag(node)
    return `${componentGroupIcon(tag, widgets)} ${tag}`
  }

  return WIDGET_DISPLAY_NAMES[node.widgetType] ?? node.widgetType
}

export function nodePreviewText(node: PageBuilderNodeInterface): string {
  if (node.widgetType === 'component') {
    const propCount = Object.keys(getComponentProps(node)).length
    return `${componentTag(node)} (${propCount} props)`
  }

  return String(node.props.text ?? '')
}

export function listItems(node: PageBuilderNodeInterface): string[] {
  const raw = String(node.props.items ?? '')
  return raw.split('\n').filter((line) => line.trim() !== '')
}
