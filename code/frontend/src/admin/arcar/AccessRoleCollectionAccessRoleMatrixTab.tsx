import { useEffect, useRef, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../../api/useLoadedData.ts'
import type { AccessRole } from '../../auth/access/AccessRole.ts'
import { AccessRoleBadge } from '../../auth/access/AccessRoleBadge.tsx'
import type { AccessRoleCollection } from '../../auth/access/AccessRoleCollection.ts'
import { AccessRoleCollectionBadge } from '../../auth/access/AccessRoleCollectionBadge.tsx'
import type { AccessRoleCollectionRole } from '../../auth/access/AccessRoleCollectionRole.ts'
import { useAccessRoleCollection } from '../../auth/access/useAccessRoleCollection.ts'
import { useAccessRoleCollectionRole } from '../../auth/access/useAccessRoleCollectionRole.ts'
import { Matrix } from '../../components/Matrix.tsx'
import { type MatrixBrush, MatrixBrushes } from '../../components/MatrixBrushes.tsx'
import {
  type MatrixCellChange,
  type MatrixServerValue,
  useMatrixCellEdits,
} from '../../components/useMatrixCellEdits.ts'
import { useListingOrder } from '../../components/useListingOrder.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'

/** Die Pinsel oben in der Ecke, wie in der Vorlage. */
const BRUSHES: MatrixBrush<boolean>[] = [
  { value: false, label: '·', hint: 'Pinsel: nicht verleihen' },
  { value: true, label: '×', hint: 'Pinsel: verleihen' },
]

/** Der Eintrag „Collection verleiht dieses Recht“, `undefined` wenn es ihn nicht gibt. */
function findAccessRoleCollectionRole(
  accessRoleCollectionRoles: AccessRoleCollectionRole[],
  accessRoleCollectionKey: string,
  accessRoleKey: string,
): AccessRoleCollectionRole | undefined {
  for (const accessRoleCollectionRole of accessRoleCollectionRoles) {
    const isSameCollection = accessRoleCollectionRole.accessRoleCollectionKey === accessRoleCollectionKey
    const isSameAccessRole = accessRoleCollectionRole.accessRoleKey === accessRoleKey
    if (isSameCollection && isSameAccessRole) {
      return accessRoleCollectionRole
    }
  }
  return undefined
}

function getAccessRoleCollectionKey(accessRoleCollection: AccessRoleCollection): string {
  return accessRoleCollection.key
}

/** z. B. „1 Zuordnung“ oder „12 Zuordnungen“ */
function getCountText(count: number, singular: string, plural: string): string {
  if (count === 1) {
    return count + ' ' + singular
  }
  return count + ' ' + plural
}

/**
 * Tab „ARC-AR“ der Administration, wie in der Vorlage: welche Rechte (AR) eine Collection (ARC) verleiht. Links die
 * Collections, oben die Rechte, in der Ecke der Pinsel: verleihen (×) oder nicht (·).
 *
 * Malen: linke Maustaste gedrückt halten und über die Zellen fahren, jede bekommt den Wert des Pinsels. Klick: eine
 * Zelle bekommt den Wert des Pinsels, hat sie ihn schon, schaltet sie um. Speichern, Schraffur bis zur Bestätigung und
 * Toast übernimmt `useMatrixCellEdits`. Gespeichert wird je Zelle ein Request (aufnehmen oder entfernen). Wer eine
 * geänderte Collection trägt, bekommt die neuen Rechte bei der nächsten Anmeldung ins Token.
 *
 * Die Zeilen (Positionen) lassen sich am Griff im Zeilenkopf per Drag and Drop verschieben; die Reihenfolge gilt
 * überall (Stammdaten). Die Zuordnungen hängen an den Keys, nicht an der Zeile, und bleiben deshalb richtig.
 */
export function AccessRoleCollectionAccessRoleMatrixTab() {
  const masterDataHook = useMasterData()
  const accessRoles = masterDataHook.accessRoles
  const masterDataError = masterDataHook.error
  const orderAccessRoleCollectionHook = useAccessRoleCollection()
  const changeAccessRoleCollectionListingPositions =
    orderAccessRoleCollectionHook.changeAccessRoleCollectionListingPositions

  async function saveAccessRoleCollectionOrder(accessRoleCollectionKeysInOrder: string[]): Promise<boolean> {
    const reorderedAccessRoleCollections = await changeAccessRoleCollectionListingPositions(
      accessRoleCollectionKeysInOrder,
    )
    await masterDataHook.reload()
    return reorderedAccessRoleCollections !== null
  }

  const listingOrder = useListingOrder(
    masterDataHook.accessRoleCollections,
    getAccessRoleCollectionKey,
    saveAccessRoleCollectionOrder,
    'Positionen',
  )
  const accessRoleCollections = listingOrder.shownItems
  const loadAccessRoleCollectionRoleHook = useAccessRoleCollectionRole()
  const saveAccessRoleCollectionRoleHook = useAccessRoleCollectionRole()
  const getAllAccessRoleCollectionRole = loadAccessRoleCollectionRoleHook.getAllAccessRoleCollectionRole
  const loadedAccessRoleCollectionRoles = useLoadedData(getAllAccessRoleCollectionRole)
  // Der Stand nach dem letzten Speichern, bis dahin der geladene
  const [savedAccessRoleCollectionRoles, setSavedAccessRoleCollectionRoles] = useState<
    AccessRoleCollectionRole[] | null
  >(null)
  const [brush, setBrush] = useState<boolean>(true)

  let serverAccessRoleCollectionRoles = loadedAccessRoleCollectionRoles.data
  if (savedAccessRoleCollectionRoles !== null) {
    serverAccessRoleCollectionRoles = savedAccessRoleCollectionRoles
  }
  // Für die Handler, die nach dem Rendern laufen: der neueste Stand
  const serverAccessRoleCollectionRolesRef = useRef<AccessRoleCollectionRole[]>([])
  useEffect(() => {
    if (serverAccessRoleCollectionRoles !== null) {
      serverAccessRoleCollectionRolesRef.current = serverAccessRoleCollectionRoles
    }
  })

  function isGrantedInBackend(accessRoleCollectionKey: string, accessRoleKey: string): boolean {
    const currentAccessRoleCollectionRoles = serverAccessRoleCollectionRolesRef.current
    const foundAccessRoleCollectionRole = findAccessRoleCollectionRole(
      currentAccessRoleCollectionRoles,
      accessRoleCollectionKey,
      accessRoleKey,
    )
    return foundAccessRoleCollectionRole !== undefined
  }

  /** Lädt den Stand frisch aus dem Backend und übernimmt ihn. */
  async function reloadServerAccessRoleCollectionRoles(): Promise<AccessRoleCollectionRole[]> {
    const reloadedAccessRoleCollectionRoles = await getAllAccessRoleCollectionRole()
    if (reloadedAccessRoleCollectionRoles === null) {
      return serverAccessRoleCollectionRolesRef.current
    }
    serverAccessRoleCollectionRolesRef.current = reloadedAccessRoleCollectionRoles
    setSavedAccessRoleCollectionRoles(reloadedAccessRoleCollectionRoles)
    return reloadedAccessRoleCollectionRoles
  }

  /** Je Zelle aufnehmen oder entfernen, danach den Stand frisch laden. Scheitert eine, wird trotzdem neu geladen. */
  async function saveAccessRoleCollectionRoleChanges(
    changes: MatrixCellChange<boolean>[],
  ): Promise<MatrixServerValue<boolean>> {
    for (const change of changes) {
      const existingAccessRoleCollectionRole = findAccessRoleCollectionRole(
        serverAccessRoleCollectionRolesRef.current,
        change.rowKey,
        change.columnKey,
      )
      let succeeded = true
      if (change.value && existingAccessRoleCollectionRole === undefined) {
        const newAccessRoleCollectionRole = { accessRoleCollectionKey: change.rowKey, accessRoleKey: change.columnKey }
        const createdAccessRoleCollectionRole =
          await saveAccessRoleCollectionRoleHook.createAccessRoleCollectionRole(newAccessRoleCollectionRole)
        succeeded = createdAccessRoleCollectionRole !== null
      } else if (!change.value && existingAccessRoleCollectionRole !== undefined) {
        const existingId = existingAccessRoleCollectionRole.id
        succeeded = await saveAccessRoleCollectionRoleHook.deleteAccessRoleCollectionRole(existingId)
      }
      if (!succeeded) {
        await reloadServerAccessRoleCollectionRoles()
        throw new Error('Speichern fehlgeschlagen, die Matrix zeigt den gespeicherten Stand.')
      }
    }
    const reloadedAccessRoleCollectionRoles = await reloadServerAccessRoleCollectionRoles()
    return (accessRoleCollectionKey: string, accessRoleKey: string) => {
      const savedAccessRoleCollectionRole = findAccessRoleCollectionRole(
        reloadedAccessRoleCollectionRoles,
        accessRoleCollectionKey,
        accessRoleKey,
      )
      return savedAccessRoleCollectionRole !== undefined
    }
  }

  const matrixCellEdits = useMatrixCellEdits<boolean>({
    serverValue: isGrantedInBackend,
    save: saveAccessRoleCollectionRoleChanges,
    savedToast: (cellCount, rowCount) => {
      const cellCountText = getCountText(cellCount, 'Zuordnung', 'Zuordnungen')
      const rowCountText = getCountText(rowCount, 'ARC', 'ARC')
      return {
        kind: 'success',
        title: 'Verliehene AR gespeichert',
        text: 'Alles sicher in der Datenbank: ' + cellCountText + ' an ' + rowCountText + '.',
      }
    },
  })

  function handleCellClick(accessRoleCollection: AccessRoleCollection, accessRole: AccessRole) {
    const currentValue = matrixCellEdits.currentValue(accessRoleCollection.key, accessRole.key)
    let newValue = brush
    if (currentValue === brush) {
      newValue = !currentValue
    }
    matrixCellEdits.changeCell(accessRoleCollection.key, accessRole.key, newValue)
  }

  function handleCellPaint(accessRoleCollection: AccessRoleCollection, accessRole: AccessRole) {
    matrixCellEdits.paintCell(accessRoleCollection.key, accessRole.key, brush)
  }

  /** Der Wert zum Zeichnen: noch nicht bestätigt, sonst der Stand des Backends. */
  function isShownGranted(accessRoleCollection: AccessRoleCollection, accessRole: AccessRole): boolean {
    const pendingChange = matrixCellEdits.pendingChange(accessRoleCollection.key, accessRole.key)
    if (pendingChange !== undefined) {
      return pendingChange.value
    }
    if (serverAccessRoleCollectionRoles === null) {
      return false
    }
    const foundAccessRoleCollectionRole = findAccessRoleCollectionRole(
      serverAccessRoleCollectionRoles,
      accessRoleCollection.key,
      accessRole.key,
    )
    return foundAccessRoleCollectionRole !== undefined
  }

  function getCellClassName(accessRoleCollection: AccessRoleCollection, accessRole: AccessRole): string | undefined {
    const pendingChange = matrixCellEdits.pendingChange(accessRoleCollection.key, accessRole.key)
    if (pendingChange !== undefined) {
      return 'matrix-cell-pending'
    }
    return undefined
  }

  function getCellLabel(accessRoleCollection: AccessRoleCollection, accessRole: AccessRole): string {
    let grantedText = 'nicht verliehen'
    if (isShownGranted(accessRoleCollection, accessRole)) {
      grantedText = 'verliehen'
    }
    let pendingText = ''
    const pendingChange = matrixCellEdits.pendingChange(accessRoleCollection.key, accessRole.key)
    if (pendingChange !== undefined) {
      pendingText = ', noch nicht gespeichert'
    }
    return accessRole.key + ' über ' + accessRoleCollection.key + ': ' + grantedText + pendingText
  }

  let errorMessage: string | null = null
  if (masterDataError !== null) {
    errorMessage = masterDataError.detail
  } else if (loadAccessRoleCollectionRoleHook.error !== null) {
    errorMessage = loadAccessRoleCollectionRoleHook.error.detail
  } else if (saveAccessRoleCollectionRoleHook.error !== null) {
    errorMessage = saveAccessRoleCollectionRoleHook.error.detail
  } else if (orderAccessRoleCollectionHook.error !== null) {
    errorMessage = orderAccessRoleCollectionHook.error.detail
  } else if (matrixCellEdits.saveErrorMessage !== null) {
    errorMessage = matrixCellEdits.saveErrorMessage
  }
  const isLoading = serverAccessRoleCollectionRoles === null || accessRoleCollections === null || accessRoles === null
  const brushes = <MatrixBrushes brushes={BRUSHES} value={brush} onChange={setBrush} />

  return (
    <>
      {/* Nur bei Fehler oder während des Ladens, sonst steht die Matrix allein */}
      {(errorMessage !== null || isLoading) && (
        <div className="matrix-message">
          {errorMessage !== null && <span className="text-danger">{errorMessage}</span>}
          {errorMessage === null && <Spinner animation="border" size="sm" />}
        </div>
      )}
      {!isLoading && accessRoleCollections !== null && accessRoles !== null && (
        <Matrix
          rows={accessRoleCollections}
          columns={accessRoles}
          rowKey={(accessRoleCollection) => accessRoleCollection.key}
          columnKey={(accessRole) => accessRole.key}
          rowsLabel="AccessRoleCollection"
          columnsLabel="AccessRole"
          cornerContent={brushes}
          rowHeader={(accessRoleCollection) => <AccessRoleCollectionBadge accessRoleCollection={accessRoleCollection} />}
          columnHeader={(accessRole) => <AccessRoleBadge accessRole={accessRole} />}
          isMarked={isShownGranted}
          cellClassName={getCellClassName}
          cellLabel={getCellLabel}
          onCellClick={handleCellClick}
          onCellPaint={handleCellPaint}
          onPaintEnd={matrixCellEdits.endPaint}
          onRowReorder={listingOrder.reorder}
          isRowReorderDisabled={listingOrder.isSaving}
        />
      )}
    </>
  )
}
