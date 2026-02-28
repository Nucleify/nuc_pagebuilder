import { GROUP_ICONS, GROUP_ORDER, WIDGET_ICONS } from '../constants'
import type {
  PageBuilderWidgetDefinitionInterface,
  WidgetGroup,
} from '../types'

export function getWidgetGroup(
  widget: PageBuilderWidgetDefinitionInterface
): string {
  if (widget.source === 'native') return 'Native'
  if (widget.source === 'templates') return 'Templates'
  if (widget.source === 'sections') return 'Sections'

  const match = widget.label.match(/^Atomic\s+(Atom|Molecule|Organism):\s+/)
  if (match) return match[1]
  return 'Other'
}

export function getWidgetShortLabel(
  widget: PageBuilderWidgetDefinitionInterface
): string {
  const atomicMatch = widget.label.match(
    /^Atomic\s+(?:Atom|Molecule|Organism):\s+(.+)$/
  )
  if (atomicMatch) return atomicMatch[1]

  const templateMatch = widget.label.match(/^(?:Template|Section):\s+(.+)$/)
  if (templateMatch) return templateMatch[1]

  return widget.label
}

export function widgetIcon(
  widget: PageBuilderWidgetDefinitionInterface
): string {
  if (WIDGET_ICONS[widget.key]) return WIDGET_ICONS[widget.key]
  const group = getWidgetGroup(widget)
  return GROUP_ICONS[group] ?? '📦'
}

export function buildGroupedWidgets(
  widgets: PageBuilderWidgetDefinitionInterface[]
): WidgetGroup[] {
  const groupedMap = new Map<string, PageBuilderWidgetDefinitionInterface[]>()

  for (const widget of widgets) {
    const groupKey = getWidgetGroup(widget)
    if (!groupedMap.has(groupKey)) groupedMap.set(groupKey, [])
    groupedMap.get(groupKey)!.push(widget)
  }

  const groups: WidgetGroup[] = []
  for (const key of GROUP_ORDER) {
    const groupWidgets = groupedMap.get(key)
    if (groupWidgets && groupWidgets.length > 0) {
      groups.push({
        key,
        label: key,
        icon: GROUP_ICONS[key] ?? '📦',
        widgets: groupWidgets,
      })
    }
  }

  return groups
}
