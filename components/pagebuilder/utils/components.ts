import type { Component } from 'vue'

import { GROUP_ICONS, WIDGET_DISPLAY_NAMES } from '../constants'
import type {
  PageBuilderNodeInterface,
  PageBuilderWidgetDefinitionInterface,
} from '../types'
import { getWidgetGroup } from './widgets'

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

export function buildLocalAtomicComponents(
  exportsMap: Record<string, unknown>
): Record<string, Component> {
  const map: Record<string, Component> = {}

  for (const [name, value] of Object.entries(exportsMap)) {
    if (!name.startsWith('Ad') || !value) {
      continue
    }

    const kebab = name
      .replace(
        /[A-Z]/g,
        (char, index) => `${index > 0 ? '-' : ''}${char.toLowerCase()}`
      )
      .trim()

    map[name] = value as Component
    map[kebab] = value as Component
  }

  return map
}

export function resolveComponentTag(
  node: PageBuilderNodeInterface,
  localAtomicComponents: Record<string, Component>,
  appComponents: Record<string, unknown>
): string | Component {
  const rawTag = componentTag(node)
  const pascalTag = toPascalCase(rawTag)

  if (localAtomicComponents[rawTag]) {
    return localAtomicComponents[rawTag]
  }

  if (localAtomicComponents[pascalTag]) {
    return localAtomicComponents[pascalTag]
  }

  if (appComponents[rawTag]) {
    return rawTag
  }

  if (appComponents[pascalTag]) {
    return pascalTag
  }

  return rawTag
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
