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
          :class="{ active: dropTargetIndex === index }"
        />
        <div
          class="pb-node"
          :class="{
            selected: selectedNodeId === node.id,
            dragging: draggedNodeId === node.id,
          }"
          :data-node-index="index"
          draggable="true"
          @dragstart="emit('node-drag-start', node.id)"
          @dragend="emit('node-drag-end')"
          @click="emit('select-node', node.id)"
        >
          <div class="pb-node-header">
            <span class="pb-node-title">{{ index + 1 }}. {{ widgetDisplayName(node) }}</span>
            <button
              class="pb-node-delete"
              type="button"
              @click.stop="emit('remove-node', node.id)"
            >✕</button>
          </div>

          <component
            v-if="node.widgetType === 'heading'"
            :is="String(node.props.level ?? 'h2')"
            :style="node.styles"
            class="pb-inline-preview"
          >{{ node.props.text ?? '' }}</component>

          <p v-else-if="node.widgetType === 'text'" :style="node.styles" class="pb-inline-preview">
            {{ node.props.text ?? '' }}
          </p>

          <a
            v-else-if="node.widgetType === 'button'"
            :href="String(node.props.href ?? '#')"
            :style="node.styles"
            class="pb-inline-preview pb-btn-preview"
            @click.prevent
          >{{ node.props.text ?? '' }}</a>

          <img
            v-else-if="node.widgetType === 'image'"
            :src="String(node.props.src ?? '')"
            :alt="String(node.props.alt ?? '')"
            :style="{ maxWidth: String(node.props.width || '100%'), ...node.styles as any }"
            class="pb-inline-preview pb-image-preview"
          />

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

          <hr v-else-if="node.widgetType === 'divider'" :style="node.styles" class="pb-inline-preview pb-divider-preview" />

          <div
            v-else-if="node.widgetType === 'spacer'"
            class="pb-inline-preview pb-spacer-preview"
            :style="{ height: String(node.props.height ?? '40px'), ...node.styles as any }"
          >
            <span class="pb-spacer-label">↕ {{ node.props.height ?? '40px' }}</span>
          </div>

          <div
            v-else-if="node.widgetType === 'html'"
            class="pb-inline-preview pb-html-preview"
            v-html="String(node.props.html ?? '')"
          />

          <component
            v-else-if="node.widgetType === 'list'"
            :is="node.props.ordered ? 'ol' : 'ul'"
            :style="node.styles"
            class="pb-inline-preview pb-list-preview"
          >
            <li v-for="(item, itemIndex) in listItems(node)" :key="itemIndex">{{ item }}</li>
          </component>

          <blockquote
            v-else-if="node.widgetType === 'quote'"
            :style="node.styles"
            class="pb-inline-preview pb-quote-preview"
          >
            <p>{{ node.props.text ?? '' }}</p>
            <cite v-if="node.props.cite">— {{ node.props.cite }}</cite>
          </blockquote>

          <pre
            v-else-if="node.widgetType === 'code'"
            class="pb-inline-preview pb-code-preview"
          ><code>{{ node.props.code ?? '' }}</code></pre>

          <div v-else-if="node.widgetType === 'component'" class="pb-node-render">
            <component :is="resolvedComponentTag(node)" v-bind="componentProps(node)" />
          </div>

          <span v-else class="pb-node-text">{{ nodePreviewText(node) }}</span>
        </div>
      </template>
      <div
        class="pb-drop-indicator"
        :class="{ active: dropTargetIndex === layout.children.length }"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ref } from 'vue'

import type {
  PageBuilderLayoutInterface,
  PageBuilderNodeInterface,
} from '../../types'

interface Props {
  layout: PageBuilderLayoutInterface
  selectedNodeId: string | null
  draggedNodeId: string | null
  dropTargetIndex: number | null
  resolvedComponentTag: (node: PageBuilderNodeInterface) => string | Component
  componentProps: (node: PageBuilderNodeInterface) => Record<string, unknown>
  widgetDisplayName: (node: PageBuilderNodeInterface) => string
  nodePreviewText: (node: PageBuilderNodeInterface) => string
  listItems: (node: PageBuilderNodeInterface) => string[]
}

defineProps<Props>()

const emit = defineEmits<{
  'canvas-drag-over': [event: DragEvent, canvasElement: HTMLElement | null]
  'canvas-drop': []
  'canvas-drag-leave': []
  'node-drag-start': [nodeId: string]
  'node-drag-end': []
  'select-node': [nodeId: string]
  'remove-node': [nodeId: string]
}>()

const canvasRef = ref<HTMLElement | null>(null)
</script>

<style scoped lang="scss" src="./_index.scss"></style>
