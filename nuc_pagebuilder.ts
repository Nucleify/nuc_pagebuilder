import type { App, Component } from 'vue'

import {
  AtomicAtom,
  AtomicMolecule,
  AtomicOrganism,
  NucPageBuilderEditor,
  NucPageBuilderRender,
} from 'nucleify'

function toKebabCase(name: string): string {
  return name.replace(
    /[A-Z]/g,
    (char, index) => `${index > 0 ? '-' : ''}${char.toLowerCase()}`
  )
}

function registerAtomicComponents(app: App<Element>): void {
  const atomicExports = {
    ...AtomicAtom,
    ...AtomicMolecule,
    ...AtomicOrganism,
  } as Record<string, unknown>

  for (const [exportName, component] of Object.entries(atomicExports)) {
    if (!exportName.startsWith('Ad') || !component) {
      continue
    }

    app.component(exportName, component as Component)
    app.component(toKebabCase(exportName), component as Component)
  }
}

export function registerNucPageBuilder(app: App<Element>): void {
  registerAtomicComponents(app)
  app
    .component('nuc-page-builder-editor', NucPageBuilderEditor)
    .component('nuc-page-builder-render', NucPageBuilderRender)
}
