import { describe, expect, test } from 'vitest'

import {
  createLayout,
  createNode,
  findNodeById,
  findParentOfNode,
  getSlotChildren,
  getWidgetSlots,
  insertAtSlotIndex,
  insertNodeAt,
  isContainerType,
  removeNodeById,
  setRowColumns,
} from '../components/pagebuilder'

describe('nuc_pagebuilder layout utils', () => {
  test('createLayout returns empty page layout', () => {
    const layout = createLayout()

    expect(layout.type).toBe('page')
    expect(Array.isArray(layout.children)).toBe(true)
    expect(layout.children).toHaveLength(0)
    expect(layout.settings).toEqual({})
    expect(typeof layout.id).toBe('string')
  })

  test('createNode creates heading widget with defaults', () => {
    const node = createNode('native-heading')

    expect(node.type).toBe('widget')
    expect(node.widgetType).toBe('heading')
    expect(node.props).toHaveProperty('text')
  })

  test('createNode creates component widget from registry', () => {
    const node = createNode('templates-grid-background')

    expect(node.widgetType).toBe('component')
    expect(node.props).toHaveProperty('componentTag', 'nuc-grid-background')
    expect(node.props).toHaveProperty('componentProps')
    expect(node.props.componentProps).toHaveProperty('adType', 'main')
  })

  test('createNode for unknown key falls back to text widget', () => {
    const node = createNode('non-existent-key')

    expect(node.widgetType).toBe('text')
    expect(node.type).toBe('widget')
    expect(node.children).toHaveLength(0)
  })

  test('createNode for row creates columns', () => {
    const node = createNode('native-row')

    expect(node.widgetType).toBe('row')
    expect(node.children.length).toBeGreaterThanOrEqual(1)
    node.children.forEach((col) => {
      expect(col.widgetType).toBe('column')
      expect(col.props).toHaveProperty('gap', '16px')
    })
  })

  test('setRowColumns adds and removes columns', () => {
    const row = createNode('native-row')
    const initialCount = row.children.length

    setRowColumns(row, 5)
    expect(row.children).toHaveLength(5)

    setRowColumns(row, 2)
    expect(row.children).toHaveLength(2)

    setRowColumns(row, initialCount)
    expect(row.children).toHaveLength(initialCount)
  })

  test('isContainerType returns true for row, column, container, section', () => {
    expect(isContainerType('row')).toBe(true)
    expect(isContainerType('column')).toBe(true)
    expect(isContainerType('container')).toBe(true)
    expect(isContainerType('section')).toBe(true)
    expect(isContainerType('heading')).toBe(false)
    expect(isContainerType('component')).toBe(false)
  })

  test('findNodeById finds node in tree and returns null when missing', () => {
    const layout = createLayout()
    const child = createNode('native-text')
    layout.children.push(child)

    expect(findNodeById(layout.children, child.id)).toEqual(child)
    expect(findNodeById(layout.children, 'missing-id')).toBeNull()
  })

  test('findParentOfNode returns parent array and index', () => {
    const layout = createLayout()
    const child = createNode('native-text')
    layout.children.push(child)

    const result = findParentOfNode(layout.children, child.id)
    expect(result).not.toBeNull()
    expect(result!.parent).toBe(layout.children)
    expect(result!.index).toBe(0)
    expect(findParentOfNode(layout.children, 'missing')).toBeNull()
  })

  test('removeNodeById removes node and returns true', () => {
    const layout = createLayout()
    const child = createNode('native-text')
    layout.children.push(child)

    expect(removeNodeById(layout.children, child.id)).toBe(true)
    expect(layout.children).toHaveLength(0)
    expect(removeNodeById(layout.children, child.id)).toBe(false)
  })

  test('insertNodeAt inserts at root or under parent', () => {
    const layout = createLayout()
    const node = createNode('native-heading')

    expect(insertNodeAt(layout.children, null, 0, node)).toBe(true)
    expect(layout.children).toHaveLength(1)
    expect(layout.children[0]).toBe(node)

    const child = createNode('native-text')
    expect(insertNodeAt(layout.children, layout.children[0].id, 0, child)).toBe(
      true
    )
    expect(layout.children[0].children).toHaveLength(1)

    const section = createNode('native-section')
    layout.children.push(section)
    const second = createNode('native-text')
    expect(insertNodeAt(layout.children, section.id, 0, second)).toBe(true)
    expect(section.children).toHaveLength(1)
  })

  test('getSlotChildren filters children by slot name', () => {
    const component = createNode('templates-grid-background')
    const a = createNode('native-text')
    const b = createNode('native-text')
    a.slot = 'header'
    b.slot = 'default'
    component.children.push(a, b)

    expect(getSlotChildren(component, 'header')).toHaveLength(1)
    expect(getSlotChildren(component, 'header')[0]).toBe(a)
    expect(getSlotChildren(component, 'default')).toHaveLength(1)
    expect(getSlotChildren(component, 'footer')).toHaveLength(0)
  })

  test('getWidgetSlots returns undefined for native widget', () => {
    const heading = createNode('native-heading')
    expect(getWidgetSlots(heading)).toBeUndefined()
  })

  test('insertAtSlotIndex inserts child with slot and index', () => {
    const parentChildren: ReturnType<typeof createNode>[] = []
    const first = createNode('native-text')
    first.slot = 'header'
    parentChildren.push(first)

    const second = createNode('native-text')
    insertAtSlotIndex(parentChildren, 'header', 1, second)

    expect(second.slot).toBe('header')
    expect(parentChildren).toHaveLength(2)
    insertAtSlotIndex(parentChildren, undefined, 0, createNode('native-text'))
    expect(parentChildren).toHaveLength(3)
  })
})
