'use client'

import type { JSX } from 'react'

import type { NucPageBuilderSidebarProps } from '../interfaces'

import { getWidgetShortLabel, widgetIcon } from '../../utils/widgets'

import './_index.scss'

export function NucPageBuilderSidebar({
  pages,
  selectedPageId,
  filteredWidgets,
  groupedWidgets,
  collapsedGroups,
  widgetSearch,
  widgetSources,
  activeWidgetSource,
  onCreatePage,
  onLoadPage,
  onDeletePage,
  onWidgetSearchChange,
  onWidgetSourceChange,
  onToggleGroup,
  onWidgetDragStart,
  onAddWidget,
}: NucPageBuilderSidebarProps): JSX.Element {
  return (
    <aside className="pb-sidebar pb-panel">
      <div className="pb-header-row">
        <h3>Pages</h3>
        <button type="button" className="pb-btn" onClick={onCreatePage}>
          + New
        </button>
      </div>
      <ul className="pb-pages-list">
        {pages.map((page) => (
          <li key={page.id}>
            <div
              className={`pb-page-item${selectedPageId === page.id ? ' active' : ''}`}
              onClick={() => onLoadPage(page.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  onLoadPage(page.id)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <span>{page.title}</span>
              <div className="pb-page-item-right">
                <small>{page.status}</small>
                <button
                  type="button"
                  className="pb-page-delete"
                  title="Delete page"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDeletePage(page.id)
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="pb-header-row pb-widget-header">
        <h3>Widgets</h3>
        <span className="pb-chip">{filteredWidgets.length}</span>
      </div>

      <div className="pb-widget-search-row">
        <svg
          className="pb-search-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={widgetSearch}
          className="pb-input pb-input-search"
          placeholder="Search widgets..."
          onChange={(event) => onWidgetSearchChange(event.target.value)}
        />
      </div>

      <div className="pb-source-tabs">
        {widgetSources.map((source) => (
          <button
            key={source}
            type="button"
            className={`pb-source-tab${activeWidgetSource === source ? ' active' : ''}`}
            onClick={() => onWidgetSourceChange(source)}
          >
            {source}
          </button>
        ))}
      </div>

      <div className="pb-widget-groups">
        {groupedWidgets.map((group) => (
          <div key={group.key}>
            <button
              type="button"
              className={`pb-group-header${collapsedGroups.has(group.key) ? ' collapsed' : ''}`}
              onClick={() => onToggleGroup(group.key)}
            >
              <span className="pb-group-header-left">
                <span className="pb-group-icon">{group.icon}</span>
                <span className="pb-group-label">{group.label}</span>
              </span>
              <span className="pb-group-header-right">
                <span className="pb-chip pb-chip-sm">
                  {group.widgets.length}
                </span>
                <span className="pb-group-chevron">›</span>
              </span>
            </button>
            {!collapsedGroups.has(group.key) ? (
              <div
                className={`pb-widget-grid${group.key === 'Native' ? ' pb-widget-grid-2col' : ''}`}
              >
                {group.widgets.map((widget) => (
                  <button
                    key={widget.key}
                    type="button"
                    draggable
                    className={`pb-widget-card${widget.source === 'native' ? ' pb-widget-card-native' : ''}`}
                    title={widget.label}
                    onDragStart={() => onWidgetDragStart(widget.key)}
                    onClick={() => onAddWidget(widget.key)}
                  >
                    <span className="pb-widget-card-icon">
                      {widgetIcon(widget)}
                    </span>
                    <span className="pb-widget-card-label">
                      {getWidgetShortLabel(widget)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {filteredWidgets.length === 0 ? (
          <p className="pb-empty-small">No widgets found for this filter.</p>
        ) : null}
      </div>
    </aside>
  )
}

export default NucPageBuilderSidebar
