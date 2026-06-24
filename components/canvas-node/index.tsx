'use client'

import type { ComponentType, CSSProperties, JSX, ReactNode } from 'react'
import { createElement, useMemo } from 'react'

import type { NucPageBuilderCanvasNodeProps } from '../interfaces'

import {
  getWidgetSlots,
  isContainerType,
  nodeAcceptsChildren,
} from '../../utils/widget_helpers'
import { NucPageBuilderChildrenDropZone } from '../children-drop-zone/index.tsx'

import './_index.scss'

const CSS_HANDLED_PROPS = new Set(['width', 'height'])

function renderDynamicComponent(
  Resolved: string | ComponentType<Record<string, unknown>>,
  props: Record<string, unknown>,
  style: CSSProperties | undefined,
  children?: ReactNode
): JSX.Element {
  if (typeof Resolved === 'string') {
    return createElement(Resolved, { ...props, style }, children)
  }
  return (
    <Resolved {...props} style={style}>
      {children}
    </Resolved>
  )
}

export function NucPageBuilderCanvasNode({
  node,
  index,
  parentId,
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
}: NucPageBuilderCanvasNodeProps): JSX.Element {
  const acceptsChildren = nodeAcceptsChildren(node)
  const isNativeContainer = isContainerType(node.widgetType)
  const widgetSlots = getWidgetSlots(node)

  const leafWrapperStyle = useMemo((): CSSProperties => {
    if (node.widgetType !== 'component') return {}
    const cp = componentProps(node)
    const s: Record<string, string> = {}
    if (cp.width) {
      s.width = String(cp.width).match(/^\d+$/)
        ? `${cp.width}px`
        : String(cp.width)
    }
    if (cp.height) {
      s.height = String(cp.height).match(/^\d+$/)
        ? `${cp.height}px`
        : String(cp.height)
    }
    return s
  }, [node, componentProps])

  const leafComponentProps = useMemo((): Record<string, unknown> => {
    const cp = componentProps(node)
    const tag = String(node.props.componentTag ?? '')
      .trim()
      .toLowerCase()
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
  }, [node, componentProps])

  const nativeContainerStyle = useMemo((): CSSProperties => {
    const s: Record<string, string> = { ...node.styles }
    const p = node.props
    if (p.gap) s.gap = String(p.gap)
    if (p.alignItems) s.alignItems = String(p.alignItems)
    if (p.justifyContent) s.justifyContent = String(p.justifyContent)
    if (p.flexWrap) s.flexWrap = String(p.flexWrap)
    if (p.maxWidth) s.maxWidth = String(p.maxWidth)
    if (p.minHeight) s.minHeight = String(p.minHeight)
    return s
  }, [node])

  const dropZoneProps = {
    node,
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
  }

  const renderDropZone = (slotName?: string): JSX.Element => (
    <NucPageBuilderChildrenDropZone {...dropZoneProps} slotName={slotName} />
  )

  const renderNodeContent = (): JSX.Element => {
    if (node.widgetType === 'heading') {
      const level = String(node.props.level ?? 'h2')
      return createElement(
        level,
        { style: node.styles, className: 'pb-inline-preview' },
        String(node.props.text ?? '')
      )
    }

    if (node.widgetType === 'text') {
      return (
        <p style={node.styles} className="pb-inline-preview">
          {String(node.props.text ?? '')}
        </p>
      )
    }

    if (node.widgetType === 'button') {
      return (
        <a
          href={String(node.props.href ?? '#')}
          style={node.styles}
          className="pb-inline-preview pb-btn-preview"
          onClick={(event) => event.preventDefault()}
        >
          {String(node.props.text ?? '')}
        </a>
      )
    }

    if (node.widgetType === 'image') {
      return (
        <img
          src={String(node.props.src ?? '')}
          alt={String(node.props.alt ?? '')}
          style={{
            maxWidth: String(node.props.width || '100%'),
            ...node.styles,
          }}
          className="pb-inline-preview pb-image-preview"
        />
      )
    }

    if (node.widgetType === 'video') {
      return (
        <div className="pb-inline-preview pb-video-preview">
          <iframe
            src={String(node.props.src ?? '')}
            width={String(node.props.width ?? '100%')}
            height={String(node.props.height ?? '400')}
            frameBorder="0"
            allowFullScreen
            style={{ pointerEvents: 'none', borderRadius: '8px' }}
            title="Video preview"
          />
        </div>
      )
    }

    if (node.widgetType === 'divider') {
      return (
        <hr
          style={node.styles}
          className="pb-inline-preview pb-divider-preview"
        />
      )
    }

    if (node.widgetType === 'spacer') {
      return (
        <div
          className="pb-inline-preview pb-spacer-preview"
          style={{
            height: String(node.props.height ?? '40px'),
            ...node.styles,
          }}
        >
          <span className="pb-spacer-label">
            ↕ {String(node.props.height ?? '40px')}
          </span>
        </div>
      )
    }

    if (node.widgetType === 'html') {
      return (
        <div
          className="pb-inline-preview pb-html-preview"
          dangerouslySetInnerHTML={{
            __html: String(node.props.html ?? ''),
          }}
        />
      )
    }

    if (node.widgetType === 'list') {
      const ListTag = node.props.ordered ? 'ol' : 'ul'
      return createElement(
        ListTag,
        { style: node.styles, className: 'pb-inline-preview pb-list-preview' },
        listItems(node).map((item, itemIndex) => (
          <li key={itemIndex}>{item}</li>
        ))
      )
    }

    if (node.widgetType === 'quote') {
      return (
        <blockquote
          style={node.styles}
          className="pb-inline-preview pb-quote-preview"
        >
          <p>{String(node.props.text ?? '')}</p>
          {node.props.cite ? <cite>— {String(node.props.cite)}</cite> : null}
        </blockquote>
      )
    }

    if (node.widgetType === 'code') {
      return (
        <pre className="pb-inline-preview pb-code-preview">
          <code>{String(node.props.code ?? '')}</code>
        </pre>
      )
    }

    if (node.widgetType === 'component' && widgetSlots.length > 0) {
      const Resolved = resolvedComponentTag(node)
      const slotProps: Record<string, ReactNode> = {}
      for (const sName of widgetSlots) {
        slotProps[sName] = renderDropZone(sName)
      }
      return (
        <div className="pb-node-render">
          {renderDynamicComponent(
            Resolved,
            { ...componentProps(node), ...slotProps },
            node.styles
          )}
        </div>
      )
    }

    if (node.widgetType === 'component' && acceptsChildren) {
      const Resolved = resolvedComponentTag(node)
      return (
        <div className="pb-node-render">
          {renderDynamicComponent(
            Resolved,
            componentProps(node),
            node.styles,
            renderDropZone()
          )}
        </div>
      )
    }

    if (node.widgetType === 'component') {
      const Resolved = resolvedComponentTag(node)
      return (
        <div className="pb-node-render" style={leafWrapperStyle}>
          {renderDynamicComponent(Resolved, leafComponentProps, node.styles)}
        </div>
      )
    }

    if (isNativeContainer) {
      return (
        <div
          className={`pb-native-container-preview pb-native-${node.widgetType}`}
          style={nativeContainerStyle}
        >
          {renderDropZone()}
        </div>
      )
    }

    return <span className="pb-node-text">{nodePreviewText(node)}</span>
  }

  return (
    <div
      className={`pb-node${selectedNodeId === node.id ? ' selected' : ''}${draggedNodeId === node.id ? ' dragging' : ''}`}
      data-node-index={index}
      data-node-id={node.id}
      data-parent-id={parentId ?? 'root'}
      draggable
      onDragStart={(event) => {
        event.stopPropagation()
        onNodeDragStart(node.id)
      }}
      onDragEnd={onNodeDragEnd}
      onClick={(event) => {
        event.stopPropagation()
        onSelectNode(node.id)
      }}
    >
      <div className="pb-node-header">
        <span className="pb-node-title">
          {index + 1}. {widgetDisplayName(node)}
        </span>
        <button
          type="button"
          className="pb-node-delete"
          onClick={(event) => {
            event.stopPropagation()
            onRemoveNode(node.id)
          }}
        >
          ✕
        </button>
      </div>
      {renderNodeContent()}
    </div>
  )
}

export default NucPageBuilderCanvasNode
