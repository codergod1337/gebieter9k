import { type ReactNode, useMemo, useState } from 'react'
import Button from 'react-bootstrap/Button'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import { useUrlParam } from '../../navigation/useUrlParam.ts'
import { ANIMATION_TEXTS } from '../animation/animationTexts.ts'
import { removeAnimationsOfMissingEquations } from '../animation/equationAnimationChanges.ts'
import type { EquationAnimationJson } from '../animation/EquationAnimationJson.ts'
import { EquationAnimationPopup } from '../animation/EquationAnimationPopup.tsx'
import type { BlockContent } from '../BlockContent.ts'
import { BlockContentError } from '../BlockContentError.ts'
import { BlockContentFrame } from '../BlockContentFrame.tsx'
import type { BlockContentJson } from '../BlockContentJson.ts'
import { BlockContentReader } from '../BlockContentReader.ts'
import { collectEquationJsons, type ElementJson } from '../elements/ElementJson.ts'
import { ElementListView } from '../elements/ElementListView.tsx'
import { AddElementDropdown } from './AddElementDropdown.tsx'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { ElementCardEditor } from './ElementCardEditor.tsx'
import { ElementEditorScope } from './ElementEditorScope.tsx'
import { JsonValueEditor } from './JsonValueEditor.tsx'
import { moveListItem, removeListItem, replaceListItem } from './listChanges.ts'

type BlockContentEditorProps = {
  /** Der Inhalt als JSON-Text, so wie er gespeichert wird. */
  contentText: string
  /** Der geänderte Inhalt, nach jeder Eingabe. Der Aufrufer hält ihn und speichert, wann er will. */
  onContentTextChange: (changedContentText: string) => void
  /** Rechts in der Leiste des Editors: was der Aufrufer dazutut, z. B. der Stand und „Speichern“. */
  actions?: ReactNode
}

/** Was aus dem Text geworden ist: der Inhalt zum Zeichnen oder der Grund, warum er sich nicht lesen ließ. */
type ReadContent = {
  content: BlockContent | null
  problem: string | null
}

/** In der Adresse: wie die linke Seite ein Element zeigt. Ohne Angabe als Elemente. */
const VIEW_URL_PARAM = 'editorView'
const VIEW_JSON = 'json'

/** So weit sind verschachtelte Stücke des JSON eingerückt, wenn der Editor den Inhalt schreibt. */
const JSON_INDENT_SPACES = 2

/** Der Inhalt als eingerückter JSON-Text. */
export function formatBlockContentText(contentJson: unknown): string {
  return JSON.stringify(contentJson, null, JSON_INDENT_SPACES)
}

/** Der Text als Inhalt zum Bearbeiten; `null`, wenn er kein JSON-Objekt mit einer Liste `elements` ist. */
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

/** Ob ein getipptes JSON an die Stelle EINES Elements passt: ein Objekt mit einer Art; die Meldung, wenn nicht. */
function findElementJsonProblem(parsedValue: unknown): string | null {
  const isObject = typeof parsedValue === 'object' && parsedValue !== null && !Array.isArray(parsedValue)
  const hasType = isObject && typeof (parsedValue as { type?: unknown }).type === 'string'
  if (!hasType) {
    return getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.jsonElementProblem)
  }
  return null
}

/** Ob ein getipptes JSON an die Stelle der Animationen passt: eine Liste; die Meldung, wenn nicht. */
function findAnimationsJsonProblem(parsedValue: unknown): string | null {
  if (!Array.isArray(parsedValue)) {
    return getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.jsonAnimationsProblem)
  }
  return null
}

/**
 * Der allgemeine Editor für Inhalte (Nutzer 2026-11-27: „als allgemeinen richtext editor nutzen“, nicht nur für die
 * Wissensdatenbank). Aufbau nach seiner Vorgabe vom selben Tag: „wir zeigen beim bearbeiten immer contentbox … und eine
 * contentbox rechts hat links davon den code bzw. den inhalt der sie definiert. wir machen nur einen scrollbalken auf
 * der hauptansicht. den editor will ich selbst nicht in einer contentbox angezeigt haben, denn da wollen wir den
 * maximalen platz“:
 *
 * - Der Editor ist eine Folge von Zeilen, je Element der obersten Ebene eine: links seine Definition, rechts das
 *   Element selbst, gezeichnet vom selben Leser wie die fertige Seite (eine ContentBox also als ContentBox).
 * - Die linke Seite hat zwei Ansichten, die Wahl steht in der Adresse (`?editorView=json`, REPLACE): „Elemente“ (die
 *   Karte des Elements mit seinem Bearbeiten-Teil, {@link ElementCardEditor}) oder „JSON“ (sein Code,
 *   {@link JsonValueEditor}; dort stehen unter den Elementen auch die Animationen als Code).
 * - Nichts hat einen eigenen Scrollbereich: Es rollt nur die Seite. Die Leiste oben (Ansichten, Zahl der Gleichungen,
 *   „Animationen“, rechts was der Aufrufer dazutut) bleibt dabei stehen; ist die linke Seite länger als die rechte,
 *   bleibt auch das Element rechts im Blick.
 * - Der Editor steht in keiner ContentBox und nimmt die ganze Breite, die er bekommt.
 *
 * „Animationen“ öffnet das Popup des Animations-Moduls ({@link EquationAnimationPopup}); die Elemente und ihre
 * Bearbeiten-Teile wissen nichts von Animationen. Verschwindet eine Gleichung, verschwindet die Animation, die von ihr
 * ausging.
 *
 * Der Editor hält nichts selbst: Er bekommt den Text und meldet jede Änderung. Lässt sich der Inhalt nicht lesen, steht
 * über den Zeilen die Stelle im JSON und rechts nichts; ob dann gespeichert werden darf, entscheidet der Aufrufer
 * ({@link readBlockContentProblem}).
 */
