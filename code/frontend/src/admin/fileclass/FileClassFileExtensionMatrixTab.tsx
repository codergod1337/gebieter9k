import { useEffect, useRef, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { Hoverlay } from '../../components/Hoverlay.tsx'
import { Matrix } from '../../components/Matrix.tsx'
import { type MatrixBrush, MatrixBrushes } from '../../components/MatrixBrushes.tsx'
import { type MatrixCellChange, type MatrixServerValue, useMatrixCellEdits } from '../../components/useMatrixCellEdits.ts'
import type { FileClass } from '../../file/FileClass.ts'
import { FileClassBadge } from '../../file/FileClassBadge.tsx'
import type { FileClassFileExtension } from '../../file/FileClassFileExtension.ts'
import type { FileExtension } from '../../file/FileExtension.ts'
import {
  type FileExtensionBlock,
  getFileExtensionBlockKey,
  getFileExtensionBlocks,
} from '../../file/getFileExtensionBlocks.ts'
import { useFileClassFileExtension } from '../../file/useFileClassFileExtension.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'

/** Die Pinsel oben in der Ecke, wie bei ARC-AR. */
const BRUSHES: MatrixBrush<boolean>[] = [
  { value: false, label: '·', hint: 'Pinsel: nicht annehmen' },
  { value: true, label: '×', hint: 'Pinsel: annehmen' },
]

/** Eine Zeile der Matrix: die Kopfzeile einer Gruppe oder eine Endung darunter. */
type FileExtensionMatrixRow =
  | { kind: 'GROUP'; fileExtensionBlock: FileExtensionBlock }
  | { kind: 'EXTENSION'; fileExtension: FileExtension }

/** Der Eintrag „FileClass nimmt diese Endung an“, `undefined` wenn es ihn nicht gibt. */
function findFileClassFileExtension(
  fileClassFileExtensions: FileClassFileExtension[],
  fileClassKey: string,
  fileExtension: string,
): FileClassFileExtension | undefined {
  return fileClassFileExtensions.find(
    (fileClassFileExtension) =>
      fileClassFileExtension.fileClassKey === fileClassKey && fileClassFileExtension.fileExtension === fileExtension,
  )
}

/** z. B. „1 Freischaltung“ oder „12 Freischaltungen“ */
function getCountText(count: number, singular: string, plural: string): string {
  if (count === 1) {
    return count + ' ' + singular
  }
  return count + ' ' + plural
}

/** Der Name eines Blocks: der Name der Gruppe, ohne Gruppe ein fester Text. */
function getFileExtensionBlockTitle(fileExtensionBlock: FileExtensionBlock): string {
  if (fileExtensionBlock.fileExtensionGroup === null) {
    return 'ohne Gruppe'
  }
  return getTextInCurrentLanguage(fileExtensionBlock.fileExtensionGroup.displayName)
}

function getFileExtensionMatrixRowKey(fileExtensionMatrixRow: FileExtensionMatrixRow): string {
  if (fileExtensionMatrixRow.kind === 'GROUP') {
    const fileExtensionBlockKey = getFileExtensionBlockKey(fileExtensionMatrixRow.fileExtensionBlock)
    return 'group-' + fileExtensionBlockKey
  }
  return 'extension-' + fileExtensionMatrixRow.fileExtension.extension
}

function getFileClassKey(fileClass: FileClass): string {
  return fileClass.key
}

/**
 * Tab „FileClass-Endung“ der Administration, wie die Freischalt-Matrix der Vorlage: oben die FileClasses, links die
 * Endungen nach Gruppen, jede Gruppe mit eigener Kopfzeile, darin je Endung ihr Platz aus dem Tab „Endungen“. In der
 * Ecke der Pinsel: setzen (×) oder entfernen (·).
 *
 * Malen: linke Maustaste gedrückt halten und über die Zellen fahren, jede Endung bekommt den Wert des Pinsels, die
 * Kopfzeilen der Gruppen bleiben unberührt. Klick: Die Zelle bekommt den Wert des Pinsels, hat sie ihn schon, schaltet
 * sie um. In der Kopfzeile einer Gruppe zählt die Zelle, wie viele ihrer Endungen die FileClass annimmt; ein Klick
 * schaltet alle frei oder, wenn schon alle frei sind, alle ab. Bis das Backend bestätigt, sind Zellen schraffiert, danach
 * kommt ein Toast. Gespeichert wird je Zelle ein Request (freischalten oder entfernen), danach laden auch die Stammdaten
 * neu, damit die Upload-Maske den neuen Stand kennt. Schon hochgeladene Dateien bleiben, wenn eine Endung entfernt wird.
 */
export function FileClassFileExtensionMatrixTab() {
  const masterDataHook = useMasterData()
  const fileClasses = masterDataHook.fileClasses
  const fileExtensions = masterDataHook.fileExtensions
  const fileExtensionGroups = masterDataHook.fileExtensionGroups
  const reloadMasterData = masterDataHook.reload
  const loadFileClassFileExtensionHook = useFileClassFileExtension()
  const saveFileClassFileExtensionHook = useFileClassFileExtension()
  const getAllFileClassFileExtension = loadFileClassFileExtensionHook.getAllFileClassFileExtension
  const loadedFileClassFileExtensions = useLoadedData(getAllFileClassFileExtension)
  // Der Stand nach dem letzten Speichern, bis dahin der geladene
  const [savedFileClassFileExtensions, setSavedFileClassFileExtensions] = useState<FileClassFileExtension[] | null>(
    null,
  )
  const [brush, setBrush] = useState<boolean>(true)

  let serverFileClassFileExtensions = loadedFileClassFileExtensions.data
  if (savedFileClassFileExtensions !== null) {
    serverFileClassFileExtensions = savedFileClassFileExtensions
  }
  // Für die Handler, die nach dem Rendern laufen: der neueste Stand
  const serverFileClassFileExtensionsRef = useRef<FileClassFileExtension[]>([])
  useEffect(() => {
    if (serverFileClassFileExtensions !== null) {
      serverFileClassFileExtensionsRef.current = serverFileClassFileExtensions
    }
  })

  function isEnabledInBackend(fileClassKey: string, fileExtension: string): boolean {
    const foundFileClassFileExtension = findFileClassFileExtension(
      serverFileClassFileExtensionsRef.current,
      fileClassKey,
      fileExtension,
    )
    return foundFileClassFileExtension !== undefined
  }

  /** Lädt den Stand frisch aus dem Backend und übernimmt ihn, die Stammdaten gleich mit. */
  async function reloadServerFileClassFileExtensions(): Promise<FileClassFileExtension[]> {
    const reloadedFileClassFileExtensions = await getAllFileClassFileExtension()
    await reloadMasterData()
    if (reloadedFileClassFileExtensions === null) {
      return serverFileClassFileExtensionsRef.current
    }
    serverFileClassFileExtensionsRef.current = reloadedFileClassFileExtensions
    setSavedFileClassFileExtensions(reloadedFileClassFileExtensions)
    return reloadedFileClassFileExtensions
  }

  /** Je Zelle freischalten oder entfernen, danach den Stand frisch laden. Scheitert eine, wird trotzdem neu geladen. */
  async function saveFileClassFileExtensionChanges(
    changes: MatrixCellChange<boolean>[],
  ): Promise<MatrixServerValue<boolean>> {
    for (const change of changes) {
      const existingFileClassFileExtension = findFileClassFileExtension(
        serverFileClassFileExtensionsRef.current,
        change.rowKey,
        change.columnKey,
      )
      let succeeded = true
      if (change.value && existingFileClassFileExtension === undefined) {
        const newFileClassFileExtension = { fileClassKey: change.rowKey, fileExtension: change.columnKey }
        const createdFileClassFileExtension =
          await saveFileClassFileExtensionHook.createFileClassFileExtension(newFileClassFileExtension)
        succeeded = createdFileClassFileExtension !== null
      } else if (!change.value && existingFileClassFileExtension !== undefined) {
        succeeded = await saveFileClassFileExtensionHook.deleteFileClassFileExtension(existingFileClassFileExtension.id)
      }
      if (!succeeded) {
        await reloadServerFileClassFileExtensions()
        throw new Error('Speichern fehlgeschlagen, die Matrix zeigt den gespeicherten Stand.')
      }
    }
    const reloadedFileClassFileExtensions = await reloadServerFileClassFileExtensions()
    return (fileClassKey: string, fileExtension: string) => {
      const savedFileClassFileExtension = findFileClassFileExtension(
        reloadedFileClassFileExtensions,
        fileClassKey,
        fileExtension,
      )
      return savedFileClassFileExtension !== undefined
    }
  }

  // Gespeichert wird je FileClass: Für den Hook ist die FileClass die Zeile und die Endung die Spalte, auch wenn die
  // Matrix sie andersherum zeigt.
  const matrixCellEdits = useMatrixCellEdits<boolean>({
    serverValue: isEnabledInBackend,
    save: saveFileClassFileExtensionChanges,
    savedToast: (cellCount, rowCount) => {
      const cellCountText = getCountText(cellCount, 'Freischaltung', 'Freischaltungen')
      const rowCountText = getCountText(rowCount, 'FileClass', 'FileClasses')
      return {
        kind: 'success',
        title: 'Endungen gespeichert',
        text: 'Alles sicher in der Datenbank: ' + cellCountText + ' an ' + rowCountText + '.',
      }
    },
  })

  /** Der Wert zum Zeichnen: noch nicht bestätigt, sonst der Stand des Backends. */
  function isShownEnabled(fileClass: FileClass, fileExtension: FileExtension): boolean {
    const pendingChange = matrixCellEdits.pendingChange(fileClass.key, fileExtension.extension)
    if (pendingChange !== undefined) {
      return pendingChange.value
    }
    if (serverFileClassFileExtensions === null) {
      return false
    }
    const foundFileClassFileExtension = findFileClassFileExtension(
      serverFileClassFileExtensions,
      fileClass.key,
      fileExtension.extension,
    )
    return foundFileClassFileExtension !== undefined
  }

  function isPending(fileExtensionMatrixRow: FileExtensionMatrixRow, fileClass: FileClass): boolean {
    if (fileExtensionMatrixRow.kind === 'EXTENSION') {
      const pendingChange = matrixCellEdits.pendingChange(fileClass.key, fileExtensionMatrixRow.fileExtension.extension)
      return pendingChange !== undefined
    }
    const fileExtensionsOfBlock = fileExtensionMatrixRow.fileExtensionBlock.fileExtensions
    return fileExtensionsOfBlock.some((fileExtension) => {
      const pendingChange = matrixCellEdits.pendingChange(fileClass.key, fileExtension.extension)
      return pendingChange !== undefined
    })
  }

  /** Wie viele Endungen eines Blocks die FileClass gerade annimmt (so wie gezeichnet). */
  function getShownEnabledCount(fileExtensionBlock: FileExtensionBlock, fileClass: FileClass): number {
    const shownEnabledFileExtensions = fileExtensionBlock.fileExtensions.filter((fileExtension) =>
      isShownEnabled(fileClass, fileExtension),
    )
    return shownEnabledFileExtensions.length
  }

  function handleCellClick(fileExtensionMatrixRow: FileExtensionMatrixRow, fileClass: FileClass) {
    if (fileExtensionMatrixRow.kind === 'EXTENSION') {
      const fileExtension = fileExtensionMatrixRow.fileExtension.extension
      const currentValue = matrixCellEdits.currentValue(fileClass.key, fileExtension)
      let newValue = brush
      if (currentValue === brush) {
        newValue = !currentValue
      }
      matrixCellEdits.changeCell(fileClass.key, fileExtension, newValue)
      return
    }
    // Kopfzeile einer Gruppe: alle frei, dann alle ab, sonst alle frei
    const fileExtensionsOfBlock = fileExtensionMatrixRow.fileExtensionBlock.fileExtensions
    if (fileExtensionsOfBlock.length === 0) {
      return
    }
    const allEnabled = fileExtensionsOfBlock.every((fileExtension) =>
      matrixCellEdits.currentValue(fileClass.key, fileExtension.extension),
    )
    const newValue = !allEnabled
    const changes: MatrixCellChange<boolean>[] = fileExtensionsOfBlock.map((fileExtension) => ({
      rowKey: fileClass.key,
      columnKey: fileExtension.extension,
      value: newValue,
    }))
    matrixCellEdits.changeCells(changes)
  }

  /** Gemalt wird nur auf Endungen, die Kopfzeilen der Gruppen bleiben unberührt. */
  function handleCellPaint(fileExtensionMatrixRow: FileExtensionMatrixRow, fileClass: FileClass) {
    if (fileExtensionMatrixRow.kind !== 'EXTENSION') {
      return
    }
    matrixCellEdits.paintCell(fileClass.key, fileExtensionMatrixRow.fileExtension.extension, brush)
  }

  function isMarked(fileExtensionMatrixRow: FileExtensionMatrixRow, fileClass: FileClass): boolean {
    if (fileExtensionMatrixRow.kind === 'EXTENSION') {
      return isShownEnabled(fileClass, fileExtensionMatrixRow.fileExtension)
    }
    return false
  }

  /** In der Kopfzeile einer Gruppe der Zähler, z. B. „2/4“; bei einer Endung das übliche × bzw. ·. */
  function getCellContent(fileExtensionMatrixRow: FileExtensionMatrixRow, fileClass: FileClass) {
    if (fileExtensionMatrixRow.kind !== 'GROUP') {
      return undefined
    }
    const fileExtensionBlock = fileExtensionMatrixRow.fileExtensionBlock
    const enabledCount = getShownEnabledCount(fileExtensionBlock, fileClass)
    const totalCount = fileExtensionBlock.fileExtensions.length
    let countClassName = 'matrix-count'
    if (totalCount > 0 && enabledCount === totalCount) {
      countClassName = 'matrix-count matrix-count-full'
    }
    const countText = enabledCount + '/' + totalCount
    return <span className={countClassName}>{countText}</span>
  }

  function getCellClassName(fileExtensionMatrixRow: FileExtensionMatrixRow, fileClass: FileClass): string | undefined {
    if (isPending(fileExtensionMatrixRow, fileClass)) {
      return 'matrix-cell-pending'
    }
    return undefined
  }

  function getRowClassName(fileExtensionMatrixRow: FileExtensionMatrixRow): string | undefined {
    if (fileExtensionMatrixRow.kind === 'GROUP') {
      return 'matrix-group-row'
    }
    return undefined
  }

  function getCellLabel(fileExtensionMatrixRow: FileExtensionMatrixRow, fileClass: FileClass): string {
    if (fileExtensionMatrixRow.kind === 'GROUP') {
      const fileExtensionBlock = fileExtensionMatrixRow.fileExtensionBlock
      const fileExtensionBlockTitle = getFileExtensionBlockTitle(fileExtensionBlock)
      const enabledCount = getShownEnabledCount(fileExtensionBlock, fileClass)
      const totalCount = fileExtensionBlock.fileExtensions.length
      return (
        fileClass.key + ': alle Endungen der Gruppe ' + fileExtensionBlockTitle + ' umschalten (' + enabledCount +
        ' von ' + totalCount + ' frei)'
      )
    }
    const fileExtension = fileExtensionMatrixRow.fileExtension
    let enabledText = 'nimmt nicht an'
    if (isShownEnabled(fileClass, fileExtension)) {
      enabledText = 'nimmt an'
    }
    return fileClass.key + ' ' + enabledText + ': ' + fileExtension.extension
  }

  function renderRowHeader(fileExtensionMatrixRow: FileExtensionMatrixRow) {
    if (fileExtensionMatrixRow.kind === 'GROUP') {
      const fileExtensionBlock = fileExtensionMatrixRow.fileExtensionBlock
      const fileExtensionBlockTitle = getFileExtensionBlockTitle(fileExtensionBlock)
      const fileExtensionCountText = '(' + fileExtensionBlock.fileExtensions.length + ')'
      return (
        <span className="matrix-row-head-content">
          {fileExtensionBlockTitle}
          <span className="matrix-group-count">{fileExtensionCountText}</span>
        </span>
      )
    }
    const fileExtension = fileExtensionMatrixRow.fileExtension
    let descriptionText: string | null = null
    if (fileExtension.description !== null) {
      descriptionText = getTextInCurrentLanguage(fileExtension.description)
    }
    return (
      <span className="matrix-row-head-content matrix-extension-head">
        <Hoverlay text={descriptionText}>
          <code>.{fileExtension.extension}</code>
        </Hoverlay>
      </span>
    )
  }

  function renderColumnHeader(fileClass: FileClass) {
    return <FileClassBadge fileClass={fileClass} />
  }

  const fileExtensionMatrixRows: FileExtensionMatrixRow[] = []
  if (fileExtensionGroups !== null && fileExtensions !== null) {
    const fileExtensionBlocks = getFileExtensionBlocks(fileExtensionGroups, fileExtensions)
    for (const fileExtensionBlock of fileExtensionBlocks) {
      fileExtensionMatrixRows.push({ kind: 'GROUP', fileExtensionBlock })
      for (const fileExtension of fileExtensionBlock.fileExtensions) {
        fileExtensionMatrixRows.push({ kind: 'EXTENSION', fileExtension })
      }
    }
  }

  let errorMessage: string | null = null
  if (masterDataHook.error !== null) {
    errorMessage = masterDataHook.error.detail
  } else if (loadFileClassFileExtensionHook.error !== null) {
    errorMessage = loadFileClassFileExtensionHook.error.detail
  } else if (saveFileClassFileExtensionHook.error !== null) {
    errorMessage = saveFileClassFileExtensionHook.error.detail
  } else if (matrixCellEdits.saveErrorMessage !== null) {
    errorMessage = matrixCellEdits.saveErrorMessage
  }
  const isLoading =
    serverFileClassFileExtensions === null ||
    fileClasses === null ||
    fileExtensions === null ||
    fileExtensionGroups === null
  const brushes = <MatrixBrushes brushes={BRUSHES} value={brush} onChange={setBrush} />

  return (
    <>
      {(errorMessage !== null || isLoading) && (
        <div className="matrix-message">
          {errorMessage !== null && <span className="text-danger">{errorMessage}</span>}
          {errorMessage === null && <Spinner animation="border" size="sm" />}
        </div>
      )}
      {!isLoading && fileClasses !== null && (
        <Matrix
          rows={fileExtensionMatrixRows}
          columns={fileClasses}
          rowKey={getFileExtensionMatrixRowKey}
          columnKey={getFileClassKey}
          rowsLabel="Endung"
          columnsLabel="FileClass"
          cornerContent={brushes}
          rowHeader={renderRowHeader}
          columnHeader={renderColumnHeader}
          isMarked={isMarked}
          cellContent={getCellContent}
          cellClassName={getCellClassName}
          rowClassName={getRowClassName}
          cellLabel={getCellLabel}
          onCellClick={handleCellClick}
          onCellPaint={handleCellPaint}
          onPaintEnd={matrixCellEdits.endPaint}
        />
      )}
    </>
  )
}
