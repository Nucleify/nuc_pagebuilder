<template>
  <component
    v-if="node.widgetType === 'component' && hasNamedSlots"
    :is="resolveComponentTag(node)"
    class="page-builder-node"
    v-bind="componentProps(node)"
    :style="node.styles"
  >
    <template v-for="sName in widgetSlots" :key="sName" #[sName]>
      <RenderNode
        v-for="child in slotChildren(sName)"
        :key="child.id"
        :node="child"
        :resolve-component-tag="resolveComponentTag"
        :component-props="componentProps"
      />
    </template>
  </component>

  <component
    v-else-if="node.widgetType === 'component'"
    :is="resolveComponentTag(node)"
    class="page-builder-node"
    v-bind="componentProps(node)"
    :style="node.styles"
  >
    <RenderNode
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      :resolve-component-tag="resolveComponentTag"
      :component-props="componentProps"
    />
  </component>

  <div
    v-else-if="node.widgetType === 'container'"
    class="page-builder-node page-builder-container-block"
    :style="containerStyles"
  >
    <RenderNode
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      :resolve-component-tag="resolveComponentTag"
      :component-props="componentProps"
    />
  </div>

  <div
    v-else-if="node.widgetType === 'row'"
    class="page-builder-node page-builder-row"
    :style="containerStyles"
  >
    <RenderNode
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      :resolve-component-tag="resolveComponentTag"
      :component-props="componentProps"
    />
  </div>

  <div
    v-else-if="node.widgetType === 'column'"
    class="page-builder-node page-builder-column"
    :style="containerStyles"
  >
    <RenderNode
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      :resolve-component-tag="resolveComponentTag"
      :component-props="componentProps"
    />
  </div>

  <section
    v-else-if="node.widgetType === 'section'"
    class="page-builder-node page-builder-section"
    :style="containerStyles"
  >
    <RenderNode
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      :resolve-component-tag="resolveComponentTag"
      :component-props="componentProps"
    />
  </section>

  <component
    v-else-if="node.widgetType === 'heading'"
    :is="resolvedHeadingTag"
    class="page-builder-node"
    :style="node.styles"
  >{{ nodeText }}</component>

  <a
    v-else-if="node.widgetType === 'button'"
    class="page-builder-node page-builder-btn"
    :href="String(node.props.href ?? '#')"
    :style="node.styles"
  >{{ nodeText }}</a>

  <img
    v-else-if="node.widgetType === 'image'"
    class="page-builder-node"
    :src="String(node.props.src ?? '')"
    :alt="String(node.props.alt ?? '')"
    :style="{ maxWidth: String(node.props.width || '100%'), ...node.styles }"
  />

  <iframe
    v-else-if="node.widgetType === 'video'"
    class="page-builder-node"
    :src="String(node.props.src ?? '')"
    :width="String(node.props.width ?? '100%')"
    :height="String(node.props.height ?? '400')"
    frameborder="0"
    allowfullscreen
    loading="lazy"
    :style="node.styles"
  />

  <hr
    v-else-if="node.widgetType === 'divider'"
    class="page-builder-node page-builder-divider"
    :style="node.styles"
  />

  <div
    v-else-if="node.widgetType === 'spacer'"
    class="page-builder-node"
    :style="{ height: String(node.props.height ?? '40px'), ...node.styles }"
  />

  <div
    v-else-if="node.widgetType === 'html'"
    class="page-builder-node"
    v-html="String(node.props.html ?? '')"
  />

  <component
    v-else-if="node.widgetType === 'list'"
    :is="node.props.ordered ? 'ol' : 'ul'"
    class="page-builder-node page-builder-list"
    :style="node.styles"
  >
    <li v-for="(item, i) in listItemsArray" :key="i">{{ item }}</li>
  </component>

  <blockquote
    v-else-if="node.widgetType === 'quote'"
    class="page-builder-node page-builder-quote"
    :style="node.styles"
  >
    <p>{{ nodeText }}</p>
    <cite v-if="node.props.cite">— {{ node.props.cite }}</cite>
  </blockquote>

  <pre
    v-else-if="node.widgetType === 'code'"
    class="page-builder-node page-builder-code"
    :style="node.styles"
  ><code>{{ node.props.code ?? '' }}</code></pre>

  <p
    v-else
    class="page-builder-node"
    :style="node.styles"
  >{{ nodeText }}</p>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed, defineAsyncComponent } from 'vue'

import type { PageBuilderNodeInterface } from 'nucleify'
import { getWidgetSlots } from 'nucleify'

interface Props {
  node: PageBuilderNodeInterface
  resolveComponentTag: (node: PageBuilderNodeInterface) => string | Component
  componentProps: (node: PageBuilderNodeInterface) => Record<string, unknown>
}

const props = defineProps<Props>()

const RenderNode = defineAsyncComponent(() => import('./index.vue'))

const nodeText = computed(() => String(props.node.props.text ?? ''))

const widgetSlots = computed(() => getWidgetSlots(props.node))
const hasNamedSlots = computed(
  () => widgetSlots.value && widgetSlots.value.length > 0
)

function slotChildren(slotName: string): PageBuilderNodeInterface[] {
  return props.node.children.filter((c) => (c.slot ?? 'default') === slotName)
}

const resolvedHeadingTag = computed(() => {
  const level = String(props.node.props.level ?? 'h2')
  return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(level) ? level : 'h2'
})

const listItemsArray = computed(() => {
  const raw = String(props.node.props.items ?? '')
  return raw.split('\n').filter((l: string) => l.trim() !== '')
})

const containerStyles = computed(() => {
  const s: Record<string, string> = { ...props.node.styles }
  const p = props.node.props
  if (p.gap) s.gap = String(p.gap)
  if (p.alignItems) s.alignItems = String(p.alignItems)
  if (p.justifyContent) s.justifyContent = String(p.justifyContent)
  if (p.flexWrap) s.flexWrap = String(p.flexWrap)
  if (p.maxWidth) s.maxWidth = String(p.maxWidth)
  if (p.minHeight) s.minHeight = String(p.minHeight)
  return s
})
</script>

<style lang="scss">
@import 'index';
</style>
