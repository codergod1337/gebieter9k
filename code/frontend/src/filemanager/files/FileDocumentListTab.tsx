import { useCallback } from 'react'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import Table from 'react-bootstrap/Table'
import { Link } from 'react-router'
import { ContentBox } from '../../components/ContentBox.tsx'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { formatByteCount } from '../../components/formatByteCount.ts'
import { DateTimeText } from '../../components/DateTimeText.tsx'
import { useCurrentSession } from '../../auth/login/useCurrentSession.ts'
import { getReadableFileClassKeys } from '../../file/FileClassAccessRole.ts'
import { FileClassPicker } from '../../file/FileClassPicker.tsx'
import { type FileDocumentPage, getFileDocumentText } from '../../file/FileDocument.ts'
import { FILE_DOCUMENT_VIEW_CACHE_SCOPE } from '../../file/fileDocumentViewCacheScope.ts'
import { useFileDocument } from '../../file/useFileDocument.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { useCachedLoadedData } from '../../navigation/useCachedLoadedData.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'
import { formatUrlPage, parseUrlPage, useUrlParam, useUrlParamsChanger } from '../../navigation/useUrlParam.ts'
import { FileDocumentActionButtons } from '../../file/document/FileDocumentActionButtons.tsx'
import { FileDocumentPreviewImage } from '../../file/document/FileDocumentPreviewImage.tsx'
import { getFileDocumentViewerKind } from '../../file/document/fileDocumentViewerKind.ts'
import { getFileDocumentPath } from '../../file/fileDocumentPaths.ts'

/** Der Parameter der Adresse mit der gewählten FileClass, z. B. `?fileClass=FOTO_URLAUB`. */
const FILE_CLASS_URL_PARAM = 'fileClass'

/** Der Parameter der Adresse mit der Seite, ab 1. */
const PAGE_URL_PARAM = 'page'

/** Der Name dieses Tabs für „Zurück zu …“ auf der Seite einer Datei. */
const FILE_DOCUMENT_LIST_ORIGIN_LABEL = 'Dateien'

/**
 * Tab „Dateien“ des File-Managers: FileClass wählen, dann ihre Dateien als Tabelle (Auflösen nach `fileClassKey`), neueste
 * zuerst, seitenweise. Je Zeile Vorschau, Name (zur Datei), Größe, Upload und die Aktionen Viewer und Download. Alle
 * weiteren Felder (Titel, Tags …) zeigt die Seite der Datei, aus den Felddefinitionen.
 * Gezeigt wird nur, was der User lesen darf; die Suche (Freitext) kommt später.
 *
 * Nach dem Muster aller Module: FileClass und Seite stehen in der Adresse (`?fileClass=…&page=…`), jede Wahl ist ein
 * Eintrag im Verlauf. Die Seiten kommen aus dem Zwischenspeicher der Ansichten, Zurück aus einer Datei zeigt die Liste
 * sofort an derselben Stelle. Die Datei öffnet sich mit diesem Tab als Origin („Zurück zu Dateien“).
 */
