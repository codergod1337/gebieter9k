import { type CSSProperties, type FormEvent, useCallback, useMemo, useRef, useState } from 'react'
import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'
import { ContentBox } from '../../components/ContentBox.tsx'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { FileDropzone } from '../../components/FileDropzone.tsx'
import { SubmitButton } from '../../components/SubmitButton.tsx'
import { showToast } from '../../components/toastStore.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import type { SolrField } from '../../solr/SolrField.ts'
import {
  createSolrClientFieldValues,
  getEmptySolrFieldInputValue,
  getSolrFieldLabel,
  type SolrFieldInputValue,
} from '../../solr/solrFieldInputValue.ts'
import type { FileClass } from '../FileClass.ts'
import { FileClassBadge } from '../FileClassBadge.tsx'
import { getFileExtensionsOfFileClass } from '../FileClassFileExtension.ts'
import { FileClassPicker } from '../FileClassPicker.tsx'
import { type FileUploadResult, getFileDocumentText } from '../FileDocument.ts'
import { useFileFieldInputHelpers } from '../useFileFieldInputHelpers.ts'
import { useFileSolrFields } from '../useFileSolrFields.ts'
import { FileUploadDoneRow } from './FileUploadDoneRow.tsx'
import { type FileUploadField, FileUploadListRow } from './FileUploadListRow.tsx'
import {
  type FileUploadRow,
  getFileRowKey,
  UPLOADABLE_ROW_STATES,
  type UploadFileFunction,
  useFileUploadList,
} from './useFileUploadList.ts'
import { useRecentFileUploads } from './useRecentFileUploads.ts'

/** Die FileClass wählt der User aus den angebotenen (File-Manager, Galerie). */
type FileClassByChoiceProps = {
  /** Die FileClasses zur Wahl, schon nach Schreibrecht (und Ziel) gefiltert. */
  offeredFileClasses: FileClass[]
  /** Was statt der Auswahl steht, wenn keine FileClass angeboten wird. */
  noFileClassText: string
  fixedFileClass?: undefined
}

/**
 * Die FileClass steht durch den Upload-Weg fest (Rubrik des Gebietermarkts, Nutzer 2026-11-11): Es gibt keine Auswahl,
 * das Formular zeigt sie nur und schickt sie nicht mit, das Backend setzt sie selbst.
 */
type FileClassFixedProps = {
  fixedFileClass: FileClass
  offeredFileClasses?: undefined
  noFileClassText?: undefined
}

type FileUploadFormProps = (FileClassByChoiceProps | FileClassFixedProps) & {
  /** Der Titel der Box, z. B. „Dateien hochladen“. */
  title: string
  /**
   * Die Felder, die man je Datei ausfüllt, in dieser Reihenfolge (Solr-Namen), z. B. Beschreibung und Tags in der
   * Galerie. `null`: alle Felder, die der Client setzen darf, außer FileClass und Dateiname (der Name ist beim Upload
   * immer der der Datei, ändern lässt er sich danach beim Bearbeiten).
   */
  uploadFieldNames: string[] | null
  /** Wohin hochgeladen wird (File-Manager oder Galerie). */
  uploadFile: UploadFileFunction
  /** Unter diesem Schlüssel bleiben die fertigen Dateien der Liste gemerkt, je Upload-Seite ein eigener. */
  recentFileUploadsStateKey: string
  /** Origin-Text, wenn die Namen fertiger Dateien zur Datei im File-Manager führen; `null`: ohne Link. */
  fileDocumentOriginLabel: string | null
  /** Nach jeder eingecheckten Datei, z. B. lädt die Galerie ihre Bilder neu. */
  onUploaded?: (uploadResult: FileUploadResult) => void
  /** Sobald die Auswertung einer Datei fertig ist (Vorschau da). */
  onAnalysisCompleted?: () => void
}

function getSolrFieldLabelInCurrentLanguage(solrField: SolrField): string {
  const displayNameText = getTextInCurrentLanguage(solrField.displayName)
  return getSolrFieldLabel(solrField, displayNameText)
}

