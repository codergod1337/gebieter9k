import { AutoSizeTextArea } from '../../components/AutoSizeTextArea.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import type { ElementEditorProps } from './ElementEditorProps.ts'
import { NumberField } from './NumberField.tsx'

/** Die Stellen des Ausschnitts in der gespeicherten Liste `[left, top, right, bottom]`. */
const LEFT_INDEX = 0
const TOP_INDEX = 1
const RIGHT_INDEX = 2
const BOTTOM_INDEX = 3

/**
 * Eine Figur im Editor: ihr Ausschnitt (welche Werte an den vier Rändern liegen), ihr Seitenverhältnis und ihr Text in
 * der Sprache der Zeichenbibliothek. Was der Text ergibt, steht in derselben Zeile rechts, in der fertigen Anzeige.
 */
export function FigureElementEditor({ element, onChange }: ElementEditorProps<'FIGURE'>) {
  const boundingBox = element.boundingBox

  function changeBoundingBoxValue(valueIndex: number, changedValue: number) {
    const changedBoundingBox: [number, number, number, number] = [...boundingBox]
    changedBoundingBox[valueIndex] = changedValue
    onChange({ ...element, boundingBox: changedBoundingBox })
  }

  const leftLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.figureLeft)
  const rightLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.figureRight)
  const bottomLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.figureBottom)
  const topLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.figureTop)
  const aspectRatioLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.figureAspectRatio)
  return (
    <>
      <div className="blockcontent-editor-row blockcontent-editor-row-wrap">
        <span className="blockcontent-editor-position">
          <span className="blockcontent-editor-position-label">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.figureHorizontal)}</span>
          <NumberField label={leftLabel} value={boundingBox[LEFT_INDEX]} onChange={(changedValue) => changeBoundingBoxValue(LEFT_INDEX, changedValue)} />
          <NumberField label={rightLabel} value={boundingBox[RIGHT_INDEX]} onChange={(changedValue) => changeBoundingBoxValue(RIGHT_INDEX, changedValue)} />
        </span>
        <span className="blockcontent-editor-position">
          <span className="blockcontent-editor-position-label">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.figureVertical)}</span>
          <NumberField label={bottomLabel} value={boundingBox[BOTTOM_INDEX]} onChange={(changedValue) => changeBoundingBoxValue(BOTTOM_INDEX, changedValue)} />
          <NumberField label={topLabel} value={boundingBox[TOP_INDEX]} onChange={(changedValue) => changeBoundingBoxValue(TOP_INDEX, changedValue)} />
        </span>
        <span className="blockcontent-editor-position">
          <span className="blockcontent-editor-position-label">{aspectRatioLabel}</span>
          <NumberField label={aspectRatioLabel} value={element.aspectRatio} onChange={(changedValue) => onChange({ ...element, aspectRatio: changedValue })} />
        </span>
      </div>
      <AutoSizeTextArea
        label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.figureCode)}
        className="blockcontent-editor-code"
        value={element.code}
        onChange={(changedCode) => onChange({ ...element, code: changedCode })}
      />
    </>
  )
}