export function BlockContentEditor({ contentText, onContentTextChange, actions }: BlockContentEditorProps) {
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
  const content = readContent.content
  /**
   * Der zuletzt lesbare Inhalt: Mit ihm bleibt der Rahmen um die Zeilen stehen, auch wenn der Inhalt beim Tippen kurz
   * unlesbar wird. Fiele der Rahmen dann weg, entstünden alle Zeilen neu, und das Feld, in dem man gerade tippt, verlöre
   * die Schreibmarke.
   */
  const [frameContent, setFrameContent] = useState<BlockContent | null>(content)
  if (content !== null && content !== frameContent) {
    setFrameContent(content)
  }

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

  function showJsonView(shown: boolean) {
    // „Elemente“ ist die Vorgabe und steht nicht in der Adresse
    const urlValue = shown ? VIEW_JSON : null
    viewUrlParam.changeValue(urlValue, 'REPLACE')
  }

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

  /** Die Zeilen: je Element links seine Definition, rechts das Element selbst; darunter „+ Element“. */
  function renderPairs(elements: ElementJson[]): ReactNode {
    return (
      <div className="blockcontent-editor-pairs">
        {elements.map((element, elementIndex) => {
          let definition = (
            <ElementCardEditor
              element={element}
              onChange={(changedElement) => changeElements(replaceListItem(elements, elementIndex, changedElement))}
              onMoveUp={() => changeElements(moveListItem(elements, elementIndex, -1))}
              onMoveDown={() => changeElements(moveListItem(elements, elementIndex, 1))}
              onRemove={() => changeElements(removeListItem(elements, elementIndex))}
            />
          )
          if (jsonViewShown) {
            definition = (
              <JsonValueEditor
                label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.jsonElementLabel)}
                value={element}
                findProblem={findElementJsonProblem}
                onChange={(changedElement) => changeElements(replaceListItem(elements, elementIndex, changedElement as ElementJson))}
              />
            )
          }
          return (
            <div key={elementIndex} className="blockcontent-editor-pair">
              <div className="blockcontent-editor-definition">{definition}</div>
              <div className="blockcontent-editor-result">
                {content !== null && elementIndex < content.elements.length && <ElementListView elements={[content.elements[elementIndex]]} />}
              </div>
            </div>
          )
        })}
        <div className="blockcontent-editor-pair">
          <div className="blockcontent-editor-definition">
            <AddElementDropdown onTopLevel onAdd={(newElement) => changeElements([...elements, newElement])} />
          </div>
        </div>
        {jsonViewShown && (
          <div className="blockcontent-editor-pair">
            <div className="blockcontent-editor-definition">
              <span className="blockcontent-editor-json-heading">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.jsonAnimationsLabel)}</span>
              <JsonValueEditor
                label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.jsonAnimationsLabel)}
                value={animations}
                findProblem={findAnimationsJsonProblem}
                onChange={(changedAnimations) => changeAnimations(changedAnimations as EquationAnimationJson[])}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  let pairs: ReactNode = null
  if (contentJson !== null) {
    pairs = renderPairs(contentJson.elements)
    // Formeln und Animationen brauchen den Rahmen eines lesbaren Inhalts
    if (frameContent !== null) {
      pairs = <BlockContentFrame content={frameContent}>{pairs}</BlockContentFrame>
    }
  }

  return (
    <div className="blockcontent-editor">
      <div className="blockcontent-editor-bar">
        <ButtonGroup size="sm" aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.viewChoiceLabel)}>
          <Button variant={jsonViewShown ? 'outline-primary' : 'primary'} aria-pressed={!jsonViewShown} onClick={() => showJsonView(false)}>
            {getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.viewElements)}
          </Button>
          <Button variant={jsonViewShown ? 'primary' : 'outline-primary'} aria-pressed={jsonViewShown} onClick={() => showJsonView(true)}>
            {getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.viewJson)}
          </Button>
        </ButtonGroup>
        <span className="blockcontent-editor-equation-count">{equationCountText}</span>
        <Button size="sm" variant="outline-primary" disabled={contentJson === null} onClick={() => setAnimationPopupShown(true)}>
          <i className="bi bi-play-circle me-1" aria-hidden="true"></i>
          {animationButtonText}
        </Button>
        {actions !== undefined && <div className="blockcontent-editor-bar-actions">{actions}</div>}
      </div>
      {readContent.problem !== null && (
        <p className="blockcontent-editor-problem">
          {getTextInCurrentLanguageWithValues(BLOCK_CONTENT_EDITOR_TEXTS.unreadable, { reason: readContent.problem })}
        </p>
      )}
      {contentJson !== null && <ElementEditorScope elements={contentJson.elements}>{pairs}</ElementEditorScope>}
      {contentJson !== null && !jsonViewShown && (
        <p className="blockcontent-editor-help">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.textHelp)}</p>
      )}
      {contentJson === null && (
        <>
          <p className="blockcontent-editor-problem">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.contentUnavailable)}</p>
          <Form.Control
            as="textarea"
            className="blockcontent-editor-json-text"
            rows={20}
            spellCheck={false}
            aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.jsonInputLabel)}
            value={contentText}
            onChange={(changeEvent) => onContentTextChange(changeEvent.target.value)}
          />
        </>
      )}
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
