<template>
  <div
    class="pb-children-drop-zone"
    :class="{ 'drop-active': isDropTarget }"
    :data-container-id="node.id"
    :data-slot-name="slotName ?? ''"
    @dragover.stop.prevent="onDragOver"
    @drop.stop.prevent="onDrop"
    @dragleave.stop="onDragLeave"
  >
    <div v-if="slotName" class="pb-slot-label">{{ slotName }}</div>
    <div v-if="filteredChildren.length === 0" class="pb-children-empty">
      Drop widgets here
    </div>
    <template v-for="(child, childIdx) in filteredChildren" :key="child.id">
      <div
        class="pb-drop-indicator"
        :class="{ active: isChildDropTarget(childIdx) }"
      />
      <CanvasNode
        :node="child"
        :index="childIdx"
        :parent-id="node.id"
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
    <div
      class="pb-drop-indicator"
      :class="{ active: isChildDropTarget(filteredChildren.length) }"
    />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed, defineAsyncComponent } from 'vue'

import type { DropTargetInfo, PageBuilderNodeInterface } from 'nucleify'

interface Props {
  node: PageBuilderNodeInterface
  slotName?: string
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

const CanvasNode = defineAsyncComponent(() => import('../CanvasNode/index.vue'))

const filteredChildren = computed(() => {
  if (!props.slotName) return props.node.children
  return props.node.children.filter(
    (c) => (c.slot ?? 'default') === props.slotName
  )
})

const isDropTarget = computed(() => {
  return (
    props.dropTarget?.parentId === props.node.id &&
    props.dropTarget?.slotName === props.slotName
  )
})

function isChildDropTarget(childIndex: number): boolean {
  return (
    props.dropTarget?.parentId === props.node.id &&
    props.dropTarget?.slotName === props.slotName &&
    props.dropTarget?.index === childIndex
  )
}

function onDragOver(event: DragEvent): void {
  emit('container-drag-over', {
    containerId: props.node.id,
    event,
    slotName: props.slotName,
  })
}

function onDrop(): void {
  emit('container-drop', {
    containerId: props.node.id,
    slotName: props.slotName,
  })
}

function onDragLeave(): void {
  emit('container-drag-leave', {
    containerId: props.node.id,
    slotName: props.slotName,
  })
}
</script>

<style lang="scss">
@import 'index';
</style>