/**
 * Der eine Upload-Ablauf der Plattform, für jeden Upload-Weg gleich (File-Manager, Galerie, Gebietermarkt): oben die
 * FileClass (zur Wahl nur die angebotenen; im Gebietermarkt steht sie durch die Rubrik fest und wird nur gezeigt),
 * darunter das Upload-Feld und EINE Liste, in der jede Datei von Anfang bis Ende steht (Nutzer 2026-11-09):
 * - Neu abgelegt: Prüfsumme, dann die Frage ans Backend, ob es sie schon gibt. Daneben ihre eigenen Felder (z. B.
 *   Beschreibung und Tags mit Vervollständigung) und der Mülleimer, der sie aus der Liste nimmt.
 * - „Hochladen“ reiht ein, zwei gehen gleichzeitig hoch, mit Fortschritt und „Wird verarbeitet …“.
 * - Eingecheckt: Die Zeile wird fertig („hochgeladen“ blinkt grün, man darf die Seite verlassen) und zeigt, was die
 *   Auswertung im Backend gerade macht (Platz in der Warteschlange, „Schritt 2 von 4: …“), bis „ausgewertet“.
 * Offene Dateien stehen oben, fertige darunter (neueste zuerst); die fertigen bleiben bis zum Abmelden gemerkt.
 */
