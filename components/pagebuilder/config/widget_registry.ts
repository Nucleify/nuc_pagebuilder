import type { PageBuilderWidgetDefinitionInterface } from 'nucleify'

import {
  ATOMIC_DEFAULT_PROPS,
  ATOMIC_SLOTS,
  LEAF_TAGS,
} from './atomic_defaults'
import {
  ATOMIC_ATOM_TAGS,
  ATOMIC_MOLECULE_TAGS,
  ATOMIC_ORGANISM_TAGS,
} from './atomic_tags'
import { NATIVE_WIDGETS } from './native_widgets'
import { SECTION_WIDGETS, TEMPLATE_WIDGETS } from './template_widgets'

function formatLabel(tag: string): string {
  return tag
    .replace(/^ad-|^nuc-/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function atomicWidget(
  tag: string,
  group: string
): PageBuilderWidgetDefinitionInterface {
  return {
    key: `atomic-${tag}`,
    label: `Atomic ${group}: ${formatLabel(tag)}`,
    source: 'atomic',
    type: 'component',
    componentTag: tag,
    defaultProps: ATOMIC_DEFAULT_PROPS[tag] ?? {},
    acceptsChildren: !LEAF_TAGS.has(tag),
    slots: ATOMIC_SLOTS[tag],
  }
}

export const CONTAINER_WIDGET_TYPES = new Set<string>([
  'container',
  'row',
  'column',
  'section',
])

export const PAGE_BUILDER_WIDGET_REGISTRY: PageBuilderWidgetDefinitionInterface[] =
  [
    ...NATIVE_WIDGETS,
    ...ATOMIC_ATOM_TAGS.map((tag) => atomicWidget(tag, 'Atom')),
    ...ATOMIC_MOLECULE_TAGS.map((tag) => atomicWidget(tag, 'Molecule')),
    ...ATOMIC_ORGANISM_TAGS.map((tag) => atomicWidget(tag, 'Organism')),
    ...TEMPLATE_WIDGETS,
    ...SECTION_WIDGETS,
  ]

export const PAGE_BUILDER_WIDGETS = PAGE_BUILDER_WIDGET_REGISTRY
