import { useMemo } from 'react'
import Form from 'react-bootstrap/Form'
import Nav from 'react-bootstrap/Nav'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import { useUrlParam } from '../../navigation/useUrlParam.ts'
import type { BlockContent } from '../BlockContent.ts'
import { BlockContentError } from '../BlockContentError.ts'
import type { BlockContentJson } from '../BlockContentJson.ts'
import { BlockContentReader } from '../BlockContentReader.ts'
import { BlockContentView } from '../BlockContentView.tsx'
import { BlockContentCardsEditor } from './BlockContentCardsEditor.tsx'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'

type BlockContentEditorProps = {
  /** Der Inhalt als JSON-Text, so wie er gespeichert wird. */
  contentText: string
  /** Der geänderte Inhalt, nach jeder Eingabe. Der Aufrufer hält ihn und speichert, wann er will. */
  onContentTextChange: (changedContentText: string) => void
}

/** Was aus dem Text geworden ist: die Bausteine für die Vorschau oder der Grund, warum er sich nicht lesen ließ. */
type ReadContent = {
  content: BlockContent | null
  problem: string | null
}

/** In der Adresse: welche Ansicht des Editors offen ist. Ohne Angabe die Bausteine. */
const VIEW_URL_PARAM = 'editorView'
const VIEW_CARDS = 'cards'
const VIEW_JSON = 'json'

/** So weit sind verschachtelte Stücke des JSON eingerückt, in der Ansicht „JSON“ und beim Schreiben aus den Karten. */
const JSON_INDENT_SPACES = 2

/** Der Inhalt als eingerückter JSON-Text. */
export function formatBlockContentText(contentJson: unknown): string {
  return JSON.stringify(contentJson, null, JSON_INDENT_SPACES)
}

/** Der Text als Inhalt für die Karten; `null`, wenn er kein JSON-Objekt mit einer Liste `blocks` ist. */
function parseContentJson(contentText: string): BlockContentJson | null {
  try {
    const parsedContent: unknown = JSON.parse(contentText)
    const isObject = typeof parsedContent === 'object' && parsedContent !== null && !Array.isArray(parsedContent)
    if (!isObject) {
      return null
    }
    const blocks = (parsedContent as { blocks?: unknown }).blocks
    if (!Array.isArray(blocks)) {
      return null
    }
    return parsedContent as BlockContentJson
  } catch {
    return null
  }
}

/**
 * Der allgemeine Editor für Inhalte aus Bausteinen (Nutzer 2026-11-27: „als allgemeinen richtext editor nutzen“, nicht
 * nur für die Wissensdatenbank): links wird bearbeitet, rechts steht sofort die Vorschau, gezeichnet vom selben Leser
 * wie die fertige Seite; beide Hälften sind gleich hoch und rollen für sich.
 *
 * Zwei Ansichten zum Bearbeiten, die Wahl steht in der Adresse (`?editorView=json`, REPLACE):
 * - „Bausteine“: je Baustein eine Karte mit Feldern; Formeln werden getippt ({@link BlockContentCardsEditor}).
 * - „JSON“: der Inhalt als eingerückter Text, so wie er gespeichert wird, für alles, was die Karten noch nicht können.
 *
 * Der Editor hält nichts selbst: Er bekommt den Text und meldet jede Änderung. Lässt sich der Text nicht lesen, steht
 * statt der Vorschau die Stelle im JSON; ob dann gespeichert werden darf, entscheidet der Aufrufer
 * ({@link readBlockContentProblem}).
 */
export function BlockContentEditor({ contentText, onContentTextChange }: BlockContentEditorProps) {
  const viewUrlParam = useUrlParam(VIEW_URL_PARAM)
  const jsonViewShown = viewUrlParam.value === VIEW_JSON

  const readContent = useMemo((): ReadContent => {
    const blockContentReader = new BlockContentReader()
    try {
      const content = blockContentReader.readContent(contentText)
      return { content, problem: null }
    } catch (caughtError) {
      let reason = String(caughtError)
      if (caughtError instanceof BlockContentError) {
        reason = caughtError.message
      }
      return { content: null, problem: reason }
    }
  }, [contentText])
  const contentJson = useMemo(() => parseContentJson(contentText), [contentText])

  function showView(view: string) {
    // die Bausteine sind die Vorgabe und stehen nicht in der Adresse
    const urlValue = view === VIEW_JSON ? VIEW_JSON : null
    viewUrlParam.changeValue(urlValue, 'REPLACE')
  }

  const activeView = jsonViewShown ? VIEW_JSON : VIEW_CARDS
  return (
    <div className="blockcontent-editor">
      <div className="blockcontent-editor-source">
        <Nav
          variant="tabs"
          className="blockcontent-editor-views"
          activeKey={activeView}
          onSelect={(selectedView) => showView(selectedView ?? VIEW_CARDS)}>
          <Nav.Item>
            <Nav.Link eventKey={VIEW_CARDS}>{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.viewCards)}</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={VIEW_JSON}>{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.viewJson)}</Nav.Link>
          </Nav.Item>
        </Nav>
        <div className="blockcontent-editor-pane">
          {!jsonViewShown && contentJson !== null && (
            <BlockContentCardsEditor
              contentJson={contentJson}
              onChange={(changedContentJson) => onContentTextChange(formatBlockContentText(changedContentJson))}
            />
          )}
          {!jsonViewShown && contentJson === null && (
            <p className="text-danger">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.cardsUnavailable)}</p>
          )}
          {jsonViewShown && (
            <Form.Control
              as="textarea"
              className="blockcontent-editor-textarea"
              spellCheck={false}
              aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.jsonInputLabel)}
              value={contentText}
              onChange={(changeEvent) => onContentTextChange(changeEvent.target.value)}
            />
          )}
        </div>
      </div>
      <div className="blockcontent-editor-preview">
        <div className="blockcontent-editor-preview-label">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.previewLabel)}</div>
        <div className="blockcontent-editor-pane">
          {readContent.content !== null && <BlockContentView content={readContent.content} />}
          {readContent.problem !== null && (
            <p className="text-danger">
              {getTextInCurrentLanguageWithValues(BLOCK_CONTENT_EDITOR_TEXTS.unreadable, { reason: readContent.problem })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** Warum sich ein Inhalt nicht lesen lässt; `null`, wenn er in Ordnung ist. Für den Aufrufer, der das Speichern sperrt. */
export function readBlockContentProblem(contentText: string): string | null {
  const blockContentReader = new BlockContentReader()
  try {
    blockContentReader.readContent(contentText)
    return null
  } catch (caughtError) {
    if (caughtError instanceof BlockContentError) {
      return caughtError.message
    }
    return String(caughtError)
  }
}
