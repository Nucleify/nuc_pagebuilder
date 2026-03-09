<template>
  <aside class="pb-sidebar pb-panel">
    <div class="pb-header-row">
      <h3>Pages</h3>
      <button class="pb-btn" @click="emit('create-page')">+ New</button>
    </div>
    <ul class="pb-pages-list">
      <li v-for="page in pages" :key="page.id">
        <div
          class="pb-page-item"
          :class="{ active: selectedPageId === page.id }"
          @click="emit('load-page', page.id)"
        >
          <span>{{ page.title }}</span>
          <div class="pb-page-item-right">
            <small>{{ page.status }}</small>
            <button
              class="pb-page-delete"
              title="Delete page"
              @click.stop="emit('delete-page', page.id)"
            >✕</button>
          </div>
        </div>
      </li>
    </ul>

    <div class="pb-header-row pb-widget-header">
      <h3>Widgets</h3>
      <span class="pb-chip">{{ filteredWidgets.length }}</span>
    </div>

    <div class="pb-widget-search-row">
      <svg class="pb-search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input
        :value="widgetSearch"
        class="pb-input pb-input-search"
        placeholder="Search widgets..."
        @input="emit('update:widget-search', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="pb-source-tabs">
      <button
        v-for="source in widgetSources"
        :key="source"
        class="pb-source-tab"
        :class="{ active: activeWidgetSource === source }"
        @click="emit('update:widget-source', source)"
      >
        {{ source }}
      </button>
    </div>

    <div class="pb-widget-groups">
      <template v-for="group in groupedWidgets" :key="group.key">
        <button
          class="pb-group-header"
          :class="{ collapsed: collapsedGroups.has(group.key) }"
          @click="emit('toggle-group', group.key)"
        >
          <span class="pb-group-header-left">
            <span class="pb-group-icon">{{ group.icon }}</span>
            <span class="pb-group-label">{{ group.label }}</span>
          </span>
          <span class="pb-group-header-right">
            <span class="pb-chip pb-chip-sm">{{ group.widgets.length }}</span>
            <span class="pb-group-chevron">›</span>
          </span>
        </button>
        <div
          v-if="!collapsedGroups.has(group.key)"
          class="pb-widget-grid"
          :class="{ 'pb-widget-grid-2col': group.key === 'Native' }"
        >
          <button
            v-for="widget in group.widgets"
            :key="widget.key"
            draggable="true"
            class="pb-widget-card"
            :class="{ 'pb-widget-card-native': widget.source === 'native' }"
            :title="widget.label"
            @dragstart="emit('widget-drag-start', widget.key)"
            @click="emit('add-widget', widget.key)"
          >
            <span class="pb-widget-card-icon">{{ widgetIcon(widget) }}</span>
            <span class="pb-widget-card-label">{{ getWidgetShortLabel(widget) }}</span>
          </button>
        </div>
      </template>
      <p v-if="filteredWidgets.length === 0" class="pb-empty-small">
        No widgets found for this filter.
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type {
  PageBuilderPageInterface,
  PageBuilderWidgetDefinitionInterface,
  PageBuilderWidgetSourceFilter,
  WidgetGroup,
} from 'nucleify'
import { getWidgetShortLabel, widgetIcon } from 'nucleify'

interface Props {
  pages: PageBuilderPageInterface[]
  selectedPageId: number | null
  filteredWidgets: PageBuilderWidgetDefinitionInterface[]
  groupedWidgets: WidgetGroup[]
  collapsedGroups: Set<string>
  widgetSearch: string
  widgetSources: PageBuilderWidgetSourceFilter[]
  activeWidgetSource: PageBuilderWidgetSourceFilter
}

defineProps<Props>()

const emit = defineEmits<{
  'create-page': []
  'load-page': [pageId: number]
  'delete-page': [pageId: number]
  'update:widget-search': [value: string]
  'update:widget-source': [value: PageBuilderWidgetSourceFilter]
  'toggle-group': [key: string]
  'widget-drag-start': [widgetKey: string]
  'add-widget': [widgetKey: string]
}>()
</script>

<style lang="scss">
@import 'index';
</style>
