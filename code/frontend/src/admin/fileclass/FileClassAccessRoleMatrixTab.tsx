import { useEffect, useRef, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../../api/useLoadedData.ts'
import type { AccessRole } from '../../auth/access/AccessRole.ts'
import { AccessRoleBadge } from '../../auth/access/AccessRoleBadge.tsx'
import { Matrix } from '../../components/Matrix.tsx'
import { type MatrixBrush, MatrixBrushes } from '../../components/MatrixBrushes.tsx'
import { type MatrixCellChange, type MatrixServerValue, useMatrixCellEdits } from '../../components/useMatrixCellEdits.ts'
import type { FileClass } from '../../file/FileClass.ts'
import type { FileClassAccessRole } from '../../file/FileClassAccessRole.ts'
import { useFileClassAccessRole } from '../../file/useFileClassAccessRole.ts'
import type { MultilingualText } from '../../language/MultilingualText.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { FILE_CLASS_ACCESS_TEXTS } from './fileClassAccessTexts.ts'

/**
 * Was eine Zelle zeigt: welche der drei Schalter an sind, je Schalter ein Buchstabe (L lesen, B bearbeiten,
 * H hochladen). Bearbeiten und Hochladen schließen Lesen ein, deshalb gibt es genau diese Kombinationen.
 */
type FileClassAccessCellValue = 'NONE' | 'L' | 'LH' | 'LB' | 'LBH'

/** Die drei Schalter eines Eintrags. */
type FileClassGrants = {
  readGranted: boolean
  editGranted: boolean
  uploadGranted: boolean
}

/** Die Pinsel oben in der Ecke: nichts, nur lesen, lesen und hochladen, lesen und bearbeiten, alles. */
const BRUSHES: MatrixBrush<FileClassAccessCellValue>[] = [
  { value: 'NONE', label: '·', hint: getTextInCurrentLanguage(FILE_CLASS_ACCESS_TEXTS.brushNoneHint) },
  { value: 'L', label: 'L', hint: getTextInCurrentLanguage(FILE_CLASS_ACCESS_TEXTS.brushReadHint) },
  { value: 'LH', label: 'LH', hint: getTextInCurrentLanguage(FILE_CLASS_ACCESS_TEXTS.brushReadUploadHint) },
  { value: 'LB', label: 'LB', hint: getTextInCurrentLanguage(FILE_CLASS_ACCESS_TEXTS.brushReadEditHint) },
  { value: 'LBH', label: 'LBH', hint: getTextInCurrentLanguage(FILE_CLASS_ACCESS_TEXTS.brushReadEditUploadHint) },
]

/** Für Screenreader: was eine Zelle mit diesem Wert erlaubt. */
const CELL_VALUE_TEXTS: Record<FileClassAccessCellValue, MultilingualText> = {
  NONE: FILE_CLASS_ACCESS_TEXTS.cellNone,
  L: FILE_CLASS_ACCESS_TEXTS.cellRead,
  LH: FILE_CLASS_ACCESS_TEXTS.cellReadUpload,
  LB: FILE_CLASS_ACCESS_TEXTS.cellReadEdit,
  LBH: FILE_CLASS_ACCESS_TEXTS.cellReadEditUpload,
}

/** Der Wert einer Zelle zu den drei Schaltern eines Eintrags. */
function getCellValueOfGrants(fileClassGrants: FileClassGrants): FileClassAccessCellValue {
  if (fileClassGrants.editGranted && fileClassGrants.uploadGranted) {
    return 'LBH'
  }
  if (fileClassGrants.editGranted) {
    return 'LB'
  }
  if (fileClassGrants.uploadGranted) {
    return 'LH'
  }
  if (fileClassGrants.readGranted) {
    return 'L'
  }
  return 'NONE'
}

/** Die drei Schalter zum Wert einer Zelle; Lesen ist bei jedem Wert außer „nichts“ dabei. */
function getGrantsOfCellValue(cellValue: FileClassAccessCellValue): FileClassGrants {
  const readGranted = cellValue !== 'NONE'
  const editGranted = cellValue === 'LB' || cellValue === 'LBH'
  const uploadGranted = cellValue === 'LH' || cellValue === 'LBH'
  return { readGranted, editGranted, uploadGranted }
}

/** Der Eintrag des Rechts an der FileClass, `undefined` wenn es keinen gibt. */
function findFileClassAccessRole(
  fileClassAccessRoles: FileClassAccessRole[],
  fileClassKey: string,
  accessRoleKey: string,
): FileClassAccessRole | undefined {
  return fileClassAccessRoles.find(
    (fileClassAccessRole) =>
      fileClassAccessRole.fileClassKey === fileClassKey && fileClassAccessRole.accessRoleKey === accessRoleKey,
  )
}

/** Der Wert einer Zelle aus der Liste der Einträge. */
function getCellValue(
  fileClassAccessRoles: FileClassAccessRole[],
  fileClassKey: string,
  accessRoleKey: string,
): FileClassAccessCellValue {
  const foundFileClassAccessRole = findFileClassAccessRole(fileClassAccessRoles, fileClassKey, accessRoleKey)
  if (foundFileClassAccessRole === undefined) {
    return 'NONE'
  }
  return getCellValueOfGrants(foundFileClassAccessRole)
}

/** z. B. „1 Zelle“ oder „12 Zellen“ */
function getCountText(count: number, singular: string, plural: string): string {
  if (count === 1) {
    return count + ' ' + singular
  }
  return count + ' ' + plural
}

/**
 * Tab „FileClass-AR“ der Administration: welches Recht an den Dateien einer FileClass lesen (L), bearbeiten (B) und
 * hochladen (H) darf, drei eigene Schalter (Nutzer 2026-11-11). Links die FileClasses, oben die Rechte, in der Ecke die
 * Pinsel: nichts, L, LH, LB, LBH. Bearbeiten und Hochladen schließen Lesen ein. Klick setzt den Pinsel, hat die Zelle
 * ihn schon, wird sie leer; mit gedrückter linker Maustaste wird gemalt. Gespeichert wird je Zelle ein Request (anlegen,
 * Schalter ändern oder entfernen), danach laden auch die Stammdaten neu.
 *
 * „Bearbeiten“ wird gespeichert, aber noch nicht ausgewertet: Bis die Regel steht, bearbeitet der Autor seine Datei.
 *
 * Achtung: Hochgeladene Dateien tragen die Rechte ihrer FileClass vom Zeitpunkt des Uploads. Das Nachziehen bestehender
 * Dokumente kommt mit dem Upload.
 */
export function FileClassAccessRoleMatrixTab() {
  const masterDataHook = useMasterData()
  const fileClasses = masterDataHook.fileClasses
  const accessRoles = masterDataHook.accessRoles
  const reloadMasterData = masterDataHook.reload
  const loadFileClassAccessRoleHook = useFileClassAccessRole()
  const saveFileClassAccessRoleHook = useFileClassAccessRole()
  const getAllFileClassAccessRole = loadFileClassAccessRoleHook.getAllFileClassAccessRole
  const loadedFileClassAccessRoles = useLoadedData(getAllFileClassAccessRole)
  // Der Stand nach dem letzten Speichern, bis dahin der geladene
  const [savedFileClassAccessRoles, setSavedFileClassAccessRoles] = useState<FileClassAccessRole[] | null>(null)
  const [brush, setBrush] = useState<FileClassAccessCellValue>('LH')

  let serverFileClassAccessRoles = loadedFileClassAccessRoles.data
  if (savedFileClassAccessRoles !== null) {
    serverFileClassAccessRoles = savedFileClassAccessRoles
  }
  // Für die Handler, die nach dem Rendern laufen: der neueste Stand
  const serverFileClassAccessRolesRef = useRef<FileClassAccessRole[]>([])
  useEffect(() => {
    if (serverFileClassAccessRoles !== null) {
      serverFileClassAccessRolesRef.current = serverFileClassAccessRoles
    }
  })

  function getServerCellValue(fileClassKey: string, accessRoleKey: string): FileClassAccessCellValue {
    return getCellValue(serverFileClassAccessRolesRef.current, fileClassKey, accessRoleKey)
  }

  /** Lädt den Stand frisch aus dem Backend und übernimmt ihn, die Stammdaten gleich mit. */
  async function reloadServerFileClassAccessRoles(): Promise<FileClassAccessRole[]> {
    const reloadedFileClassAccessRoles = await getAllFileClassAccessRole()
    await reloadMasterData()
    if (reloadedFileClassAccessRoles === null) {
      return serverFileClassAccessRolesRef.current
    }
    serverFileClassAccessRolesRef.current = reloadedFileClassAccessRoles
    setSavedFileClassAccessRoles(reloadedFileClassAccessRoles)
    return reloadedFileClassAccessRoles
  }

  /** Speichert eine Zelle: anlegen, Schalter ändern oder entfernen. Liefert, ob es geklappt hat. */
  async function saveFileClassAccessCell(change: MatrixCellChange<FileClassAccessCellValue>): Promise<boolean> {
    const existingFileClassAccessRole = findFileClassAccessRole(
      serverFileClassAccessRolesRef.current,
      change.rowKey,
      change.columnKey,
    )
    if (change.value === 'NONE') {
      if (existingFileClassAccessRole === undefined) {
        return true
      }
      return saveFileClassAccessRoleHook.deleteFileClassAccessRole(existingFileClassAccessRole.id)
    }
    const changedGrants = getGrantsOfCellValue(change.value)
    if (existingFileClassAccessRole === undefined) {
      const newFileClassAccessRole = {
        fileClassKey: change.rowKey,
        accessRoleKey: change.columnKey,
        ...changedGrants,
      }
      const createdFileClassAccessRole =
        await saveFileClassAccessRoleHook.createFileClassAccessRole(newFileClassAccessRole)
      return createdFileClassAccessRole !== null
    }
    const existingCellValue = getCellValueOfGrants(existingFileClassAccessRole)
    if (existingCellValue === change.value) {
      return true
    }
    const changedFileClassAccessRole: FileClassAccessRole = { ...existingFileClassAccessRole, ...changedGrants }
    const savedFileClassAccessRole =
      await saveFileClassAccessRoleHook.changeFileClassAccessRole(changedFileClassAccessRole)
    return savedFileClassAccessRole !== null
  }

  /** Je Zelle speichern, danach den Stand frisch laden. Scheitert eine, wird trotzdem neu geladen. */
  async function saveFileClassAccessRoleChanges(
    changes: MatrixCellChange<FileClassAccessCellValue>[],
  ): Promise<MatrixServerValue<FileClassAccessCellValue>> {
    for (const change of changes) {
      const succeeded = await saveFileClassAccessCell(change)
      if (!succeeded) {
        await reloadServerFileClassAccessRoles()
        throw new Error('Speichern fehlgeschlagen, die Matrix zeigt den gespeicherten Stand.')
      }
    }
    const reloadedFileClassAccessRoles = await reloadServerFileClassAccessRoles()
    return (fileClassKey: string, accessRoleKey: string) => {
      return getCellValue(reloadedFileClassAccessRoles, fileClassKey, accessRoleKey)
    }
  }

  const matrixCellEdits = useMatrixCellEdits<FileClassAccessCellValue>({
    serverValue: getServerCellValue,
    save: saveFileClassAccessRoleChanges,
    savedToast: (cellCount, rowCount) => {
      const cellCountText = getCountText(cellCount, 'Zelle', 'Zellen')
      const rowCountText = getCountText(rowCount, 'FileClass', 'FileClasses')
      return {
        kind: 'success',
        title: 'Rechte an FileClasses gespeichert',
        text: 'Alles sicher in der Datenbank: ' + cellCountText + ' an ' + rowCountText + '.',
      }
    },
  })

  function handleCellClick(fileClass: FileClass, accessRole: AccessRole) {
    const currentValue = matrixCellEdits.currentValue(fileClass.key, accessRole.key)
    let newValue: FileClassAccessCellValue = brush
    if (currentValue === brush) {
      newValue = 'NONE'
    }
    matrixCellEdits.changeCell(fileClass.key, accessRole.key, newValue)
  }

  function handleCellPaint(fileClass: FileClass, accessRole: AccessRole) {
    matrixCellEdits.paintCell(fileClass.key, accessRole.key, brush)
  }

  /** Der Wert zum Zeichnen: noch nicht bestätigt, sonst der Stand des Backends. */
  function getShownCellValue(fileClass: FileClass, accessRole: AccessRole): FileClassAccessCellValue {
    const pendingChange = matrixCellEdits.pendingChange(fileClass.key, accessRole.key)
    if (pendingChange !== undefined) {
      return pendingChange.value
    }
    if (serverFileClassAccessRoles === null) {
      return 'NONE'
    }
    return getCellValue(serverFileClassAccessRoles, fileClass.key, accessRole.key)
  }

  function isShownMarked(fileClass: FileClass, accessRole: AccessRole): boolean {
    return getShownCellValue(fileClass, accessRole) !== 'NONE'
  }

  /** In einer gesetzten Zelle stehen die Buchstaben ihrer Schalter, z. B. „LH“. */
  function getShownMarkText(fileClass: FileClass, accessRole: AccessRole): string {
    return getShownCellValue(fileClass, accessRole)
  }

  function getCellClassName(fileClass: FileClass, accessRole: AccessRole): string | undefined {
    const pendingChange = matrixCellEdits.pendingChange(fileClass.key, accessRole.key)
    if (pendingChange !== undefined) {
      return 'matrix-cell-pending'
    }
    return undefined
  }

  function getCellLabel(fileClass: FileClass, accessRole: AccessRole): string {
    const shownCellValue = getShownCellValue(fileClass, accessRole)
    const accessText = getTextInCurrentLanguage(CELL_VALUE_TEXTS[shownCellValue])
    return accessRole.key + ' an ' + fileClass.key + ': ' + accessText
  }

  let errorMessage: string | null = null
  if (masterDataHook.error !== null) {
    errorMessage = masterDataHook.error.detail
  } else if (loadFileClassAccessRoleHook.error !== null) {
    errorMessage = loadFileClassAccessRoleHook.error.detail
  } else if (saveFileClassAccessRoleHook.error !== null) {
    errorMessage = saveFileClassAccessRoleHook.error.detail
  } else if (matrixCellEdits.saveErrorMessage !== null) {
    errorMessage = matrixCellEdits.saveErrorMessage
  }
  const isLoading = serverFileClassAccessRoles === null || fileClasses === null || accessRoles === null
  const brushes = <MatrixBrushes brushes={BRUSHES} value={brush} onChange={setBrush} />

  return (
    <>
      {(errorMessage !== null || isLoading) && (
        <div className="matrix-message">
          {errorMessage !== null && <span className="text-danger">{errorMessage}</span>}
          {errorMessage === null && <Spinner animation="border" size="sm" />}
        </div>
      )}
      {!isLoading && fileClasses !== null && accessRoles !== null && (
        <Matrix
          rows={fileClasses}
          columns={accessRoles}
          rowKey={(fileClass) => fileClass.key}
          columnKey={(accessRole) => accessRole.key}
          rowsLabel="FileClass"
          columnsLabel="AccessRole"
          cornerContent={brushes}
          rowHeader={(fileClass) => getTextInCurrentLanguage(fileClass.displayName)}
          columnHeader={(accessRole) => <AccessRoleBadge accessRole={accessRole} />}
          isMarked={isShownMarked}
          markText={getShownMarkText}
          cellClassName={getCellClassName}
          cellLabel={getCellLabel}
          onCellClick={handleCellClick}
          onCellPaint={handleCellPaint}
          onPaintEnd={matrixCellEdits.endPaint}
        />
      )}
    </>
  )
}
