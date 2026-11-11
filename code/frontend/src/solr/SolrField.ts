import type { MultilingualText } from '../language/MultilingualText.ts'

/** Die Typen eines Feldes, wie das Enum `SolrFieldType` im Backend. */
export type SolrFieldType = 'STRING' | 'BOOLEAN' | 'LONG' | 'DOUBLE' | 'DATE' | 'TEXT_EDGE' | 'TEXT_SUCHE'

/**
 * Ein Feld eines Kerns, wie wir es in Postgres definieren (`SolrField` im Backend).
 * Doku: `docu/entities/SolrField.md`
 */
export type SolrField = {
  id: number
  solrCoreKey: string
  /** Feldname in Solr: Anfang ein kleiner Buchstabe, dann Buchstaben und Ziffern, z. B. `authorUsersGuid`. */
  name: string
  /**
   * Gesetzt an der Zeile einer Referenz, der Key der Referenz. Dann stehen Typ, Schalter und Schreibregel fest, je Kern
   * änderbar sind nur Leserechte und Suchgewicht. `null` bei jedem anderen Feld.
   */
  solrReferenceKey: string | null
  type: SolrFieldType
  indexed: boolean
  stored: boolean
  multiValued: boolean
  docValues: boolean
  required: boolean
  /** Zwilling `<name>Suggest` für die Vervollständigung beim Tippen. */
  suggestTwin: boolean
  /** Zwilling `<name>Ngram`: jedes Stück ab 3 Zeichen trifft. */
  ngramTwin: boolean
  /**
   * Vom Client übernehmbar: Schickt der Client beim Upload oder Bearbeiten einen Wert mit, nimmt das Backend ihn an. Ein
   * Kann, kein Muss. Aus: Der Wert kommt nie vom Client, Herr der Information ist das Backend oder die Auswertung (Tika).
   */
  clientValueAccepted: boolean
  /** Von {@link SOLR_FIELD_SEARCH_WEIGHT_MIN} bis {@link SOLR_FIELD_SEARCH_WEIGHT_MAX}, siehe {@link describeSolrFieldSearchWeight}. */
  searchWeight: number
  /** „Wer liest“: Mit diesem einen Recht bekommt man das Feld in einer Antwort. `null`: kein User, nur das Backend. */
  readerAccessRoleKey: string | null
  displayName: MultilingualText
  description: MultilingualText | null
  listingPosition: number
}

/** Body zum Anlegen: alles außer der `id`, die vergibt das Backend. */
export type NewSolrField = Omit<SolrField, 'id'>

/** Die Typen mit Erklärung für die Auswahl, in dieser Reihenfolge. */
export const SOLR_FIELD_TYPE_OPTIONS: { type: SolrFieldType; label: string }[] = [
  { type: 'STRING', label: 'STRING – exakter Wert (GUID, Key, Pfad)' },
  { type: 'BOOLEAN', label: 'BOOLEAN – ja oder nein' },
  { type: 'LONG', label: 'LONG – ganze Zahl (Größe, Zähler)' },
  { type: 'DOUBLE', label: 'DOUBLE – Kommazahl (z. B. GPS)' },
  { type: 'DATE', label: 'DATE – Zeitpunkt' },
  { type: 'TEXT_EDGE', label: 'TEXT_EDGE – Text, beim Tippen über Wortanfänge findbar' },
  { type: 'TEXT_SUCHE', label: 'TEXT_SUCHE – Volltext deutsch' },
]

/** Wie im Backend (`SolrFieldType.isSuggestTwinAllowed`): nur exakte Werte und Zahlen. */
export function isSuggestTwinAllowed(type: SolrFieldType): boolean {
  return type === 'STRING' || type === 'LONG' || type === 'DOUBLE'
}

/** Wie im Backend (`SolrFieldType.isNgramTwinAllowed`): nur Werte mit Text. */
export function isNgramTwinAllowed(type: SolrFieldType): boolean {
  return type === 'STRING' || type === 'TEXT_EDGE' || type === 'TEXT_SUCHE'
}

/** Die Schalter eines Feldes samt Zwillingen, so heißen sie im Backend. */
export type SolrFieldSwitchName =
  | 'indexed'
  | 'stored'
  | 'multiValued'
  | 'docValues'
  | 'required'
  | 'suggestTwin'
  | 'ngramTwin'

/** Die Schalter als Spalten der Feldtabelle, mit ihrem Spaltenkopf, in der Reihenfolge des Formulars. */
export const SOLR_FIELD_SWITCH_COLUMNS: { switchName: SolrFieldSwitchName; columnHead: string }[] = [
  { switchName: 'indexed', columnHead: 'indexed' },
  { switchName: 'stored', columnHead: 'stored' },
  { switchName: 'multiValued', columnHead: 'multiValued' },
  { switchName: 'docValues', columnHead: 'docValues' },
  { switchName: 'required', columnHead: 'required' },
  { switchName: 'suggestTwin', columnHead: '+Suggest' },
  { switchName: 'ngramTwin', columnHead: '+Ngram' },
]

/** Ob ein Schalter beim Typ des Feldes geht: Die Zwillinge hängen am Typ, die übrigen Schalter gehen immer. */
export function isSolrFieldSwitchAllowed(type: SolrFieldType, switchName: SolrFieldSwitchName): boolean {
  if (switchName === 'suggestTwin') {
    return isSuggestTwinAllowed(type)
  }
  if (switchName === 'ngramTwin') {
    return isNgramTwinAllowed(type)
  }
  return true
}

/**
 * Der Bereich des Suchgewichts, wie `gebiter.solr.search-weight` im Backend: -1 heißt nicht durchsucht, die Suchwörter
 * erreichen das Feld nicht; 0 heißt durchsucht, aber ohne Punkte; 1 bis 10 ist der Faktor des Feldes in der
 * Freitextsuche (Solr edismax `feld^gewicht`).
 */
export const SOLR_FIELD_SEARCH_WEIGHT_MIN = -1
export const SOLR_FIELD_SEARCH_WEIGHT_MAX = 10

/** Was ein Suchgewicht bedeutet, in einem Satz, z. B. unter dem Schieberegler. */
export function describeSolrFieldSearchWeight(searchWeight: number): string {
  if (searchWeight < 0) {
    return 'Nicht durchsucht: Die Suchwörter erreichen das Feld nicht.'
  }
  if (searchWeight === 0) {
    return 'Durchsucht, aber ohne Punkte: Ein Treffer zählt, ordnet aber nicht.'
  }
  return 'Faktor ' + searchWeight + ': Je höher, desto weiter oben stehen Treffer in diesem Feld.'
}

/** Was „niemand“ bei „Wer liest“ bedeutet, gleich in Tabelle und Formular. */
export const SOLR_FIELD_NO_READER_TEXT = 'Kein User bekommt das Feld, nur das Backend nutzt es.'
