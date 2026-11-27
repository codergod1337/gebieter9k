import type { ReactNode } from 'react'
import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import { SKETCH_HIGHLIGHT_KEYS } from '../sketch/SketchHighlightKey.ts'
import type { PositionJson, SketchElementJson, SketchJson } from '../sketch/SketchJson.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { EditorAddButton, EditorRowButtons } from './EditorCard.tsx'
import { moveListItem, removeListItem, replaceListItem } from './listChanges.ts'

type SketchEditorProps = {
  sketch: SketchJson
  onChange: (changedSketch: SketchJson) => void
}

type NumberFieldProps = {
  label: string
  value: number
  onChange: (changedValue: number) => void
}

/** Ein kleines Zahlenfeld; solange dort keine Zahl steht, bleibt der alte Wert. */
function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <Form.Control
      size="sm"
      type="number"
      step="any"
      className="blockcontent-editor-number-input"
      aria-label={label}
      title={label}
      value={value}
      onChange={(changeEvent) => {
        const changedValue = Number(changeEvent.target.value)
        if (changeEvent.target.value !== '' && Number.isFinite(changedValue)) {
          onChange(changedValue)
        }
      }}
    />
  )
}

type PositionFieldsProps = {
  label: string
  position: PositionJson
  onChange: (changedPosition: PositionJson) => void
}

/** Ein Ort in der Skizze: x und y in den Einheiten des Achsenkreuzes. */
function PositionFields({ label, position, onChange }: PositionFieldsProps) {
  return (
    <span className="blockcontent-editor-position">
      <span className="blockcontent-editor-position-label">{label}</span>
      <NumberField label={label + ' x'} value={position.x} onChange={(changedX) => onChange({ ...position, x: changedX })} />
      <NumberField label={label + ' y'} value={position.y} onChange={(changedY) => onChange({ ...position, y: changedY })} />
    </span>
  )
}

/**
 * Eine Skizze im Editor: ihr Feld und ihr Achsenkreuz (wo der Nullpunkt liegt, wie lang die Strecke von 0
 * bis 1 ist, wie weit die Achsen reichen), ihre Beschreibung für Screenreader und ihre Elemente als Liste: Punkt,
 * Strecke, Winkel, rechter Winkel, jedes mit seinen Feldern. Die Reihenfolge ist die Zeichenreihenfolge (Späteres liegt
 * über Früherem). Eine Strecke oder ein Winkel kann eine Farbe der Palette tragen. Der Rahmen darum (Art, Verschieben,
 * Entfernen) kommt von der Liste der Elemente.
 */
