import type { Component } from 'vue'

import type {
  PageBuilderNodeInterface,
  PageBuilderWidgetDefinitionInterface,
  PropFieldSchema,
} from 'nucleify'
import { GROUP_ICONS, getWidgetGroup, WIDGET_DISPLAY_NAMES } from 'nucleify'

function shouldIncludeProp(key: string): boolean {
  if (key.startsWith('on') && key.length > 2 && key[2] === key[2].toUpperCase())
    return false
  return true
}

function camelToLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
}

function vueTypeToFieldType(propDef: unknown): PropFieldSchema['type'] {
  if (!propDef) return 'string'

  let types: unknown[] = []

  if (typeof propDef === 'function') {
    types = [propDef]
  } else if (typeof propDef === 'object' && propDef !== null) {
    const def = propDef as Record<string, unknown>
    if (def.type) {
      types = Array.isArray(def.type) ? def.type : [def.type]
    }
  }

  if (types.length === 0) return 'string'

  if (types.includes(Boolean) && types.length === 1) return 'boolean'
  if (types.includes(Number) && !types.includes(String)) return 'number'
  if (types.includes(Array) || types.includes(Object)) return 'json'
  return 'string'
}

export function extractPropsSchema(component: Component): PropFieldSchema[] {
  const comp = component as Record<string, unknown>
  const propsDef = comp.props ?? comp.__props

  if (!propsDef) return []

  const schema: PropFieldSchema[] = []

  if (Array.isArray(propsDef)) {
    for (const key of propsDef) {
      if (typeof key === 'string' && shouldIncludeProp(key)) {
        schema.push({ key, label: camelToLabel(key), type: 'string' })
      }
    }
  } else if (typeof propsDef === 'object') {
    for (const [key, def] of Object.entries(
      propsDef as Record<string, unknown>
    )) {
      if (!shouldIncludeProp(key)) continue
      schema.push({
        key,
        label: camelToLabel(key),
        type: vueTypeToFieldType(def),
      })
    }
  }

  schema.sort((a, b) => {
    const order: Record<string, number> = {
      string: 0,
      number: 1,
      select: 2,
      color: 3,
      json: 4,
      boolean: 5,
    }
    return (order[a.type] ?? 3) - (order[b.type] ?? 3)
  })

  return schema
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

export function buildLocalAtomicComponents(
  exportsMap: Record<string, unknown>
): Record<string, Component> {
  const map: Record<string, Component> = {}

  for (const [name, value] of Object.entries(exportsMap)) {
    if (!value || typeof value !== 'object') continue

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
