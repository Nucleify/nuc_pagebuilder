'use client'

import type { ComponentType, CSSProperties, JSX, ReactNode } from 'react'
import { createElement, useMemo } from 'react'

import type { NucPageBuilderRenderNodeProps } from '../interfaces'

import { getWidgetSlots } from '../../utils/widget_helpers'

import './_index.scss'

function renderDynamicComponent(
  Resolved: string | ComponentType<Record<string, unknown>>,
  props: Record<string, unknown>,
  className: string,
  style: CSSProperties | undefined,
  children?: ReactNode
): JSX.Element {
  if (typeof Resolved === 'string') {
    return createElement(Resolved, { ...props, className, style }, children)
  }
  return (
    <Resolved {...props} className={className} style={style}>
      {children}
    </Resolved>
  )
}

export function NucPageBuilderRenderNode({
  node,
  resolveComponentTag,
  componentProps,
}: NucPageBuilderRenderNodeProps): JSX.Element {
  const nodeText = String(node.props.text ?? '')
  const widgetSlots = getWidgetSlots(node)
  const hasNamedSlots = widgetSlots.length > 0

  const resolvedHeadingTag = useMemo(() => {
    const level = String(node.props.level ?? 'h2')
    return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(level) ? level : 'h2'
  }, [node.props.level])

  const listItemsArray = useMemo(() => {
    const raw = String(node.props.items ?? '')
    return raw.split('\n').filter((line) => line.trim() !== '')
  }, [node.props.items])

  const containerStyles = useMemo((): CSSProperties => {
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

  const renderChild = (child: typeof node): JSX.Element => (
    <NucPageBuilderRenderNode
      key={child.id}
      node={child}
      resolveComponentTag={resolveComponentTag}
      componentProps={componentProps}
    />
  )

  const slotChildren = (slotName: string) =>
    node.children.filter((c) => (c.slot ?? 'default') === slotName)

  if (node.widgetType === 'component' && hasNamedSlots) {
    const Resolved = resolveComponentTag(node)
    const slotProps: Record<string, ReactNode> = {}
    for (const sName of widgetSlots) {
      slotProps[sName] = slotChildren(sName).map(renderChild)
    }
    return renderDynamicComponent(
      Resolved,
      { ...componentProps(node), ...slotProps },
      'page-builder-node',
      node.styles
    )
  }

  if (node.widgetType === 'component') {
    const Resolved = resolveComponentTag(node)
    return renderDynamicComponent(
      Resolved,
      componentProps(node),
      'page-builder-node',
      node.styles,
      node.children.map(renderChild)
    )
  }

  if (node.widgetType === 'container') {
    return (
      <div
        className="page-builder-node page-builder-container-block"
        style={containerStyles}
      >
        {node.children.map(renderChild)}
      </div>
    )
  }

  if (node.widgetType === 'row') {
    return (
      <div
        className="page-builder-node page-builder-row"
        style={containerStyles}
      >
        {node.children.map(renderChild)}
      </div>
    )
  }

  if (node.widgetType === 'column') {
    return (
      <div
        className="page-builder-node page-builder-column"
        style={containerStyles}
      >
        {node.children.map(renderChild)}
      </div>
    )
  }

  if (node.widgetType === 'section') {
    return (
      <section
        className="page-builder-node page-builder-section"
        style={containerStyles}
      >
        {node.children.map(renderChild)}
      </section>
    )
  }

  if (node.widgetType === 'heading') {
    return createElement(
      resolvedHeadingTag,
      { className: 'page-builder-node', style: node.styles },
      nodeText
    )
  }

  if (node.widgetType === 'button') {
    return (
      <a
        className="page-builder-node page-builder-btn"
        href={String(node.props.href ?? '#')}
        style={node.styles}
      >
        {nodeText}
      </a>
    )
  }

  if (node.widgetType === 'image') {
    return (
      <img
        className="page-builder-node"
        src={String(node.props.src ?? '')}
        alt={String(node.props.alt ?? '')}
        style={{
          maxWidth: String(node.props.width || '100%'),
          ...node.styles,
        }}
      />
    )
  }

  if (node.widgetType === 'video') {
    return (
      <iframe
        className="page-builder-node"
        src={String(node.props.src ?? '')}
        width={String(node.props.width ?? '100%')}
        height={String(node.props.height ?? '400')}
        frameBorder="0"
        allowFullScreen
        loading="lazy"
        style={node.styles}
        title="Embedded video"
      />
    )
  }

  if (node.widgetType === 'divider') {
    return (
      <hr
        className="page-builder-node page-builder-divider"
        style={node.styles}
      />
    )
  }

  if (node.widgetType === 'spacer') {
    return (
      <div
        className="page-builder-node"
        style={{
          height: String(node.props.height ?? '40px'),
          ...node.styles,
        }}
      />
    )
  }

  if (node.widgetType === 'html') {
    return (
      <div
        className="page-builder-node"
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
      { className: 'page-builder-node page-builder-list', style: node.styles },
      listItemsArray.map((item, i) => <li key={i}>{item}</li>)
    )
  }

  if (node.widgetType === 'quote') {
    return (
      <blockquote
        className="page-builder-node page-builder-quote"
        style={node.styles}
      >
        <p>{nodeText}</p>
        {node.props.cite ? <cite>— {String(node.props.cite)}</cite> : null}
      </blockquote>
    )
  }

  if (node.widgetType === 'code') {
    return (
      <pre className="page-builder-node page-builder-code" style={node.styles}>
        <code>{String(node.props.code ?? '')}</code>
      </pre>
    )
  }

  return (
    <p className="page-builder-node" style={node.styles}>
      {nodeText}
    </p>
  )
}

export default NucPageBuilderRenderNode
