import { useState } from 'react'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import { Link } from 'react-router'
import { ContentBox } from '../../components/ContentBox.tsx'
import { DateTimeText } from '../../components/DateTimeText.tsx'
import { EditableCellButton } from '../../components/EditableCellButton.tsx'
import { EditTextPopup } from '../../components/EditTextPopup.tsx'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { StatusMark } from '../../components/StatusMark.tsx'
import { getKnowledgePagePath } from '../../knowledge/knowledgePaths.ts'
import {
  getKnowledgePageText,
  getKnowledgePageTexts,
  type KnowledgePageDocument,
  type KnowledgeSolrFieldNameSet,
} from '../../knowledge/page/KnowledgePageDocument.ts'
import type { KnowledgeSection } from '../../knowledge/section/KnowledgeSection.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'
import { describeKnowledgePagePlace } from './describeKnowledgePagePlace.ts'
import { getKnowledgePageStatusLook, KNOWLEDGE_PAGE_STATUS_PUBLISHED, KNOWLEDGE_PAGE_STATUSES } from './knowledgePageStatusLooks.ts'
import { KNOWLEDGE_PAGE_TEXTS } from './knowledgePageTexts.ts'

type KnowledgePageFieldsBoxProps = {
  knowledgePage: KnowledgePageDocument
  fieldNames: KnowledgeSolrFieldNameSet
  knowledgeSections: KnowledgeSection[]
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  /** Speichert die genannten Felder der Seite (ein leerer Wert nimmt das Feld heraus); liefert, ob es geklappt hat. */
  onSaveFields: (fieldValuesByFieldName: KnowledgePageDocument) => Promise<boolean>
}

/** Welches Feld gerade in seinem Popup geändert wird. */
type EditedField = 'TITLE' | 'SUMMARY' | 'PAGE_KEY' | 'TAGS'

/** So trennt und verbindet das Popup mehrere Schlagwörter. */
const TAG_SEPARATOR = ','

/**
 * Der Kopf des Editors einer Wissensseite: Titel, Zusammenfassung, wo sie steht, ihre Adresse, Schlagwörter und Status.
 * Jeder Wert lässt sich per Klick in einem kleinen Popup ändern und wird sofort gespeichert; der Status wechselt mit
 * einem Klick auf seinen Knopf. Ist die Seite veröffentlicht, führt „Seite ansehen“ zu ihr in der Wissensdatenbank.
 */
