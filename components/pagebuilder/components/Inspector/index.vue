<template>
  <aside class="pb-inspector pb-panel">
    <div class="pb-inspector-tabs">
      <button
        class="pb-inspector-tab"
        :class="{ active: inspectorTab === 'widget' }"
        @click="emit('update:inspector-tab', 'widget')"
      >Widget</button>
      <button
        v-if="selectedNode?.widgetType === 'component'"
        class="pb-inspector-tab"
        :class="{ active: inspectorTab === 'props' }"
        @click="emit('update:inspector-tab', 'props')"
      >Props</button>
      <button
        class="pb-inspector-tab"
        :class="{ active: inspectorTab === 'page' }"
        @click="emit('update:inspector-tab', 'page')"
      >Page</button>
      <button
        class="pb-inspector-tab"
        :class="{ active: inspectorTab === 'styles' }"
        @click="emit('update:inspector-tab', 'styles')"
      >Styles</button>
    </div>

    <div v-if="inspectorTab === 'page'" class="pb-inspector-body">
      <h4 class="pb-inspector-section">SEO & Meta</h4>
      <label class="pb-label">
        Meta title
        <input
          class="pb-input"
          :value="String(layout.settings.metaTitle ?? '')"
          placeholder="Page title for search engines"
          @input="emit('setting-change', 'metaTitle', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="pb-label">
        Meta description
        <textarea
          class="pb-textarea"
          :value="String(layout.settings.metaDescription ?? '')"
          placeholder="Short description for search engines"
          @input="emit('setting-change', 'metaDescription', ($event.target as HTMLTextAreaElement).value)"
        />
      </label>
      <label class="pb-label">
        OG image URL
        <input
          class="pb-input"
          :value="String(layout.settings.ogImage ?? '')"
          placeholder="https://example.com/image.jpg"
          @input="emit('setting-change', 'ogImage', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <h4 class="pb-inspector-section">Layout</h4>
      <label class="pb-label">
        Max width
        <input
          class="pb-input"
          :value="String(layout.settings.maxWidth ?? '1140px')"
          placeholder="e.g. 1140px, 100%"
          @input="emit('setting-change', 'maxWidth', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="pb-label">
        Page padding
        <input
          class="pb-input"
          :value="String(layout.settings.pagePadding ?? '0')"
          placeholder="e.g. 48px 16px"
          @input="emit('setting-change', 'pagePadding', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="pb-label">
        Background color
        <div class="pb-color-row">
          <input
            type="color"
            class="pb-color-input"
            :value="String(layout.settings.bgColor ?? '#000000')"
            @input="emit('setting-change', 'bgColor', ($event.target as HTMLInputElement).value)"
          />
          <input
            class="pb-input"
            :value="String(layout.settings.bgColor ?? '')"
            placeholder="#000000"
            @input="emit('setting-change', 'bgColor', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </label>

      <h4 class="pb-inspector-section">Info</h4>
      <div class="pb-info-grid">
        <span>Sections</span>
        <span>{{ layout.children.length }}</span>
        <span>Status</span>
        <span>{{ selectedPageSlug ? 'saved' : 'new' }}</span>
        <span>Slug</span>
        <span>/{{ lang }}/{{ formSlug || '—' }}</span>
      </div>
    </div>

    <div v-else-if="inspectorTab === 'widget'" class="pb-inspector-body">
      <template v-if="selectedNode">
        <p class="pb-inspector-type">{{ selectedNode.widgetType }}</p>

        <!-- Row: column count control -->
        <template v-if="selectedNode.widgetType === 'row'">
          <h4 class="pb-inspector-section">Columns</h4>
          <div class="pb-columns-control">
            <button
              class="pb-col-btn"
              :disabled="selectedNode.children.length <= 1"
              @click="emit('set-row-columns', selectedNode.children.length - 1)"
            >−</button>
            <span class="pb-col-count">{{ selectedNode.children.length }}</span>
            <button
              class="pb-col-btn"
              :disabled="selectedNode.children.length >= 12"
              @click="emit('set-row-columns', selectedNode.children.length + 1)"
            >+</button>
          </div>
          <div class="pb-col-presets">
            <button v-for="n in [1,2,3,4,6]" :key="n" class="pb-col-preset" :class="{ active: selectedNode.children.length === n }" @click="emit('set-row-columns', n)">{{ n }}</button>
          </div>
        </template>

        <!-- Container info -->
        <div v-if="selectedNodeIsContainer && selectedNode.widgetType !== 'row'" class="pb-container-info">
          <span>{{ selectedNode.children.length }} children</span>
        </div>

        <!-- Container props (gap, alignment, etc.) -->
        <template v-if="selectedNodeIsContainer">
          <h4 class="pb-inspector-section">Layout</h4>
          <template v-for="field in containerPropsSchema" :key="field.key">
            <label v-if="field.type === 'string'" class="pb-label">
              {{ field.label }}
              <input
                class="pb-input"
                :value="String(selectedNode.props[field.key] ?? field.default ?? '')"
                :placeholder="field.placeholder"
                @input="emit('node-prop-change', field.key, ($event.target as HTMLInputElement).value)"
              />
            </label>
            <label v-else-if="field.type === 'select'" class="pb-label">
              {{ field.label }}
              <select
                class="pb-input"
                :value="String(selectedNode.props[field.key] ?? field.default ?? '')"
                @change="emit('node-prop-change', field.key, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="option in field.options" :key="option" :value="option">
                  {{ option || '(default)' }}
                </option>
              </select>
            </label>
          </template>
        </template>

        <!-- Native widget props -->
        <label v-if="hasTextProp" class="pb-label">
          Text
          <textarea
            class="pb-textarea"
            :value="String(selectedNode.props.text ?? '')"
            @input="emit('node-prop-change', 'text', ($event.target as HTMLTextAreaElement).value)"
          />
        </label>
        <label v-if="selectedNode.widgetType === 'heading'" class="pb-label">
          Heading level
          <select
            class="pb-input"
            :value="String(selectedNode.props.level ?? 'h2')"
            @change="emit('node-prop-change', 'level', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="level in ['h1','h2','h3','h4','h5','h6']" :key="level" :value="level">{{ level }}</option>
          </select>
        </label>
        <label v-if="selectedNode.widgetType === 'button'" class="pb-label">
          Button link
          <input
            class="pb-input"
            :value="String(selectedNode.props.href ?? '#')"
            @input="emit('node-prop-change', 'href', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <template v-if="selectedNode.widgetType === 'image'">
          <label class="pb-label">
            Image URL
            <input
              class="pb-input"
              :value="String(selectedNode.props.src ?? '')"
              @input="emit('node-prop-change', 'src', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="pb-label">
            Alt text
            <input
              class="pb-input"
              :value="String(selectedNode.props.alt ?? '')"
              @input="emit('node-prop-change', 'alt', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="pb-label">
            Width (e.g. 300px, 100%)
            <input
              class="pb-input"
              :value="String(selectedNode.props.width ?? '')"
              @input="emit('node-prop-change', 'width', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </template>
        <template v-if="selectedNode.widgetType === 'video'">
          <label class="pb-label">
            Embed URL
            <input
              class="pb-input"
              :value="String(selectedNode.props.src ?? '')"
              @input="emit('node-prop-change', 'src', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="pb-label">
            Width
            <input
              class="pb-input"
              :value="String(selectedNode.props.width ?? '100%')"
              @input="emit('node-prop-change', 'width', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="pb-label">
            Height
            <input
              class="pb-input"
              :value="String(selectedNode.props.height ?? '400')"
              @input="emit('node-prop-change', 'height', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </template>
        <label v-if="selectedNode.widgetType === 'spacer'" class="pb-label">
          Height
          <input
            class="pb-input"
            :value="String(selectedNode.props.height ?? '40px')"
            @input="emit('node-prop-change', 'height', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label v-if="selectedNode.widgetType === 'html'" class="pb-label">
          HTML code
          <textarea
            class="pb-textarea pb-textarea-code"
            :value="String(selectedNode.props.html ?? '')"
            @input="emit('node-prop-change', 'html', ($event.target as HTMLTextAreaElement).value)"
          />
        </label>
        <template v-if="selectedNode.widgetType === 'list'">
          <label class="pb-label">
            Items (one per line)
            <textarea
              class="pb-textarea"
              :value="String(selectedNode.props.items ?? '')"
              @input="emit('node-prop-change', 'items', ($event.target as HTMLTextAreaElement).value)"
            />
          </label>
          <label class="pb-label pb-label-inline">
            <input
              type="checkbox"
              :checked="!!selectedNode.props.ordered"
              @change="emit('node-prop-change', 'ordered', ($event.target as HTMLInputElement).checked)"
            />
            Ordered list (1, 2, 3…)
          </label>
        </template>
        <label v-if="selectedNode.widgetType === 'quote'" class="pb-label">
          Citation
          <input
            class="pb-input"
            :value="String(selectedNode.props.cite ?? '')"
            @input="emit('node-prop-change', 'cite', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <template v-if="selectedNode.widgetType === 'code'">
          <label class="pb-label">
            Code
            <textarea
              class="pb-textarea pb-textarea-code"
              :value="String(selectedNode.props.code ?? '')"
              @input="emit('node-prop-change', 'code', ($event.target as HTMLTextAreaElement).value)"
            />
          </label>
          <label class="pb-label">
            Language
            <input
              class="pb-input"
              :value="String(selectedNode.props.language ?? '')"
              @input="emit('node-prop-change', 'language', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </template>

        <!-- Style fields for all widget types -->
        <h4 class="pb-inspector-section">Styles</h4>
        <template v-for="field in nativeStyleSchema" :key="field.key">
          <label v-if="field.type === 'color'" class="pb-label">
            {{ field.label }}
            <div class="pb-color-row">
              <input
                type="color"
                class="pb-color-input"
                :value="String(selectedNode.styles[field.key] ?? '#000000')"
                @input="emit('node-style-change', field.key, ($event.target as HTMLInputElement).value)"
              />
              <input
                class="pb-input"
                :value="String(selectedNode.styles[field.key] ?? '')"
                :placeholder="field.placeholder"
                @input="emit('node-style-change', field.key, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </label>
          <label v-else class="pb-label">
            {{ field.label }}
            <input
              class="pb-input"
              :value="String(selectedNode.styles[field.key] ?? '')"
              :placeholder="field.placeholder"
              @input="emit('node-style-change', field.key, ($event.target as HTMLInputElement).value)"
            />
          </label>
        </template>
      </template>
      <p v-else class="pb-empty-small">Select a widget on the canvas to edit its properties.</p>
    </div>

    <div v-else-if="inspectorTab === 'props'" class="pb-inspector-body">
      <template v-if="selectedNode?.widgetType === 'component'">
        <p class="pb-inspector-type">{{ String(selectedNode.props.componentTag ?? '') }}</p>
        <template v-if="activeComponentSchema.length > 0">
          <template v-for="field in activeComponentSchema" :key="field.key">
            <label v-if="field.type === 'string'" class="pb-label">
              {{ field.label }}
              <input
                class="pb-input"
                :value="String(getComponentProp(field.key) ?? field.default ?? '')"
                :placeholder="field.placeholder"
                @input="emit('set-component-prop', field.key, ($event.target as HTMLInputElement).value)"
              />
            </label>
            <label v-else-if="field.type === 'number'" class="pb-label">
              {{ field.label }}
              <input
                class="pb-input"
                type="number"
                :value="getComponentProp(field.key) ?? field.default ?? ''"
                :placeholder="field.placeholder"
                @input="emit('set-component-prop', field.key, Number(($event.target as HTMLInputElement).value))"
              />
            </label>
            <label v-else-if="field.type === 'boolean'" class="pb-label pb-label-inline">
              <input
                type="checkbox"
                :checked="!!getComponentProp(field.key) || (getComponentProp(field.key) === undefined && !!field.default)"
                @change="emit('set-component-prop', field.key, ($event.target as HTMLInputElement).checked)"
              />
              {{ field.label }}
            </label>
            <label v-else-if="field.type === 'select' && field.key === 'adType'" class="pb-label">
              {{ field.label }}
              <ad-select
                :model-value="String(getComponentProp(field.key) ?? field.default ?? 'main')"
                ad-type="main"
                :options="(field.options ?? []) as string[]"
                class="pb-ad-select"
                @update:model-value="emit('set-component-prop', field.key, $event)"
              />
            </label>
            <label v-else-if="field.type === 'select'" class="pb-label">
              {{ field.label }}
              <select
                class="pb-input"
                :value="String(getComponentProp(field.key) ?? field.default ?? '')"
                @change="emit('set-component-prop', field.key, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="option in field.options" :key="option" :value="option">
                  {{ option || '(default)' }}
                </option>
              </select>
            </label>
            <label v-else-if="field.type === 'color'" class="pb-label">
              {{ field.label }}
              <div class="pb-color-row">
                <input
                  type="color"
                  class="pb-color-input"
                  :value="String(getComponentProp(field.key) ?? field.default ?? '#000000')"
                  @input="emit('set-component-prop', field.key, ($event.target as HTMLInputElement).value)"
                />
                <input
                  class="pb-input"
                  :value="String(getComponentProp(field.key) ?? '')"
                  :placeholder="field.placeholder"
                  @input="emit('set-component-prop', field.key, ($event.target as HTMLInputElement).value)"
                />
              </div>
            </label>
            <label v-else-if="field.type === 'json'" class="pb-label">
              {{ field.label }}
              <textarea
                class="pb-textarea pb-textarea-code"
                :value="jsonStringify(getComponentProp(field.key))"
                :placeholder="field.placeholder"
                @input="emit('set-component-prop-json', field.key, ($event.target as HTMLTextAreaElement).value)"
              />
            </label>
          </template>
        </template>
        <template v-else>
          <h4 class="pb-inspector-section">Props (JSON)</h4>
          <textarea
            class="pb-textarea pb-textarea-code"
            :value="componentPropsJson"
            @input="emit('component-props-json-input', ($event.target as HTMLTextAreaElement).value)"
          />
          <p class="pb-styles-hint">No schema for this component. Edit raw JSON.</p>
        </template>
        <p v-if="componentJsonError" class="pb-error">{{ componentJsonError }}</p>
      </template>
      <p v-else class="pb-empty-small">Select a component widget to edit its props.</p>
    </div>

    <div v-else-if="inspectorTab === 'styles'" class="pb-inspector-body">
      <div class="pb-styles-lang-toggle">
        <button
          class="pb-chip-btn"
          :class="{ active: pageStyleLang === 'css' }"
          @click="emit('update:page-style-lang', 'css')"
        >CSS</button>
        <button
          class="pb-chip-btn"
          :class="{ active: pageStyleLang === 'scss' }"
          @click="emit('update:page-style-lang', 'scss')"
        >SCSS</button>
      </div>
      <textarea
        class="pb-textarea pb-textarea-code pb-styles-editor"
        :value="pageCustomStyles"
        placeholder="/* Write custom CSS / SCSS for this page */&#10;#page-builder-public {&#10;  h2 { color: red; }&#10;}"
        @input="emit('custom-styles-input', ($event.target as HTMLTextAreaElement).value)"
      />
      <p class="pb-styles-hint">
        Styles are scoped to <code>#page-builder-public</code>.
        Output: <code>&lt;style{{ pageStyleLang === 'scss' ? ' lang=&quot;scss&quot;' : '' }}&gt;</code>
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type {
  PageBuilderLayoutInterface,
  PageBuilderNodeInterface,
  PropFieldSchema,
} from 'nucleify'
import { jsonStringify } from 'nucleify'

interface Props {
  inspectorTab: 'widget' | 'props' | 'page' | 'styles'
  pageStyleLang: 'css' | 'scss'
  pageCustomStyles: string
  layout: PageBuilderLayoutInterface
  lang: string
  selectedPageSlug: string | null
  formSlug: string
  selectedNode: PageBuilderNodeInterface | null
  selectedNodeIsContainer: boolean
  hasTextProp: boolean
  activeComponentSchema: PropFieldSchema[]
  containerPropsSchema: PropFieldSchema[]
  nativeStyleSchema: PropFieldSchema[]
  getComponentProp: (key: string) => unknown
  componentPropsJson: string
  componentJsonError: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  'update:inspector-tab': [value: 'widget' | 'props' | 'page' | 'styles']
  'update:page-style-lang': [value: 'css' | 'scss']
  'setting-change': [key: string, value: unknown]
  'node-prop-change': [key: string, value: unknown]
  'node-style-change': [key: string, value: string]
  'custom-styles-input': [value: string]
  'set-component-prop': [key: string, value: unknown]
  'set-component-prop-json': [key: string, value: string]
  'component-props-json-input': [value: string]
  'set-row-columns': [count: number]
}>()
</script>

<style lang="scss">
@import 'index';
</style>