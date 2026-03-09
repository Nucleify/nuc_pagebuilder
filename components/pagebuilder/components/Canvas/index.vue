<template>
  <main
    class="pb-canvas-wrapper pb-panel"
    :style="layout.settings.bgColor ? { background: layout.settings.bgColor } : {}"
  >
    <div class="pb-hint">
      Drag or click widgets to add · Ctrl+S save · Ctrl+Z undo · Ctrl+Y redo
    </div>
    <div
      ref="canvasRef"
      class="pb-canvas"
      @dragover.prevent="emit('canvas-drag-over', $event, canvasRef)"
      @drop.prevent="emit('canvas-drop')"
      @dragleave="emit('canvas-drag-leave')"
    >
      <div v-if="layout.children.length === 0" class="pb-empty">
        Empty page. Drop first widget.
      </div>
      <template v-for="(node, index) in layout.children" :key="node.id">
        <div
          class="pb-drop-indicator"
          :class="{ active: isRootDropTarget(index) }"
        />
        <CanvasNode
          :node="node"
          :index="index"
          :parent-id="null"
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
        :class="{ active: isRootDropTarget(layout.children.length) }"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ref } from 'vue'

import type {
  DropTargetInfo,
  PageBuilderLayoutInterface,
  PageBuilderNodeInterface,
} from 'nucleify'

import CanvasNode from '../CanvasNode/index.vue'

interface Props {
  layout: PageBuilderLayoutInterface
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
  'canvas-drag-over': [event: DragEvent, canvasElement: HTMLElement | null]
  'canvas-drop': []
  'canvas-drag-leave': []
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

const canvasRef = ref<HTMLElement | null>(null)

function isRootDropTarget(index: number): boolean {
  return (
    props.dropTarget?.parentId === null && props.dropTarget?.index === index
  )
}
</script>

<style lang="scss">
@import 'index';
</style>