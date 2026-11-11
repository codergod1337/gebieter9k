import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ContentBox } from '../../components/ContentBox.tsx'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { Table } from '../../components/Table.tsx'
import type { TableColumn } from '../../components/TableColumn.ts'
import type { FileClass } from '../../file/FileClass.ts'
import { FileClassBadge } from '../../file/FileClassBadge.tsx'
import {
  FILE_CLASS_DESTINATION_LABELS,
  FILE_CLASS_DESTINATIONS,
  type FileClassDestination,
  type FileClassDestinationAssignment,
} from '../../file/FileClassDestination.ts'
import { useFileClassDestinationAssignment } from '../../file/useFileClassDestinationAssignment.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'

/** Unter diesem Schlüssel merkt sich die Tabelle die Spaltenbreiten des Users. */
const FILE_CLASS_DESTINATION_TABLE_SETTING_KEY = 'FILE_CLASS_DESTINATION'

function getFileClassKey(fileClass: FileClass): string {
  return fileClass.key
}

/** Die Zuordnung dieser FileClass zu diesem Ziel, `undefined` wenn sie dort nicht angeboten wird. */
function findAssignment(
  assignments: FileClassDestinationAssignment[],
  fileClassKey: string,
  destination: FileClassDestination,
): FileClassDestinationAssignment | undefined {
  return assignments.find((assignment) => assignment.fileClassKey === fileClassKey && assignment.destination === destination)
}

/**
 * Tab „FileClass-Ziel“ der Administration (Konzept `docu/konzept-galerie.md`): je FileClass eine Zeile, je Ziel eine
 * Spalte mit Checkbox. Ein Haken heißt: Am Upload-Weg dieses Ziels steht die FileClass im Dropdown, z. B. beim
 * Hochladen in eine Galerie. Ein Klick speichert sofort. Schon hochgeladene Dateien bleiben, wenn ein Haken wegfällt.
 *
 * Die Rubriken des Gebietermarkts stehen hier nicht: Jede Rubrik hat genau eine FileClass, festgelegt an der Rubrik
 * selbst (Modul „Achievements & Markt“, Tab „Rubriken“).
 */
export function FileClassDestinationTab() {
  const { fileClasses } = useMasterData()
  const loadHook = useFileClassDestinationAssignment()
  const saveHook = useFileClassDestinationAssignment()
  const loadedAssignments = useLoadedData(loadHook.getAllFileClassDestinationAssignment)
  const assignments = loadedAssignments.data
  const isSaving = saveHook.isLoading
  let saveErrorMessage: string | null = null
  if (saveHook.error !== null) {
    saveErrorMessage = saveHook.error.detail
  }

  /** Setzt oder nimmt den Haken und lädt neu. */
  async function toggleAssignment(fileClassKey: string, destination: FileClassDestination) {
    const existingAssignment = findAssignment(assignments ?? [], fileClassKey, destination)
    if (existingAssignment === undefined) {
      const newAssignment = { fileClassKey, destination }
      await saveHook.createFileClassDestinationAssignment(newAssignment)
    } else {
      await saveHook.deleteFileClassDestinationAssignment(existingAssignment.id)
    }
    await loadedAssignments.reload()
  }

  const columns: TableColumn<FileClass>[] = [
    {
      header: 'FileClass',
      key: 'fileClass',
      headerHint: 'Die Dateiart, so wie ihr Badge überall erscheint.',
      width: '16rem',
      cell: (fileClass) => <FileClassBadge fileClass={fileClass} />,
    },
    {
      header: 'Key',
      key: 'key',
      headerHint: 'Der feste Name der FileClass.',
      width: '14rem',
      cell: (fileClass) => <code>{fileClass.key}</code>,
    },
  ]
  for (const destination of FILE_CLASS_DESTINATIONS) {
    const destinationLabel = FILE_CLASS_DESTINATION_LABELS[destination]
    columns.push({
      header: destinationLabel.label,
      key: 'destination-' + destination,
      headerHint: destinationLabel.hint,
      width: '7rem',
      cellClassName: 'text-center',
      cell: (fileClass) => {
        const assigned = findAssignment(assignments ?? [], fileClass.key, destination) !== undefined
        const checkboxLabel = fileClass.key + ' am Ziel ' + destinationLabel.label
        return (
          <Form.Check
            type="checkbox"
            aria-label={checkboxLabel}
            checked={assigned}
            disabled={isSaving}
            onChange={() => void toggleAssignment(fileClass.key, destination)}
          />
        )
      },
    })
  }

  let footer = null
  if (isSaving) {
    footer = <Spinner animation="border" size="sm" />
  }
  const loaded = fileClasses !== null && assignments !== null
  return (
    <ContentBox title="FileClass-Ziel" footer={footer}>
      <ErrorAlert message={saveErrorMessage} />
      {!loaded && <Spinner animation="border" />}
      {loaded && (
        <Table
          columns={columns}
          rows={fileClasses}
          rowKey={getFileClassKey}
          detailTitle={getFileClassKey}
          emptyText="Es gibt noch keine FileClasses."
          settingKey={FILE_CLASS_DESTINATION_TABLE_SETTING_KEY}
        />
      )}
    </ContentBox>
  )
}
