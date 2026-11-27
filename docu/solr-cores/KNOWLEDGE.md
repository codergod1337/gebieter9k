# Solr-Kern KNOWLEDGE

> Von Hand geschrieben am 2026-11-27, zusammen mit dem Code (noch kein Export; der Kern hat seit dem 2026-11-27 eine Seite). Die Felder stehen in Postgres (`solr_field`, Solr-Manager). Nach dem ersten Export mit `docu/tools/generate_entity_docs.py` in einer KOPIE des Projekts abgleichen, nie im Projekt selbst laufen lassen.

Die Seiten der Wissensdatenbank („Mini-Wikipedia“: nur der Admin schreibt, alle dürfen lesen, auch ohne Anmeldung). **Ein Dokument = eine Seite in einer Sprache.** Die Gliederung (Rubrik, Kapitel, Unterkapitel mit Namen und Reihenfolge) steht in Postgres ([`KnowledgeSection`](../entities/KnowledgeSection.md)); im Dokument stehen nur die Keys. Konzept: [`konzept-wissensdatenbank.md`](../konzept-wissensdatenbank.md).

- **Kern:** `KNOWLEDGE` (`gebiter.knowledge.solr-core-key`, steht in `gebiter.solr.core-keys`; auf dem Pi in `SOLR_CORES` der `.env`, angelegt am 2026-11-27)
- **Feldnamen im Backend:** [`KnowledgeSolrFieldNames`](../../code/backend/src/main/java/de/gebiter/knowledge/KnowledgeSolrFieldNames.java) aus `gebiter.knowledge.field.*`
- **Service:** [`KnowledgePageService`](../../code/backend/src/main/java/de/gebiter/knowledge/service/KnowledgePageService.java), bei einer Key-Änderung der Gliederung [`KnowledgePageSectionKeyService`](../../code/backend/src/main/java/de/gebiter/knowledge/service/KnowledgePageSectionKeyService.java)
- **Frontend:** [`code/frontend/src/knowledge/`](../../code/frontend/src/knowledge/) (Modul `/wissen`)

## Keine Sonderlösung: Die Felder führt der Solr-Manager

Wie beim Kern FILE geht eine Seite als **Feld-Map** zum Client (jedes Feld unter seinem Solr-Namen) und kommt als Feld-Map zurück ([`SolrDocumentFieldService`](../../code/backend/src/main/java/de/gebiter/solr/service/SolrDocumentFieldService.java)):

- **Lesen:** Ein Leser bekommt die Felder, deren „Wer liest“ zu seinen Rechten passt. Ein Besucher **ohne Anmeldung** bekommt genau die Felder, deren „Wer liest“ auf **`ANY`** steht („Alle, auch ohne Anmeldung“, `gebiter.solr.reader-any-key`; kein Recht, sondern ein fester Wert, neu seit 2026-11-27).
- **Schreiben:** Übernommen werden nur Felder mit „vom Client“; alle anderen und unbekannte fallen still weg.
- Ein neues Feld im Solr-Manager geht damit ohne Änderung am Code mit. Der Service kennt nur die Felder, an denen Regeln hängen (siehe unten), und die, die das Backend selbst setzt: `id`, `pageGuid`, `listingPosition`, `contentFormatVersion`, `authorUsersGuid`, `createdAt`, `lastChangedAt`; die setzt der Client nie, gleich was bei „vom Client“ steht. `language` setzt er nur beim Anlegen.

## Felder

Stand 2026-11-27 (`solr_field` ids 44–61, dazu die Referenz `wtf`).

