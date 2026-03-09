<template>
  <header class="pb-topbar pb-panel">
    <div class="pb-topbar-left">
      <input
        :value="title"
        class="pb-input pb-input-title"
        placeholder="Page title"
        @input="emit('update:title', ($event.target as HTMLInputElement).value)"
      />
      <span class="pb-slug-prefix">/{{ lang }}/</span>
      <input
        :value="slug"
        class="pb-input pb-input-slug"
        placeholder="slug"
        @input="emit('update:slug', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="pb-topbar-center">
      <div class="pb-status" :class="`pb-status-${saveState}`">
        <span class="pb-status-dot" />
        {{ saveLabel }}
        <span v-if="lastSavedLabel" class="pb-status-time"> · {{ lastSavedLabel }}</span>
      </div>
    </div>

    <div class="pb-topbar-right">
      <button
        class="pb-btn pb-btn-sm"
        title="Undo (Ctrl+Z)"
        :disabled="!selectedPageId"
        @click="emit('undo')"
      >↩</button>
      <button
        class="pb-btn pb-btn-sm"
        title="Redo (Ctrl+Y)"
        :disabled="!selectedPageId"
        @click="emit('redo')"
      >↪</button>
      <span class="pb-topbar-sep" />
      <label class="pb-autosave-toggle" title="Autosave">
        <input type="checkbox" :checked="autosaveEnabled" @change="onAutosaveChange" />
        <span class="pb-autosave-label">Auto</span>
      </label>
      <span class="pb-topbar-sep" />
      <button
        class="pb-btn"
        :disabled="!selectedPageId || saveState === 'saving'"
        @click="emit('save')"
      >💾 Save</button>
      <button
        class="pb-btn pb-btn-primary"
        :disabled="!selectedPageId || saveState === 'saving'"
        @click="emit('publish')"
      >🚀 Publish</button>
      <a
        v-if="selectedPageSlug"
        class="pb-btn"
        :href="`/${lang}/${selectedPageSlug}`"
        target="_blank"
      >↗ Preview</a>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { PageBuilderSaveState } from 'nucleify'

interface Props {
  title: string
  slug: string
  lang: string
  saveState: PageBuilderSaveState
  saveLabel: string
  lastSavedLabel: string
  autosaveEnabled: boolean
  selectedPageId: number | null
  selectedPageSlug: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  'update:title': [value: string]
  'update:slug': [value: string]
  'update:autosave': [value: boolean]
  save: []
  publish: []
  undo: []
  redo: []
}>()

function onAutosaveChange(event: Event): void {
  emit('update:autosave', (event.target as HTMLInputElement).checked)
}
</script>

<style lang="scss">
@import 'index';
</style>
