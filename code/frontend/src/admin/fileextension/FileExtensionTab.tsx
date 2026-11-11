import { useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import Table from 'react-bootstrap/Table'
import { useNavigate } from 'react-router'
import { ConfirmDeletePopup } from '../../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../../components/ContentBox.tsx'
import { NewEntityButton } from '../../components/NewEntityButton.tsx'
import { SortableArea } from '../../components/SortableArea.tsx'
import { useListingOrder } from '../../components/useListingOrder.ts'
import type { FileExtension } from '../../file/FileExtension.ts'
import type { FileExtensionGroup } from '../../file/FileExtensionGroup.ts'
import {
  type FileExtensionBlock,
  getFileExtensionBlockKey,
  getFileExtensionBlocks,
} from '../../file/getFileExtensionBlocks.ts'
import { useFileExtension } from '../../file/useFileExtension.ts'
import { useFileExtensionGroup } from '../../file/useFileExtensionGroup.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { FileExtensionGroupTableRow } from './FileExtensionGroupTableRow.tsx'
import { FileExtensionTableRow } from './FileExtensionTableRow.tsx'
import {
  getEditFileExtensionGroupPath,
  getEditFileExtensionPath,
  NEW_FILE_EXTENSION_GROUP_PATH,
  NEW_FILE_EXTENSION_PATH,
} from './fileExtensionPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

function getFileExtensionGroupKey(fileExtensionGroup: FileExtensionGroup): string {
  return fileExtensionGroup.key
}

function getFileExtensionKey(fileExtension: FileExtension): string {
  return fileExtension.extension
}

/** Die Überschrift eines Blocks: der Name der Gruppe, ohne Gruppe ein fester Text. */
function getFileExtensionBlockTitle(fileExtensionBlock: FileExtensionBlock): string {
  if (fileExtensionBlock.fileExtensionGroup === null) {
    return 'ohne Gruppe'
  }
  return getTextInCurrentLanguage(fileExtensionBlock.fileExtensionGroup.displayName)
}

/**
 * Tab „Endungen“ der Administration, wie in der Vorlage: oben die Gruppen (Bilder, Videos, Dokumente …), darunter der
 * Katalog der Endungen nach Gruppen, jede mit Zwischenüberschrift. Beides lässt sich am Griff verschieben, die Endungen
 * innerhalb ihrer Gruppe: So stehen die wichtigen vorn, nicht das Alphabet entscheidet. In welche Gruppe eine Endung
 * gehört, wählt ihr Formular. Löschen fragt vorher nach; eine gelöschte Endung nimmt keine FileClass mehr an, eine
 * gelöschte Gruppe lässt ihre Endungen ohne Gruppe stehen. Welche FileClass welche Endung annimmt, steht in der Matrix
 * „FileClass-Endung“.
 */
export function FileExtensionTab() {
  const navigate = useNavigate()
  const originNavigation = useOrigin()
  const masterDataHook = useMasterData()
  const orderFileExtensionGroupHook = useFileExtensionGroup()
  const deleteFileExtensionGroupHook = useFileExtensionGroup()
  const orderFileExtensionHook = useFileExtension()
  const deleteFileExtensionHook = useFileExtension()
  const [fileExtensionGroupToDelete, setFileExtensionGroupToDelete] = useState<FileExtensionGroup | null>(null)
  const [fileExtensionToDelete, setFileExtensionToDelete] = useState<FileExtension | null>(null)

  async function saveFileExtensionGroupOrder(fileExtensionGroupKeysInOrder: string[]): Promise<boolean> {
    const reorderedFileExtensionGroups =
      await orderFileExtensionGroupHook.changeFileExtensionGroupListingPositions(fileExtensionGroupKeysInOrder)
    await masterDataHook.reload()
    return reorderedFileExtensionGroups !== null
  }

  async function saveFileExtensionOrder(fileExtensionsInOrder: string[]): Promise<boolean> {
    const reorderedFileExtensions = await orderFileExtensionHook.changeFileExtensionListingPositions(fileExtensionsInOrder)
    await masterDataHook.reload()
    return reorderedFileExtensions !== null
  }

  const fileExtensionGroupListingOrder = useListingOrder(
    masterDataHook.fileExtensionGroups,
    getFileExtensionGroupKey,
    saveFileExtensionGroupOrder,
    'Gruppen',
  )
  const fileExtensionListingOrder = useListingOrder(
    masterDataHook.fileExtensions,
    getFileExtensionKey,
    saveFileExtensionOrder,
    'Endungen',
  )
  const fileExtensionGroups = fileExtensionGroupListingOrder.shownItems
  const fileExtensions = fileExtensionListingOrder.shownItems
  let fileExtensionBlocks: FileExtensionBlock[] | null = null
  if (fileExtensionGroups !== null && fileExtensions !== null) {
    fileExtensionBlocks = getFileExtensionBlocks(fileExtensionGroups, fileExtensions)
  }

  /**
   * Innerhalb einer Gruppe verschoben: Gespeichert wird die ganze Liste, alle Gruppen hintereinander, die verschobene in
   * ihrer neuen Reihenfolge. So stimmt der Platz jeder Endung auch innerhalb ihrer Gruppe.
   */
  function handleFileExtensionBlockReorder(
    reorderedFileExtensionBlock: FileExtensionBlock,
    reorderedFileExtensions: FileExtension[],
  ) {
    if (fileExtensionBlocks === null) {
      return
    }
    const reorderedFileExtensionBlockKey = getFileExtensionBlockKey(reorderedFileExtensionBlock)
    const allFileExtensionsInOrder: FileExtension[] = []
    for (const fileExtensionBlock of fileExtensionBlocks) {
      const fileExtensionBlockKey = getFileExtensionBlockKey(fileExtensionBlock)
      let fileExtensionsOfBlock = fileExtensionBlock.fileExtensions
      if (fileExtensionBlockKey === reorderedFileExtensionBlockKey) {
        fileExtensionsOfBlock = reorderedFileExtensions
      }
      allFileExtensionsInOrder.push(...fileExtensionsOfBlock)
    }
    void fileExtensionListingOrder.reorder(allFileExtensionsInOrder)
  }

  function getFileExtensionCountOfGroup(fileExtensionGroup: FileExtensionGroup): number {
    if (fileExtensions === null) {
      return 0
    }
    const fileExtensionsOfGroup = fileExtensions.filter(
      (fileExtension) => fileExtension.fileExtensionGroupKey === fileExtensionGroup.key,
    )
    return fileExtensionsOfGroup.length
  }

  function handleNewFileExtensionGroup() {
    const originState = originNavigation.createOriginStateHere('Endungen')
    navigate(NEW_FILE_EXTENSION_GROUP_PATH, { state: originState })
  }

  function handleEditFileExtensionGroup(fileExtensionGroup: FileExtensionGroup) {
    const editFileExtensionGroupPath = getEditFileExtensionGroupPath(fileExtensionGroup.key)
    const originState = originNavigation.createOriginStateHere('Endungen')
    navigate(editFileExtensionGroupPath, { state: originState })
  }

  function handleNewFileExtension() {
    const originState = originNavigation.createOriginStateHere('Endungen')
    navigate(NEW_FILE_EXTENSION_PATH, { state: originState })
  }

  function handleEditFileExtension(fileExtension: FileExtension) {
    const editFileExtensionPath = getEditFileExtensionPath(fileExtension.extension)
    const originState = originNavigation.createOriginStateHere('Endungen')
    navigate(editFileExtensionPath, { state: originState })
  }

  async function handleConfirmDeleteFileExtensionGroup() {
    if (fileExtensionGroupToDelete === null) {
      return
    }
    const deleted = await deleteFileExtensionGroupHook.deleteFileExtensionGroup(fileExtensionGroupToDelete.key)
    if (!deleted) {
      return
    }
    setFileExtensionGroupToDelete(null)
    await masterDataHook.reload()
  }

  async function handleConfirmDeleteFileExtension() {
    if (fileExtensionToDelete === null) {
      return
    }
    const deleted = await deleteFileExtensionHook.deleteFileExtension(fileExtensionToDelete.extension)
    if (!deleted) {
      return
    }
    setFileExtensionToDelete(null)
    await masterDataHook.reload()
  }

  let errorMessage: string | null = null
  if (masterDataHook.error !== null) {
    errorMessage = masterDataHook.error.detail
  } else if (orderFileExtensionGroupHook.error !== null) {
    errorMessage = orderFileExtensionGroupHook.error.detail
  } else if (orderFileExtensionHook.error !== null) {
    errorMessage = orderFileExtensionHook.error.detail
  }
  let deleteFileExtensionGroupErrorMessage: string | null = null
  if (deleteFileExtensionGroupHook.error !== null) {
    deleteFileExtensionGroupErrorMessage = deleteFileExtensionGroupHook.error.detail
  }
  let deleteFileExtensionErrorMessage: string | null = null
  if (deleteFileExtensionHook.error !== null) {
    deleteFileExtensionErrorMessage = deleteFileExtensionHook.error.detail
  }

  let fileExtensionGroupFooter
  let fileExtensionFooter
  if (errorMessage !== null) {
    fileExtensionGroupFooter = <span className="text-danger">{errorMessage}</span>
    fileExtensionFooter = fileExtensionGroupFooter
  } else if (fileExtensionGroups === null || fileExtensions === null) {
    fileExtensionGroupFooter = <Spinner animation="border" size="sm" />
    fileExtensionFooter = fileExtensionGroupFooter
  } else {
    const fileExtensionGroupCountText = fileExtensionGroups.length + ' Gruppen, am Griff links verschieben'
    const fileExtensionCountText = fileExtensions.length + ' Endungen, am Griff innerhalb der Gruppe verschieben'
    fileExtensionGroupFooter = <span>{fileExtensionGroupCountText}</span>
    fileExtensionFooter = <span>{fileExtensionCountText}</span>
  }
  let fileExtensionGroupToDeleteName = ''
  if (fileExtensionGroupToDelete !== null) {
    fileExtensionGroupToDeleteName = getTextInCurrentLanguage(fileExtensionGroupToDelete.displayName)
  }
  const newFileExtensionGroupButton = <NewEntityButton label="neue Gruppe" onClick={handleNewFileExtensionGroup} />
  const newFileExtensionButton = <NewEntityButton label="neue Endung" onClick={handleNewFileExtension} />

  return (
    <>
      <ContentBox title="Gruppen" actions={newFileExtensionGroupButton} footer={fileExtensionGroupFooter}>
        {fileExtensionGroups !== null && (
          <Table striped hover responsive className="mb-0">
            <thead>
              <tr>
                <th className="drag-cell"></th>
                <th>Key</th>
                <th>Anzeigename</th>
                <th>Endungen</th>
                <th></th>
              </tr>
            </thead>
            <SortableArea
              items={fileExtensionGroups}
              itemKey={getFileExtensionGroupKey}
              onReorder={fileExtensionGroupListingOrder.reorder}>
              <tbody>
                {fileExtensionGroups.map((fileExtensionGroup) => {
                  const fileExtensionCountOfGroup = getFileExtensionCountOfGroup(fileExtensionGroup)
                  return (
                    <FileExtensionGroupTableRow
                      key={fileExtensionGroup.key}
                      fileExtensionGroup={fileExtensionGroup}
                      fileExtensionCount={fileExtensionCountOfGroup}
                      isDragDisabled={fileExtensionGroupListingOrder.isSaving}
                      onEdit={handleEditFileExtensionGroup}
                      onDelete={setFileExtensionGroupToDelete}
                    />
                  )
                })}
              </tbody>
            </SortableArea>
          </Table>
        )}
      </ContentBox>

      <ContentBox title="Endungen" actions={newFileExtensionButton} footer={fileExtensionFooter}>
        {fileExtensionBlocks !== null &&
          fileExtensionBlocks.map((fileExtensionBlock) => {
            const fileExtensionBlockKey = getFileExtensionBlockKey(fileExtensionBlock)
            const fileExtensionBlockTitle = getFileExtensionBlockTitle(fileExtensionBlock)
            const fileExtensionCountText = '(' + fileExtensionBlock.fileExtensions.length + ')'
            return (
              <section key={fileExtensionBlockKey} className="file-extension-block">
                <h3 className="file-extension-block-title">
                  {fileExtensionBlockTitle}
                  <span className="file-extension-block-count">{fileExtensionCountText}</span>
                </h3>
                {fileExtensionBlock.fileExtensions.length === 0 && (
                  <p className="small text-secondary mb-0">keine Endungen in dieser Gruppe</p>
                )}
                {fileExtensionBlock.fileExtensions.length > 0 && (
                  <Table striped hover responsive className="mb-0 file-extension-table">
                    <thead>
                      <tr>
                        <th className="drag-cell"></th>
                        <th className="file-extension-cell">Endung</th>
                        <th>Beschreibung</th>
                        <th className="file-extension-preview-cell">Vorschaubild</th>
                        <th className="file-extension-actions-cell"></th>
                      </tr>
                    </thead>
                    <SortableArea
                      items={fileExtensionBlock.fileExtensions}
                      itemKey={getFileExtensionKey}
                      onReorder={(reorderedFileExtensions) =>
                        handleFileExtensionBlockReorder(fileExtensionBlock, reorderedFileExtensions)
                      }>
                      <tbody>
                        {fileExtensionBlock.fileExtensions.map((fileExtension) => (
                          <FileExtensionTableRow
                            key={fileExtension.extension}
                            fileExtension={fileExtension}
                            isDragDisabled={fileExtensionListingOrder.isSaving}
                            onEdit={handleEditFileExtension}
                            onDelete={setFileExtensionToDelete}
                          />
                        ))}
                      </tbody>
                    </SortableArea>
                  </Table>
                )}
              </section>
            )
          })}
      </ContentBox>

      {fileExtensionGroupToDelete !== null && (
        <ConfirmDeletePopup
          title="Gruppe löschen"
          isDeleting={deleteFileExtensionGroupHook.isLoading}
          errorMessage={deleteFileExtensionGroupErrorMessage}
          onConfirm={handleConfirmDeleteFileExtensionGroup}
          onClose={() => setFileExtensionGroupToDelete(null)}>
          Soll die Gruppe <strong>{fileExtensionGroupToDeleteName}</strong> wirklich
          gelöscht werden? Ihre Endungen bleiben und stehen danach ohne Gruppe.
        </ConfirmDeletePopup>
      )}
      {fileExtensionToDelete !== null && (
        <ConfirmDeletePopup
          title="Endung löschen"
          isDeleting={deleteFileExtensionHook.isLoading}
          errorMessage={deleteFileExtensionErrorMessage}
          onConfirm={handleConfirmDeleteFileExtension}
          onClose={() => setFileExtensionToDelete(null)}>
          Soll die Endung <code>.{fileExtensionToDelete.extension}</code> wirklich gelöscht werden? Keine FileClass nimmt
          sie danach noch an. Schon hochgeladene Dateien bleiben.
        </ConfirmDeletePopup>
      )}
    </>
  )
}
