<template>
  <section class="page-builder-renderer">
    <div class="page-builder-container">
      <nuc-page-builder-render-node
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

import * as AtomicAtom from '../../nuxt/atomic/atom'
import * as AtomicMolecule from '../../nuxt/atomic/molecule'
import * as AtomicOrganism from '../../nuxt/atomic/organism'

import NucPageBuilderRenderNode from './components/render-node/index.vue'
import type {
  PageBuilderLayoutInterface,
  PageBuilderNodeInterface,
} from './types/interfaces'
import { buildLocalAtomicComponents } from './utils/components'

const props = defineProps<{
  layout: PageBuilderLayoutInterface | null
}>()
const instance = getCurrentInstance()

const localAtomicComponents = buildLocalAtomicComponents({
  ...AtomicAtom,
  ...AtomicMolecule,
  ...AtomicOrganism,
})

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
