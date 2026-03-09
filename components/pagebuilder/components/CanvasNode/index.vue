<template>
  <div
    class="pb-node"
    :class="{
      selected: selectedNodeId === node.id,
      dragging: draggedNodeId === node.id,
    }"
    :data-node-index="index"
    :data-node-id="node.id"
    :data-parent-id="parentId ?? 'root'"
    draggable="true"
    @dragstart.stop="emit('node-drag-start', node.id)"
    @dragend="emit('node-drag-end')"
    @click.stop="emit('select-node', node.id)"
  >
    <div class="pb-node-header">
      <span class="pb-node-title">{{ index + 1 }}. {{ widgetDisplayName(node) }}</span>
      <button
        class="pb-node-delete"
        type="button"
        @click.stop="emit('remove-node', node.id)"
      >✕</button>
    </div>

    <!-- Heading -->
    <component
      v-if="node.widgetType === 'heading'"
      :is="String(node.props.level ?? 'h2')"
      :style="node.styles"
      class="pb-inline-preview"
    >{{ node.props.text ?? '' }}</component>

    <!-- Text -->
    <p v-else-if="node.widgetType === 'text'" :style="node.styles" class="pb-inline-preview">
      {{ node.props.text ?? '' }}
    </p>

    <!-- Button -->
    <a
      v-else-if="node.widgetType === 'button'"
      :href="String(node.props.href ?? '#')"
      :style="node.styles"
      class="pb-inline-preview pb-btn-preview"
      @click.prevent
    >{{ node.props.text ?? '' }}</a>

    <!-- Image -->
    <img
      v-else-if="node.widgetType === 'image'"
      :src="String(node.props.src ?? '')"
      :alt="String(node.props.alt ?? '')"
      :style="{ maxWidth: String(node.props.width || '100%'), ...node.styles }"
      class="pb-inline-preview pb-image-preview"
    />

    <!-- Video -->
    <div v-else-if="node.widgetType === 'video'" class="pb-inline-preview pb-video-preview">
      <iframe
        :src="String(node.props.src ?? '')"
        :width="String(node.props.width ?? '100%')"
        :height="String(node.props.height ?? '400')"
        frameborder="0"
        allowfullscreen
        style="pointer-events:none;border-radius:8px;"
      />
    </div>

    <!-- Divider -->
    <hr v-else-if="node.widgetType === 'divider'" :style="node.styles" class="pb-inline-preview pb-divider-preview" />

    <!-- Spacer -->
    <div
      v-else-if="node.widgetType === 'spacer'"
      class="pb-inline-preview pb-spacer-preview"
      :style="{ height: String(node.props.height ?? '40px'), ...node.styles }"
    >
      <span class="pb-spacer-label">↕ {{ node.props.height ?? '40px' }}</span>
    </div>

    <!-- HTML -->
    <div
      v-else-if="node.widgetType === 'html'"
      class="pb-inline-preview pb-html-preview"
      v-html="String(node.props.html ?? '')"
    />

    <!-- List -->
    <component
      v-else-if="node.widgetType === 'list'"
      :is="node.props.ordered ? 'ol' : 'ul'"
      :style="node.styles"
      class="pb-inline-preview pb-list-preview"
    >
      <li v-for="(item, itemIndex) in listItems(node)" :key="itemIndex">{{ item }}</li>
    </component>

    <!-- Quote -->
    <blockquote
      v-else-if="node.widgetType === 'quote'"
      :style="node.styles"
      class="pb-inline-preview pb-quote-preview"
    >
      <p>{{ node.props.text ?? '' }}</p>
      <cite v-if="node.props.cite">— {{ node.props.cite }}</cite>
    </blockquote>

    <!-- Code -->
    <pre
      v-else-if="node.widgetType === 'code'"
      class="pb-inline-preview pb-code-preview"
    ><code>{{ node.props.code ?? '' }}</code></pre>

    <!-- Component with named slots (e.g. card: header, title, content) -->
    <div v-else-if="node.widgetType === 'component' && widgetSlots" class="pb-node-render">
      <component :is="resolvedComponentTag(node)" v-bind="componentProps(node)" :style="node.styles">
        <template v-for="sName in widgetSlots" :key="sName" #[sName]>
          <ChildrenDropZone
            :node="node"
            :slot-name="sName"
            :selected-node-id="selectedNodeId"
            :dragged-node-id="draggedNodeId"
            :drop-target="dropTarget"
            :resolved-component-tag="resolvedComponentTag"
            :component-props="componentProps"
            :widget-display-name="widgetDisplayName"
            :node-preview-text="nodePreviewText"
            :list-items="listItems"
            @node-drag-start="emit('node-drag-start', $event)"
            @node-drag-end="emit('node-drag-end')"
            @select-node="emit('select-node', $event)"
            @remove-node="emit('remove-node', $event)"
            @container-drag-over="emit('container-drag-over', $event)"
            @container-drop="emit('container-drop', $event)"
            @container-drag-leave="emit('container-drag-leave', $event)"
          />
        </template>
      </component>
    </div>

    <!-- Component with default slot only -->
    <div v-else-if="node.widgetType === 'component' && acceptsChildren" class="pb-node-render">
      <component :is="resolvedComponentTag(node)" v-bind="componentProps(node)" :style="node.styles">
        <ChildrenDropZone
          :node="node"
          :selected-node-id="selectedNodeId"
          :dragged-node-id="draggedNodeId"
          :drop-target="dropTarget"
          :resolved-component-tag="resolvedComponentTag"
          :component-props="componentProps"
          :widget-display-name="widgetDisplayName"
          :node-preview-text="nodePreviewText"
          :list-items="listItems"
          @node-drag-start="emit('node-drag-start', $event)"
          @node-drag-end="emit('node-drag-end')"
          @select-node="emit('select-node', $event)"
          @remove-node="emit('remove-node', $event)"
          @container-drag-over="emit('container-drag-over', $event)"
          @container-drop="emit('container-drop', $event)"
          @container-drag-leave="emit('container-drag-leave', $event)"
        />
      </component>
    </div>

    <!-- Leaf component (no children accepted) -->
    <div v-else-if="node.widgetType === 'component'" class="pb-node-render" :style="leafWrapperStyle">
      <component :is="resolvedComponentTag(node)" v-bind="leafComponentProps" :style="node.styles" />
    </div>

    <!-- Native container (container/row/column/section) -->
    <template v-else-if="isNativeContainer">
      <div
        class="pb-native-container-preview"
        :class="`pb-native-${node.widgetType}`"
        :style="nativeContainerStyle"
      >
        <ChildrenDropZone
          :node="node"
          :selected-node-id="selectedNodeId"
          :dragged-node-id="draggedNodeId"
          :drop-target="dropTarget"
          :resolved-component-tag="resolvedComponentTag"
          :component-props="componentProps"
          :widget-display-name="widgetDisplayName"
          :node-preview-text="nodePreviewText"
          :list-items="listItems"
          @node-drag-start="emit('node-drag-start', $event)"
          @node-drag-end="emit('node-drag-end')"
          @select-node="emit('select-node', $event)"
          @remove-node="emit('remove-node', $event)"
          @container-drag-over="emit('container-drag-over', $event)"
          @container-drop="emit('container-drop', $event)"
          @container-drag-leave="emit('container-drag-leave', $event)"
        />
      </div>
    </template>

    <!-- Default (text) -->
    <span v-else class="pb-node-text">{{ nodePreviewText(node) }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed, defineAsyncComponent } from 'vue'

