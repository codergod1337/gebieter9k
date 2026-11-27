import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { LoadStatus } from '../../components/LoadStatus.tsx'
import { showToast } from '../../components/toastStore.ts'
import { getKnowledgePageText, type KnowledgePageDocument } from '../../knowledge/page/KnowledgePageDocument.ts'
import { useKnowledgePage } from '../../knowledge/page/useKnowledgePage.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { KnowledgePageContentEditor } from './KnowledgePageContentEditor.tsx'
import { KnowledgePageFieldsBox } from './KnowledgePageFieldsBox.tsx'
import { KNOWLEDGE_PAGE_TEXTS } from './knowledgePageTexts.ts'

/** Eine geladene Seite samt der id, für die sie geladen wurde. */
type LoadedKnowledgePage = {
  knowledgePageId: string
  knowledgePageDocument: KnowledgePageDocument
}

/**
 * Der Editor einer Wissensseite unter `/knowledge-manager/page/<id>` (nur ADMIN): oben die Felder der Seite
 * ({@link KnowledgePageFieldsBox}), darunter ihr Inhalt als JSON-Text mit Vorschau ({@link KnowledgePageContentEditor}).
 * Jede Änderung geht einzeln an `PUT /api/admin/knowledge-page` (nur die genannten Felder) und kommt als ganze Seite
 * zurück. Lesen und Speichern laufen über getrennte Hooks: So steht ein Fehler des Speicherns dort, wo gespeichert
 * wurde, und nicht an der Ladeanzeige.
 */
export function KnowledgePageEditorPage() {
  const { knowledgePageId } = useParams()
  const loadKnowledgePageHook = useKnowledgePage()
  const saveKnowledgePageHook = useKnowledgePage()
  const masterData = useMasterData()
  const getKnowledgePage = loadKnowledgePageHook.getKnowledgePage
  const changeKnowledgePage = saveKnowledgePageHook.changeKnowledgePage
  const loadedFieldNames = useLoadedData(loadKnowledgePageHook.getKnowledgeSolrFieldNameSet)
  const fieldNames = loadedFieldNames.data
  const knowledgeSections = masterData.knowledgeSections
  const [loadedKnowledgePage, setLoadedKnowledgePage] = useState<LoadedKnowledgePage | null>(null)
  /** Welcher Teil gerade speichert und wessen Fehler zu zeigen ist: die Felder oben oder der Inhalt unten. */
  const [lastSavedPart, setLastSavedPart] = useState<'FIELDS' | 'CONTENT' | null>(null)

  useEffect(() => {
    if (knowledgePageId === undefined) {
      return
    }
    let stillShown = true
    void getKnowledgePage(knowledgePageId).then((knowledgePageDocument) => {
      if (stillShown && knowledgePageDocument !== null) {
        setLoadedKnowledgePage({ knowledgePageId, knowledgePageDocument })
      }
    })
    return () => {
      stillShown = false
    }
  }, [knowledgePageId, getKnowledgePage])

  const saveFields = useCallback(
    async (fieldValuesByFieldName: KnowledgePageDocument): Promise<KnowledgePageDocument | null> => {
      if (knowledgePageId === undefined) {
        return null
      }
      const savedKnowledgePage = await changeKnowledgePage(knowledgePageId, fieldValuesByFieldName)
      if (savedKnowledgePage !== null) {
        setLoadedKnowledgePage({ knowledgePageId, knowledgePageDocument: savedKnowledgePage })
      }
      return savedKnowledgePage
    },
    [knowledgePageId, changeKnowledgePage],
  )

  let knowledgePage: KnowledgePageDocument | null = null
  if (loadedKnowledgePage !== null && loadedKnowledgePage.knowledgePageId === knowledgePageId) {
    knowledgePage = loadedKnowledgePage.knowledgePageDocument
  }
  if (knowledgePage === null || fieldNames === null || knowledgeSections === null || knowledgePageId === undefined) {
    let loadErrorMessage: string | null = null
    if (loadKnowledgePageHook.error !== null) {
      loadErrorMessage = loadKnowledgePageHook.error.detail
    } else if (masterData.error !== null) {
      loadErrorMessage = masterData.error.detail
    }
    return <LoadStatus errorMessage={loadErrorMessage} isLoading={loadErrorMessage === null} />
  }

  const title = getKnowledgePageText(knowledgePage, fieldNames.title) ?? ''
  const savedContentText = getKnowledgePageText(knowledgePage, fieldNames.content) ?? ''
  const contentFieldName = fieldNames.content
  let saveErrorMessage: string | null = null
  if (saveKnowledgePageHook.error !== null) {
    saveErrorMessage = saveKnowledgePageHook.error.detail
  }
  let fieldsErrorMessage: string | null = null
  let contentErrorMessage: string | null = null
  if (lastSavedPart === 'FIELDS') {
    fieldsErrorMessage = saveErrorMessage
  } else if (lastSavedPart === 'CONTENT') {
    contentErrorMessage = saveErrorMessage
  }

  async function handleSaveFields(fieldValuesByFieldName: KnowledgePageDocument): Promise<boolean> {
    setLastSavedPart('FIELDS')
    const savedKnowledgePage = await saveFields(fieldValuesByFieldName)
    return savedKnowledgePage !== null
  }

  async function handleSaveContent(contentText: string): Promise<boolean> {
    setLastSavedPart('CONTENT')
    const savedKnowledgePage = await saveFields({ [contentFieldName]: contentText })
    if (savedKnowledgePage === null) {
      return false
    }
    showToast({
      kind: 'success',
      title: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.contentSavedToastTitle),
      text: getTextInCurrentLanguageWithValues(KNOWLEDGE_PAGE_TEXTS.contentSavedToastText, { title }),
    })
    return true
  }

  return (
    <>
      <KnowledgePageFieldsBox
        knowledgePage={knowledgePage}
        fieldNames={fieldNames}
        knowledgeSections={knowledgeSections}
        isSaving={saveKnowledgePageHook.isLoading}
        errorMessage={fieldsErrorMessage}
        onSaveFields={handleSaveFields}
      />
      <KnowledgePageContentEditor
        key={knowledgePageId}
        savedContentText={savedContentText}
        isSaving={saveKnowledgePageHook.isLoading}
        errorMessage={contentErrorMessage}
        onSave={handleSaveContent}
      />
    </>
  )
}
