import type { ComponentType } from 'react'

import { componentTag, toPascalCase } from './components_shared'

import * as AtomicAtom from '../../../next/atomic/atom'
import * as AtomicMolecule from '../../../next/atomic/molecule'
import * as AtomicOrganism from '../../../next/atomic/organism'
import * as NucleifyModules from '../../index.react'
import type { PageBuilderNodeInterface } from '../types/interfaces'

export * from './components_shared'

export type ReactComponentMap = Record<
  string,
  ComponentType<Record<string, unknown>>
>

export function buildLocalAtomicComponentsReact(): ReactComponentMap {
  // Pagebuilder needs more than just Atomic components: it also renders
  // Templates (`nuc-*`) and Sections (`nuc-section-*`) in preview.
  const exportsMap = {
    ...NucleifyModules,
    ...AtomicAtom,
    ...AtomicMolecule,
    ...AtomicOrganism,
  } as Record<string, unknown>

  const map: ReactComponentMap = {}

  for (const [name, value] of Object.entries(exportsMap)) {
    if (!value || typeof value !== 'function') continue
    // Limit to component-like exports to avoid polluting the map with utilities.
    if (!name.startsWith('Ad') && !name.startsWith('Nuc')) continue

    const kebab = name
      .replace(
        /[A-Z]/g,
        (char, index) => `${index > 0 ? '-' : ''}${char.toLowerCase()}`
      )
      .trim()

    map[name] = value as ComponentType<Record<string, unknown>>
    map[kebab] = value as ComponentType<Record<string, unknown>>
  }

  return map
}

export function resolveComponentTagReact(
  node: PageBuilderNodeInterface,
  localAtomicComponents: ReactComponentMap,
  appComponents: Record<string, unknown> = {}
): string | ComponentType<Record<string, unknown>> {
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

export function extractPropsSchemaReact(): never[] {
  return []
}
