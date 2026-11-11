import { DeleteButton } from '../../components/DeleteButton.tsx'
import { formatByteCount } from '../../components/formatByteCount.ts'
import type { ValueSuggestion } from '../../components/ValuesInput.tsx'
import type { SolrField } from '../../solr/SolrField.ts'
import { getEmptySolrFieldInputValue, type SolrFieldInputValue } from '../../solr/solrFieldInputValue.ts'
import { SolrFieldValueInput } from '../../solr/SolrFieldValueInput.tsx'
import { FileUploadRowStatus } from './FileUploadRowStatus.tsx'
import type { FileUploadRow } from './useFileUploadList.ts'

/** Eine Spalte der Upload-Liste: das Feld und seine Bezeichnung (auf dem Handy steht sie über der Eingabe). */
export type FileUploadField = {
  solrField: SolrField
  label: string
  /** Bei Feldern mit Vervollständigung (z. B. Tags): vorhandene Werte zum Getippten. */
  searchSuggestions: ((typedText: string) => Promise<ValueSuggestion[]>) | undefined
  /** Einheitliche Form je Wert, z. B. Tags ohne Raute. */
  normalizeValue: ((value: string) => string) | undefined
}

type FileUploadListRowProps = {
  row: FileUploadRow
  uploadFields: FileUploadField[]
  isFileExtensionAllowed: boolean
  onInputValueChange: (rowKey: string, fieldName: string, inputValue: SolrFieldInputValue) => void
  /** Nimmt die Datei aus der Liste, solange sie nicht hochlädt. */
  onRemove: (rowKey: string) => void
}

/**
 * Eine Datei der Upload-Liste, bevor und während sie hochgeht: links Name und Größe, daneben der Stand (Prüfsumme, gibt
 * es schon, bereit, Fortschritt, wird verarbeitet), dann ihre eigenen Felder (z. B. Beschreibung und Tags) und rechts der
 * Mülleimer, der sie aus der Liste nimmt. Ist sie eingecheckt, steht sie als fertige Zeile weiter in derselben Liste.
 */
export function FileUploadListRow({ row, uploadFields, isFileExtensionAllowed, onInputValueChange, onRemove }: FileUploadListRowProps) {
  const fileSizeText = formatByteCount(row.file.size)
  const uploading = row.state === 'UPLOADING'
  const inputsDisabled = uploading || row.state === 'DONE' || row.state === 'EXISTS'
  const removable = !uploading && !row.uploadQueued
  const removeLabel = row.file.name + ' aus der Liste nehmen'

  return (
    <li className="file-upload-list-row">
      <div className="file-upload-list-file">
        <i className="bi bi-file-earmark-image file-upload-list-file-icon" aria-hidden="true"></i>
        <div className="file-upload-list-file-text">
          <div className="file-upload-list-file-name">{row.file.name}</div>
          <div className="small text-body-secondary">{fileSizeText}</div>
        </div>
      </div>
      <div className="file-upload-list-state">
        <FileUploadRowStatus row={row} isFileExtensionAllowed={isFileExtensionAllowed} />
      </div>
      {uploadFields.map((uploadField) => {
        const solrField = uploadField.solrField
        const inputValue = row.inputValuesByFieldName[solrField.name] ?? getEmptySolrFieldInputValue(solrField)
        const controlId = 'fileUpload-' + row.rowKey + '-' + solrField.name
        return (
          <div key={solrField.name} className="file-upload-list-field">
            <label className="file-upload-list-field-label" htmlFor={controlId}>
              {uploadField.label}
            </label>
            <SolrFieldValueInput
              controlId={controlId}
              solrField={solrField}
              value={inputValue}
              compact={true}
              disabled={inputsDisabled}
              searchSuggestions={uploadField.searchSuggestions}
              normalizeValue={uploadField.normalizeValue}
              onChange={(changedValue) => onInputValueChange(row.rowKey, solrField.name, changedValue)}
            />
          </div>
        )
      })}
      <div className="file-upload-list-remove">
        {removable && <DeleteButton label={removeLabel} onClick={() => onRemove(row.rowKey)} />}
      </div>
    </li>
  )
}
