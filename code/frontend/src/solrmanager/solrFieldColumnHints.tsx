import type { ReactNode } from 'react'
import type { SolrFieldSwitchName } from '../solr/SolrField.ts'

/**
 * Die Erklärungen der Spalten in der Feldtabelle, fürs Hoverlay am Spaltenkopf, nach den solrFieldHints der Vorlage:
 * was eine Einstellung tut, was sie kostet und wofür man sie braucht. JSX, damit Titel und Absätze möglich sind.
 */
function explanation(title: string, ...paragraphs: string[]): ReactNode {
  return (
    <span className="hoverlay-explanation">
      <strong>{title}</strong>
      {paragraphs.map((paragraph) => (
        <span key={paragraph}>{paragraph}</span>
      ))}
    </span>
  )
}

export const SOLR_FIELD_POSITION_HINT = explanation(
  'Pos.: Platz in der Tabelle',
  'In dieser Reihenfolge stehen die Felder hier und in jeder Maske, die die Felder des Kerns zeigt.',
  'Ändern: am Griff links die Zeile ziehen, die neue Reihenfolge wird sofort gespeichert.',
)

export const SOLR_FIELD_NAME_HINT = explanation(
  'Name: der Feldname in Solr',
  'Anfang ein kleiner Buchstabe, dann Buchstaben und Ziffern, z. B. authorUsersGuid. Je Kern nur einmal. Er darf nicht auf Suggest oder Ngram enden, so heißen die Zwillinge.',
  'Umbenennen ändert nur die Definition. In Solr bleibt das alte Feld stehen, der Abgleich meldet es als „nur in Solr“.',
)

export const SOLR_FIELD_DISPLAY_NAME_HINT = explanation(
  'Anzeigename: wie das Feld für Menschen heißt',
  'Steht in Masken, Hinweisen und Trefferlisten statt des technischen Namens. Mehrsprachig, vorerst nur Deutsch.',
)

export const SOLR_FIELD_TYPE_HINT = explanation(
  'Typ: wie Solr den Wert ablegt',
  'STRING: der Wert genau so, wie er kommt, trifft nur exakt. Für Keys, Status, GUIDs, Hashes. BOOLEAN: ja oder nein. LONG: ganze Zahl. DOUBLE: Kommazahl, z. B. GPS. DATE: Zeitpunkt in UTC.',
  'TEXT_EDGE: zerlegt in Wörter, klein geschrieben, jeder Wortanfang ab 3 Zeichen trifft. Für alles, was man beim Tippen wiederfinden will, z. B. Dateiname oder Titel. TEXT_SUCHE: Volltext deutsch, jedes Wort in seiner Stammform.',
  'Den Typ nachträglich ändern heißt den Kern neu aufbauen: Solr schreibt alte Dokumente nicht um.',
)

