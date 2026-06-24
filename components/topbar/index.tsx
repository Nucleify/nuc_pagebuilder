'use client'

import type { JSX } from 'react'

import type { NucPageBuilderTopbarProps } from '../interfaces'

import './_index.scss'

export function NucPageBuilderTopbar({
  title,
  slug,
  lang,
  saveState,
  saveLabel,
  lastSavedLabel,
  autosaveEnabled,
  selectedPageId,
  selectedPageSlug,
  onTitleChange,
  onSlugChange,
  onAutosaveChange,
  onSave,
  onPublish,
  onUndo,
  onRedo,
}: NucPageBuilderTopbarProps): JSX.Element {
  return (
    <header className="pb-topbar pb-panel">
      <div className="pb-topbar-left">
        <input
          value={title}
          className="pb-input pb-input-title"
          placeholder="Page title"
          onChange={(event) => onTitleChange(event.target.value)}
        />
        <span className="pb-slug-prefix">/{lang}/</span>
        <input
          value={slug}
          className="pb-input pb-input-slug"
          placeholder="slug"
          onChange={(event) => onSlugChange(event.target.value)}
        />
      </div>

      <div className="pb-topbar-center">
        <div className={`pb-status pb-status-${saveState}`}>
          <span className="pb-status-dot" />
          {saveLabel}
          {lastSavedLabel ? (
            <span className="pb-status-time"> · {lastSavedLabel}</span>
          ) : null}
        </div>
      </div>

      <div className="pb-topbar-right">
        <button
          type="button"
          className="pb-btn pb-btn-sm"
          title="Undo (Ctrl+Z)"
          disabled={!selectedPageId}
          onClick={onUndo}
        >
          ↩
        </button>
        <button
          type="button"
          className="pb-btn pb-btn-sm"
          title="Redo (Ctrl+Y)"
          disabled={!selectedPageId}
          onClick={onRedo}
        >
          ↪
        </button>
        <span className="pb-topbar-sep" />
        <label className="pb-autosave-toggle" title="Autosave">
          <input
            type="checkbox"
            checked={autosaveEnabled}
            onChange={(event) => onAutosaveChange(event.target.checked)}
          />
          <span className="pb-autosave-label">Auto</span>
        </label>
        <span className="pb-topbar-sep" />
        <button
          type="button"
          className="pb-btn"
          disabled={!selectedPageId || saveState === 'saving'}
          onClick={onSave}
        >
          💾 Save
        </button>
        <button
          type="button"
          className="pb-btn pb-btn-primary"
          disabled={!selectedPageId || saveState === 'saving'}
          onClick={onPublish}
        >
          🚀 Publish
        </button>
        {selectedPageSlug ? (
          <a
            className="pb-btn"
            href={`/${lang}/${selectedPageSlug}`}
            target="_blank"
            rel="noreferrer"
          >
            ↗ Preview
          </a>
        ) : null}
      </div>
    </header>
  )
}

export default NucPageBuilderTopbar