| Pos. | Feld | Typ | indexiert | gespeichert | mehrwertig | docValues | Pflicht | Suggest | NGram | vom Client | Suchgewicht | lesen ab | Anzeigename | Beschreibung |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | STRING | ja | ja |  | ja | ja |  |  |  | -1 | ANY | ID | Schlüssel des Dokuments: pageGuid, Unterstrich, Sprache (z. B. 3f2a…_de). Setzt das Backend. |
| 1 | `wtf` | STRING | ja | ja | ja | ja |  | ja |  | ja | 2 | (nur Backend) | WTF | Referenz, in jedem Kern von selbst: beliebige Markierungen an einem Dokument. |
| 2 | `pageGuid` | STRING | ja | ja |  | ja | ja |  |  |  | -1 | ANY | Seiten-GUID | Die Seite über alle Sprachen hinweg; ändert sich nie, auch nicht beim Verschieben. Setzt das Backend. |
| 3 | `language` | STRING | ja | ja |  | ja | ja |  |  | ja | -1 | ANY | Sprache | Sprache dieser Fassung der Seite, eine der aktiven Sprachen der Plattform, z. B. de. |
| 4 | `rubricKey` | STRING | ja | ja |  | ja | ja |  |  | ja | -1 | ANY | Rubrik | Key der Rubrik (Postgres, Tabelle knowledge_section), z. B. MATHE. |
| 5 | `chapterKey` | STRING | ja | ja |  | ja | ja |  |  | ja | -1 | ANY | Kapitel | Key des Kapitels in der Rubrik, z. B. GRUNDLAGEN. |
| 6 | `subChapterKey` | STRING | ja | ja |  | ja |  |  |  | ja | -1 | ANY | Unterkapitel | Key des Unterkapitels im Kapitel; fehlt, wenn die Seite direkt im Kapitel steht. |
| 7 | `pageKey` | STRING | ja | ja |  | ja | ja |  |  | ja | -1 | ANY | Seiten-Key | Die Seite in ihrer Adresse, z. B. KOORDINATENTRANSFORMATION für /wissen/mathe/grundlagen/koordinatentransformation. Eindeutig je Kapitel und Sprache. |
| 8 | `listingPosition` | LONG | ja | ja |  | ja |  |  |  |  | -1 | ANY | Platz | Reihenfolge der Seiten in ihrem Kapitel. Setzt das Backend. |
| 9 | `title` | TEXT_EDGE | ja | ja |  |  | ja |  | ja | ja | 5 | ANY | Titel | Überschrift der Seite, wird beim Tippen gefunden. |
| 10 | `summary` | TEXT_SUCHE | ja | ja |  |  |  |  |  | ja | 3 | ANY | Zusammenfassung | Ein Satz für die Übersicht des Kapitels und für Treffer der Suche. |
| 11 | `content` | STRING |  | ja |  |  | ja |  |  | ja | -1 | ANY | Inhalt | Die ganze Seite als ein langer JSON-Text aus Bausteinen (Text, Rechnungen, Skizzen). Nur gespeichert, wird nie durchsucht. |
| 12 | `contentFormatVersion` | LONG | ja | ja |  | ja |  |  |  |  | -1 | ANY | Format-Fassung | In welcher Fassung des Formats der Inhalt geschrieben ist. Setzt das Backend. |
| 13 | `tags` | STRING | ja | ja | ja | ja |  | ja |  | ja | 4 | ANY | Tags | Schlagwörter von Hand, ohne Raute, je Tag ein Wert. |
| 14 | `status` | STRING | ja | ja |  | ja | ja |  |  | ja | -1 | ADMIN | Status | DRAFT (Entwurf, nur der Admin sieht die Seite), PUBLISHED (veröffentlicht, alle sehen sie) oder DELETED (weich gelöscht). |
| 15 | `relatedPageGuids` | STRING | ja | ja | ja | ja |  |  |  | ja | -1 | ANY | Verweise | Siehe auch und baut auf: andere Seiten über ihre pageGuid. |
| 16 | `authorUsersGuid` | STRING | ja | ja |  | ja |  |  |  |  | -1 | ADMIN | Autor | GUID des Users, der die Seite angelegt hat. Setzt das Backend. |
| 17 | `createdAt` | DATE | ja | ja |  | ja |  |  |  |  | -1 | ANY | Angelegt am | Zeitpunkt des Anlegens. Setzt das Backend. |
| 18 | `lastChangedAt` | DATE | ja | ja |  | ja |  |  |  |  | -1 | ANY | Zuletzt geändert | Zeitpunkt der letzten Änderung. Setzt das Backend. |

