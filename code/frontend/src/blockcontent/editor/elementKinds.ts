import type { ComponentType } from 'react'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { MultilingualText } from '../../language/MultilingualText.ts'
import type { ElementJsonOfType, ElementType } from '../elements/ElementJson.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { CollapsibleElementEditor } from './CollapsibleElementEditor.tsx'
import { ContentBoxElementEditor } from './ContentBoxElementEditor.tsx'
import type { ElementEditorProps } from './ElementEditorProps.ts'
import { EquationElementEditor } from './EquationElementEditor.tsx'
import { HeadingElementEditor } from './HeadingElementEditor.tsx'
import { HintElementEditor } from './HintElementEditor.tsx'
import { ListElementEditor } from './ListElementEditor.tsx'
import { ParagraphElementEditor } from './ParagraphElementEditor.tsx'
import { SketchElementEditor } from './SketchElementEditor.tsx'

/** Liefert eine feste Kennung, die es im Inhalt noch nicht gibt, z. B. `e3` zur Vorsilbe `e`. */
type FreeIdCreator = (prefix: string) => string

/** Alles, was der Editor über EINE Art von Element wissen muss. */
export type ElementKind<Type extends ElementType> = {
  type: Type
  /** Wie die Art im Editor heißt, z. B. „Gleichung“. */
  label: MultilingualText
  /** Ob das Element nur auf oberster Ebene stehen darf (die ContentBox). */
  topLevelOnly: boolean
  /** Ein neues, noch leeres Element dieser Art. */
  createElement: (createFreeId: FreeIdCreator) => ElementJsonOfType<Type>
  /** Der Bearbeiten-Teil. */
  Editor: ComponentType<ElementEditorProps<Type>>
}

type ElementKinds = {
  [Type in ElementType]: ElementKind<Type>
}

/** Die Vorsilben der festen Kennungen: `e1`, `e2` … für Gleichungen, `c1` … für Aufklapper. */
const EQUATION_ID_PREFIX = 'e'
const COLLAPSIBLE_ID_PREFIX = 'c'

/**
 * DIE Liste der Elemente im Editor: je Art genau ein Eintrag mit ihrem Namen, ihrem leeren Anfang und ihrem
 * Bearbeiten-Teil. Ein neues Element bekommt hier seinen Eintrag (und seine Anzeige in `elements/elementViews.ts`); an
 * den vorhandenen ändert sich dafür nichts.
 */
export const ELEMENT_KINDS: ElementKinds = {
  CONTENT_BOX: {
    type: 'CONTENT_BOX',
    label: BLOCK_CONTENT_EDITOR_TEXTS.contentBoxLabel,
    topLevelOnly: true,
    createElement: () => {
      const title = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.newContentBoxTitle)
      return { type: 'CONTENT_BOX', title, elements: [{ type: 'PARAGRAPH', text: '' }] }
    },
    Editor: ContentBoxElementEditor,
  },
  HEADING: {
    type: 'HEADING',
    label: BLOCK_CONTENT_EDITOR_TEXTS.headingLabel,
    topLevelOnly: false,
    createElement: () => ({ type: 'HEADING', text: '' }),
    Editor: HeadingElementEditor,
  },
  PARAGRAPH: {
    type: 'PARAGRAPH',
    label: BLOCK_CONTENT_EDITOR_TEXTS.paragraphLabel,
    topLevelOnly: false,
    createElement: () => ({ type: 'PARAGRAPH', text: '' }),
    Editor: ParagraphElementEditor,
  },
  LIST: {
    type: 'LIST',
    label: BLOCK_CONTENT_EDITOR_TEXTS.listLabel,
    topLevelOnly: false,
    createElement: () => ({ type: 'LIST', ordered: false, items: [''] }),
    Editor: ListElementEditor,
  },
  HINT: {
    type: 'HINT',
    label: BLOCK_CONTENT_EDITOR_TEXTS.hintLabel,
    topLevelOnly: false,
    createElement: () => ({ type: 'HINT', text: '' }),
    Editor: HintElementEditor,
  },
  EQUATION: {
    type: 'EQUATION',
    label: BLOCK_CONTENT_EDITOR_TEXTS.equationLabel,
    topLevelOnly: false,
    createElement: (createFreeId) => {
      const id = createFreeId(EQUATION_ID_PREFIX)
      return { type: 'EQUATION', id, latex: '' }
    },
    Editor: EquationElementEditor,
  },
  COLLAPSIBLE: {
    type: 'COLLAPSIBLE',
    label: BLOCK_CONTENT_EDITOR_TEXTS.collapsibleLabel,
    topLevelOnly: false,
    createElement: (createFreeId) => {
      const id = createFreeId(COLLAPSIBLE_ID_PREFIX)
      const title = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.newCollapsibleTitle)
      return { type: 'COLLAPSIBLE', id, title, elements: [] }
    },
    Editor: CollapsibleElementEditor,
  },
  SKETCH: {
    type: 'SKETCH',
    label: BLOCK_CONTENT_EDITOR_TEXTS.sketchLabel,
    topLevelOnly: false,
    createElement: () => ({
      type: 'SKETCH',
      sketch: { width: 340, height: 280, originX: 52, originY: 228, unitLength: 48, axisMaxX: 5.6, axisMaxY: 4.3, description: '', elements: [] },
    }),
    Editor: SketchElementEditor,
  },
}

/** In dieser Reihenfolge bietet der Editor die Arten zum Anlegen an. */
export const ELEMENT_KIND_ORDER: ElementType[] = ['CONTENT_BOX', 'HEADING', 'PARAGRAPH', 'LIST', 'HINT', 'EQUATION', 'COLLAPSIBLE', 'SKETCH']
