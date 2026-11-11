import { useCallback, useMemo } from 'react'
import type { UploadProgressListener } from '../api/ApiRequest.ts'
import type { FileClass } from '../file/FileClass.ts'
import type { FileUploadResult } from '../file/FileDocument.ts'
import { FileUploadForm } from '../file/upload/FileUploadForm.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../masterdata/useMasterData.ts'
import { useShopItem } from '../shop/useShopItem.ts'
import { MARKET_TEXTS } from './marketTexts.ts'

type MarketUploadBoxProps = {
  shopCategoryKey: string
  /** Der Name der Rubrik: für „Zurück zu …“, wenn man aus der Liste die Seite einer Datei öffnet. */
  shopCategoryTitle: string
  /** Die FileClass der Rubrik: Sie steht fest, eine Auswahl gibt es nicht. */
  fileClass: FileClass
  /** Unter diesem Schlüssel merkt sich die Liste ihre fertigen Dateien; je geöffnetem Ablauf ein eigener. */
  recentFileUploadsStateKey: string
  /** Nach jeder eingecheckten Datei: Sie ist jetzt ein Artikel der Rubrik, noch ohne Angebot. */
  onUploaded: (uploadResult: FileUploadResult) => void
  /** Sobald die Auswertung einer Datei fertig ist (Vorschau da). */
  onAnalysisCompleted: () => void
}

/**
 * Der Upload-Schritt von „neues Angebot“ im Gebietermarkt (Nutzer 2026-11-11: als Erstes die Datei hochladen und sehen,
 * dass es klappt): derselbe Ablauf wie überall ({@link FileUploadForm}), eine Liste je Datei von der Prüfung bis
 * „ausgewertet“. Anders sind nur die FileClass (immer die der Rubrik, ohne Auswahl, Nutzer 2026-11-11), die Felder je
 * Datei (Beschreibung und Tags, wie in der Galerie) und der Endpunkt (`/api/shop-item/upload`, das Backend setzt die
 * FileClass der Rubrik und macht die Datei zu ihrem Artikel). Das Angebot kommt in den Schritten danach.
 */
export function MarketUploadBox({
  shopCategoryKey,
  shopCategoryTitle,
  fileClass,
  recentFileUploadsStateKey,
  onUploaded,
  onAnalysisCompleted,
}: MarketUploadBoxProps) {
  const { fileSolrFieldNameSet } = useMasterData()
  const shopItemHook = useShopItem()
  const uploadFileIntoShopCategory = shopItemHook.uploadFileIntoShopCategory

  const uploadFileIntoThisShopCategory = useCallback(
    (
      file: File,
      clientFieldValues: Record<string, unknown>,
      onUploadProgress: UploadProgressListener,
      abortSignal: AbortSignal,
    ) => uploadFileIntoShopCategory(file, shopCategoryKey, clientFieldValues, onUploadProgress, abortSignal),
    [uploadFileIntoShopCategory, shopCategoryKey],
  )

  // Je Datei nur Beschreibung und Tags, wie in der Galerie: Die Tags sind die Überschrift
  const uploadFieldNames = useMemo(() => {
    if (fileSolrFieldNameSet === null) {
      return []
    }
    return [fileSolrFieldNameSet.fileDescription, fileSolrFieldNameSet.tags]
  }, [fileSolrFieldNameSet])

  return (
    <FileUploadForm
      title={getTextInCurrentLanguage(MARKET_TEXTS.uploadTitle)}
      fixedFileClass={fileClass}
      uploadFieldNames={uploadFieldNames}
      uploadFile={uploadFileIntoThisShopCategory}
      recentFileUploadsStateKey={recentFileUploadsStateKey}
      fileDocumentOriginLabel={shopCategoryTitle}
      onUploaded={onUploaded}
      onAnalysisCompleted={onAnalysisCompleted}
    />
  )
}
