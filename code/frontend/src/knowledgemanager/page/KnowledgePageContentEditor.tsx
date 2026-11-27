import { useMemo, useState } from 'react'
import Button from 'react-bootstrap/Button'
import { BlockContentEditor, formatBlockContentText, readBlockContentProblem } from '../../blockcontent/editor/BlockContentEditor.tsx'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { getKnowledgeEquationPath } from '../../knowledge/knowledgePaths.ts'
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

/** Der Inhalt zum Bearbeiten: eingerückt, ein Stück je Zeile. Lässt er sich nicht als JSON lesen, bleibt er, wie er ist. */
function formatContentText(contentText: string): string {
  try {
    const parsedContent: unknown = JSON.parse(contentText)
    return formatBlockContentText(parsedContent)
  } catch {
    return contentText
  }
}

/**
 * Der Inhalt einer Wissensseite zum Ansehen und Ändern (Nutzer 2026-11-27: „ich muss ja sehen was du da … gebaut
 * hast“): der allgemeine Editor für Inhalte ({@link BlockContentEditor}) mit dem, was nur zur Wissensseite gehört und
 * rechts in seiner Leiste steht: der Stand (gespeichert oder geändert), „Änderungen verwerfen“ und „Inhalt speichern“.
 * Der Editor steht in KEINER ContentBox und nimmt die ganze Breite des Fensters (Nutzer 2026-11-27: „den editor will ich
 * selbst nicht in einer contenbox angezeigt haben, denn da wollen wir den maximalen platz“); die Klasse `main-wide`
 * sagt der Seite, dass sie dafür ihren Rand hergibt. Lässt sich der Inhalt nicht lesen, ist Speichern gesperrt: So
 * kommt kein kaputter Inhalt in die Seite.
 */
export function KnowledgePageContentEditor({ savedContentText, isSaving, errorMessage, onSave }: KnowledgePageContentEditorProps) {
  const [editedContentText, setEditedContentText] = useState(() => formatContentText(savedContentText))
  const [lastSavedContentText, setLastSavedContentText] = useState(() => formatContentText(savedContentText))
  const contentProblem = useMemo(() => readBlockContentProblem(editedContentText), [editedContentText])

  const changed = editedContentText !== lastSavedContentText
  const readable = contentProblem === null

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
  const actions = (
    <>
      <span className="knowledge-editor-state">{stateText}</span>
      <Button size="sm" variant="outline-secondary" disabled={!changed || isSaving} onClick={handleReset}>
        {getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.contentReset)}
      </Button>
      <Button size="sm" variant="primary" disabled={!changed || !readable || isSaving} onClick={() => void handleSave()}>
        {getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.contentSave)}
      </Button>
    </>
  )

  return (
    <section className="knowledge-editor-content main-wide" aria-label={getTextInCurrentLanguage(KNOWLEDGE_PAGE_TEXTS.contentTitle)}>
      <ErrorAlert message={errorMessage} />
      <BlockContentEditor
        contentText={editedContentText}
        onContentTextChange={setEditedContentText}
        actions={actions}
        getForeignEquationPath={getKnowledgeEquationPath}
      />
    </section>
  )
}
