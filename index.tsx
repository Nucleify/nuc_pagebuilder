'use client'

import type { JSX } from 'react'

import { NucPageBuilderCanvas } from './components/canvas/index'
import { NucPageBuilderDialogs } from './components/dialogs/index'
import { NucPageBuilderInspector } from './components/inspector/index'
import { NucPageBuilderSidebar } from './components/sidebar/index'
import { NucPageBuilderTopbar } from './components/topbar/index'
import { usePagebuilderEditor } from './utils/use_pagebuilder_editor.react'

import './_index.scss'

export function NucPageBuilderEditor(): JSX.Element {
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
    containerPropsSchema,
    createPage,
    draggedNodeId,
    dropTarget,
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
    nativeStyleSchema,
    nodePreviewText,
    nodeWidgetDisplayName,
    onCanvasDragLeave,
    onCanvasDragOver,
    onCanvasDrop,
    onComponentPropsJsonInput,
    onContainerDragLeave,
    onContainerDragOver,
    onContainerDrop,
    onCustomStylesInput,
    onNodeDragEnd,
    onNodeDragStart,
    onNodePropChange,
    onNodeStyleChange,
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
    selectedNodeIsContainer,
    selectedPageId,
    selectedPageSlug,
    setActiveWidgetSource,
    setAutosaveEnabled,
    setComponentProp,
    setComponentPropJson,
    setConfirmDeleteNodeId,
    setConfirmDeletePageId,
    setForm,
    setInspectorTab,
    setPageStyleLang,
    setWidgetSearch,
    onSetRowColumns,
    toggleGroup,
    undo,
    widgetSearch,
    widgetSources,
  } = usePagebuilderEditor()

  return (
    <section className="pb-editor">
      <NucPageBuilderTopbar
        title={form.title}
        slug={form.slug}
        lang={lang}
        saveState={saveState}
        saveLabel={saveLabel}
        lastSavedLabel={lastSavedLabel}
        autosaveEnabled={autosaveEnabled}
        selectedPageId={selectedPageId}
        selectedPageSlug={selectedPageSlug}
        onTitleChange={(title) => setForm((prev) => ({ ...prev, title }))}
        onSlugChange={(slug) => setForm((prev) => ({ ...prev, slug }))}
        onAutosaveChange={setAutosaveEnabled}
        onSave={() => void saveDraft()}
        onPublish={() => void publishPage()}
        onUndo={undo}
        onRedo={redo}
      />

      <div className="pb-layout">
        <NucPageBuilderSidebar
          pages={pages}
          selectedPageId={selectedPageId}
          filteredWidgets={filteredWidgets}
          groupedWidgets={groupedWidgets}
          collapsedGroups={collapsedGroups}
          widgetSearch={widgetSearch}
          widgetSources={widgetSources}
          activeWidgetSource={activeWidgetSource}
          onCreatePage={() => void createPage()}
          onLoadPage={(pageId) => void loadPage(pageId)}
          onDeletePage={setConfirmDeletePageId}
          onWidgetSearchChange={setWidgetSearch}
          onWidgetSourceChange={setActiveWidgetSource}
          onToggleGroup={toggleGroup}
          onWidgetDragStart={onWidgetDragStart}
          onAddWidget={addWidget}
        />

        <NucPageBuilderCanvas
          layout={layout}
          selectedNodeId={selectedNodeId}
          draggedNodeId={draggedNodeId}
          dropTarget={dropTarget}
          resolvedComponentTag={resolvedComponentTag}
          componentProps={componentProps}
          widgetDisplayName={nodeWidgetDisplayName}
          nodePreviewText={nodePreviewText}
          listItems={listItems}
          onCanvasDragOver={onCanvasDragOver}
          onCanvasDrop={onCanvasDrop}
          onCanvasDragLeave={onCanvasDragLeave}
          onNodeDragStart={onNodeDragStart}
          onNodeDragEnd={onNodeDragEnd}
          onSelectNode={selectNode}
          onRemoveNode={removeNode}
          onContainerDragOver={onContainerDragOver}
          onContainerDrop={onContainerDrop}
          onContainerDragLeave={onContainerDragLeave}
        />

        <NucPageBuilderInspector
          inspectorTab={inspectorTab}
          pageStyleLang={pageStyleLang}
          pageCustomStyles={pageCustomStyles}
          layout={layout}
          lang={lang}
          selectedPageSlug={selectedPageSlug}
          formSlug={form.slug}
          selectedNode={selectedNode}
          selectedNodeIsContainer={selectedNodeIsContainer}
          hasTextProp={hasTextProp}
          activeComponentSchema={activeComponentSchema}
          containerPropsSchema={containerPropsSchema}
          nativeStyleSchema={nativeStyleSchema}
          getComponentProp={getComponentProp}
          componentPropsJson={componentPropsJson}
          componentJsonError={componentJsonError}
          onInspectorTabChange={setInspectorTab}
          onPageStyleLangChange={setPageStyleLang}
          onSettingChange={onSettingChange}
          onNodePropChange={onNodePropChange}
          onNodeStyleChange={onNodeStyleChange}
          onCustomStylesInput={onCustomStylesInput}
          onSetComponentProp={setComponentProp}
          onSetComponentPropJson={setComponentPropJson}
          onComponentPropsJsonInput={onComponentPropsJsonInput}
          onSetRowColumns={onSetRowColumns}
        />
      </div>

      {pageCustomStyles ? <style>{pageCustomStyles}</style> : null}

      <NucPageBuilderDialogs
        confirmDeleteNodeId={confirmDeleteNodeId}
        confirmDeleteNodeName={confirmDeleteNodeName}
        confirmDeletePageId={confirmDeletePageId}
        confirmDeletePageName={confirmDeletePageName}
        onCloseNodeDialog={() => setConfirmDeleteNodeId(null)}
        onConfirmRemoveNode={confirmRemoveNode}
        onClosePageDialog={() => setConfirmDeletePageId(null)}
        onConfirmDeletePage={confirmDeletePage}
      />
    </section>
  )
}

export default NucPageBuilderEditor
