import { useMemo, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Nav from 'react-bootstrap/Nav'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import { useUrlParam } from '../../navigation/useUrlParam.ts'
import { ANIMATION_TEXTS } from '../animation/animationTexts.ts'
import { removeAnimationsOfMissingEquations } from '../animation/equationAnimationChanges.ts'
import type { EquationAnimationJson } from '../animation/EquationAnimationJson.ts'
import { EquationAnimationPopup } from '../animation/EquationAnimationPopup.tsx'
import type { BlockContent } from '../BlockContent.ts'
import { BlockContentError } from '../BlockContentError.ts'
import type { BlockContentJson } from '../BlockContentJson.ts'
import { BlockContentReader } from '../BlockContentReader.ts'
import { BlockContentView } from '../BlockContentView.tsx'
import { collectEquationJsons, type ElementJson } from '../elements/ElementJson.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { ElementsEditor } from './ElementsEditor.tsx'

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

/** In der Adresse: welche Ansicht des Editors offen ist. Ohne Angabe die Elemente. */
const VIEW_URL_PARAM = 'editorView'
const VIEW_ELEMENTS = 'elements'
const VIEW_JSON = 'json'

/** So weit sind verschachtelte Stücke des JSON eingerückt, in der Ansicht „JSON“ und beim Schreiben aus den Elementen. */
const JSON_INDENT_SPACES = 2

/** Der Inhalt als eingerückter JSON-Text. */
export function formatBlockContentText(contentJson: unknown): string {
  return JSON.stringify(contentJson, null, JSON_INDENT_SPACES)
}

/** Der Text als Inhalt für die Ansicht „Elemente“; `null`, wenn er kein JSON-Objekt mit einer Liste `elements` ist. */
function parseContentJson(contentText: string): BlockContentJson | null {
  try {
    const parsedContent: unknown = JSON.parse(contentText)
    const isObject = typeof parsedContent === 'object' && parsedContent !== null && !Array.isArray(parsedContent)
    if (!isObject) {
      return null
    }
    const elements = (parsedContent as { elements?: unknown }).elements
    if (!Array.isArray(elements)) {
      return null
    }
    return parsedContent as BlockContentJson
  } catch {
    return null
  }
}

/**
 * Der allgemeine Editor für Inhalte (Nutzer 2026-11-27: „als allgemeinen richtext editor nutzen“, nicht nur für die
 * Wissensdatenbank): links wird bearbeitet, rechts steht sofort die Vorschau, gezeichnet vom selben Leser wie die
 * fertige Seite; beide Hälften sind gleich hoch und rollen für sich.
 *
 * Zwei Ansichten zum Bearbeiten, die Wahl steht in der Adresse (`?editorView=json`, REPLACE):
 * - „Elemente“: je Element eine Karte mit seinem Bearbeiten-Teil; Formeln im Formelfeld ({@link ElementsEditor}).
 * - „JSON“: der Inhalt als eingerückter Text, so wie er gespeichert wird.
 *
 * Daneben der Knopf „Animationen“: Er öffnet das Popup des Animations-Moduls ({@link EquationAnimationPopup}). Der
 * Editor der Elemente weiß nichts von Animationen (Nutzer 2026-11-27: „das hat aber nichts im editor zu suchen, dort
 * definiere ich nur die ids der elemente“); dieser Rahmen reicht dem Popup nur die Gleichungen und nimmt die geänderten
 * Animationen zurück. Verschwindet eine Gleichung, verschwindet die Animation, die von ihr ausging.
 *
 * Der Editor hält nichts selbst: Er bekommt den Text und meldet jede Änderung. Lässt sich der Text nicht lesen, steht
 * statt der Vorschau die Stelle im JSON; ob dann gespeichert werden darf, entscheidet der Aufrufer
 * ({@link readBlockContentProblem}).
 */
export function BlockContentEditor({ contentText, onContentTextChange }: BlockContentEditorProps) {
  const viewUrlParam = useUrlParam(VIEW_URL_PARAM)
  const jsonViewShown = viewUrlParam.value === VIEW_JSON
  const [animationPopupShown, setAnimationPopupShown] = useState(false)

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

  const equations = useMemo(() => {
    if (contentJson === null) {
      return []
    }
    return collectEquationJsons(contentJson.elements)
  }, [contentJson])
  const animations: EquationAnimationJson[] = contentJson?.animations ?? []

  function changeElements(changedElements: ElementJson[]) {
    if (contentJson === null) {
      return
    }
    const remainingEquations = collectEquationJsons(changedElements)
    const remainingEquationIds = remainingEquations.map((equation) => equation.id)
    const remainingAnimations = removeAnimationsOfMissingEquations(animations, remainingEquationIds)
    const changedContentJson: BlockContentJson = { ...contentJson, elements: changedElements, animations: remainingAnimations }
    onContentTextChange(formatBlockContentText(changedContentJson))
  }

  function changeAnimations(changedAnimations: EquationAnimationJson[]) {
    if (contentJson === null) {
      return
    }
    const changedContentJson: BlockContentJson = { ...contentJson, animations: changedAnimations }
    onContentTextChange(formatBlockContentText(changedContentJson))
  }

  function showView(view: string) {
    // die Elemente sind die Vorgabe und stehen nicht in der Adresse
    const urlValue = view === VIEW_JSON ? VIEW_JSON : null
    viewUrlParam.changeValue(urlValue, 'REPLACE')
  }

  const activeView = jsonViewShown ? VIEW_JSON : VIEW_ELEMENTS
  // ein Übergang führt von einer Gleichung zur nächsten: Es gibt einen weniger als Gleichungen
  const transitionCount = Math.max(0, equations.length - 1)
  const animationButtonText = getTextInCurrentLanguageWithValues(ANIMATION_TEXTS.openPopupWithCount, {
    animationCount: String(animations.length),
    transitionCount: String(transitionCount),
  })
  let equationCountText = getTextInCurrentLanguageWithValues(BLOCK_CONTENT_EDITOR_TEXTS.equationCountMany, {
    equationCount: String(equations.length),
  })
  if (equations.length === 1) {
    equationCountText = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.equationCountOne)
  }
  return (
    <div className="blockcontent-editor">
      <div className="blockcontent-editor-source">
        <Nav
          variant="tabs"
          className="blockcontent-editor-views"
          activeKey={activeView}
          onSelect={(selectedView) => showView(selectedView ?? VIEW_ELEMENTS)}>
          <Nav.Item>
            <Nav.Link eventKey={VIEW_ELEMENTS}>{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.viewElements)}</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={VIEW_JSON}>{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.viewJson)}</Nav.Link>
          </Nav.Item>
          <Nav.Item className="blockcontent-editor-views-extra">
            <span className="blockcontent-editor-equation-count">{equationCountText}</span>
            <Button size="sm" variant="outline-primary" disabled={contentJson === null} onClick={() => setAnimationPopupShown(true)}>
              <i className="bi bi-play-circle me-1" aria-hidden="true"></i>
              {animationButtonText}
            </Button>
          </Nav.Item>
        </Nav>
        <div className="blockcontent-editor-pane">
          {!jsonViewShown && contentJson !== null && <ElementsEditor elements={contentJson.elements} onChange={changeElements} />}
          {!jsonViewShown && contentJson === null && (
            <p className="text-danger">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.elementsUnavailable)}</p>
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
      {animationPopupShown && (
        <EquationAnimationPopup
          equations={equations}
          animations={animations}
          onAnimationsChange={changeAnimations}
          onClose={() => setAnimationPopupShown(false)}
        />
      )}
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
