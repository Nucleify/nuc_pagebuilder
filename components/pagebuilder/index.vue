<template>
  <section class="pb-editor">
    <Topbar
      :title="form.title"
      :slug="form.slug"
      :lang="lang"
      :save-state="saveState"
      :save-label="saveLabel"
      :last-saved-label="lastSavedLabel"
      :autosave-enabled="autosaveEnabled"
      :selected-page-id="selectedPageId"
      :selected-page-slug="selectedPageSlug"
      @update:title="form.title = $event"
      @update:slug="form.slug = $event"
      @update:autosave="autosaveEnabled = $event"
      @save="saveDraft"
      @publish="publishPage"
      @undo="undo"
      @redo="redo"
    />

    <div class="pb-layout">
      <Sidebar
        :pages="pages"
        :selected-page-id="selectedPageId"
        :filtered-widgets="filteredWidgets"
        :grouped-widgets="groupedWidgets"
        :collapsed-groups="collapsedGroups"
        :widget-search="widgetSearch"
        :widget-sources="widgetSources"
        :active-widget-source="activeWidgetSource"
        @create-page="createPage"
        @load-page="loadPage"
        @delete-page="confirmDeletePageId = $event"
        @update:widget-search="widgetSearch = $event"
        @update:widget-source="activeWidgetSource = $event"
        @toggle-group="toggleGroup"
        @widget-drag-start="onWidgetDragStart"
        @add-widget="addWidget"
      />

      <Canvas
        :layout="layout"
        :selected-node-id="selectedNodeId"
        :dragged-node-id="draggedNodeId"
        :drop-target-index="dropTargetIndex"
        :resolved-component-tag="resolvedComponentTag"
        :component-props="componentProps"
        :widget-display-name="nodeWidgetDisplayName"
        :node-preview-text="nodePreviewText"
        :list-items="listItems"
        @canvas-drag-over="onCanvasDragOver"
        @canvas-drop="onCanvasDrop"
        @canvas-drag-leave="onCanvasDragLeave"
        @node-drag-start="onNodeDragStart"
        @node-drag-end="onNodeDragEnd"
        @select-node="selectNode"
        @remove-node="removeNode"
      />

      <Inspector
        :inspector-tab="inspectorTab"
        :page-style-lang="pageStyleLang"
        :page-custom-styles="pageCustomStyles"
        :layout="layout"
        :lang="lang"
        :selected-page-slug="selectedPageSlug"
        :form-slug="form.slug"
        :selected-node="selectedNode"
        :has-text-prop="hasTextProp"
        :active-component-schema="activeComponentSchema"
        :get-component-prop="getComponentProp"
        :component-props-json="componentPropsJson"
        :component-json-error="componentJsonError"
        @update:inspector-tab="inspectorTab = $event"
        @update:page-style-lang="pageStyleLang = $event"
        @setting-change="onSettingChange"
        @node-prop-change="onNodePropChange"
        @custom-styles-input="onCustomStylesInput"
        @set-component-prop="setComponentProp"
        @set-component-prop-json="setComponentPropJson"
        @component-props-json-input="onComponentPropsJsonInput"
      />
    </div>
  </section>

  <component :is="'style'" v-if="pageCustomStyles">{{ pageCustomStyles }}</component>

  <Dialogs
    :confirm-delete-node-id="confirmDeleteNodeId"
    :confirm-delete-node-name="confirmDeleteNodeName"
    :confirm-delete-page-id="confirmDeletePageId"
    :confirm-delete-page-name="confirmDeletePageName"
    @close-node-dialog="confirmDeleteNodeId = null"
    @confirm-remove-node="confirmRemoveNode"
    @close-page-dialog="confirmDeletePageId = null"
    @confirm-delete-page="confirmDeletePage"
  />
</template>

<script setup lang="ts">
import Canvas from './components/Canvas/index.vue'
import Dialogs from './components/Dialogs/index.vue'
import Inspector from './components/Inspector/index.vue'
import Sidebar from './components/Sidebar/index.vue'
import Topbar from './components/Topbar/index.vue'
import { usePagebuilderEditor } from './utils/use_pagebuilder_editor'

const {
  activeComponentSchema,
  activeWidgetSource,
  addWidget,
  autosaveEnabled,
  collapsedGroups,
  componentJsonError,
  componentProps,
  componentPropsJson,
  confirmDeleteNodeId,
  confirmDeleteNodeName,
  confirmDeletePage,
  confirmDeletePageId,
  confirmDeletePageName,
  confirmRemoveNode,
  createPage,
  draggedNodeId,
  dropTargetIndex,
  filteredWidgets,
  form,
  getComponentProp,
  groupedWidgets,
  hasTextProp,
  inspectorTab,
  lang,
  lastSavedLabel,
  layout,
  listItems,
  loadPage,
  nodePreviewText,
  nodeWidgetDisplayName,
  onCanvasDragLeave,
  onCanvasDragOver,
  onCanvasDrop,
  onComponentPropsJsonInput,
  onCustomStylesInput,
  onNodeDragEnd,
  onNodeDragStart,
  onNodePropChange,
  onSettingChange,
  onWidgetDragStart,
  pageCustomStyles,
  pageStyleLang,
  pages,
  publishPage,
  redo,
  removeNode,
  resolvedComponentTag,
  saveDraft,
  saveLabel,
  saveState,
  selectNode,
  selectedNode,
  selectedNodeId,
  selectedPageId,
  selectedPageSlug,
  setComponentProp,
  setComponentPropJson,
  toggleGroup,
  undo,
  widgetSearch,
  widgetSources,
} = usePagebuilderEditor()
</script>

<style lang="scss" src="./_index.scss"></style>

