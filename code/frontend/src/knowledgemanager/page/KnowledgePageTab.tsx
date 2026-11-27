import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ContentBox } from '../../components/ContentBox.tsx'
import { DateTimeText } from '../../components/DateTimeText.tsx'
import { EditButton } from '../../components/EditButton.tsx'
import { LoadStatus } from '../../components/LoadStatus.tsx'
import { NewEntityButton } from '../../components/NewEntityButton.tsx'
import { StatusMark } from '../../components/StatusMark.tsx'
import { Table } from '../../components/Table.tsx'
import type { TableColumn } from '../../components/TableColumn.ts'
import { getKnowledgePageText, type KnowledgePageDocument } from '../../knowledge/page/KnowledgePageDocument.ts'
import { useKnowledgePage } from '../../knowledge/page/useKnowledgePage.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'
import { getKnowledgePageEditorPath } from '../knowledgeManagerPaths.ts'
import { describeKnowledgePagePlace } from './describeKnowledgePagePlace.ts'
import { getKnowledgePageStatusLook } from './knowledgePageStatusLooks.ts'
import { KNOWLEDGE_PAGE_TEXTS } from './knowledgePageTexts.ts'
import { NewKnowledgePagePopup } from './NewKnowledgePagePopup.tsx'

/**
 * Der Reiter „Seiten“ im Wissensmanager (Nutzer 2026-11-27: „mini wikipedia“, nur der Admin schreibt): alle Seiten der
 * Wissensdatenbank in einer Tabelle, in jedem Status. Ein Klick auf den Titel oder den Stift öffnet den Editor der
 * Seite; der Reiter geht als Origin mit („Zurück zu Seiten“). „neue Seite“ legt geführt eine Seite an
 * ({@link NewKnowledgePagePopup}) und öffnet danach gleich ihren Editor.
 */
