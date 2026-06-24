'use client'

import type { JSX } from 'react'

import { AdButton, AdDialog } from 'nucleify'

import type { NucPageBuilderDialogsProps } from '../interfaces'

import './_index.scss'

export function NucPageBuilderDialogs({
  confirmDeleteNodeId,
  confirmDeleteNodeName,
  confirmDeletePageId,
  confirmDeletePageName,
  onCloseNodeDialog,
  onConfirmRemoveNode,
  onClosePageDialog,
  onConfirmDeletePage,
}: NucPageBuilderDialogsProps): JSX.Element {
  return (
    <>
      <AdDialog
        visible={!!confirmDeleteNodeId}
        onHide={onCloseNodeDialog}
        modal
        dismissableMask
        draggable={false}
        showHeader
        header={<span className="pb-confirm-title">Usunąć sekcję?</span>}
        className="pb-confirm-dialog"
        footer={
          <div className="pb-confirm-footer">
            <AdButton
              label="Anuluj"
              severity="secondary"
              outlined
              onClick={onCloseNodeDialog}
            />
            <AdButton
              label="Usuń"
              severity="danger"
              onClick={onConfirmRemoveNode}
            />
          </div>
        }
      >
        <p className="pb-confirm-text">
          Czy na pewno chcesz usunąć <strong>{confirmDeleteNodeName}</strong>?
        </p>
      </AdDialog>

      <AdDialog
        visible={!!confirmDeletePageId}
        onHide={onClosePageDialog}
        modal
        dismissableMask
        draggable={false}
        showHeader
        header={<span className="pb-confirm-title">Usunąć stronę?</span>}
        className="pb-confirm-dialog"
        footer={
          <div className="pb-confirm-footer">
            <AdButton
              label="Anuluj"
              severity="secondary"
              outlined
              onClick={onClosePageDialog}
            />
            <AdButton
              label="Usuń"
              severity="danger"
              onClick={() => void onConfirmDeletePage()}
            />
          </div>
        }
      >
        <p className="pb-confirm-text">
          Czy na pewno chcesz usunąć <strong>{confirmDeletePageName}</strong>?
          Tej operacji nie można cofnąć.
        </p>
      </AdDialog>
    </>
  )
}

export default NucPageBuilderDialogs
