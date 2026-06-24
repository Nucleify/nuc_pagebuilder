'use client'

import type { JSX } from 'react'
import { useRef } from 'react'

import type { NucPageBuilderCanvasProps } from '../interfaces'

import { NucPageBuilderCanvasNode } from '../canvas-node/index.tsx'

import './_index.scss'

export function NucPageBuilderCanvas({
  layout,
  selectedNodeId,
  draggedNodeId,
  dropTarget,
  resolvedComponentTag,
  componentProps,
  widgetDisplayName,
  nodePreviewText,
  listItems,
  onCanvasDragOver,
  onCanvasDrop,
  onCanvasDragLeave,
  onNodeDragStart,
  onNodeDragEnd,
  onSelectNode,
  onRemoveNode,
  onContainerDragOver,
  onContainerDrop,
  onContainerDragLeave,
}: NucPageBuilderCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLDivElement | null>(null)

  const isRootDropTarget = (index: number): boolean => {
    return dropTarget?.parentId === null && dropTarget?.index === index
  }

  const canvasStyle = layout.settings.bgColor
    ? { background: String(layout.settings.bgColor) }
    : undefined

  return (
    <main className="pb-canvas-wrapper pb-panel" style={canvasStyle}>
      <div className="pb-hint">
        Drag or click widgets to add · Ctrl+S save · Ctrl+Z undo · Ctrl+Y redo
      </div>
      <div
        ref={canvasRef}
        className="pb-canvas"
        onDragOver={(event) => {
          event.preventDefault()
          onCanvasDragOver(event.nativeEvent, canvasRef.current)
        }}
        onDrop={(event) => {
          event.preventDefault()
          onCanvasDrop()
        }}
        onDragLeave={onCanvasDragLeave}
      >
        {layout.children.length === 0 ? (
          <div className="pb-empty">Empty page. Drop first widget.</div>
        ) : null}
        {layout.children.map((node, index) => (
          <div key={node.id}>
            <div
              className={`pb-drop-indicator${isRootDropTarget(index) ? ' active' : ''}`}
            />
            <NucPageBuilderCanvasNode
              node={node}
              index={index}
              parentId={null}
              selectedNodeId={selectedNodeId}
              draggedNodeId={draggedNodeId}
              dropTarget={dropTarget}
              resolvedComponentTag={resolvedComponentTag}
              componentProps={componentProps}
              widgetDisplayName={widgetDisplayName}
              nodePreviewText={nodePreviewText}
              listItems={listItems}
              onNodeDragStart={onNodeDragStart}
              onNodeDragEnd={onNodeDragEnd}
              onSelectNode={onSelectNode}
              onRemoveNode={onRemoveNode}
              onContainerDragOver={onContainerDragOver}
              onContainerDrop={onContainerDrop}
              onContainerDragLeave={onContainerDragLeave}
            />
          </div>
        ))}
        <div
          className={`pb-drop-indicator${isRootDropTarget(layout.children.length) ? ' active' : ''}`}
        />
      </div>
    </main>
  )
}

export default NucPageBuilderCanvas
