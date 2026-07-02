'use client'

import type { JSX } from 'react'

import { AdSelect } from 'nucleify'

import type { NucPageBuilderInspectorProps } from '../interfaces'

import { jsonStringify } from '../../utils/json_stringify'

import './_index.scss'

export function NucPageBuilderInspector({
  inspectorTab,
  pageStyleLang,
  pageCustomStyles,
  layout,
  lang,
  selectedPageSlug,
  formSlug,
  selectedNode,
  selectedNodeIsContainer,
  hasTextProp,
  activeComponentSchema,
  containerPropsSchema,
  nativeStyleSchema,
  getComponentProp,
  componentPropsJson,
  componentJsonError,
  onInspectorTabChange,
  onPageStyleLangChange,
  onSettingChange,
  onNodePropChange,
  onNodeStyleChange,
  onCustomStylesInput,
  onSetComponentProp,
  onSetComponentPropJson,
  onComponentPropsJsonInput,
  onSetRowColumns,
}: NucPageBuilderInspectorProps): JSX.Element {
  return (
    <aside className="pb-inspector pb-panel">
      <div className="pb-inspector-tabs">
        <button
          type="button"
          className={`pb-inspector-tab${inspectorTab === 'widget' ? ' active' : ''}`}
          onClick={() => onInspectorTabChange('widget')}
        >
          Widget
        </button>
        {selectedNode?.widgetType === 'component' ? (
          <button
            type="button"
            className={`pb-inspector-tab${inspectorTab === 'props' ? ' active' : ''}`}
            onClick={() => onInspectorTabChange('props')}
          >
            Props
          </button>
        ) : null}
        <button
          type="button"
          className={`pb-inspector-tab${inspectorTab === 'page' ? ' active' : ''}`}
          onClick={() => onInspectorTabChange('page')}
        >
          Page
        </button>
        <button
          type="button"
          className={`pb-inspector-tab${inspectorTab === 'styles' ? ' active' : ''}`}
          onClick={() => onInspectorTabChange('styles')}
        >
          Styles
        </button>
      </div>

      {inspectorTab === 'page' ? (
        <div className="pb-inspector-body">
          <h4 className="pb-inspector-section">SEO & Meta</h4>
          <label className="pb-label">
            Meta title
            <input
              className="pb-input"
              value={String(layout.settings.metaTitle ?? '')}
              placeholder="Page title for search engines"
              onChange={(event) =>
                onSettingChange('metaTitle', event.target.value)
              }
            />
          </label>
          <label className="pb-label">
            Meta description
            <textarea
              className="pb-textarea"
              value={String(layout.settings.metaDescription ?? '')}
              placeholder="Short description for search engines"
              onChange={(event) =>
                onSettingChange('metaDescription', event.target.value)
              }
            />
          </label>
          <label className="pb-label">
            OG image URL
            <input
              className="pb-input"
              value={String(layout.settings.ogImage ?? '')}
              placeholder="https://example.com/image.jpg"
              onChange={(event) =>
                onSettingChange('ogImage', event.target.value)
              }
            />
          </label>

          <h4 className="pb-inspector-section">Layout</h4>
          <label className="pb-label">
            Max width
            <input
              className="pb-input"
              value={String(layout.settings.maxWidth ?? '1140px')}
              placeholder="e.g. 1140px, 100%"
              onChange={(event) =>
                onSettingChange('maxWidth', event.target.value)
              }
            />
          </label>
          <label className="pb-label">
            Page padding
            <input
              className="pb-input"
              value={String(layout.settings.pagePadding ?? '0')}
              placeholder="e.g. 48px 16px"
              onChange={(event) =>
                onSettingChange('pagePadding', event.target.value)
              }
            />
          </label>
          <label className="pb-label">
            Background color
            <div className="pb-color-row">
              <input
                type="color"
                className="pb-color-input"
                value={String(layout.settings.bgColor ?? '#000000')}
                onChange={(event) =>
                  onSettingChange('bgColor', event.target.value)
                }
              />
              <input
                className="pb-input"
                value={String(layout.settings.bgColor ?? '')}
                placeholder="#000000"
                onChange={(event) =>
                  onSettingChange('bgColor', event.target.value)
                }
              />
            </div>
          </label>

          <h4 className="pb-inspector-section">Info</h4>
          <div className="pb-info-grid">
            <span>Sections</span>
            <span>{layout.children.length}</span>
            <span>Status</span>
            <span>{selectedPageSlug ? 'saved' : 'new'}</span>
            <span>Slug</span>
            <span>
              /{lang}/{formSlug || '—'}
            </span>
          </div>
        </div>
      ) : null}

      {inspectorTab === 'widget' ? (
        <div className="pb-inspector-body">
          {selectedNode ? (
            <>
              <p className="pb-inspector-type">{selectedNode.widgetType}</p>

              {selectedNode.widgetType === 'row' ? (
                <>
                  <h4 className="pb-inspector-section">Columns</h4>
                  <div className="pb-columns-control">
                    <button
                      type="button"
                      className="pb-col-btn"
                      disabled={selectedNode.children.length <= 1}
                      onClick={() =>
                        onSetRowColumns(selectedNode.children.length - 1)
                      }
                    >
                      −
                    </button>
                    <span className="pb-col-count">
                      {selectedNode.children.length}
                    </span>
                    <button
                      type="button"
                      className="pb-col-btn"
                      disabled={selectedNode.children.length >= 12}
                      onClick={() =>
                        onSetRowColumns(selectedNode.children.length + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  <div className="pb-col-presets">
                    {[1, 2, 3, 4, 6].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`pb-col-preset${selectedNode.children.length === n ? ' active' : ''}`}
                        onClick={() => onSetRowColumns(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {selectedNodeIsContainer && selectedNode.widgetType !== 'row' ? (
                <div className="pb-container-info">
                  <span>{selectedNode.children.length} children</span>
                </div>
              ) : null}

              {selectedNodeIsContainer ? (
                <>
                  <h4 className="pb-inspector-section">Layout</h4>
                  {containerPropsSchema.map((field) => {
                    if (field.type === 'string') {
                      return (
                        <label key={field.key} className="pb-label">
                          {field.label}
                          <input
                            className="pb-input"
                            value={String(
                              selectedNode.props[field.key] ??
                                field.default ??
                                ''
                            )}
                            placeholder={field.placeholder}
                            onChange={(event) =>
                              onNodePropChange(field.key, event.target.value)
                            }
                          />
                        </label>
                      )
                    }
                    if (field.type === 'select') {
                      return (
                        <label key={field.key} className="pb-label">
                          {field.label}
                          <select
                            className="pb-input"
                            value={String(
                              selectedNode.props[field.key] ??
                                field.default ??
                                ''
                            )}
                            onChange={(event) =>
                              onNodePropChange(field.key, event.target.value)
                            }
                          >
                            {(field.options ?? []).map((option) => (
                              <option key={option} value={option}>
                                {option || '(default)'}
                              </option>
                            ))}
                          </select>
                        </label>
                      )
                    }
                    return null
                  })}
                </>
              ) : null}

              {hasTextProp ? (
                <label className="pb-label">
                  Text
                  <textarea
                    className="pb-textarea"
                    value={String(selectedNode.props.text ?? '')}
                    onChange={(event) =>
                      onNodePropChange('text', event.target.value)
                    }
                  />
                </label>
              ) : null}

              {selectedNode.widgetType === 'heading' ? (
                <label className="pb-label">
                  Heading level
                  <select
                    className="pb-input"
                    value={String(selectedNode.props.level ?? 'h2')}
                    onChange={(event) =>
                      onNodePropChange('level', event.target.value)
                    }
                  >
                    {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {selectedNode.widgetType === 'button' ? (
                <label className="pb-label">
                  Button link
                  <input
                    className="pb-input"
                    value={String(selectedNode.props.href ?? '#')}
                    onChange={(event) =>
                      onNodePropChange('href', event.target.value)
                    }
                  />
                </label>
              ) : null}

              {selectedNode.widgetType === 'image' ? (
                <>
                  <label className="pb-label">
                    Image URL
                    <input
                      className="pb-input"
                      value={String(selectedNode.props.src ?? '')}
                      onChange={(event) =>
                        onNodePropChange('src', event.target.value)
                      }
                    />
                  </label>
                  <label className="pb-label">
                    Alt text
                    <input
                      className="pb-input"
                      value={String(selectedNode.props.alt ?? '')}
                      onChange={(event) =>
                        onNodePropChange('alt', event.target.value)
                      }
                    />
                  </label>
                  <label className="pb-label">
                    Width (e.g. 300px, 100%)
                    <input
                      className="pb-input"
                      value={String(selectedNode.props.width ?? '')}
                      onChange={(event) =>
                        onNodePropChange('width', event.target.value)
                      }
                    />
                  </label>
                </>
              ) : null}

              {selectedNode.widgetType === 'video' ? (
                <>
                  <label className="pb-label">
                    Embed URL
                    <input
                      className="pb-input"
                      value={String(selectedNode.props.src ?? '')}
                      onChange={(event) =>
                        onNodePropChange('src', event.target.value)
                      }
                    />
                  </label>
                  <label className="pb-label">
                    Width
                    <input
                      className="pb-input"
                      value={String(selectedNode.props.width ?? '100%')}
                      onChange={(event) =>
                        onNodePropChange('width', event.target.value)
                      }
                    />
                  </label>
                  <label className="pb-label">
                    Height
                    <input
                      className="pb-input"
                      value={String(selectedNode.props.height ?? '400')}
                      onChange={(event) =>
                        onNodePropChange('height', event.target.value)
                      }
                    />
                  </label>
                </>
              ) : null}

              {selectedNode.widgetType === 'spacer' ? (
                <label className="pb-label">
                  Height
                  <input
                    className="pb-input"
                    value={String(selectedNode.props.height ?? '40px')}
                    onChange={(event) =>
                      onNodePropChange('height', event.target.value)
                    }
                  />
                </label>
              ) : null}

              {selectedNode.widgetType === 'html' ? (
                <label className="pb-label">
                  HTML code
                  <textarea
                    className="pb-textarea pb-textarea-code"
                    value={String(selectedNode.props.html ?? '')}
                    onChange={(event) =>
                      onNodePropChange('html', event.target.value)
                    }
                  />
                </label>
              ) : null}

              {selectedNode.widgetType === 'list' ? (
                <>
                  <label className="pb-label">
                    Items (one per line)
                    <textarea
                      className="pb-textarea"
                      value={String(selectedNode.props.items ?? '')}
                      onChange={(event) =>
                        onNodePropChange('items', event.target.value)
                      }
                    />
                  </label>
                  <label className="pb-label pb-label-inline">
                    <input
                      type="checkbox"
                      checked={!!selectedNode.props.ordered}
                      onChange={(event) =>
                        onNodePropChange('ordered', event.target.checked)
                      }
                    />
                    Ordered list (1, 2, 3…)
                  </label>
                </>
              ) : null}

              {selectedNode.widgetType === 'quote' ? (
                <label className="pb-label">
                  Citation
                  <input
                    className="pb-input"
                    value={String(selectedNode.props.cite ?? '')}
                    onChange={(event) =>
                      onNodePropChange('cite', event.target.value)
                    }
                  />
                </label>
              ) : null}

              {selectedNode.widgetType === 'code' ? (
                <>
                  <label className="pb-label">
                    Code
                    <textarea
                      className="pb-textarea pb-textarea-code"
                      value={String(selectedNode.props.code ?? '')}
                      onChange={(event) =>
                        onNodePropChange('code', event.target.value)
                      }
                    />
                  </label>
                  <label className="pb-label">
                    Language
                    <input
                      className="pb-input"
                      value={String(selectedNode.props.language ?? '')}
                      onChange={(event) =>
                        onNodePropChange('language', event.target.value)
                      }
                    />
                  </label>
                </>
              ) : null}

              <h4 className="pb-inspector-section">Styles</h4>
              {nativeStyleSchema.map((field) => {
                if (field.type === 'color') {
                  return (
                    <label key={field.key} className="pb-label">
                      {field.label}
                      <div className="pb-color-row">
                        <input
                          type="color"
                          className="pb-color-input"
                          value={String(
                            selectedNode.styles[field.key] ?? '#000000'
                          )}
                          onChange={(event) =>
                            onNodeStyleChange(field.key, event.target.value)
                          }
                        />
                        <input
                          className="pb-input"
                          value={String(selectedNode.styles[field.key] ?? '')}
                          placeholder={field.placeholder}
                          onChange={(event) =>
                            onNodeStyleChange(field.key, event.target.value)
                          }
                        />
                      </div>
                    </label>
                  )
                }
                return (
                  <label key={field.key} className="pb-label">
                    {field.label}
                    <input
                      className="pb-input"
                      value={String(selectedNode.styles[field.key] ?? '')}
                      placeholder={field.placeholder}
                      onChange={(event) =>
                        onNodeStyleChange(field.key, event.target.value)
                      }
                    />
                  </label>
                )
              })}
            </>
          ) : (
            <p className="pb-empty-small">
              Select a widget on the canvas to edit its properties.
            </p>
          )}
        </div>
      ) : null}

      {inspectorTab === 'props' ? (
        <div className="pb-inspector-body">
          {selectedNode?.widgetType === 'component' ? (
            <>
              <p className="pb-inspector-type">
                {String(selectedNode.props.componentTag ?? '')}
              </p>
              {activeComponentSchema.length > 0 ? (
                activeComponentSchema.map((field) => {
                  if (field.type === 'string') {
                    return (
                      <label key={field.key} className="pb-label">
                        {field.label}
                        <input
                          className="pb-input"
                          value={String(
                            getComponentProp(field.key) ?? field.default ?? ''
                          )}
                          placeholder={field.placeholder}
                          onChange={(event) =>
                            onSetComponentProp(field.key, event.target.value)
                          }
                        />
                      </label>
                    )
                  }
                  if (field.type === 'number') {
                    return (
                      <label key={field.key} className="pb-label">
                        {field.label}
                        <input
                          className="pb-input"
                          type="number"
                          value={String(
                            getComponentProp(field.key) ?? field.default ?? ''
                          )}
                          placeholder={field.placeholder}
                          onChange={(event) =>
                            onSetComponentProp(
                              field.key,
                              Number(event.target.value)
                            )
                          }
                        />
                      </label>
                    )
                  }
                  if (field.type === 'boolean') {
                    return (
                      <label
                        key={field.key}
                        className="pb-label pb-label-inline"
                      >
                        <input
                          type="checkbox"
                          checked={
                            !!getComponentProp(field.key) ||
                            (getComponentProp(field.key) === undefined &&
                              !!field.default)
                          }
                          onChange={(event) =>
                            onSetComponentProp(field.key, event.target.checked)
                          }
                        />
                        {field.label}
                      </label>
                    )
                  }
                  if (field.type === 'select' && field.key === 'nuiType') {
                    return (
                      <label key={field.key} className="pb-label">
                        {field.label}
                        <AdSelect
                          value={String(
                            getComponentProp(field.key) ??
                              field.default ??
                              'main'
                          )}
                          nuiType="main"
                          options={(field.options ?? []) as string[]}
                          className="pb-ad-select"
                          onChange={(value) =>
                            onSetComponentProp(field.key, value)
                          }
                        />
                      </label>
                    )
                  }
                  if (field.type === 'select') {
                    return (
                      <label key={field.key} className="pb-label">
                        {field.label}
                        <select
                          className="pb-input"
                          value={String(
                            getComponentProp(field.key) ?? field.default ?? ''
                          )}
                          onChange={(event) =>
                            onSetComponentProp(field.key, event.target.value)
                          }
                        >
                          {(field.options ?? []).map((option) => (
                            <option key={option} value={option}>
                              {option || '(default)'}
                            </option>
                          ))}
                        </select>
                      </label>
                    )
                  }
                  if (field.type === 'color') {
                    return (
                      <label key={field.key} className="pb-label">
                        {field.label}
                        <div className="pb-color-row">
                          <input
                            type="color"
                            className="pb-color-input"
                            value={String(
                              getComponentProp(field.key) ??
                                field.default ??
                                '#000000'
                            )}
                            onChange={(event) =>
                              onSetComponentProp(field.key, event.target.value)
                            }
                          />
                          <input
                            className="pb-input"
                            value={String(getComponentProp(field.key) ?? '')}
                            placeholder={field.placeholder}
                            onChange={(event) =>
                              onSetComponentProp(field.key, event.target.value)
                            }
                          />
                        </div>
                      </label>
                    )
                  }
                  if (field.type === 'json') {
                    return (
                      <label key={field.key} className="pb-label">
                        {field.label}
                        <textarea
                          className="pb-textarea pb-textarea-code"
                          value={jsonStringify(getComponentProp(field.key))}
                          placeholder={field.placeholder}
                          onChange={(event) =>
                            onSetComponentPropJson(
                              field.key,
                              event.target.value
                            )
                          }
                        />
                      </label>
                    )
                  }
                  return null
                })
              ) : (
                <>
                  <h4 className="pb-inspector-section">Props (JSON)</h4>
                  <textarea
                    className="pb-textarea pb-textarea-code"
                    value={componentPropsJson}
                    onChange={(event) =>
                      onComponentPropsJsonInput(event.target.value)
                    }
                  />
                  <p className="pb-styles-hint">
                    No schema for this component. Edit raw JSON.
                  </p>
                </>
              )}
              {componentJsonError ? (
                <p className="pb-error">{componentJsonError}</p>
              ) : null}
            </>
          ) : (
            <p className="pb-empty-small">
              Select a component widget to edit its props.
            </p>
          )}
        </div>
      ) : null}

      {inspectorTab === 'styles' ? (
        <div className="pb-inspector-body">
          <div className="pb-styles-lang-toggle">
            <button
              type="button"
              className={`pb-chip-btn${pageStyleLang === 'css' ? ' active' : ''}`}
              onClick={() => onPageStyleLangChange('css')}
            >
              CSS
            </button>
            <button
              type="button"
              className={`pb-chip-btn${pageStyleLang === 'scss' ? ' active' : ''}`}
              onClick={() => onPageStyleLangChange('scss')}
            >
              SCSS
            </button>
          </div>
          <textarea
            className="pb-textarea pb-textarea-code pb-styles-editor"
            value={pageCustomStyles}
            placeholder={
              '/* Write custom CSS / SCSS for this page */\n#page-builder-public {\n  h2 { color: red; }\n}'
            }
            onChange={(event) => onCustomStylesInput(event.target.value)}
          />
          <p className="pb-styles-hint">
            Styles are scoped to <code>#page-builder-public</code>. Output:{' '}
            <code>
              &lt;style
              {pageStyleLang === 'scss' ? ' lang="scss"' : ''}&gt;
            </code>
          </p>
        </div>
      ) : null}
    </aside>
  )
}

export default NucPageBuilderInspector
