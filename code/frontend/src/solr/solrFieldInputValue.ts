import type { SolrField } from './SolrField.ts'

/**
 * Was eine Eingabe zu einem Solr-Feld hält, bevor es zum Backend geht: mehrwertig eine Liste von Texten, BOOLEAN ein
 * Schalter, alles andere ein Text (auch Zahlen und Zeitpunkte, so wie das Eingabefeld sie liefert).
 */
export type SolrFieldInputValue = string | string[] | boolean

/** Der leere Startwert einer Eingabe zu diesem Feld. */
export function getEmptySolrFieldInputValue(solrField: SolrField): SolrFieldInputValue {
  if (solrField.multiValued) {
    return []
  }
  if (solrField.type === 'BOOLEAN') {
    return false
  }
  return ''
}

/** Ein einzelner Wert nach dem Typ des Feldes; `undefined`, wenn er leer ist oder keine Zahl, wo eine verlangt ist. */
function toSingleSolrClientValue(solrField: SolrField, inputText: string): unknown {
  const trimmedText = inputText.trim()
  if (trimmedText === '') {
    return undefined
  }
  if (solrField.type === 'LONG') {
    const wholeNumber = Number.parseInt(trimmedText, 10)
    if (Number.isNaN(wholeNumber)) {
      return undefined
    }
    return wholeNumber
  }
  if (solrField.type === 'DOUBLE') {
    const decimalNumber = Number.parseFloat(trimmedText)
    if (Number.isNaN(decimalNumber)) {
      return undefined
    }
    return decimalNumber
  }
  if (solrField.type === 'DATE') {
    // datetime-local liefert Ortszeit ohne Zone, das Backend will ISO 8601 in UTC
    const localDate = new Date(trimmedText)
    if (Number.isNaN(localDate.getTime())) {
      return undefined
    }
    return localDate.toISOString()
  }
  return trimmedText
}

/** Der Wert, wie das Backend ihn für das Feld erwartet; `undefined` heißt: nicht mitschicken. */
export function toSolrClientValue(solrField: SolrField, inputValue: SolrFieldInputValue): unknown {
  if (typeof inputValue === 'boolean') {
    return inputValue
  }
  if (Array.isArray(inputValue)) {
    const clientValues: unknown[] = []
    for (const inputText of inputValue) {
      const clientValue = toSingleSolrClientValue(solrField, inputText)
      if (clientValue !== undefined) {
        clientValues.push(clientValue)
      }
    }
    if (clientValues.length === 0) {
      return undefined
    }
    return clientValues
  }
  return toSingleSolrClientValue(solrField, inputValue)
}

/**
 * Die Werte für das Backend: je Feld mit Eingabe der umgewandelte Wert unter dem Solr-Namen, leere fallen weg. Was der
 * Client nicht setzen darf, ignoriert das Backend ohnehin.
 */
export function createSolrClientFieldValues(
  solrFields: SolrField[],
  inputValuesByFieldName: Record<string, SolrFieldInputValue>,
): Record<string, unknown> {
  const clientFieldValues: Record<string, unknown> = {}
  for (const solrField of solrFields) {
    const inputValue = inputValuesByFieldName[solrField.name]
    if (inputValue === undefined) {
      continue
    }
    const clientValue = toSolrClientValue(solrField, inputValue)
    if (clientValue !== undefined) {
      clientFieldValues[solrField.name] = clientValue
    }
  }
  return clientFieldValues
}

/** Der Anzeigename eines Feldes, ohne Namen der technische Name. */
export function getSolrFieldLabel(solrField: SolrField, displayNameText: string): string {
  if (displayNameText.trim() === '') {
    return solrField.name
  }
  return displayNameText
}

/** Ein Zeitpunkt (ISO, UTC) als Wert für `datetime-local` in Ortszeit, z. B. `2026-11-08T02:51`. */
function toDateTimeLocalText(isoDateTimeText: string): string {
  const dateTime = new Date(isoDateTimeText)
  if (Number.isNaN(dateTime.getTime())) {
    return ''
  }
  const timezoneOffsetMillis = dateTime.getTimezoneOffset() * 60 * 1000
  const localDateTime = new Date(dateTime.getTime() - timezoneOffsetMillis)
  const localIsoText = localDateTime.toISOString()
  return localIsoText.slice(0, 16)
}

/** Der Startwert einer Eingabe aus dem gespeicherten Wert im Dokument, z. B. zum Bearbeiten eines Feldes. */
export function toSolrFieldInputValue(solrField: SolrField, storedValue: unknown): SolrFieldInputValue {
  if (solrField.multiValued) {
    if (!Array.isArray(storedValue)) {
      return []
    }
    return storedValue.map((singleValue) => String(singleValue))
  }
  if (solrField.type === 'BOOLEAN') {
    return storedValue === true
  }
  if (storedValue === undefined || storedValue === null) {
    return ''
  }
  if (solrField.type === 'DATE' && typeof storedValue === 'string') {
    return toDateTimeLocalText(storedValue)
  }
  return String(storedValue)
}

/** Der Wert, mit dem das Backend ein Feld leert: eine leere Liste bei mehrwertigen Feldern, sonst ein leerer Text. */
export function getClearingSolrClientValue(solrField: SolrField): unknown {
  if (solrField.multiValued) {
    return []
  }
  return ''
}
