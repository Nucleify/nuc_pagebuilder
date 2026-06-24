'use client'

import type { JSX } from 'react'
import { useCallback, useMemo } from 'react'

import type { NucPageBuilderRenderProps } from './components/interfaces'
import { NucPageBuilderRenderNode } from './components/render-node/index'
import {
  buildLocalAtomicComponentsReact,
  getComponentProps,
  resolveComponentTagReact,
} from './utils/components.react'

import './render.scss'

export function NucPageBuilderRender({
  layout,
}: NucPageBuilderRenderProps): JSX.Element {
  const localAtomicComponents = useMemo(
    () => buildLocalAtomicComponentsReact(),
    []
  )

  const nodes = layout?.children ?? []

  const resolvedComponentTag = useCallback(
    (node: Parameters<typeof resolveComponentTagReact>[0]) => {
      return resolveComponentTagReact(node, localAtomicComponents, {})
    },
    [localAtomicComponents]
  )

  const componentProps = useCallback(
    (node: Parameters<typeof getComponentProps>[0]) => {
      return getComponentProps(node)
    },
    []
  )

  return (
    <section className="page-builder-renderer">
      <div className="page-builder-container">
        {nodes.map((node) => (
          <NucPageBuilderRenderNode
            key={node.id}
            node={node}
            resolveComponentTag={resolvedComponentTag}
            componentProps={componentProps}
          />
        ))}
      </div>
    </section>
  )
}

export default NucPageBuilderRender