export function FileUploadForm({
  title,
  offeredFileClasses,
  noFileClassText,
  fixedFileClass,
  uploadFieldNames,
  uploadFile,
  recentFileUploadsStateKey,
  fileDocumentOriginLabel,
  onUploaded,
  onAnalysisCompleted,
}: FileUploadFormProps) {
  const masterDataHook = useMasterData()
  const fileSolrFieldNameSet = masterDataHook.fileSolrFieldNameSet
  const fileSolrFieldsHook = useFileSolrFields()
  const fileSolrFields = fileSolrFieldsHook.fileSolrFields
  const fileFieldInputHelpers = useFileFieldInputHelpers()
  const getSearchSuggestions = fileFieldInputHelpers.getSearchSuggestions
  const getNormalizeValue = fileFieldInputHelpers.getNormalizeValue

  /** Die FileClass aus der Auswahl, `null` solange keine gewählt ist. Ohne Bedeutung, wenn sie feststeht. */
  const [chosenFileClassKey, setChosenFileClassKey] = useState<string | null>(null)
  const fileClassIsFixed = fixedFileClass !== undefined
  let selectedFileClassKey = chosenFileClassKey
  if (fixedFileClass !== undefined) {
    selectedFileClassKey = fixedFileClass.key
  }
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  // Für Rückrufe während des Hochladens: die neueste Auswahl, nicht die vom Klick
  const selectedFilesRef = useRef<File[]>([])
  const recentFileUploadsHook = useRecentFileUploads(recentFileUploadsStateKey, onAnalysisCompleted)

  // Die Felder je Datei: die genannten, sonst alle, die der Client setzen darf, außer FileClass und Dateiname
  const uploadSolrFields = useMemo(() => {
    if (fileSolrFields === null || fileSolrFieldNameSet === null) {
      return []
    }
    const clientSolrFields = fileSolrFields.filter((solrField) => solrField.clientValueAccepted)
    if (uploadFieldNames === null) {
      return clientSolrFields.filter(
        (solrField) => solrField.name !== fileSolrFieldNameSet.fileClassKey && solrField.name !== fileSolrFieldNameSet.fileName,
      )
    }
    const chosenSolrFields: SolrField[] = []
    for (const uploadFieldName of uploadFieldNames) {
      const chosenSolrField = clientSolrFields.find((solrField) => solrField.name === uploadFieldName)
      if (chosenSolrField !== undefined) {
        chosenSolrFields.push(chosenSolrField)
      }
    }
    return chosenSolrFields
  }, [fileSolrFields, fileSolrFieldNameSet, uploadFieldNames])

  // Je Feld Bezeichnung, Vervollständigung (Felder mit Suggest-Zwilling, z. B. Tags) und einheitliche Form (Tags ohne Raute)
  const uploadFields: FileUploadField[] = useMemo(() => {
    return uploadSolrFields.map((solrField) => {
      const label = getSolrFieldLabelInCurrentLanguage(solrField)
      const searchSuggestions = getSearchSuggestions(solrField)
      const normalizeValue = getNormalizeValue(solrField)
      return { solrField, label, searchSuggestions, normalizeValue }
    })
  }, [uploadSolrFields, getSearchSuggestions, getNormalizeValue])

  // Je neue Datei: jedes Feld leer
  const createRowInputValues = useCallback(() => {
    const rowInputValues: Record<string, SolrFieldInputValue> = {}
    for (const uploadSolrField of uploadSolrFields) {
      rowInputValues[uploadSolrField.name] = getEmptySolrFieldInputValue(uploadSolrField)
    }
    return rowInputValues
  }, [uploadSolrFields])
  const fileUploadList = useFileUploadList(createRowInputValues, uploadFile)
  const rows = fileUploadList.rows

  let allowedFileExtensions: string[] = []
  if (selectedFileClassKey !== null) {
    allowedFileExtensions = getFileExtensionsOfFileClass(masterDataHook.fileClassFileExtensions ?? [], selectedFileClassKey)
  }

  function isFileExtensionAllowed(row: FileUploadRow): boolean {
    return allowedFileExtensions.includes(row.fileExtension)
  }

  function handleSelectedFilesChange(changedFiles: File[]) {
    selectedFilesRef.current = changedFiles
    setSelectedFiles(changedFiles)
    fileUploadList.syncSelectedFiles(changedFiles)
  }

  /** Der Mülleimer einer Zeile: Die Datei geht aus der Auswahl und damit aus der Liste. */
  function removeRow(rowKey: string) {
    const remainingFiles = selectedFilesRef.current.filter((selectedFile) => getFileRowKey(selectedFile) !== rowKey)
    handleSelectedFilesChange(remainingFiles)
  }

  const uploadableRows = rows.filter(
    (row) => UPLOADABLE_ROW_STATES.includes(row.state) && !row.uploadQueued && isFileExtensionAllowed(row),
  )
  const queuedRowCount = rows.filter((row) => row.uploadQueued).length

  /**
   * Eine Datei ist eingecheckt (im Upload-Puffer des Backends und in Solr): Sie wird in der Liste zur fertigen Zeile
   * (Platz für die nächsten in der Auswahl); SFTP und Auswertung laufen im Hintergrund weiter.
   */
  function handleUploaded(rowKey: string, uploadResult: FileUploadResult) {
    const uploadedRow = fileUploadList.rows.find((row) => row.rowKey === rowKey)
    let uploadedFileName = uploadResult.id
    if (uploadedRow !== undefined) {
      uploadedFileName = uploadedRow.file.name
    }
    if (uploadResult.document !== null && fileSolrFieldNameSet !== null) {
      uploadedFileName = getFileDocumentText(uploadResult.document, fileSolrFieldNameSet.fileName)
    }
    recentFileUploadsHook.addRecentFileUpload(uploadResult, uploadedFileName)
    removeRow(rowKey)
    if (onUploaded !== undefined) {
      onUploaded(uploadResult)
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selectedFileClassKey === null || fileSolrFieldNameSet === null || uploadableRows.length === 0) {
      return
    }
    const fileClassKeyFieldName = fileSolrFieldNameSet.fileClassKey
    const rowKeysToUpload = uploadableRows.map((row) => row.rowKey)
    const uploadResults = await fileUploadList.enqueueUploads(
      rowKeysToUpload,
      (row) => {
        const rowClientFieldValues = createSolrClientFieldValues(uploadSolrFields, row.inputValuesByFieldName)
        if (fileClassIsFixed) {
          // Die FileClass steht durch den Upload-Weg fest: Das Backend setzt sie, mitgeschickt wird keine
          return rowClientFieldValues
        }
        return { ...rowClientFieldValues, [fileClassKeyFieldName]: selectedFileClassKey }
      },
      handleUploaded,
    )

    if (uploadResults.length === 0 && rowKeysToUpload.length === 0) {
      return
    }
    const failedCount = rowKeysToUpload.length - uploadResults.length
    const uploadedCountText = uploadResults.length + ' hochgeladen, die Auswertung läuft im Hintergrund'
    if (failedCount === 0) {
      showToast({ kind: 'success', title: 'Upload fertig', text: uploadedCountText + '.' })
    } else {
      const failedCountText = failedCount + ' nicht hochgeladen (Grund in der Liste)'
      showToast({ kind: 'error', title: 'Upload fertig', text: uploadedCountText + ', ' + failedCountText + '.' })
    }
  }

  let loadErrorMessage: string | null = null
  if (masterDataHook.error !== null) {
    loadErrorMessage = masterDataHook.error.detail
  } else if (fileSolrFieldsHook.errorMessage !== null) {
    loadErrorMessage = fileSolrFieldsHook.errorMessage
  }
  if (loadErrorMessage !== null) {
    return <ErrorAlert message={loadErrorMessage} />
  }
  if (fileSolrFields === null || fileSolrFieldNameSet === null || masterDataHook.fileClasses === null) {
    return <Spinner animation="border" />
  }

  const recentFileUploads = recentFileUploadsHook.recentFileUploads
  const pendingAnalysisCount = recentFileUploads.filter(recentFileUploadsHook.isAnalysisPending).length
  const isUploading = fileUploadList.isUploading
  const noFileClassChosen = selectedFileClassKey === null
  let uploadButtonText = uploadableRows.length + ' Dateien hochladen'
  const listTextParts: string[] = [rows.length + ' offen']
  if (isUploading) {
    uploadButtonText = uploadableRows.length + ' weitere einreihen'
    listTextParts.push(fileUploadList.activeUploadCount + ' laden hoch', queuedRowCount + ' warten')
  }
  if (recentFileUploads.length > 0) {
    listTextParts.push(recentFileUploads.length + ' hochgeladen')
  }
  if (pendingAnalysisCount > 0) {
    listTextParts.push(pendingAnalysisCount + ' in der Auswertung')
  }
  const listText = listTextParts.join(', ')
  const footer = (
    <div className="d-flex justify-content-between align-items-center gap-2">
      <span className="small">
        {(isUploading || pendingAnalysisCount > 0) && <Spinner animation="border" size="sm" className="me-2" />}
        {listText}
      </span>
      <SubmitButton isSubmitting={false} fullWidth={false} disabled={uploadableRows.length === 0}>
        {uploadButtonText}
      </SubmitButton>
    </div>
  )
  // Die Spalten der Liste: Datei, Stand, je Feld eine, Mülleimer
  const listStyle = { '--file-upload-field-count': uploadFields.length } as CSSProperties
  const listShown = rows.length > 0 || recentFileUploads.length > 0

  return (
    <Form onSubmit={handleUpload}>
      <ContentBox title={title} footer={footer}>
        <Form.Group className="mb-3">
          <Form.Label>FileClass</Form.Label>
          {fixedFileClass !== undefined && (
            <div>
              <FileClassBadge fileClass={fixedFileClass} showDescription />
            </div>
          )}
          {offeredFileClasses !== undefined && (
            <>
              {offeredFileClasses.length === 0 && <div className="text-secondary">{noFileClassText}</div>}
              <div>
                <FileClassPicker
                  fileClasses={offeredFileClasses}
                  selectedFileClassKey={chosenFileClassKey}
                  onSelectedFileClassKeyChange={setChosenFileClassKey}
                />
              </div>
            </>
          )}
          {selectedFileClassKey !== null && <Form.Text>Erlaubte Endungen: {allowedFileExtensions.join(', ')}</Form.Text>}
        </Form.Group>
        {noFileClassChosen && <div className="text-secondary mb-2">Erst die FileClass wählen, dann Dateien ablegen.</div>}
        <FileDropzone
          selectedFiles={selectedFiles}
          onSelectedFilesChange={handleSelectedFilesChange}
          multiple={true}
          disabled={noFileClassChosen}
          showFileList={false}
        />
        {listShown && (
          <div className="file-upload-list" style={listStyle}>
            <div className="file-upload-list-head" aria-hidden="true">
              <span>Datei</span>
              <span>Stand</span>
              {uploadFields.map((uploadField) => (
                <span key={uploadField.solrField.name}>{uploadField.label}</span>
              ))}
              <span></span>
            </div>
            <ul className="file-upload-list-rows">
              {rows.map((row) => (
                <FileUploadListRow
                  key={row.rowKey}
                  row={row}
                  uploadFields={uploadFields}
                  isFileExtensionAllowed={isFileExtensionAllowed(row)}
                  onInputValueChange={fileUploadList.changeRowInputValue}
                  onRemove={removeRow}
                />
              ))}
              {recentFileUploads.map((recentFileUpload) => (
                <FileUploadDoneRow
                  key={recentFileUpload.id}
                  recentFileUpload={recentFileUpload}
                  uploadFields={uploadFields}
                  analysisProgress={recentFileUploadsHook.analysisProgressById[recentFileUpload.id]}
                  fileDocumentOriginLabel={fileDocumentOriginLabel}
                />
              ))}
            </ul>
          </div>
        )}
      </ContentBox>
    </Form>
  )
}
