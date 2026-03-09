<template>
  <section class="page-builder-renderer">
    <div class="page-builder-container">
      <RenderNode
        v-for="node in nodes"
        :key="node.id"
        :node="node"
        :resolve-component-tag="resolvedComponentTag"
        :component-props="componentProps"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed, getCurrentInstance } from 'vue'

import type {
  PageBuilderLayoutInterface,
  PageBuilderNodeInterface,
} from 'nucleify'

import * as AtomicAtom from 'nucleify/atom'
import * as AtomicMolecule from 'nucleify/molecule'
import * as AtomicOrganism from 'nucleify/organism'
import RenderNode from './components/RenderNode/index.vue'

const props = defineProps<{
  layout: PageBuilderLayoutInterface | null
}>()
const instance = getCurrentInstance()

const localAtomicComponents = buildLocalAtomicComponents()

const nodes = computed<PageBuilderNodeInterface[]>(
  () => props.layout?.children ?? []
)

function toPascalCase(tag: string): string {
  return tag
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function buildLocalAtomicComponents(): Record<string, Component> {
  const exportsMap = {
    ...AtomicAtom,
    ...AtomicMolecule,
    ...AtomicOrganism,
  } as Record<string, unknown>

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

function resolvedComponentTag(
  node: PageBuilderNodeInterface
): string | Component {
  const rawTag = String(node.props.componentTag ?? 'div').trim()
  const pascalTag = toPascalCase(rawTag)
  const components = instance?.appContext.components ?? {}

  if (localAtomicComponents[rawTag]) {
    return localAtomicComponents[rawTag]
  }

  if (localAtomicComponents[pascalTag]) {
    return localAtomicComponents[pascalTag]
  }

  if (components[rawTag]) {
    return rawTag
  }

  if (components[pascalTag]) {
    return pascalTag
  }

  return rawTag
}

function componentProps(
  node: PageBuilderNodeInterface
): Record<string, unknown> {
  const nodeProps = node.props.componentProps
  if (nodeProps && typeof nodeProps === 'object') {
    return nodeProps as Record<string, unknown>
  }

  return {}
}
</script>

<style scoped lang="scss">
.page-builder-renderer {
  padding: 48px 16px;
}

.page-builder-container {
  max-width: 1140px;
  margin: 0 auto;
}
</style>