const SOLR_FIELD_SWITCH_HINTS: Record<SolrFieldSwitchName, ReactNode> = {
  indexed: explanation(
    'indexed: das Feld kommt in den Suchindex',
    'Nur ein indexiertes Feld lässt sich durchsuchen, filtern und auflösen. Ohne indexed wird der Wert nur gespeichert und zurückgegeben, keine Abfrage findet ihn.',
    'Kostet Platz und macht das Schreiben langsamer, bei Texten deutlich. Nachträglich einschalten wirkt nur für neue Dokumente.',
  ),
  stored: explanation(
    'stored: der Originalwert bleibt im Dokument',
    'Nur ein gespeichertes Feld kommt bei einer Abfrage zurück. Ohne stored ist der Wert nur suchbar, aber nie wieder lesbar.',
    'Solr ist für den Kern FILE der einzige Speicher der Metadaten: Echte Felder bleiben stored, sonst gehen bei Teilupdates Werte verloren.',
  ),
  multiValued: explanation(
    'multiValued: mehrere Werte je Dokument',
    'Das Feld trägt je Dokument eine Liste, z. B. tags oder galleryIds. Die Suche trifft jeden Wert.',
    'Nach einem Listenfeld lässt sich nicht sortieren. Nachträglich umschalten heißt den Kern neu aufbauen.',
  ),
  docValues: explanation(
    'docValues: eine spaltenweise Kopie der Werte',
    'Für Sortieren, Zählen (Facetten) und Rechnen mit dem Wert, z. B. nach Datum sortieren. Fürs Finden ist der Index da, docValues laufen andersherum: vom Dokument zum Wert.',
    'Kostet Platz auf der Platte. Geht nicht bei Text (TEXT_EDGE, TEXT_SUCHE).',
  ),
  required: explanation(
    'required: Pflicht in jedem Dokument',
    'Solr nimmt kein Dokument ohne diesen Wert an. Vorsicht beim Nachrüsten: Alte Dokumente ohne Wert lassen sich erst wieder schreiben, wenn sie den Wert bekommen.',
  ),
  suggestTwin: explanation(
    '+Suggest: ein Zwilling für die Vervollständigung beim Tippen',
    'Legt das Feld <name>Suggest an, Solr füllt es selbst per copyField mit den Wortanfängen. Darüber laufen Vorschläge beim Tippen, das Feld selbst bleibt exakt.',
    'Nur bei STRING, LONG und DOUBLE. Kostet Indexplatz, der Zwilling steht nicht in dieser Tabelle.',
  ),
  ngramTwin: explanation(
    '+Ngram: ein Zwilling, in dem jedes Wortstück trifft',
    'Legt das Feld <name>Ngram an: jedes Stück ab 3 Zeichen trifft, an jeder Stelle, „herst“ findet „Hersteller“. Solr füllt es selbst, das Feld selbst bleibt exakt.',
    'Nur bei STRING, TEXT_EDGE und TEXT_SUCHE. Kostet viel Indexplatz: je Wert alle seine Stücke.',
  ),
}

/** Die Erklärung eines Schalters fürs Hoverlay am Spaltenkopf. */
export function getSolrFieldSwitchHint(switchName: SolrFieldSwitchName): ReactNode {
  return SOLR_FIELD_SWITCH_HINTS[switchName]
}

export const SOLR_FIELD_CLIENT_VALUE_ACCEPTED_HINT = explanation(
  'vom Client: das Backend übernimmt einen Wert aus dem Frontend',
  'Angehakt: Schickt der Client beim Upload oder beim Bearbeiten der Metadaten einen Wert mit, nimmt das Backend ihn an, z. B. title, fileDescription, tags. Ein Kann, kein Muss: Ohne Wert bleibt das Feld leer.',
  'Nicht angehakt: Der Wert kommt nie vom Client, er fällt still weg. Herr der Information ist das Backend oder die Auswertung (Tika), z. B. mimeType, Bildmaße, EXIF.',
  'Sonderfälle im Code: fileName ist beim Upload immer der Name der hochgeladenen Datei und erst danach änderbar. Die FileClass wählt der Client beim Upload, beim Bearbeiten ist sie nie änderbar, ihr Wechsel ist ein eigener Vorgang. Neue Felder beginnen ohne Haken.',
)

export const SOLR_FIELD_SEARCH_WEIGHT_HINT = explanation(
  'Suche: das Gewicht in der Freitextsuche, -1 bis 10',
  '-1 (Strich): nicht durchsucht, die Suchwörter erreichen das Feld nicht. 0: durchsucht, aber ohne Punkte, ein Treffer zählt, ordnet aber nicht. 1 bis 10: der Faktor des Feldes, je höher, desto weiter oben stehen Treffer darin.',
  'Eingestellt per Schieberegler. Geht nur mit indexed: Nimmst du indexed raus, fällt das Gewicht auf -1.',
)

export const SOLR_FIELD_READER_HINT = explanation(
  'Wer liest: mit welchem Recht man das Feld bekommt',
  'Genau ein Recht. Wer es hat, bekommt das Feld in jeder Antwort, darf danach filtern und auflösen. Im Normalfall USER: dann bekommt es jeder, der die Datei sehen darf.',
  'niemand: kein User bekommt das Feld, nur das Backend nutzt es, z. B. sftpPath. Ob jemand die Datei überhaupt sieht, entscheiden ihre Leserollen, nicht diese Spalte.',
)

export const SOLR_FIELD_DESCRIPTION_HINT = explanation(
  'Beschreibung: wozu das Feld da ist',
  'Nur für Admins, damit man später noch weiß, was in dem Feld steht und wer es füllt.',
)