export function SketchEditor({ sketch, onChange }: SketchEditorProps) {
  const elements = sketch.elements

  function changeElements(changedElements: SketchElementJson[]) {
    onChange({ ...sketch, elements: changedElements })
  }

  function changeElement(elementIndex: number, changedElement: SketchElementJson) {
    changeElements(replaceListItem(elements, elementIndex, changedElement))
  }

  function renderTextField(label: string, value: string | null | undefined, onTextChange: (changedText: string) => void): ReactNode {
    return (
      <Form.Control
        size="sm"
        className="blockcontent-editor-sketch-text"
        placeholder={label}
        aria-label={label}
        value={value ?? ''}
        onChange={(changeEvent) => onTextChange(changeEvent.target.value)}
      />
    )
  }

  function renderHighlightSelect(highlightKey: string | null | undefined, onHighlightChange: (changedHighlightKey: string | null) => void): ReactNode {
    const label = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchHighlight)
    return (
      <Form.Select
        size="sm"
        className="blockcontent-editor-short-input"
        aria-label={label}
        title={label}
        value={highlightKey ?? ''}
        onChange={(changeEvent) => onHighlightChange(changeEvent.target.value === '' ? null : changeEvent.target.value)}>
        <option value="">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchNoHighlight)}</option>
        {SKETCH_HIGHLIGHT_KEYS.map((offeredHighlightKey, highlightIndex) => (
          <option key={offeredHighlightKey} value={offeredHighlightKey}>
            {getTextInCurrentLanguageWithValues(BLOCK_CONTENT_EDITOR_TEXTS.sketchHighlightNumber, { number: String(highlightIndex + 1) })}
          </option>
        ))}
      </Form.Select>
    )
  }

  function renderElementFields(element: SketchElementJson, elementIndex: number): ReactNode {
    const vertexLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchVertex)
    const firstLegLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchFirstLeg)
    const secondLegLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchSecondLeg)
    const labelLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchElementLabel)
    if (element.type === 'POINT') {
      return (
        <>
          <PositionFields
            label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchPosition)}
            position={element.position}
            onChange={(changedPosition) => changeElement(elementIndex, { ...element, position: changedPosition })}
          />
          {renderTextField(labelLabel, element.label, (changedText) => changeElement(elementIndex, { ...element, label: changedText }))}
          {renderTextField(getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchHintName), element.hintName, (changedText) =>
            changeElement(elementIndex, { ...element, hintName: changedText }),
          )}
          {renderTextField(getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchHintDetail), element.hintDetail, (changedText) =>
            changeElement(elementIndex, { ...element, hintDetail: changedText }),
          )}
        </>
      )
    }
    if (element.type === 'SEGMENT') {
      const sideLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchLabelSide)
      return (
        <>
          <PositionFields
            label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchFrom)}
            position={element.from}
            onChange={(changedPosition) => changeElement(elementIndex, { ...element, from: changedPosition })}
          />
          <PositionFields
            label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchTo)}
            position={element.to}
            onChange={(changedPosition) => changeElement(elementIndex, { ...element, to: changedPosition })}
          />
          {renderTextField(labelLabel, element.label, (changedText) => changeElement(elementIndex, { ...element, label: changedText }))}
          <Form.Select
            size="sm"
            className="blockcontent-editor-short-input"
            aria-label={sideLabel}
            title={sideLabel}
            value={element.labelSide}
            onChange={(changeEvent) => {
              const changedSide = changeEvent.target.value === 'LEFT' ? 'LEFT' : 'RIGHT'
              changeElement(elementIndex, { ...element, labelSide: changedSide })
            }}>
            <option value="LEFT">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchSideLeft)}</option>
            <option value="RIGHT">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchSideRight)}</option>
          </Form.Select>
          {renderHighlightSelect(element.highlight, (changedHighlightKey) => changeElement(elementIndex, { ...element, highlight: changedHighlightKey }))}
        </>
      )
    }
    const legFields = (
      <>
        <PositionFields
          label={vertexLabel}
          position={element.vertex}
          onChange={(changedPosition) => changeElement(elementIndex, { ...element, vertex: changedPosition })}
        />
        <PositionFields
          label={firstLegLabel}
          position={element.firstLegEnd}
          onChange={(changedPosition) => changeElement(elementIndex, { ...element, firstLegEnd: changedPosition })}
        />
        <PositionFields
          label={secondLegLabel}
          position={element.secondLegEnd}
          onChange={(changedPosition) => changeElement(elementIndex, { ...element, secondLegEnd: changedPosition })}
        />
      </>
    )
    if (element.type === 'RIGHT_ANGLE') {
      return legFields
    }
    return (
      <>
        {legFields}
        {renderTextField(labelLabel, element.label, (changedText) => changeElement(elementIndex, { ...element, label: changedText }))}
        {renderTextField(getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchAngleHint), element.hint, (changedText) =>
          changeElement(elementIndex, { ...element, hint: changedText }),
        )}
        {renderHighlightSelect(element.highlight, (changedHighlightKey) => changeElement(elementIndex, { ...element, highlight: changedHighlightKey }))}
      </>
    )
  }

  const elementKindLabels: Record<SketchElementJson['type'], string> = {
    POINT: getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchPoint),
    SEGMENT: getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchSegment),
    ANGLE: getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchAngle),
    RIGHT_ANGLE: getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchRightAngle),
  }
  const origin: PositionJson = { x: 0, y: 0 }
  const unitX: PositionJson = { x: 1, y: 0 }
  const unitY: PositionJson = { x: 0, y: 1 }

  return (
    <div className="blockcontent-editor-part blockcontent-editor-sketch">
      <div className="blockcontent-editor-row">
        {renderTextField(getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchDescription), sketch.description, (changedText) =>
          onChange({ ...sketch, description: changedText }),
        )}
      </div>
      <div className="blockcontent-editor-row blockcontent-editor-row-wrap">
        <span className="blockcontent-editor-position">
          <span className="blockcontent-editor-position-label">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchField)}</span>
          <NumberField label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchWidth)} value={sketch.width} onChange={(changedValue) => onChange({ ...sketch, width: changedValue })} />
          <NumberField label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchHeight)} value={sketch.height} onChange={(changedValue) => onChange({ ...sketch, height: changedValue })} />
        </span>
        <span className="blockcontent-editor-position">
          <span className="blockcontent-editor-position-label">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchOrigin)}</span>
          <NumberField label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchOrigin) + ' x'} value={sketch.originX} onChange={(changedValue) => onChange({ ...sketch, originX: changedValue })} />
          <NumberField label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchOrigin) + ' y'} value={sketch.originY} onChange={(changedValue) => onChange({ ...sketch, originY: changedValue })} />
        </span>
        <span className="blockcontent-editor-position">
          <span className="blockcontent-editor-position-label">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchUnitLength)}</span>
          <NumberField label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchUnitLength)} value={sketch.unitLength} onChange={(changedValue) => onChange({ ...sketch, unitLength: changedValue })} />
        </span>
        <span className="blockcontent-editor-position">
          <span className="blockcontent-editor-position-label">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchAxisMax)}</span>
          <NumberField label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchAxisMax) + ' x'} value={sketch.axisMaxX} onChange={(changedValue) => onChange({ ...sketch, axisMaxX: changedValue })} />
          <NumberField label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.sketchAxisMax) + ' y'} value={sketch.axisMaxY} onChange={(changedValue) => onChange({ ...sketch, axisMaxY: changedValue })} />
        </span>
      </div>
      {elements.map((element, elementIndex) => (
        <div key={elementIndex} className="blockcontent-editor-row blockcontent-editor-row-wrap blockcontent-editor-sketch-element">
          <span className="blockcontent-editor-sketch-kind">{elementKindLabels[element.type]}</span>
          {renderElementFields(element, elementIndex)}
          <EditorRowButtons
            onMoveUp={() => changeElements(moveListItem(elements, elementIndex, -1))}
            onMoveDown={() => changeElements(moveListItem(elements, elementIndex, 1))}
            onRemove={() => changeElements(removeListItem(elements, elementIndex))}
          />
        </div>
      ))}
      <div className="blockcontent-editor-row blockcontent-editor-row-wrap">
        <EditorAddButton
          label={elementKindLabels.POINT}
          onClick={() => changeElements([...elements, { type: 'POINT', position: unitX, label: 'P', hintName: 'P' }])}
        />
        <EditorAddButton
          label={elementKindLabels.SEGMENT}
          onClick={() => changeElements([...elements, { type: 'SEGMENT', from: origin, to: unitX, label: 'a', labelSide: 'RIGHT' }])}
        />
        <EditorAddButton
          label={elementKindLabels.ANGLE}
          onClick={() =>
            changeElements([...elements, { type: 'ANGLE', vertex: origin, firstLegEnd: unitX, secondLegEnd: unitY, label: 'α', hint: 'α' }])
          }
        />
        <EditorAddButton
          label={elementKindLabels.RIGHT_ANGLE}
          onClick={() => changeElements([...elements, { type: 'RIGHT_ANGLE', vertex: origin, firstLegEnd: unitX, secondLegEnd: unitY }])}
        />
      </div>
    </div>
  )
}
