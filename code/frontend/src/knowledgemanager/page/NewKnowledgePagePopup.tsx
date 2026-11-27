import { type ChangeEvent, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { EditValuePopup } from '../../components/EditValuePopup.tsx'
import type { KnowledgePageDocument, KnowledgeSolrFieldNameSet } from '../../knowledge/page/KnowledgePageDocument.ts'
import type { KnowledgeSection } from '../../knowledge/section/KnowledgeSection.ts'
import { getKnowledgeChapters, getKnowledgeRubrics, getKnowledgeSubChapters } from '../../knowledge/section/knowledgeSectionTree.ts'
import { DEFAULT_LANGUAGE } from '../../language/activeLanguages.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { KNOWLEDGE_PAGE_TEXTS } from './knowledgePageTexts.ts'

type NewKnowledgePagePopupProps = {
  knowledgeSections: KnowledgeSection[]
  fieldNames: KnowledgeSolrFieldNameSet
  isSaving: boolean
  /** Fehler des Anlegens, `null` wenn keiner. Das Popup bleibt dann offen. */
  errorMessage: string | null
  /** Die Felder der neuen Seite, jedes unter seinem Solr-Namen; der Aufrufer legt an und öffnet den Editor. */
  onCreate: (fieldValuesByFieldName: KnowledgePageDocument) => void
  onClose: () => void
}

/** Der Inhalt einer neuen Seite: noch kein Baustein. */
const EMPTY_CONTENT_TEXT = '{"blocks":[]}'

/** Was in einem Key aus einem Umlaut wird. */
const KEY_LETTER_REPLACEMENTS: Record<string, string> = { Ä: 'AE', Ö: 'OE', Ü: 'UE', ẞ: 'SS', ß: 'SS' }

/**
 * Ein Vorschlag für den Key aus dem Titel: groß, Umlaute ausgeschrieben, alles andere als Buchstaben und Ziffern wird
 * ein Unterstrich, vorn und hinten keiner (Key-Regel). „Was ist eine Metrik?“ → `WAS_IST_EINE_METRIK`.
 */
function suggestPageKey(title: string): string {
  let key = ''
  for (const character of title.toUpperCase()) {
    const replacement = KEY_LETTER_REPLACEMENTS[character]
    if (replacement !== undefined) {
      key = key + replacement
    } else if (/[A-Z0-9]/.test(character)) {
      key = key + character
    } else {
      key = key + '_'
    }
  }
  return key.replace(/_+/g, '_').replace(/^[_0-9]+/, '').replace(/[_0-9]+$/, '')
}

/**
 * Eine neue Wissensseite anlegen, geführt (Nutzer: Anlegen immer über einen eigenen Knopf und Schritte): erst die
 * Rubrik, dann erscheint die Wahl des Kapitels, dann, wenn das Kapitel Unterkapitel hat, die des Unterkapitels, und
 * erst danach Titel und Key. Der Key wird aus dem Titel vorgeschlagen, bis man ihn selbst ändert. Die Seite entsteht
 * als Entwurf ohne Inhalt; danach öffnet sich ihr Editor.
 */
export function NewKnowledgePagePopup({
  knowledgeSections,
  fieldNames,
  isSaving,
  errorMessage,
  onCreate,
  onClose,
}: NewKnowledgePagePopupProps) {
  const [rubricKey, setRubricKey] = useState('')
  const [chapterKey, setChapterKey] = useState('')
  const [subChapterKey, setSubChapterKey] = useState('')
  const [title, setTitle] = useState('')
  const [enteredPageKey, setEnteredPageKey] = useState<string | null>(null)

  const rubrics = getKnowledgeRubrics(knowledgeSections)
  const chapters = rubricKey === '' ? [] : getKnowledgeChapters(knowledgeSections, rubricKey)
  const subChapters = chapterKey === '' ? [] : getKnowledgeSubChapters(knowledgeSections, rubricKey, chapterKey)
  const chapterChosen = chapterKey !== ''
  // solange der Key nicht von Hand geändert ist, folgt er dem Titel
  const pageKey = enteredPageKey ?? suggestPageKey(title)
  const complete = chapterChosen && title.trim() !== '' && pageKey !== ''

  function handleRubricChange(event: ChangeEvent<HTMLSelectElement>) {
    setRubricKey(event.target.value)
    setChapterKey('')
    setSubChapterKey('')
  }

  function handleChapterChange(event: ChangeEvent<HTMLSelectElement>) {
    setChapterKey(event.target.value)
    setSubChapterKey('')
  }

  function handlePageKeyChange(event: ChangeEvent<HTMLInputElement>) {
    // Keys bestehen nur aus Großbuchstaben, Ziffern und Unterstrichen. Geprüft wird im Backend.
    setEnteredPageKey(event.target.value.toUpperCase())
  }

  function handleCreate() {
    const fieldValuesByFieldName: KnowledgePageDocument = {
      [fieldNames.language]: DEFAULT_LANGUAGE.code,
      [fieldNames.rubricKey]: rubricKey,
      [fieldNames.chapterKey]: chapterKey,
      [fieldNames.pageKey]: pageKey,
      [fieldNames.title]: title.trim(),
      [fieldNames.content]: EMPTY_CONTENT_TEXT,
    }
    if (subChapterKey !== '') {
      fieldValuesByFieldName[fieldNames.subChapterKey] = subChapterKey
    }
    onCreate(fieldValuesByFieldName)
  }

  return (
    <EditValuePopup
      title={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.newPagePopupTitle)}
      isSaving={isSaving}
      errorMessage={errorMessage}
      saveDisabled={!complete}
      onSave={handleCreate}
      onClose={onClose}>
      <Form.Group className="mb-3" controlId="newKnowledgePageRubric">
        <Form.Label>{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.newPageRubric)}</Form.Label>
        <Form.Select autoFocus value={rubricKey} disabled={isSaving} onChange={handleRubricChange}>
          <option value="">{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.newPageChoose)}</option>
          {rubrics.map((rubric) => (
            <option key={rubric.id} value={rubric.rubricKey}>
              {getTextInCurrentLanguage(rubric.displayName)}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      {rubricKey !== '' && (
        <Form.Group className="mb-3" controlId="newKnowledgePageChapter">
          <Form.Label>{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.newPageChapter)}</Form.Label>
          <Form.Select value={chapterKey} disabled={isSaving} onChange={handleChapterChange}>
            <option value="">{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.newPageChoose)}</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.chapterKey ?? ''}>
                {getTextInCurrentLanguage(chapter.displayName)}
              </option>
            ))}
          </Form.Select>
          {chapters.length === 0 && <Form.Text>{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.newPageNoChapter)}</Form.Text>}
        </Form.Group>
      )}
      {chapterChosen && subChapters.length > 0 && (
        <Form.Group className="mb-3" controlId="newKnowledgePageSubChapter">
          <Form.Label>{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.newPageSubChapter)}</Form.Label>
          <Form.Select value={subChapterKey} disabled={isSaving} onChange={(event) => setSubChapterKey(event.target.value)}>
            <option value="">{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.newPageNoSubChapter)}</option>
            {subChapters.map((subChapter) => (
              <option key={subChapter.id} value={subChapter.subChapterKey ?? ''}>
                {getTextInCurrentLanguage(subChapter.displayName)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      )}
      {chapterChosen && (
        <>
          <Form.Group className="mb-3" controlId="newKnowledgePageTitle">
            <Form.Label>{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editTitleInputLabel)}</Form.Label>
            <Form.Control value={title} disabled={isSaving} onChange={(event) => setTitle(event.target.value)} />
          </Form.Group>
          <Form.Group controlId="newKnowledgePageKey">
            <Form.Label>{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.editPageKeyInputLabel)}</Form.Label>
            <Form.Control value={pageKey} disabled={isSaving} onChange={handlePageKeyChange} />
            <Form.Text>{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.newPageKeyHint)}</Form.Text>
          </Form.Group>
        </>
      )}
    </EditValuePopup>
  )
}