Später, eigener Gang (Nutzer): die aus `content` aufbereiteten Schlagwörter für die Suche als eigenes Feld, das nur das Backend setzt.

## Beispiel-Dokument

So liefert `GET /api/share/knowledge-page/{id}` die Seite an einen Besucher ohne Anmeldung (ohne `status` und `authorUsersGuid`, die stehen auf ADMIN); Werte erfunden, `content` gekürzt:

```json
{
  "id": "01a21c9e-c15c-7f15-a81d-37160dbcaf16_de",
  "pageGuid": "01a21c9e-c15c-7f15-a81d-37160dbcaf16",
  "language": "de",
  "rubricKey": "MATHE",
  "chapterKey": "GRUNDLAGEN",
  "pageKey": "KOORDINATENTRANSFORMATION",
  "listingPosition": 1,
  "title": "Koordinatentransformation",
  "summary": "Kartesische Koordinaten und Polarkoordinaten ineinander umrechnen, jede Umformung einzeln.",
  "content": "{\"quantities\":{\"radius\":{\"symbol\":\"r\",\"highlight\":\"THIRD\"}},\"blocks\":[…]}",
  "contentFormatVersion": 1,
  "tags": ["polarkoordinaten", "pythagoras"],
  "createdAt": "2026-11-27T11:00:00Z",
  "lastChangedAt": "2026-11-27T11:00:00Z"
}
```

## Regeln

