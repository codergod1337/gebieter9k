import { useMemo, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { ContentBox } from '../../components/ContentBox.tsx'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import type { KnowledgeContent } from '../../knowledge/content/KnowledgeContent.ts'
import { KnowledgeContentError } from '../../knowledge/content/KnowledgeContentError.ts'
import { KnowledgeContentReader } from '../../knowledge/content/KnowledgeContentReader.ts'
import { KnowledgeContentView } from '../../knowledge/content/KnowledgeContentView.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import { KNOWLEDGE_PAGE_TEXTS } from './knowledgePageTexts.ts'

type KnowledgePageContentEditorProps = {
  /** Der gespeicherte Inhalt der Seite, so wie er im Dokument steht. */
  savedContentText: string
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  /** Speichert den Inhalt; liefert, ob es geklappt hat. */
  onSave: (contentText: string) => Promise<boolean>
}

/** Was aus dem Text im Editor geworden ist: die Bausteine für die Vorschau oder der Grund, warum er sich nicht lesen ließ. */
type ReadContent = {
  content: KnowledgeContent | null
  problem: string | null
}

/** So weit sind verschachtelte Stücke des JSON im Editor eingerückt. */
const JSON_INDENT_SPACES = 2

/** Der Inhalt zum Lesen und Ändern: eingerückt, ein Stück je Zeile. Lässt er sich nicht als JSON lesen, bleibt er, wie er ist. */
function formatContentText(contentText: string): string {
  try {
    const parsedContent: unknown = JSON.parse(contentText)
    return JSON.stringify(parsedContent, null, JSON_INDENT_SPACES)
  } catch {
    return contentText
  }
}

/**
 * Der Inhalt einer Wissensseite zum Ansehen und Ändern (Nutzer 2026-11-27: „ich muss ja sehen was du da … gebaut
 * hast“): links der Inhalt als JSON-Text, so wie er im Solr-Dokument steht (eingerückt), rechts sofort die Vorschau,
 * gezeichnet vom selben Leser wie die Seite selbst; beide gleich hoch, jede Hälfte rollt für sich. Lässt sich der Text nicht lesen, steht statt der Vorschau die Stelle
 * im JSON, und Speichern ist gesperrt: So kommt kein kaputter Inhalt in die Seite.
 */
export function KnowledgePageContentEditor({ savedContentText, isSaving, errorMessage, onSave }: KnowledgePageContentEditorProps) {
  const [editedContentText, setEditedContentText] = useState(() => formatContentText(savedContentText))
  const [lastSavedContentText, setLastSavedContentText] = useState(() => formatContentText(savedContentText))

  const readContent = useMemo((): ReadContent => {
    const knowledgeContentReader = new KnowledgeContentReader()
    try {
      const content = knowledgeContentReader.readContent(editedContentText)
      return { content, problem: null }
    } catch (caughtError) {
      let reason = String(caughtError)
      if (caughtError instanceof KnowledgeContentError) {
        reason = caughtError.message
      }
      return { content: null, problem: reason }
    }
  }, [editedContentText])

  const changed = editedContentText !== lastSavedContentText
  const readable = readContent.problem === null

  async function handleSave() {
    const saved = await onSave(editedContentText)
    if (saved) {
      setLastSavedContentText(editedContentText)
    }
  }

  function handleReset() {
    setEditedContentText(lastSavedContentText)
  }

  let stateText = getTextInCurrentLanguageWithValues(KNOWLEDGE_PAGE_TEXTS.contentUnchanged, {
    characterCount: String(editedContentText.length),
  })
  if (changed) {
    stateText = getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.contentChanged)
  }
  const footer = (
    <div className="knowledge-editor-controls">
      <span className="knowledge-editor-state">{stateText}</span>
      <Button size="sm" variant="outline-secondary" disabled={!changed || isSaving} onClick={handleReset}>
        {getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.contentReset)}
      </Button>
      <Button size="sm" variant="primary" disabled={!changed || !readable || isSaving} onClick={() => void handleSave()}>
        {getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.contentSave)}
      </Button>
    </div>
  )

  return (
    <ContentBox title={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.contentTitle)} footer={footer}>
      <ErrorAlert message={errorMessage} />
      <div className="knowledge-editor">
        <Form.Group className="knowledge-editor-source" controlId="knowledgePageContent">
          <Form.Label>{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.contentInputLabel)}</Form.Label>
          <Form.Control
            as="textarea"
            className="knowledge-editor-textarea"
            spellCheck={false}
            value={editedContentText}
            onChange={(changeEvent) => setEditedContentText(changeEvent.target.value)}
          />
        </Form.Group>
        <div className="knowledge-editor-preview">
          <div className="form-label">{getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.contentPreviewLabel)}</div>
          <div className="knowledge-editor-preview-pane">
            {readContent.content !== null && <KnowledgeContentView content={readContent.content} />}
            {readContent.problem !== null && (
              <p className="text-danger">
                {getTextInCurrentLanguageWithValues(KNOWLEDGE_PAGE_TEXTS.contentUnreadable, { reason: readContent.problem })}
              </p>
            )}
          </div>
        </div>
      </div>
    </ContentBox>
  )
}
