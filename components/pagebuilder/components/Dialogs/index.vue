<template>
  <Dialog
    :visible="!!confirmDeleteNodeId"
    :modal="true"
    :draggable="false"
    :closable="true"
    :dismissable-mask="true"
    class="pb-confirm-dialog"
    :pt="{
      pcCloseButton: { root: { 'ad-type': 'main' } },
    }"
    @update:visible="emit('close-node-dialog')"
  >
    <template #header>
      <span class="pb-confirm-title">Usunąć sekcję?</span>
    </template>

    <p class="pb-confirm-text">
      Czy na pewno chcesz usunąć <strong>{{ confirmDeleteNodeName }}</strong>?
    </p>

    <template #footer>
      <div class="pb-confirm-footer">
        <ad-button label="Anuluj" severity="secondary" outlined @click="emit('close-node-dialog')" />
        <ad-button label="Usuń" severity="danger" @click="emit('confirm-remove-node')" />
      </div>
    </template>
  </Dialog>

  <Dialog
    :visible="!!confirmDeletePageId"
    :modal="true"
    :draggable="false"
    :closable="true"
    :dismissable-mask="true"
    class="pb-confirm-dialog"
    :pt="{
      pcCloseButton: { root: { 'ad-type': 'main' } },
    }"
    @update:visible="emit('close-page-dialog')"
  >
    <template #header>
      <span class="pb-confirm-title">Delete page?</span>
    </template>

    <p class="pb-confirm-text">
      Are you sure you want to delete <strong>{{ confirmDeletePageName }}</strong>? This action cannot be undone.
    </p>

    <template #footer>
      <div class="pb-confirm-footer">
        <ad-button label="Cancel" severity="secondary" outlined @click="emit('close-page-dialog')" />
        <ad-button label="Delete" severity="danger" @click="emit('confirm-delete-page')" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
interface Props {
  confirmDeleteNodeId: string | null
  confirmDeleteNodeName: string
  confirmDeletePageId: number | null
  confirmDeletePageName: string
}

defineProps<Props>()

const emit = defineEmits<{
  'close-node-dialog': []
  'confirm-remove-node': []
  'close-page-dialog': []
  'confirm-delete-page': []
}>()
</script>

<style scoped lang="scss" src="./_index.scss"></style>