- **id** = `pageGuid` + `_` + `language`. Die englische Fassung einer Seite wäre ein zweites Dokument mit derselben `pageGuid`; das Anlegen einer zweiten Sprache ist noch nicht gebaut (aktiv ist nur `de`).
- **Platz in der Gliederung:** `rubricKey` und `chapterKey` sind Pflicht, `subChapterKey` freiwillig; den Punkt muss es in `knowledge_section` geben (400 sonst).
- **`pageKey`:** Key-Regel; eindeutig je Kapitel und Sprache (409 sonst), denn er steht in der Adresse. Eine weich gelöschte Seite hält ihren Key nicht fest.
- **Status:** `DRAFT`, `PUBLISHED`, `DELETED`; ohne Angabe `DRAFT`. Besucher sehen nur `PUBLISHED`. Ein endgültiges Löschen gibt es nicht.
- **`content`:** Pflicht, höchstens `gebiter.knowledge.content-max-characters` Zeichen, ein JSON-Objekt. Mehr prüft das Backend nicht; das Format liest das Frontend (unten).
- **Schlagwörter:** ohne Raute, ohne Doppelte. **Verweise:** müssen GUIDs sein; ob es die Seiten gibt, wird nicht geprüft.
- **Ändern:** nur die genannten Felder, ein leerer Wert nimmt das Feld heraus; geprüft wird der Stand, der sich ergibt. Wechselt die Seite das Kapitel, kommt sie dort ans Ende. Mit dem Inhalt wird `contentFormatVersion` neu gesetzt.
- **Keys sind änderbar:** Ändert sich der Key einer Rubrik, eines Kapitels oder eines Unterkapitels (`KnowledgeSectionService.changeKnowledgeSectionKey`), bekommen ZUERST alle Seiten darunter den neuen Key (Cursor durch den Kern, Pakete von `gebiter.knowledge.key-change-batch-size`), Postgres zuletzt. Bricht es ab, zieht derselbe Aufruf den Rest nach.

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/knowledge-page` | [`KnowledgePageAdminController.createKnowledgePage`](../../code/backend/src/main/java/de/gebiter/knowledge/controller/KnowledgePageAdminController.java) | `NewKnowledgePage` (`{"fieldValuesByFieldName": {…}}`), zurück die Seite als Feld-Map |
| GET | `/api/admin/knowledge-page/{knowledgePageId}` | `KnowledgePageAdminController.getKnowledgePage` | die Seite samt Inhalt, in jedem Status |
| POST | `/api/admin/knowledge-page/resolve` | `KnowledgePageAdminController.resolveKnowledgePages` | `KnowledgePageResolveRequest`, Liste der Seiten ohne Inhalt, in jedem Status |
| PUT | `/api/admin/knowledge-page` | `KnowledgePageAdminController.changeKnowledgePage` | `KnowledgePageChangeRequest` (`{"id": "…", "fieldValuesByFieldName": {…}}`), zurück die Seite |
| GET | `/api/share/knowledge-page/field-name-set` | [`KnowledgePageShareController.getKnowledgeSolrFieldNameSet`](../../code/backend/src/main/java/de/gebiter/knowledge/controller/KnowledgePageShareController.java) | `KnowledgeSolrFieldNameSet`: wie die Felder heißen |
| GET | `/api/share/knowledge-page/{knowledgePageId}` | `KnowledgePageShareController.getPublishedKnowledgePage` | eine veröffentlichte Seite samt Inhalt |
| POST | `/api/share/knowledge-page/resolve` | `KnowledgePageShareController.resolvePublishedKnowledgePages` | `KnowledgePageResolveRequest`, Liste der veröffentlichten Seiten ohne Inhalt |

`/api/admin/**` nur für ADMIN, `/api/share/**` ohne Token. Auflösen: exakte Sollwerte (`language`, `rubricKey`, `chapterKey`, `subChapterKey`, `pageKey`), ein fehlender Wert filtert nicht; sortiert nach `listingPosition`, höchstens `gebiter.knowledge.resolve-max-rows`. Antworten bei Fehlern: fehlender oder unpassender Wert, unbekanntes Kapitel, kein JSON 400; unbekannte id bzw. für Besucher nicht veröffentlicht 404; `pageKey` im Kapitel vergeben 409; Solr nicht erreichbar 503.

Beispiele: Anlegen `{"fieldValuesByFieldName": {"language": "de", "rubricKey": "MATHE", "chapterKey": "GRUNDLAGEN", "pageKey": "KOORDINATENTRANSFORMATION", "title": "Koordinatentransformation", "content": "{\"blocks\":[]}", "status": "PUBLISHED"}}`. Veröffentlichen `{"id": "…_de", "fieldValuesByFieldName": {"status": "PUBLISHED"}}`. Weich löschen `{"status": "DELETED"}`. Zusammenfassung herausnehmen `{"summary": ""}`. Alle Seiten eines Kapitels auflösen `{"language": "de", "rubricKey": "MATHE", "chapterKey": "GRUNDLAGEN"}`.

## Verwendung im Backend

- [`knowledge/KnowledgeSolrFieldNames.java`](../../code/backend/src/main/java/de/gebiter/knowledge/KnowledgeSolrFieldNames.java): die Feldnamen aus der YAML, `toKnowledgeSolrFieldNameSet`
- [`knowledge/service/KnowledgePageService.java`](../../code/backend/src/main/java/de/gebiter/knowledge/service/KnowledgePageService.java): `createKnowledgePage`, `getKnowledgeSolrFieldNameSet`, `getKnowledgePage`, `getPublishedKnowledgePage`, `resolveKnowledgePages`, `resolvePublishedKnowledgePages`, `changeKnowledgePage`
- [`knowledge/service/KnowledgePageSectionKeyService.java`](../../code/backend/src/main/java/de/gebiter/knowledge/service/KnowledgePageSectionKeyService.java): `changeSectionKeyOfKnowledgePages` (ruft nur der `KnowledgeSectionService`)
- [`knowledge/model/KnowledgePageStatus.java`](../../code/backend/src/main/java/de/gebiter/knowledge/model/KnowledgePageStatus.java), DTOs [`NewKnowledgePage`](../../code/backend/src/main/java/de/gebiter/knowledge/dto/NewKnowledgePage.java), [`KnowledgePageChangeRequest`](../../code/backend/src/main/java/de/gebiter/knowledge/dto/KnowledgePageChangeRequest.java), [`KnowledgePageResolveRequest`](../../code/backend/src/main/java/de/gebiter/knowledge/dto/KnowledgePageResolveRequest.java), [`KnowledgeSolrFieldNameSet`](../../code/backend/src/main/java/de/gebiter/knowledge/dto/KnowledgeSolrFieldNameSet.java)
- `application.yaml`: `gebiter.knowledge.*` (Kern, Fassung des Formats, Grenzen, Feldnamen), `gebiter.solr.reader-any-key`

## Verwendung im Frontend

- [`knowledge/page/KnowledgePageDocument.ts`](../../code/frontend/src/knowledge/page/KnowledgePageDocument.ts): `KnowledgePageDocument` (die Feld-Map), `KnowledgeSolrFieldNameSet`, `KnowledgePageResolveRequest`, `getKnowledgePageText`
- [`knowledge/page/useKnowledgePage.ts`](../../code/frontend/src/knowledge/page/useKnowledgePage.ts): `getKnowledgeSolrFieldNameSet`, `getPublishedKnowledgePage`, `resolvePublishedKnowledgePages`
- [`knowledge/Knowledge.tsx`](../../code/frontend/src/knowledge/Knowledge.tsx): lädt einmal Gliederung, Feldnamen und die Liste der veröffentlichten Seiten ohne Inhalt ([`KnowledgeBase.ts`](../../code/frontend/src/knowledge/KnowledgeBase.ts)); Reiter je Rubrik
- [`KnowledgeRubricPage.tsx`](../../code/frontend/src/knowledge/KnowledgeRubricPage.tsx), [`KnowledgeChapterPage.tsx`](../../code/frontend/src/knowledge/KnowledgeChapterPage.tsx), [`KnowledgeChapterBox.tsx`](../../code/frontend/src/knowledge/KnowledgeChapterBox.tsx): die Übersichten; [`KnowledgePageView.tsx`](../../code/frontend/src/knowledge/KnowledgePageView.tsx): holt die Seite und zeichnet ihren Inhalt
- [`knowledge/content/`](../../code/frontend/src/knowledge/content/): `KnowledgeContentReader` (JSON-Text → Bausteine), `KnowledgeContentView`, `KnowledgeBoxBlockView`, `KnowledgeSketchView`, `knowledgeContentFormat.ts` (die Fassung, die das Frontend lesen kann)
- Schreiben im Browser (Seiten im Wissensmanager, Editor) ist noch NICHT gebaut; Claude legt Seiten über die Admin-Endpunkte unter dem Konto des Nutzers an.

## Format des Inhalts (`content`, Fassung 1)

Ein JSON-Objekt. Texte stehen in der Sprache der Seite.

```json
{
  "quantities": { "radius": { "symbol": "r", "highlight": "THIRD" }, "angle": { "symbol": "φ", "highlight": "FOURTH" } },
  "blocks": [
    { "type": "BOX", "title": "Worum es geht",
      "parts": [ { "type": "PARAGRAPH", "text": "…" } ],
      "sketch": { "width": 340, "height": 280, "originX": 52, "originY": 228, "unitLength": 48,
                  "axisMaxX": 5.6, "axisMaxY": 4.3, "description": "…", "elements": [ … ] } },
    { "type": "DERIVATION", "key": "xCoordinate", "title": "x aus r und φ",
      "steps": [
        { "equation": { "left": TERM, "right": TERM }, "explanation": "Woher der Ausgang kommt." },
        { "operation": { "notation": "·", "operand": TERM, "applies": ["radiusFactor"], "cancels": [] },
          "equation": { "left": TERM, "right": TERM } }
      ] },
    { "type": "BOX", "title": "Zusammenfassung",
      "parts": [ { "type": "EQUATIONS", "heading": "Von polar nach kartesisch", "equations": [ { "resultOf": "xCoordinate" } ] },
                 { "type": "HINT", "text": "…" } ] }
  ]
}
```

- **`quantities`** (freiwillig): die Größen der Seite, je Kennung ihr Zeichen und ihre Farbe (`FIRST` bis `FIFTH` oder keine). Eine Größe trägt auf der ganzen Seite dieselbe Farbe, in den Formeln und in der Skizze.
- **`BOX`**: ein Kasten mit `title` und `parts` von oben nach unten: `PARAGRAPH` (`text`), `EQUATIONS` (`heading` freiwillig, `equations`; Gruppen, die aufeinander folgen, stehen nebeneinander), `HINT` (`text`). Mit `sketch` steht die Skizze neben den Teilen.
- **`DERIVATION`**: eine Rechnung mit `key` (eindeutig auf der Seite; steht als `<key>Path=shown` in der Adresse), `title` und `steps`. Der erste Schritt ist der Ausgang, der letzte das Ergebnis; jeder weitere hat die `operation`, die ihn aus dem davor macht: `notation` (das hinter dem Strich, z. B. `·`, `kürzen`), freiwillig `operand` (ein Term), `applies` (Kennungen der Terme der NEUEN Zeile, die die Umformung bringt) und `cancels` (Kennungen der Terme der Zeile DAVOR, die sie kürzt). `explanation` nur, wo sie nötig ist (Nutzer 2026-11-27: „nicht ausformulieren“).
- **Gleichung**: `{"left": TERM, "right": TERM}` oder `{"resultOf": "<key einer Rechnung>"}` (ihr Ergebnis).
- **TERM**, ein Baum mit `type`: `QUANTITY` (`key`), `SYMBOL` (`text`), `NUMBER` (`text`), `SUM` (`terms`), `PRODUCT` (`factors`), `FRACTION` (`numerator`, `denominator`), `POWER` (`base`, `exponent`), `ROOT` (`radicand`), `FUNCTION` (`name`, `argument`), `GROUP` (`term`, Klammern). Eine `mark` (`{"key": "…", "highlight": "FIFTH" | null}`) macht einen Term über die Zeilen hinweg verfolgbar: dieselbe Kennung in zwei Zeilen ist derselbe Term. Bei `ROOT` gilt sie dem Wurzelzeichen, bei `FUNCTION` dem Namen. Eine `QUANTITY` trägt ihre Kennung von selbst.
- **Skizze**: das Feld (`width`, `height`), das Achsenkreuz (`originX`, `originY`, `unitLength`: wo der Nullpunkt liegt und wie lang die Strecke von 0 bis 1 ist; `axisMaxX`, `axisMaxY`), `description` für Screenreader und `elements` in Zeichenreihenfolge: `POINT` (`position`, freiwillig `label`, `hintName`, `hintDetail`), `SEGMENT` (`from`, `to`, `label`, `labelSide` `LEFT`/`RIGHT`, freiwillig `quantity` für die Farbe), `ANGLE` (`vertex`, `firstLegEnd`, `secondLegEnd`, `label`, `hint`, freiwillig `quantity`), `RIGHT_ANGLE` (`vertex`, `firstLegEnd`, `secondLegEnd`). Positionen als `{"x": 4, "y": 3}` in den Einheiten des Achsenkreuzes.
- Passt etwas nicht, zeigt die Seite statt des Inhalts die Stelle, z. B. „blocks[0].parts[0].type: unbekannter Teil "FOO"“. Eine höhere `contentFormatVersion`, als das Frontend kennt, zeigt den Hinweis, neu zu laden.

## Getestet

2026-11-27, Backend gegen das echte Solr des Pi (Wegwerf-Test in einer Wegwerf-Rubrik `ZZWEGWERF`, Postgres mit Rollback, die Dokumente danach gelöscht; nachgezählt: Kern wieder leer):

- anlegen: ohne Status ein Entwurf; Schlagwörter `#polar, polar, " pythagoras "` → `polar, pythagoras`; Autor, Zeitpunkte, Platz 1, 2, 3; `id`, `pageGuid`, Autor und Platz lassen sich vom Client nicht setzen, ein unbekanntes Feld fällt weg;
- abgelehnt: derselbe `pageKey` im Kapitel (409), kein JSON, eine JSON-Liste, unbekanntes Kapitel oder Unterkapitel, ungültiger Key, leerer Titel, Sprache `en`, Verweis ohne GUID, unbekannter Status, falscher Typ, unbekannte id (404);
- Besucher ohne Anmeldung: nur Veröffentlichtes, Titel und Inhalt ja, `status` und `authorUsersGuid` nein, Listen ohne Inhalt; im Kern FILE ist ohne Anmeldung weiter kein Feld lesbar;
- ändern: nur genannte Felder (veröffentlichen, Titel, Inhalt), leer nimmt heraus (`summary`, `tags`), Sprache und Autor bleiben; ein Stand ohne Titel, mit kaputtem Inhalt oder fremdem Kapitel wird abgelehnt; umbenennen auf einen vergebenen `pageKey` 409; verschieben in ein anderes Kapitel → dort Platz 1;
- Key-Änderung: Kapitel zieht 2 Seiten nach, Unterkapitel 1, Rubrik 3;
- weich löschen: für Besucher weg, der `pageKey` ist wieder frei;
- Rechte: ohne Anmeldung und mit Rolle USER kein Schreiben und kein Admin-Lesen.

2026-11-27, Frontend: Typprüfung und Bau ohne Fehler; im Firefox ohne Fenster gegen ein nachgestelltes Backend: `/wissen` → erste Rubrik, Reiter je Rubrik, Kapitel mit Seiten (Unterkapitel als Zwischenüberschrift), die Seite „Koordinatentransformation“ aus ihrem Dokument (Skizze, vier Rechnungen, Zusammenfassung), leere und unbekannte Rubrik, unbekannte Seite, eine Seite mit kaputtem Inhalt.

2026-11-27, auf dem Pi (Stand `a8f5df2`), über HTTP: angemeldet unter dem Konto des Nutzers `POST /api/admin/knowledge-page/resolve` 200 (leer), `POST /api/admin/knowledge-page` 201 (die Seite „Koordinatentransformation“, `01a21cbe-11d0-7889-ad8d-b0bb58994255_de`, Rubrik `MATHE`, Kapitel `GRUNDLAGEN`, veröffentlicht, Inhalt 10 386 Zeichen), dieselbe Seite noch einmal 409, `GET /api/admin/knowledge-page/{id}` 200 mit `status` und `authorUsersGuid`; ohne Anmeldung `GET /api/share/knowledge-page/{id}` 200 ohne diese beiden Felder, Inhalt Zeichen für Zeichen gleich, `POST /api/share/knowledge-page/resolve` 200 mit der Seite ohne Inhalt, `GET …/field-name-set` 200, `PUT` und `POST` unter `/api/admin/knowledge-page` ohne Anmeldung 401. Im Firefox ohne Fenster, ohne Anmeldung: Login-Seite → Kachel „Wissensdatenbank“ → `/wissen/mathe` (Reiter „Mathe“, Kasten „Grundlagen“ mit der Seite) → `/wissen/mathe/grundlagen/koordinatentransformation` aus dem Dokument: 6 Kästen, Skizze mit 0, 1, 1, drei Punkten, Winkel und rechtem Winkel, 4 Rechnungen; Rechenweg einblenden, nach „√“ kein Strich, nach „hebt sich auf“ zwei; keine Fehler.

NICHT geprüft: `PUT /api/admin/knowledge-page` über HTTP (das Ändern ist nur über den Service getestet) und der Solr-Manager mit dem Kern und der Auswahl „Alle, auch ohne Anmeldung“ im Browser.