export function KnowledgePageTab() {
  const knowledgePageHook = useKnowledgePage()
  const createKnowledgePageHook = useKnowledgePage()
  const masterData = useMasterData()
  const [newKnowledgePageOpen, setNewKnowledgePageOpen] = useState(false)
  const originNavigation = useOrigin()
  const navigate = useNavigate()
  const resolveKnowledgePages = knowledgePageHook.resolveKnowledgePages
  const resolveAllKnowledgePages = useCallback(() => {
    return resolveKnowledgePages({})
  }, [resolveKnowledgePages])
  const loadedFieldNames = useLoadedData(knowledgePageHook.getKnowledgeSolrFieldNameSet)
  const loadedKnowledgePages = useLoadedData(resolveAllKnowledgePages)
  const fieldNames = loadedFieldNames.data
  const knowledgePages = loadedKnowledgePages.data
  const knowledgeSections = masterData.knowledgeSections
  const tabLabel = getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.tabLabel)
  const originState = originNavigation.createOriginStateHere(tabLabel)

  let errorMessage: string | null = null
  if (knowledgePageHook.error !== null) {
    errorMessage = knowledgePageHook.error.detail
  } else if (masterData.error !== null) {
    errorMessage = masterData.error.detail
  }
  if (fieldNames === null || knowledgePages === null || knowledgeSections === null) {
    return (
      <ContentBox title={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.listTitle)}>
        <LoadStatus errorMessage={errorMessage} isLoading={errorMessage === null} />
      </ContentBox>
    )
  }

  const titleFieldName = fieldNames.title
  const idFieldName = fieldNames.id

  function getTitle(knowledgePage: KnowledgePageDocument): string {
    return getKnowledgePageText(knowledgePage, titleFieldName) ?? ''
  }

  function getId(knowledgePage: KnowledgePageDocument): string {
    return getKnowledgePageText(knowledgePage, idFieldName) ?? ''
  }

  /** Legt die Seite an; bei Erfolg geht es gleich in ihren Editor. Ein Fehler bleibt im Popup stehen. */
  async function handleCreateKnowledgePage(fieldValuesByFieldName: KnowledgePageDocument) {
    const createdKnowledgePage = await createKnowledgePageHook.createKnowledgePage(fieldValuesByFieldName)
    if (createdKnowledgePage === null) {
      return
    }
    setNewKnowledgePageOpen(false)
    openEditor(createdKnowledgePage)
  }

  function openEditor(knowledgePage: KnowledgePageDocument) {
    const editorPath = getKnowledgePageEditorPath(getId(knowledgePage))
    void navigate(editorPath, { state: originState })
  }

  const columns: TableColumn<KnowledgePageDocument>[] = [
    {
      header: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.columnTitle),
      key: 'title',
      headerHint: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.columnTitleHint),
      cell: (knowledgePage) => {
        const editorPath = getKnowledgePageEditorPath(getId(knowledgePage))
        return (
          <Link to={editorPath} state={originState}>
            {getTitle(knowledgePage)}
          </Link>
        )
      },
    },
    {
      header: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.columnPlace),
      key: 'place',
      headerHint: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.columnPlaceHint),
      cell: (knowledgePage) => {
        const rubricKey = getKnowledgePageText(knowledgePage, fieldNames.rubricKey)
        const chapterKey = getKnowledgePageText(knowledgePage, fieldNames.chapterKey)
        const subChapterKey = getKnowledgePageText(knowledgePage, fieldNames.subChapterKey)
        return describeKnowledgePagePlace(knowledgeSections, rubricKey, chapterKey, subChapterKey)
      },
    },
    {
      header: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.columnPageKey),
      key: 'pageKey',
      headerHint: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.columnPageKeyHint),
      unimportant: true,
      cell: (knowledgePage) => <code>{getKnowledgePageText(knowledgePage, fieldNames.pageKey)}</code>,
    },
    {
      header: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.columnStatus),
      key: 'status',
      headerHint: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.columnStatusHint),
      width: '10rem',
      cell: (knowledgePage) => {
        const status = getKnowledgePageText(knowledgePage, fieldNames.status)
        const statusLook = getKnowledgePageStatusLook(status)
        return <StatusMark look={statusLook} />
      },
    },
    {
      header: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.columnLastChanged),
      key: 'lastChangedAt',
      headerHint: getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.columnLastChangedHint),
      width: '10rem',
      unimportant: true,
      cell: (knowledgePage) => {
        const lastChangedAt = getKnowledgePageText(knowledgePage, fieldNames.lastChangedAt)
        if (lastChangedAt === null) {
          return null
        }
        return <DateTimeText isoDateTime={lastChangedAt} />
      },
    },
  ]

  const newKnowledgePageButton = (
    <NewEntityButton label={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.newPage)} onClick={() => setNewKnowledgePageOpen(true)} />
  )
  let createErrorMessage: string | null = null
  if (createKnowledgePageHook.error !== null) {
    createErrorMessage = createKnowledgePageHook.error.detail
  }
  const pageCount = knowledgePages.length
  let pageCountText = getTextInCurrentLanguageWithValues(KNOWLEDGE_PAGE_TEXTS.pageCountMany, { pageCount: String(pageCount) })
  if (pageCount === 1) {
    pageCountText = getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.pageCountOne)
  }
  return (
    <ContentBox title={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.listTitle)} footer={pageCountText} actions={newKnowledgePageButton}>
      <Table
        columns={columns}
        rows={knowledgePages}
        rowKey={getId}
        detailTitle={getTitle}
        emptyText={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.listEmpty)}
        settingKey="KNOWLEDGE_PAGE"
        actionsWidth="4rem"
        actions={(knowledgePage) => {
          const editLabel = getTextInCurrentLanguageWithValues(KNOWLEDGE_PAGE_TEXTS.openEditor, {
            title: getTitle(knowledgePage),
          })
          return <EditButton label={editLabel} onClick={() => openEditor(knowledgePage)} />
        }}
      />
      {newKnowledgePageOpen && (
        <NewKnowledgePagePopup
          knowledgeSections={knowledgeSections}
          fieldNames={fieldNames}
          isSaving={createKnowledgePageHook.isLoading}
          errorMessage={createErrorMessage}
          onCreate={(fieldValuesByFieldName) => void handleCreateKnowledgePage(fieldValuesByFieldName)}
          onClose={() => setNewKnowledgePageOpen(false)}
        />
      )}
    </ContentBox>
  )
}
