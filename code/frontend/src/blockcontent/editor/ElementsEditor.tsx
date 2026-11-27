import { useMemo } from 'react'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { collectElementIds, collectEquationJsons, type ElementJson } from '../elements/ElementJson.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { ElementEditorContext, type ElementEditorContextValue } from './ElementEditorContext.ts'
import { ElementListEditor } from './ElementListEditor.tsx'

type ElementsEditorProps = {
  /** Die Elemente der obersten Ebene des Inhalts. */
  elements: ElementJson[]
  onChange: (changedElements: ElementJson[]) => void
}

/**
 * Die Ansicht „Elemente“ des Editors: die Liste der Elemente des ganzen Inhalts ({@link ElementListEditor}). Dieser
 * Rahmen kennt als Einziger alle Elemente: Er vergibt die festen Kennungen neuer Gleichungen und Aufklapper und weiß,
 * welche Nummer eine Gleichung im Inhalt hat.
 */
export function ElementsEditor({ elements, onChange }: ElementsEditorProps) {
  const elementEditorContext = useMemo((): ElementEditorContextValue => {
    const takenIds = collectElementIds(elements)
    const equations = collectEquationJsons(elements)
    return {
      createFreeId: (prefix) => {
        let number = 1
        while (takenIds.includes(prefix + number)) {
          number = number + 1
        }
        return prefix + number
      },
      getEquationNumber: (equationId) => {
        const equationIndex = equations.findIndex((equation) => equation.id === equationId)
        if (equationIndex < 0) {
          return null
        }
        return equationIndex + 1
      },
    }
  }, [elements])

  return (
    <ElementEditorContext value={elementEditorContext}>
      <div className="blockcontent-editor-elements">
        <ElementListEditor elements={elements} onChange={onChange} onTopLevel />
        <p className="blockcontent-editor-help">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.textHelp)}</p>
      </div>
    </ElementEditorContext>
  )
}
