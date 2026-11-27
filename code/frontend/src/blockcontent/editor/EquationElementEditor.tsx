import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { FormulaField } from '../formula/FormulaField.tsx'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import type { ElementEditorProps } from './ElementEditorProps.ts'

/**
 * Eine Gleichung im Editor: das Formelfeld. Hier bekommt ein Teil der Formel seine id, mehr nicht (Nutzer 2026-11-27:
 * „dort definiere ich nur die ids der elemente“); was mit den Teilen beim Übergang zur nächsten Gleichung geschieht,
 * steht im Popup „Animationen“.
 */
export function EquationElementEditor({ element, onChange }: ElementEditorProps<'EQUATION'>) {
  return (
    <FormulaField
      label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.equationLabel)}
      latex={element.latex}
      onLatexChange={(changedLatex) => onChange({ ...element, latex: changedLatex })}
    />
  )
}
