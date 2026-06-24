'use client'

import type { JSX } from 'react'
import { useMemo } from 'react'

import type { NucPageBuilderChildrenDropZoneProps } from '../interfaces'

import { NucPageBuilderCanvasNode } from '../canvas-node/index'

import './_index.scss'

export function NucPageBuilderChildrenDropZone({
  node,
  slotName,
  selectedNodeId,
  draggedNodeId,
  dropTarget,
  resolvedComponentTag,
  componentProps,
  widgetDisplayName,
  nodePreviewText,
  listItems,
  onNodeDragStart,
  onNodeDragEnd,
  onSelectNode,
  onRemoveNode,
  onContainerDragOver,
  onContainerDrop,
  onContainerDragLeave,
}: NucPageBuilderChildrenDropZoneProps): JSX.Element {
  const filteredChildren = useMemo(() => {
    if (!slotName) return node.children
    return node.children.filter((c) => (c.slot ?? 'default') === slotName)
  }, [node.children, slotName])

  const isDropTarget =
    dropTarget?.parentId === node.id && dropTarget?.slotName === slotName

  const isChildDropTarget = (childIndex: number): boolean => {
    return (
      dropTarget?.parentId === node.id &&
      dropTarget?.slotName === slotName &&
      dropTarget?.index === childIndex
    )
  }

  return (
    <div
      className={`pb-children-drop-zone${isDropTarget ? ' drop-active' : ''}`}
      data-container-id={node.id}
      data-slot-name={slotName ?? ''}
      onDragOver={(event) => {
        event.stopPropagation()
        event.preventDefault()
        onContainerDragOver({
          containerId: node.id,
          event: event.nativeEvent,
          slotName,
        })
      }}
      onDrop={(event) => {
        event.stopPropagation()
        event.preventDefault()
        onContainerDrop({ containerId: node.id, slotName })
      }}
      onDragLeave={(event) => {
        event.stopPropagation()
        onContainerDragLeave({ containerId: node.id, slotName })
      }}
    >
      {slotName ? <div className="pb-slot-label">{slotName}</div> : null}
      {filteredChildren.length === 0 ? (
        <div className="pb-children-empty">Drop widgets here</div>
      ) : null}
      {filteredChildren.map((child, childIdx) => (
        <div key={child.id}>
          <div
            className={`pb-drop-indicator${isChildDropTarget(childIdx) ? ' active' : ''}`}
          />
          <NucPageBuilderCanvasNode
            node={child}
            index={childIdx}
            parentId={node.id}
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
        className={`pb-drop-indicator${isChildDropTarget(filteredChildren.length) ? ' active' : ''}`}
      />
    </div>
  )
}

export default NucPageBuilderChildrenDropZone