export function KnowledgePageFieldsBox({
  knowledgePage,
  fieldNames,
  knowledgeSections,
  isSaving,
  errorMessage,
  onSaveFields,
}: KnowledgePageFieldsBoxProps) {
  const originNavigation = useOrigin()
  const [editedField, setEditedField] = useState<EditedField | null>(null)

  const title = getKnowledgePageText(knowledgePage, fieldNames.title) ?? ''
  const summary = getKnowledgePageText(knowledgePage, fieldNames.summary)
  const rubricKey = getKnowledgePageText(knowledgePage, fieldNames.rubricKey)
  const chapterKey = getKnowledgePageText(knowledgePage, fieldNames.chapterKey)
  const subChapterKey = getKnowledgePageText(knowledgePage, fieldNames.subChapterKey)
  const pageKey = getKnowledgePageText(knowledgePage, fieldNames.pageKey) ?? ''
  const status = getKnowledgePageText(knowledgePage, fieldNames.status)
  const lastChangedAt = getKnowledgePageText(knowledgePage, fieldNames.lastChangedAt)
  const tags = getKnowledgePageTexts(knowledgePage, fieldNames.tags)
  const place = describeKnowledgePagePlace(knowledgeSections, rubricKey, chapterKey, subChapterKey)
  const statusLook = getKnowledgePageStatusLook(status)
  const published = status === KNOWLEDGE_PAGE_STATUS_PUBLISHED
  let pagePath = ''
  if (rubricKey !== null && chapterKey !== null) {
    pagePath = getKnowledgePagePath(rubricKey, chapterKey, pageKey)
  }
  const originState = originNavigation.createOriginStateHere(title)

  async function saveField(fieldName: string, fieldValue: unknown) {
    const saved = await onSaveFields({ [fieldName]: fieldValue })
    if (saved) {
      setEditedField(null)
    }
  }

  function handleSaveTags(changedTagsText: string) {
    const changedTags = changedTagsText
      .split(TAG_SEPARATOR)
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '')
    void saveField(fieldNames.tags, changedTags)
  }

  function closePopup() {
    setEditedField(null)
  }

  const tagsText = tags.join(TAG_SEPARATOR + ' ')
  const actions = published && pagePath !== '' && (
    <Link to={pagePath} state={originState} className="btn btn-sm btn-outline-secondary">
      <i className="bi bi-box-arrow-up-right me-1" aria-hidden="true"></i>
      {getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.viewPage)}
    </Link>
  )
  const footer = lastChangedAt !== null && (
    <DateTimeText isoDateTime={lastChangedAt} label={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.columnLastChanged)} />
  )

  return (
    <ContentBox title={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.fieldsTitle)} actions={actions} footer={footer}>
      {editedField === null && <ErrorAlert message={errorMessage} />}
      <div className="knowledge-editor-fields">
        <div className="knowledge-editor-place">{place}</div>
        <h2 className="knowledge-editor-title">
          <EditableCellButton
            label={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editTitleLabel)}
            disabled={isSaving}
            onClick={() => setEditedField('TITLE')}>
            {title}
          </EditableCellButton>
        </h2>
        <div className="knowledge-editor-summary">
          <EditableCellButton
            label={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editSummaryLabel)}
            disabled={isSaving}
            onClick={() => setEditedField('SUMMARY')}>
            {summary ?? <span className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.noSummary)}</span>}
          </EditableCellButton>
        </div>
        <div className="knowledge-editor-line">
          <span className="knowledge-editor-line-label">{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.addressLabel)}</span>
          <EditableCellButton
            label={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editPageKeyLabel)}
            disabled={isSaving}
            onClick={() => setEditedField('PAGE_KEY')}>
            <code>{pagePath}</code>
          </EditableCellButton>
        </div>
        <div className="knowledge-editor-line">
          <span className="knowledge-editor-line-label">{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.tagsLabel)}</span>
          <EditableCellButton
            label={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editTagsLabel)}
            disabled={isSaving}
            onClick={() => setEditedField('TAGS')}>
            {tags.length === 0 && <span className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.noTags)}</span>}
            {tags.map((tag) => (
              <Badge key={tag} bg="secondary" className="me-1">
                {tag}
              </Badge>
            ))}
          </EditableCellButton>
        </div>
        <div className="knowledge-editor-line">
          <span className="knowledge-editor-line-label">{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.statusLabel)}</span>
          <StatusMark look={statusLook} />
          <ButtonGroup size="sm" className="ms-3">
            {KNOWLEDGE_PAGE_STATUSES.map((offeredStatus) => {
              const offeredStatusLook = getKnowledgePageStatusLook(offeredStatus)
              const isCurrentStatus = offeredStatus === status
              let variant = 'outline-secondary'
              if (isCurrentStatus) {
                variant = 'secondary'
              }
              return (
                <Button
                  key={offeredStatus}
                  variant={variant}
                  disabled={isSaving || isCurrentStatus}
                  onClick={() => void saveField(fieldNames.status, offeredStatus)}>
                  {offeredStatusLook.label}
                </Button>
              )
            })}
          </ButtonGroup>
          {!published && (
            <span className="text-body-secondary ms-3">{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.notPublishedHint)}</span>
          )}
        </div>
      </div>
      {editedField === 'TITLE' && (
        <EditTextPopup
          title={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editTitlePopupTitle)}
          inputLabel={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editTitleInputLabel)}
          initialText={title}
          isSaving={isSaving}
          errorMessage={errorMessage}
          onSave={(changedTitle) => void saveField(fieldNames.title, changedTitle)}
          onClose={closePopup}
        />
      )}
      {editedField === 'SUMMARY' && (
        <EditTextPopup
          title={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editSummaryPopupTitle)}
          inputLabel={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editSummaryInputLabel)}
          initialText={summary ?? ''}
          hint={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editSummaryHint)}
          emptyAllowed
          isSaving={isSaving}
          errorMessage={errorMessage}
          onSave={(changedSummary) => void saveField(fieldNames.summary, changedSummary)}
          onClose={closePopup}
        />
      )}
      {editedField === 'PAGE_KEY' && (
        <EditTextPopup
          title={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editPageKeyPopupTitle)}
          inputLabel={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editPageKeyInputLabel)}
          initialText={pageKey}
          hint={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editPageKeyHint)}
          isSaving={isSaving}
          errorMessage={errorMessage}
          onSave={(changedPageKey) => void saveField(fieldNames.pageKey, changedPageKey)}
          onClose={closePopup}
        />
      )}
      {editedField === 'TAGS' && (
        <EditTextPopup
          title={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editTagsPopupTitle)}
          inputLabel={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editTagsInputLabel)}
          initialText={tagsText}
          hint={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editTagsHint)}
          emptyAllowed
          isSaving={isSaving}
          errorMessage={errorMessage}
          onSave={handleSaveTags}
          onClose={closePopup}
        />
      )}
    </ContentBox>
  )
}