import type { DropTargetInfo, PageBuilderNodeInterface } from 'nucleify'
import { getWidgetSlots, isContainerType, nodeAcceptsChildren } from 'nucleify'

interface Props {
  node: PageBuilderNodeInterface
  index: number
  parentId: string | null
  selectedNodeId: string | null
  draggedNodeId: string | null
  dropTarget: DropTargetInfo | null
  resolvedComponentTag: (node: PageBuilderNodeInterface) => string | Component
  componentProps: (node: PageBuilderNodeInterface) => Record<string, unknown>
  widgetDisplayName: (node: PageBuilderNodeInterface) => string
  nodePreviewText: (node: PageBuilderNodeInterface) => string
  listItems: (node: PageBuilderNodeInterface) => string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'node-drag-start': [nodeId: string]
  'node-drag-end': []
  'select-node': [nodeId: string]
  'remove-node': [nodeId: string]
  'container-drag-over': [
    payload: { containerId: string; event: DragEvent; slotName?: string },
  ]
  'container-drop': [payload: { containerId: string; slotName?: string }]
  'container-drag-leave': [payload: { containerId: string; slotName?: string }]
}>()

const ChildrenDropZone = defineAsyncComponent(
  () => import('../ChildrenDropZone/index.vue')
)

const acceptsChildren = computed(() => nodeAcceptsChildren(props.node))
const isNativeContainer = computed(() => isContainerType(props.node.widgetType))
const widgetSlots = computed(() => getWidgetSlots(props.node))

const CSS_HANDLED_PROPS = new Set(['width', 'height'])

const leafWrapperStyle = computed(() => {
  if (props.node.widgetType !== 'component') return {}
  const cp = props.componentProps(props.node)
  const s: Record<string, string> = {}
  if (cp.width)
    s.width = String(cp.width).match(/^\d+$/)
      ? `${cp.width}px`
      : String(cp.width)
  if (cp.height)
    s.height = String(cp.height).match(/^\d+$/)
      ? `${cp.height}px`
      : String(cp.height)
  return s
})

const leafComponentProps = computed(() => {
  const cp = props.componentProps(props.node)
  const tag = String((props.node.props.componentTag ?? '').trim()).toLowerCase()
  const filtered: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(cp)) {
    if (CSS_HANDLED_PROPS.has(key)) continue
    filtered[key] = value
  }
  if (tag === 'ad-date-picker') {
    const adType = filtered.adType ?? cp.adType
    if (adType != null && String(adType).trim()) {
      filtered.panelClass = String(adType).trim()
    }
  }
  return filtered
})

const nativeContainerStyle = computed(() => {
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