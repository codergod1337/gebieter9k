import { type ClipboardEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { HighlightedText } from './HighlightedText.tsx'

/** Ein Vorschlag beim Tippen: ein vorhandener Wert und ein kurzer Hinweis daneben, z. B. an wie vielen Dateien er steht. */
export type ValueSuggestion = {
  value: string
  hint: string | null
}

type ValuesInputProps = {
  /** Für das Label (`htmlFor`). */
  controlId: string
  values: string[]
  onChange: (changedValues: string[]) => void
  disabled?: boolean
  placeholder?: string
  /**
   * Mit Vervollständigung: sucht zum Getippten vorhandene Werte (z. B. Tags aller Dateien). Die Vorschläge stehen unter
   * dem Feld, ein Klick oder Enter übernimmt einen als Chip. Ohne: nur freie Eingabe.
   */
  searchSuggestions?: (typedText: string) => Promise<ValueSuggestion[]>
  /** Bringt jeden neuen Wert in seine einheitliche Form, z. B. Tags ohne Raute; was leer wird, kommt nicht hinein. */
  normalizeValue?: (value: string) => string
}

/** Die Zeichen, die einen Wert abschließen: Enter, Leertaste, Semikolon, Komma. */
const VALUE_SEPARATOR_KEYS = ['Enter', ' ', ';', ',']

/** So lange nach dem letzten Tastendruck wird gesucht, wie beim Suchfeld in der Adresse. */
const SUGGESTION_DELAY_MILLISECONDS = 250

/** Zerlegt eingefügten Text an Leerzeichen, Semikolon, Komma und Zeilenumbruch, leere Teile fallen weg. */
function splitPastedValues(pastedText: string): string[] {
  const rawValues = pastedText.split(/[\s;,]+/)
  const values: string[] = []
  for (const rawValue of rawValues) {
    const trimmedValue = rawValue.trim()
    if (trimmedValue !== '') {
      values.push(trimmedValue)
    }
  }
  return values
}

/**
 * Mehrere Werte in einem Feld, je Wert ein Chip mit ×, nach dem WerteInput der Vorlage: Tippen und mit Enter, Leertaste,
 * Semikolon oder Komma abschließen; eingefügte Listen werden zerlegt; Rücktaste im leeren Feld nimmt den letzten Wert.
 * Doppelte Werte kommen nicht hinein. Das Feld ist ein `.form-control`, Aussehen und Fokus kommen aus dem Theme.
 *
 * Mit `searchSuggestions` zeigt es beim Tippen vorhandene Werte darunter, die Fundstelle markiert: Pfeil hoch und
 * runter wählen, Enter oder Klick übernimmt den Vorschlag als Chip, Escape schließt die Liste. So bleiben z. B. Tags
 * einheitlich.
 */
export function ValuesInput({
  controlId,
  values,
  onChange,
  disabled = false,
  placeholder,
  searchSuggestions,
  normalizeValue,
}: ValuesInputProps) {
  const [typedText, setTypedText] = useState<string>('')
  const [suggestions, setSuggestions] = useState<ValueSuggestion[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  /** Zählt die Suchen: Kommt eine alte Antwort nach einer neueren an, wird sie verworfen. */
  const suggestionRequestNumberRef = useRef<number>(0)
  const searchSuggestionsRef = useRef<typeof searchSuggestions>(searchSuggestions)

  useEffect(() => {
    searchSuggestionsRef.current = searchSuggestions
  })

  // Beim Tippen: kurz warten, dann vorhandene Werte suchen
  useEffect(() => {
    const trimmedText = typedText.trim()
    const currentSearchSuggestions = searchSuggestionsRef.current
    suggestionRequestNumberRef.current = suggestionRequestNumberRef.current + 1
    const suggestionRequestNumber = suggestionRequestNumberRef.current
    if (currentSearchSuggestions === undefined || trimmedText === '') {
      setSuggestions([])
      setActiveSuggestionIndex(-1)
      return
    }
    const suggestionTimer = window.setTimeout(() => {
      void currentSearchSuggestions(trimmedText).then((foundSuggestions) => {
        if (suggestionRequestNumber !== suggestionRequestNumberRef.current) {
          return
        }
        setSuggestions(foundSuggestions)
        setActiveSuggestionIndex(-1)
      })
    }, SUGGESTION_DELAY_MILLISECONDS)
    return () => window.clearTimeout(suggestionTimer)
  }, [typedText])

  // Werte, die schon drin sind, schlägt die Liste nicht noch einmal vor
  const shownSuggestions = suggestions.filter((suggestion) => !values.includes(suggestion.value))

  function closeSuggestions() {
    suggestionRequestNumberRef.current = suggestionRequestNumberRef.current + 1
    setSuggestions([])
    setActiveSuggestionIndex(-1)
  }

  function addValues(newValues: string[]) {
    const changedValues = [...values]
    for (const newValue of newValues) {
      let addedValue = newValue
      if (normalizeValue !== undefined) {
        addedValue = normalizeValue(newValue)
      }
      const alreadyContained = changedValues.includes(addedValue)
      if (addedValue !== '' && !alreadyContained) {
        changedValues.push(addedValue)
      }
    }
    onChange(changedValues)
  }

  function commitTypedText() {
    const trimmedText = typedText.trim()
    if (trimmedText !== '') {
      addValues([trimmedText])
    }
    setTypedText('')
    closeSuggestions()
  }

  function takeSuggestion(suggestion: ValueSuggestion) {
    addValues([suggestion.value])
    setTypedText('')
    closeSuggestions()
    inputRef.current?.focus()
  }

  function removeValue(valueToRemove: string) {
    const remainingValues = values.filter((value) => value !== valueToRemove)
    onChange(remainingValues)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const suggestionsShown = shownSuggestions.length > 0
    if (suggestionsShown && event.key === 'ArrowDown') {
      event.preventDefault()
      const nextIndex = Math.min(activeSuggestionIndex + 1, shownSuggestions.length - 1)
      setActiveSuggestionIndex(nextIndex)
      return
    }
    if (suggestionsShown && event.key === 'ArrowUp') {
      event.preventDefault()
      const previousIndex = Math.max(activeSuggestionIndex - 1, -1)
      setActiveSuggestionIndex(previousIndex)
      return
    }
    if (suggestionsShown && event.key === 'Escape') {
      event.preventDefault()
      closeSuggestions()
      return
    }
    const suggestionChosen = event.key === 'Enter' && activeSuggestionIndex >= 0 && activeSuggestionIndex < shownSuggestions.length
    if (suggestionChosen) {
      event.preventDefault()
      const chosenSuggestion = shownSuggestions[activeSuggestionIndex]
      takeSuggestion(chosenSuggestion)
      return
    }
    const isSeparatorKey = VALUE_SEPARATOR_KEYS.includes(event.key)
    if (isSeparatorKey) {
      event.preventDefault()
      commitTypedText()
      return
    }
    const removesLastValue = event.key === 'Backspace' && typedText === '' && values.length > 0
    if (removesLastValue) {
      const lastValue = values[values.length - 1]
      removeValue(lastValue)
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedText = event.clipboardData.getData('text')
    const pastedValues = splitPastedValues(pastedText)
    if (pastedValues.length > 1) {
      event.preventDefault()
      addValues(pastedValues)
    }
  }

  function focusInput() {
    inputRef.current?.focus()
  }

  return (
    <div className="values-input-wrapper">
      <div className="form-control values-input" onClick={focusInput}>
        {values.map((value) => (
          <span key={value} className="badge text-bg-secondary values-input-chip">
            {value}
            {!disabled && (
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label={value + ' entfernen'}
                onClick={() => removeValue(value)}></button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          id={controlId}
          className="values-input-field"
          value={typedText}
          disabled={disabled}
          placeholder={values.length === 0 ? placeholder : undefined}
          autoComplete="off"
          onChange={(event) => setTypedText(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={commitTypedText}
        />
      </div>
      {shownSuggestions.length > 0 && (
        <ul className="values-input-suggestions" role="listbox" aria-label="Vorschläge">
          {shownSuggestions.map((suggestion, suggestionIndex) => {
            let suggestionClassName = 'values-input-suggestion'
            if (suggestionIndex === activeSuggestionIndex) {
              suggestionClassName = 'values-input-suggestion active'
            }
            return (
              <li key={suggestion.value} role="option" aria-selected={suggestionIndex === activeSuggestionIndex}>
                <button
                  type="button"
                  className={suggestionClassName}
                  // mousedown statt Blur: Der Fokus bleibt im Feld, der Klick übernimmt den Vorschlag
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => takeSuggestion(suggestion)}>
                  <span className="badge values-input-suggestion-badge">
                    <HighlightedText text={suggestion.value} searchText={typedText} />
                  </span>
                  {suggestion.hint !== null && <span className="values-input-suggestion-hint">{suggestion.hint}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
