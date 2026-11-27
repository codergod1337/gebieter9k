import { type KeyboardEvent, type MouseEvent, useEffect, useId, useRef, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import type { MathfieldElement, Selection } from 'mathlive'
import { Hoverlay } from '../../components/Hoverlay.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import { createFormulaIdInsertion, isFormulaId, readFormulaIds, removeFormulaId } from './formulaIds.ts'
import { FORMULA_TEXTS } from './formulaTexts.ts'

type FormulaFieldProps = {
  /** Für Screenreader, z. B. „Gleichung“. */
  label: string
  /** Die Formel als LaTeX. */
  latex: string
  /** Die geänderte Formel, nach jeder Eingabe. */
  onLatexChange: (changedLatex: string) => void
}

/** Das Stück der App mit dem Eingabefeld der Bibliothek; es wird erst geladen, wenn das erste Formelfeld erscheint. */
type FormulaFieldModule = typeof import('./MathLiveFormulaFieldModule.ts')

/**
 * DAS Formelfeld der App (Nutzer 2026-11-27: „einen formeleditor innerhalb vom richtexteditor“, „ich will das rad auch
 * nicht neu erfinden“): das Eingabefeld der Bibliothek MathLive. Man tippt und sieht die Formel dabei gesetzt, Befehle
 * wie `\nabla` oder `\frac` gehen, Symbole gibt es über die Tastatur des Felds. Heraus kommt LaTeX.
 *
 * Dazu, was nur wir brauchen: Ein markierter Teil bekommt eine id („id vergeben“), darunter stehen die ids der Formel,
 * jede lässt sich wieder entfernen. Wer mag, sieht und ändert das LaTeX auch als Text. Was mit einem Teil in einer
 * Animation geschieht, gehört NICHT hierher (Paket `blockcontent/animation`).
 */
export function FormulaField({ label, latex, onLatexChange }: FormulaFieldProps) {
  const [fieldModule, setFieldModule] = useState<FormulaFieldModule | null>(null)
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null)
  const [selectionCollapsed, setSelectionCollapsed] = useState(true)
  const [idInputShown, setIdInputShown] = useState(false)
  const [enteredId, setEnteredId] = useState('')
  const [latexShown, setLatexShown] = useState(false)
  const latexSwitchId = useId()
  const fieldContainerRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<MathfieldElement | null>(null)
  /** Was markiert war, als „id vergeben“ gedrückt wurde: Das Feld verliert die Markierung, sobald man die id tippt. */
  const selectionForIdRef = useRef<Selection | null>(null)
  const onLatexChangeRef = useRef(onLatexChange)
  const latexRef = useRef(latex)

  useEffect(() => {
    onLatexChangeRef.current = onLatexChange
    latexRef.current = latex
  })

  // das Stück mit dem Eingabefeld nachladen
  useEffect(() => {
    let stillShown = true
    import('./MathLiveFormulaFieldModule.ts')
      .then((loadedModule) => {
        if (stillShown) {
          setFieldModule(loadedModule)
        }
      })
      .catch((caughtError: unknown) => {
        if (stillShown) {
          setLoadErrorMessage(String(caughtError))
        }
      })
    return () => {
      stillShown = false
    }
  }, [])

  // das Eingabefeld anlegen, sobald sein Stück da ist; jede Eingabe geht als LaTeX hinaus
  useEffect(() => {
    const fieldContainer = fieldContainerRef.current
    if (fieldModule === null || fieldContainer === null) {
      return
    }
    const field = new fieldModule.MathfieldElement()
    field.setAttribute('aria-label', label)
    field.className = 'formula-field-input'
    field.setValue(latexRef.current, { silenceNotifications: true })

    function handleInput() {
      const changedLatex = field.getValue()
      onLatexChangeRef.current(changedLatex)
    }

    function handleSelectionChange() {
      setSelectionCollapsed(field.selectionIsCollapsed)
    }

    field.addEventListener('input', handleInput)
    field.addEventListener('selection-change', handleSelectionChange)
    fieldContainer.append(field)
    fieldRef.current = field
    return () => {
      field.removeEventListener('input', handleInput)
      field.removeEventListener('selection-change', handleSelectionChange)
      field.remove()
      fieldRef.current = null
    }
  }, [fieldModule, label])

  // eine Änderung von außen (Zurücksetzen, id entfernt, LaTeX als Text getippt) ins Feld übernehmen
  useEffect(() => {
    const field = fieldRef.current
    if (field === null) {
      return
    }
    if (field.getValue() !== latex) {
      field.setValue(latex, { silenceNotifications: true })
    }
  }, [latex, fieldModule])

  const formulaIds = readFormulaIds(latex)
  const enteredIdText = enteredId.trim()
  const enteredIdInvalid = enteredIdText !== '' && !isFormulaId(enteredIdText)
  const enteredIdTaken = formulaIds.includes(enteredIdText)
  const idConfirmDisabled = enteredIdText === '' || enteredIdInvalid || enteredIdTaken

  function keepSelection(mouseEvent: MouseEvent<HTMLButtonElement>) {
    // der Klick auf den Knopf soll dem Feld weder den Fokus noch die Markierung nehmen
    mouseEvent.preventDefault()
  }

  function openIdInput() {
    const field = fieldRef.current
    if (field === null) {
      return
    }
    selectionForIdRef.current = field.selection
    setEnteredId('')
    setIdInputShown(true)
  }

  function closeIdInput() {
    setIdInputShown(false)
    selectionForIdRef.current = null
  }

  function assignId() {
    const field = fieldRef.current
    const selectionForId = selectionForIdRef.current
    if (field === null || selectionForId === null || idConfirmDisabled) {
      return
    }
    field.selection = selectionForId
    const idInsertion = createFormulaIdInsertion(enteredIdText)
    field.insert(idInsertion, { selectionMode: 'item', focus: true })
    const changedLatex = field.getValue()
    onLatexChange(changedLatex)
    closeIdInput()
  }

  /** Im Feld für die id: Enter vergibt sie, Escape bricht ab. Kein eigenes Formular, das Feld steht oft schon in einem. */
  function handleIdKeyDown(keyboardEvent: KeyboardEvent<HTMLInputElement>) {
    if (keyboardEvent.key === 'Enter') {
      keyboardEvent.preventDefault()
      assignId()
    } else if (keyboardEvent.key === 'Escape') {
      keyboardEvent.preventDefault()
      closeIdInput()
    }
  }

  let loadStateText: string | null = null
  if (loadErrorMessage !== null) {
    loadStateText = getTextInCurrentLanguageWithValues(FORMULA_TEXTS.fieldLoadFailed, { reason: loadErrorMessage })
  } else if (fieldModule === null) {
    loadStateText = getTextInCurrentLanguage(FORMULA_TEXTS.fieldLoading)
  }

  return (
    <div className="formula-field">
      {loadStateText !== null && <span className="formula-field-state">{loadStateText}</span>}
      <div ref={fieldContainerRef} className="formula-field-box"></div>
      <div className="formula-field-tools">
        {!idInputShown && (
          <Hoverlay text={getTextInCurrentLanguage(FORMULA_TEXTS.assignIdHint)}>
            <span>
              <Button
                size="sm"
                variant="outline-secondary"
                disabled={fieldModule === null || selectionCollapsed}
                onMouseDown={keepSelection}
                onClick={openIdInput}>
                <i className="bi bi-tag me-1" aria-hidden="true"></i>
                {getTextInCurrentLanguage(FORMULA_TEXTS.assignId)}
              </Button>
            </span>
          </Hoverlay>
        )}
        {idInputShown && (
          <span className="formula-field-id-form">
            <Form.Control
              size="sm"
              autoFocus
              className="formula-field-id-input"
              aria-label={getTextInCurrentLanguage(FORMULA_TEXTS.idInputLabel)}
              placeholder={getTextInCurrentLanguage(FORMULA_TEXTS.idInputPlaceholder)}
              value={enteredId}
              isInvalid={enteredIdInvalid || enteredIdTaken}
              onChange={(changeEvent) => setEnteredId(changeEvent.target.value)}
              onKeyDown={handleIdKeyDown}
            />
            <Button size="sm" variant="primary" disabled={idConfirmDisabled} onClick={assignId}>
              {getTextInCurrentLanguage(FORMULA_TEXTS.idConfirm)}
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={closeIdInput}>
              {getTextInCurrentLanguage(FORMULA_TEXTS.idCancel)}
            </Button>
            {enteredIdInvalid && <span className="formula-field-problem">{getTextInCurrentLanguage(FORMULA_TEXTS.idInvalid)}</span>}
            {enteredIdTaken && <span className="formula-field-problem">{getTextInCurrentLanguage(FORMULA_TEXTS.idTaken)}</span>}
          </span>
        )}
        {formulaIds.length > 0 && (
          <span className="formula-field-ids">
            <span className="formula-field-ids-label">{getTextInCurrentLanguage(FORMULA_TEXTS.idsLabel)}</span>
            {formulaIds.map((formulaId) => (
              <span key={formulaId} className="formula-field-id">
                {formulaId}
                <button
                  type="button"
                  className="formula-field-id-remove"
                  aria-label={getTextInCurrentLanguageWithValues(FORMULA_TEXTS.removeId, { formulaId })}
                  onClick={() => onLatexChange(removeFormulaId(latex, formulaId))}>
                  <i className="bi bi-x" aria-hidden="true"></i>
                </button>
              </span>
            ))}
          </span>
        )}
        <Form.Check
          type="switch"
          className="formula-field-latex-switch"
          id={latexSwitchId}
          label={getTextInCurrentLanguage(FORMULA_TEXTS.showLatex)}
          checked={latexShown}
          onChange={(changeEvent) => setLatexShown(changeEvent.target.checked)}
        />
      </div>
      {latexShown && (
        <Form.Control
          as="textarea"
          size="sm"
          rows={2}
          spellCheck={false}
          className="formula-field-latex"
          aria-label={getTextInCurrentLanguage(FORMULA_TEXTS.latexInputLabel)}
          value={latex}
          onChange={(changeEvent) => onLatexChange(changeEvent.target.value)}
        />
      )}
    </div>
  )
}
