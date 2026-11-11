import { formatByteCount } from '../../components/formatByteCount.ts'
import { formatDateTimeWithRelativeDays } from '../../components/formatDateTime.ts'
import type { FileClass } from '../FileClass.ts'
import { FileClassBadge } from '../FileClassBadge.tsx'
import type { FileSolrFieldNameSet } from '../FileSolrFieldNameSet.ts'
import type { SolrField } from '../../solr/SolrField.ts'

type FileDocumentFieldValueProps = {
  solrField: SolrField
  value: unknown
  fileSolrFieldNameSet: FileSolrFieldNameSet
  /** Für die Dateiart: ihr Wert erscheint als Kachel. */
  fileClasses: FileClass[]
}

function formatSingleValue(solrField: SolrField, singleValue: unknown, fileSolrFieldNameSet: FileSolrFieldNameSet): string {
  if (solrField.type === 'DATE' && typeof singleValue === 'string') {
    return formatDateTimeWithRelativeDays(singleValue)
  }
  const isFileSizeField = solrField.name === fileSolrFieldNameSet.fileSizeBytes
  if (isFileSizeField && typeof singleValue === 'number') {
    return formatByteCount(singleValue)
  }
  if (typeof singleValue === 'boolean') {
    if (singleValue) {
      return 'ja'
    }
    return 'nein'
  }
  if (typeof singleValue === 'number') {
    return singleValue.toLocaleString('de-DE')
  }
  return String(singleValue)
}

/**
 * Ein Feldwert einer Datei lesbar: die Dateiart als ihre Kachel, Zeitpunkte in Ortszeit, die Größe in KB/MB, Zahlen
 * deutsch, Listen als Badges (Tags, Referenzen, Rollen).
 */
export function FileDocumentFieldValue({ solrField, value, fileSolrFieldNameSet, fileClasses }: FileDocumentFieldValueProps) {
  const isFileClassField = solrField.name === fileSolrFieldNameSet.fileClassKey
  if (isFileClassField) {
    const matchingFileClass = fileClasses.find((fileClass) => fileClass.key === value)
    if (matchingFileClass !== undefined) {
      return <FileClassBadge fileClass={matchingFileClass} />
    }
  }
  if (Array.isArray(value)) {
    return (
      <span className="d-inline-flex flex-wrap gap-1">
        {value.map((singleValue) => {
          const singleValueText = formatSingleValue(solrField, singleValue, fileSolrFieldNameSet)
          return (
            <span key={singleValueText} className="badge text-bg-secondary">
              {singleValueText}
            </span>
          )
        })}
      </span>
    )
  }
  const valueText = formatSingleValue(solrField, value, fileSolrFieldNameSet)
  return <span className="text-break">{valueText}</span>
}
