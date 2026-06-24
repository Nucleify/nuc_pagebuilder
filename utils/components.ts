import type { Component } from 'vue'

import type { PageBuilderNodeInterface, PropFieldSchema } from 'nucleify'

import {
  camelToLabel,
  componentTag,
  mergeSchemas,
  shouldIncludeProp,
  toPascalCase,
} from './components_shared'

export * from './components_shared'

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

export { mergeSchemas }

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
