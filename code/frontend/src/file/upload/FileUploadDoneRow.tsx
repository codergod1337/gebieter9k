import Spinner from 'react-bootstrap/Spinner'
import { Link } from 'react-router'
import { Hoverlay } from '../../components/Hoverlay.tsx'
import { StatusMark } from '../../components/StatusMark.tsx'
import { FILE_UPLOADED_LOOK, getFileAnalysisStatusLook } from '../fileAnalysisStatusLook.ts'
import { FileDocumentPreviewImage } from '../document/FileDocumentPreviewImage.tsx'
import { getFileDocumentPath } from '../fileDocumentPaths.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'
import { FILE_ANALYSIS_STEP_LABELS, type FileAnalysisProgress } from '../FileAnalysisProgress.ts'
import { FileAnalysisHoverlayContent } from './FileAnalysisHoverlayContent.tsx'
import type { FileUploadField } from './FileUploadListRow.tsx'
import type { RecentFileUpload } from './useRecentFileUploads.ts'

type FileUploadDoneRowProps = {
  recentFileUpload: RecentFileUpload
  uploadFields: FileUploadField[]
  /** Der letzte Stand der Auswertung aus dem Backend, `undefined` solange keiner da ist. */
  analysisProgress: FileAnalysisProgress | undefined
  /** Mit Text verlinkt der Name die Datei im File-Manager, mit diesem Origin; `null`: nur der Name. */
  fileDocumentOriginLabel: string | null
}

/** Was gerade mit der Datei passiert, solange die Auswertung offen ist: Platz in der Warteschlange oder der Schritt. */
function AnalysisProgressText({ analysisProgress }: { analysisProgress: FileAnalysisProgress | undefined }) {
  if (analysisProgress !== undefined && analysisProgress.state === 'RUNNING' && analysisProgress.step !== null) {
    const stepText = 'Schritt ' + analysisProgress.stepNumber + ' von ' + analysisProgress.stepCount + ': '
      + FILE_ANALYSIS_STEP_LABELS[analysisProgress.step]
    return (
      <span className="small text-secondary file-upload-analysis-text">
        <Spinner animation="border" size="sm" className="me-1" />
        {stepText}
      </span>
    )
  }
  if (analysisProgress !== undefined && analysisProgress.state === 'WAITING') {
    const waitingAheadCount = analysisProgress.queuePosition - 1
    const waitingText = 'Warteschlange: Platz ' + analysisProgress.queuePosition + ' von ' + analysisProgress.queueSize
      + ' (' + waitingAheadCount + ' davor)'
    return (
      <span className="small text-secondary file-upload-analysis-text">
        <i className="bi bi-hourglass-split me-1" aria-hidden="true"></i>
        {waitingText}
      </span>
    )
  }
  return (
    <span className="small text-secondary file-upload-analysis-text">
      <Spinner animation="border" size="sm" className="me-1" />
      Auswertung startet …
    </span>
  )
}

/**
 * Eine Datei der Upload-Liste, nachdem sie eingecheckt ist: Vorschau und Name, grün aufblinkendes „hochgeladen“ (ab
 * jetzt darf man die Seite verlassen), darunter, was die Auswertung im Backend gerade macht (Platz in der
 * Warteschlange, „Schritt 2 von 4: …“) und am Ende „ausgewertet“ mit dem Ergebnis im Hinweis. Die Felder zeigen, was
 * mitgeschickt wurde.
 */
export function FileUploadDoneRow({ recentFileUpload, uploadFields, analysisProgress, fileDocumentOriginLabel }: FileUploadDoneRowProps) {
  const masterDataHook = useMasterData()
  const originNavigation = useOrigin()
  const fileSolrFieldNameSet = masterDataHook.fileSolrFieldNameSet
  const fileAnalysisStatusValueSet = masterDataHook.fileAnalysisStatusValueSet
  if (fileSolrFieldNameSet === null || fileAnalysisStatusValueSet === null) {
    return null
  }
  const fileDocument = recentFileUpload.document
  let previewBase64Png: unknown = undefined
  let analysisStatus: unknown = undefined
  if (fileDocument !== null) {
    previewBase64Png = fileDocument[fileSolrFieldNameSet.previewBase64Png]
    analysisStatus = fileDocument[fileSolrFieldNameSet.analysisStatus]
  }
  const analysisStatusLook = getFileAnalysisStatusLook(analysisStatus, fileAnalysisStatusValueSet)
  let fileNameElement = <span className="file-upload-list-file-name">{recentFileUpload.fileName}</span>
  if (fileDocumentOriginLabel !== null) {
    const fileDocumentPath = getFileDocumentPath(recentFileUpload.id)
    // Die Datei öffnet sich mit der Upload-Seite als Origin („Zurück zu Hochladen“)
    const originState = originNavigation.createOriginStateHere(fileDocumentOriginLabel)
    fileNameElement = (
      <Link to={fileDocumentPath} state={originState} className="file-upload-list-file-name">
        {recentFileUpload.fileName}
      </Link>
    )
  }

  return (
    <li className="file-upload-list-row file-upload-list-row-done">
      <div className="file-upload-list-file">
        <FileDocumentPreviewImage previewBase64Png={previewBase64Png} sizePixels={40} alternativeText={recentFileUpload.fileName} />
        <div className="file-upload-list-file-text">{fileNameElement}</div>
      </div>
      <div className="file-upload-list-state">
        <span className="file-upload-flash">
          <StatusMark look={FILE_UPLOADED_LOOK} />
        </span>
        {analysisStatus === fileAnalysisStatusValueSet.pending && <AnalysisProgressText analysisProgress={analysisProgress} />}
        {analysisStatus === fileAnalysisStatusValueSet.done && fileDocument !== null && analysisStatusLook !== null && (
          <Hoverlay text={<FileAnalysisHoverlayContent fileDocument={fileDocument} fileSolrFieldNameSet={fileSolrFieldNameSet} />}>
            <span>
              <StatusMark look={analysisStatusLook} />
            </span>
          </Hoverlay>
        )}
        {analysisStatus === fileAnalysisStatusValueSet.failed && analysisStatusLook !== null && <StatusMark look={analysisStatusLook} />}
      </div>
      {uploadFields.map((uploadField) => {
        const fieldName = uploadField.solrField.name
        let fieldValue: unknown = undefined
        if (fileDocument !== null) {
          fieldValue = fileDocument[fieldName]
        }
        let fieldContent = null
        if (Array.isArray(fieldValue)) {
          fieldContent = (
            <span className="file-upload-list-field-badges">
              {fieldValue.map((listedValue) => (
                <span key={String(listedValue)} className="badge text-bg-secondary">
                  {String(listedValue)}
                </span>
              ))}
            </span>
          )
        } else if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          fieldContent = <span className="file-upload-list-field-text">{String(fieldValue)}</span>
        }
        return (
          <div key={fieldName} className="file-upload-list-field">
            <span className="file-upload-list-field-label">{uploadField.label}</span>
            {fieldContent}
          </div>
        )
      })}
      <div className="file-upload-list-remove"></div>
    </li>
  )
}