export function FileDocumentListTab() {
  const masterDataHook = useMasterData()
  const fileSolrFieldNameSet = masterDataHook.fileSolrFieldNameSet
  const fileClasses = masterDataHook.fileClasses
  const { hasAccessRole } = useCurrentSession()
  const resolveFileDocumentHook = useFileDocument()
  const resolveFileDocuments = resolveFileDocumentHook.resolveFileDocuments
  const originNavigation = useOrigin()
  const fileClassUrlParam = useUrlParam(FILE_CLASS_URL_PARAM)
  const pageUrlParam = useUrlParam(PAGE_URL_PARAM)
  const changeUrlParams = useUrlParamsChanger()
  const selectedFileClassKey = fileClassUrlParam.value
  const page = parseUrlPage(pageUrlParam.value)

  const loadFileDocumentPage = useCallback(async () => {
    if (selectedFileClassKey === null || fileSolrFieldNameSet === null) {
      return null
    }
    const exactValueByFieldName = { [fileSolrFieldNameSet.fileClassKey]: selectedFileClassKey }
    return resolveFileDocuments(exactValueByFieldName, page)
  }, [selectedFileClassKey, fileSolrFieldNameSet, page, resolveFileDocuments])
  const viewCacheRequest = { fileClassKey: selectedFileClassKey, page }
  const loadedFileDocumentPage = useCachedLoadedData(FILE_DOCUMENT_VIEW_CACHE_SCOPE, viewCacheRequest, loadFileDocumentPage)
  let fileDocumentPage: FileDocumentPage | null = null
  if (selectedFileClassKey !== null) {
    fileDocumentPage = loadedFileDocumentPage.data
  }

  /** Eine andere FileClass: neuer Eintrag im Verlauf, wieder ab Seite 1. */
  function handleFileClassChange(fileClassKey: string) {
    changeUrlParams({ [FILE_CLASS_URL_PARAM]: fileClassKey, [PAGE_URL_PARAM]: null }, 'PUSH')
  }

  /** Blättern: neuer Eintrag im Verlauf; die erste Seite steht ohne Parameter in der Adresse. */
  function changePage(changedPage: number) {
    const urlPageText = formatUrlPage(changedPage)
    changeUrlParams({ [PAGE_URL_PARAM]: urlPageText }, 'PUSH')
  }

  if (masterDataHook.error !== null) {
    return <ErrorAlert message={masterDataHook.error.detail} />
  }
  if (fileClasses === null || fileSolrFieldNameSet === null) {
    return <Spinner animation="border" />
  }

  // Nur Dateiarten, die der User lesen darf: In anderen fände er ohnehin nichts
  const readableFileClassKeys = getReadableFileClassKeys(masterDataHook.fileClassAccessRoles ?? [], hasAccessRole)
  const readableFileClasses = fileClasses.filter((fileClass) => readableFileClassKeys.has(fileClass.key))

  let pageCount = 1
  if (fileDocumentPage !== null && fileDocumentPage.pageSize > 0) {
    pageCount = Math.max(1, Math.ceil(fileDocumentPage.totalCount / fileDocumentPage.pageSize))
  }
  const isFirstPage = page === 0
  const isLastPage = page >= pageCount - 1

  let footer
  if (resolveFileDocumentHook.error !== null) {
    footer = <span className="text-danger">{resolveFileDocumentHook.error.detail}</span>
  } else if (selectedFileClassKey === null) {
    footer = <span className="small">Erst eine FileClass wählen.</span>
  } else if (fileDocumentPage === null) {
    footer = <Spinner animation="border" size="sm" />
  } else {
    const pageText = 'Seite ' + (page + 1) + ' von ' + pageCount + ' · ' + fileDocumentPage.totalCount + ' Dateien'
    footer = (
      <div className="d-flex justify-content-between align-items-center gap-2">
        <span className="small">{pageText}</span>
        <span>
          <Button size="sm" variant="outline-secondary" className="me-1" disabled={isFirstPage} onClick={() => changePage(page - 1)}>
            <i className="bi bi-chevron-left"></i>
          </Button>
          <Button size="sm" variant="outline-secondary" disabled={isLastPage} onClick={() => changePage(page + 1)}>
            <i className="bi bi-chevron-right"></i>
          </Button>
        </span>
      </div>
    )
  }

  return (
    <ContentBox title="Dateien" footer={footer}>
      <div className="mb-3">
        <FileClassPicker
          fileClasses={readableFileClasses}
          selectedFileClassKey={selectedFileClassKey}
          onSelectedFileClassKeyChange={handleFileClassChange}
        />
      </div>
      {fileDocumentPage !== null && fileDocumentPage.documents.length === 0 && (
        <div className="text-secondary">In dieser FileClass gibt es noch keine Dateien, die du sehen darfst.</div>
      )}
      {fileDocumentPage !== null && fileDocumentPage.documents.length > 0 && (
        <Table hover responsive className="mb-0 align-middle">
          <thead>
            <tr>
              <th></th>
              <th>Datei</th>
              <th>Größe</th>
              <th>Hochgeladen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {fileDocumentPage.documents.map((fileDocument) => {
              // Die Datei öffnet sich mit diesem Tab samt FileClass und Seite als Origin
              const originState = originNavigation.createOriginStateHere(FILE_DOCUMENT_LIST_ORIGIN_LABEL)
              const fileDocumentId = getFileDocumentText(fileDocument, fileSolrFieldNameSet.id)
              const fileName = getFileDocumentText(fileDocument, fileSolrFieldNameSet.fileName)
              const uploadedAtText = getFileDocumentText(fileDocument, fileSolrFieldNameSet.uploadedAt)
              const fileSizeBytes = fileDocument[fileSolrFieldNameSet.fileSizeBytes]
              let fileSizeText = ''
              if (typeof fileSizeBytes === 'number') {
                fileSizeText = formatByteCount(fileSizeBytes)
              }
              const mimeType = fileDocument[fileSolrFieldNameSet.mimeType]
              const viewerKind = getFileDocumentViewerKind(mimeType)
              const previewBase64Png = fileDocument[fileSolrFieldNameSet.previewBase64Png]
              const fileDocumentPath = getFileDocumentPath(fileDocumentId)
              return (
                <tr key={fileDocumentId}>
                  <td>
                    <FileDocumentPreviewImage previewBase64Png={previewBase64Png} sizePixels={48} alternativeText={fileName} />
                  </td>
                  <td className="text-break">
                    <Link to={fileDocumentPath} state={originState}>
                      {fileName}
                    </Link>
                  </td>
                  <td className="text-nowrap">{fileSizeText}</td>
                  <td className="text-nowrap">
                    <DateTimeText isoDateTime={uploadedAtText} label="Hochgeladen" />
                  </td>
                  <td className="text-end">
                    <FileDocumentActionButtons
                      fileDocumentId={fileDocumentId}
                      fileName={fileName}
                      hasViewer={viewerKind !== 'NONE'}
                      changeable={false}
                      linkState={originState}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </ContentBox>
  )
}
