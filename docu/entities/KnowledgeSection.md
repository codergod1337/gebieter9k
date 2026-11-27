# KnowledgeSection

> Von Hand im Format von `docu/tools/generate_entity_docs.py` geschrieben (2026-11-27), zusammen mit dem Code. Der Generator überschreibt die Datei beim nächsten Lauf.

Ein Punkt der Gliederung der Wissensdatenbank (Nutzer 2026-11-27: „das mapping der ganzen keys zum anzeigetext in postgres“): eine Rubrik, ein Kapitel in einer Rubrik oder ein Unterkapitel in einem Kapitel, mit seinem Anzeigenamen und seinem Platz. Die Seiten selbst kommen in den Solr-Kern der Wissensdatenbank und tragen dort nur die Keys (`rubricKey`, `chapterKey`, `subChapterKey`); wie der Kern aussehen soll, steht in [`konzept-wissensdatenbank.md`](../konzept-wissensdatenbank.md), Abschnitt 3c.

- **Tabelle:** `knowledge_section`
- **Klasse:** [`code/backend/src/main/java/de/gebiter/knowledge/model/KnowledgeSection.java`](../../code/backend/src/main/java/de/gebiter/knowledge/model/KnowledgeSection.java)
- **Frontend-Typ:** [`code/frontend/src/knowledge/section/KnowledgeSection.ts`](../../code/frontend/src/knowledge/section/KnowledgeSection.ts)
- **DTOs:** `KnowledgeSectionListingOrder` (die neue Reihenfolge von Geschwistern), `KnowledgeSectionKeyChange` (der neue Key eines Punkts)

## Regeln

- **Welche Ebene ein Punkt ist, sagen seine Keys:** nur `rubricKey` = Rubrik; dazu `chapterKey` = Kapitel in dieser Rubrik; dazu `subChapterKey` = Unterkapitel in diesem Kapitel. Mehr Ebenen gibt es nicht.
- Die drei Keys zusammen gibt es genau einmal. Derselbe `chapterKey` darf in zwei Rubriken stehen (Mathe → Grundlagen und Physik → Grundlagen). Das prüft der Service, nicht die Datenbank: Postgres hält zwei leere Werte in einer Eindeutigkeitsregel für verschieden.
- Den Punkt darüber muss es geben, bevor einer darunter entsteht: erst die Rubrik, dann ihr Kapitel, dann dessen Unterkapitel.
- Anlegen, ändern und sortieren darf nur der Admin. **Lesen darf jeder, auch ohne Anmeldung:** Die Wissensdatenbank ist öffentlich zum Ansehen, ein Besucher braucht die Namen.
- **Auch die Keys sind änderbar** (Nutzer 2026-11-27: „wir können doch keys ändern, wenn wir direkt nach einer änderung […] durch alle wissensdokumente cursoriterieren und den jeweiligen key ändern“). Wer den Key einer Rubrik ändert, ändert ihn in allen ihren Kapiteln und Unterkapiteln mit; beim Kapitel in seinen Unterkapiteln. Alle Zeilen ändern sich in einer Transaktion. Unter den Geschwistern muss der neue Key frei sein.
- **Die Seiten im Solr-Kern werden dabei nachgezogen, sobald es den Kern gibt** (heute gibt es weder Kern noch Seiten). Postgres und Solr teilen keine Transaktion; deshalb in der Reihenfolge der Plattform: erst alle Dokumente mit dem alten Key per Cursor ändern, Postgres zuletzt. Bricht es mittendrin ab, steht in Postgres noch der alte Key, und derselbe Aufruf zieht den Rest nach.
- Der Anzeigename und der Platz haben je ihren eigenen Weg: umbenennen, bzw. die Reihenfolge der Geschwister.
- Ein neuer Punkt landet am Ende seiner Geschwister (Rubriken unter sich, Kapitel in ihrer Rubrik, Unterkapitel in ihrem Kapitel).
- **Löschen gibt es noch nicht.** Sobald Seiten im Kern auf die Keys zeigen, wird vorher geklärt, was dann mit ihnen geschieht.

Beispiel: Der Admin legt die Rubrik `MATHE` „Mathe“ an, darin das Kapitel `GRUNDLAGEN` „Grundlagen“, darin das Unterkapitel `KOORDINATEN` „Koordinaten“. Danach die Rubrik `PHYSIK` „Physik“ (Platz 2 unter den Rubriken) mit ihrem eigenen Kapitel `GRUNDLAGEN`. Eine Seite „Koordinatentransformation“ trägt später im Kern `rubricKey` = `MATHE`, `chapterKey` = `GRUNDLAGEN`, `subChapterKey` = `KOORDINATEN`; benennt der Admin „Mathe“ in „Mathematik“ um, ändert sich nur diese eine Zeile hier.

## Beispiel-JSON

Aus den Feldern mit Getter; die Werte sind erfunden. Ein Kapitel:

```json
{
  "id": 2,
  "rubricKey": "MATHE",
  "chapterKey": "GRUNDLAGEN",
  "subChapterKey": null,
  "displayName": {
    "de": "Grundlagen"
  },
  "listingPosition": 1
}
```

Anlegen einer Rubrik: `{"rubricKey": "MATHE", "displayName": {"de": "Mathe"}}`; eines Kapitels zusätzlich `"chapterKey": "GRUNDLAGEN"`; eines Unterkapitels zusätzlich `"subChapterKey": "KOORDINATEN"`. Umbenennen: `{"id": 2, "displayName": {"de": "Grundlagen der Mathematik"}}`. Key ändern: `{"knowledgeSectionId": 2, "key": "BASICS"}`. Reihenfolge: `{"knowledgeSectionIdsInOrder": [5, 2]}` (alle Geschwister, von oben nach unten).

## Felder

| Feld | Typ | Spalte | im JSON | Bedeutung |
|---|---|---|---|---|
| `id` | `Long` | Primärschlüssel, von der Datenbank vergeben | ja | Die Zeile; über sie wird geändert und sortiert. |
| `rubricKey` | `String` | Pflicht, max. 100 Zeichen, Spalte `rubric_key` | ja | Der Key der Rubrik, Key-Regel, z. B. `MATHE`. Bei einer Rubrik ihr eigener, sonst der ihrer Rubrik. |
| `chapterKey` | `String` | max. 100 Zeichen, Spalte `chapter_key` | ja | Der Key des Kapitels, Key-Regel, z. B. `GRUNDLAGEN`; eindeutig in seiner Rubrik. `null` bei einer Rubrik. |
| `subChapterKey` | `String` | max. 100 Zeichen, Spalte `sub_chapter_key` | ja | Der Key des Unterkapitels, Key-Regel, z. B. `KOORDINATEN`; eindeutig in seinem Kapitel. `null` bei einer Rubrik und bei einem Kapitel. |
| `displayName` | `Map<String, String>` | Pflicht, jsonb | ja | Mehrsprachiger Anzeigename, z. B. `{"de": "Grundlagen"}`. |
| `listingPosition` | `int` | Pflicht | ja | Platz unter den Geschwistern, ab 1. |

## Endpunkte

| Methode | Pfad | Controller | überträgt |
|---|---|---|---|
| POST | `/api/admin/knowledge-section` | [`KnowledgeSectionAdminController.createKnowledgeSection`](../../code/backend/src/main/java/de/gebiter/knowledge/controller/KnowledgeSectionAdminController.java) | `KnowledgeSection` |
| GET | `/api/admin/knowledge-section/{knowledgeSectionId}` | [`KnowledgeSectionAdminController.getKnowledgeSection`](../../code/backend/src/main/java/de/gebiter/knowledge/controller/KnowledgeSectionAdminController.java) | `KnowledgeSection` |
| GET | `/api/share/knowledge-section` | [`KnowledgeSectionShareController.getAllKnowledgeSection`](../../code/backend/src/main/java/de/gebiter/knowledge/controller/KnowledgeSectionShareController.java) | Liste von `KnowledgeSection` |
| PUT | `/api/admin/knowledge-section` | [`KnowledgeSectionAdminController.changeKnowledgeSection`](../../code/backend/src/main/java/de/gebiter/knowledge/controller/KnowledgeSectionAdminController.java) | `KnowledgeSection` |
| PUT | `/api/admin/knowledge-section/key` | [`KnowledgeSectionAdminController.changeKnowledgeSectionKey`](../../code/backend/src/main/java/de/gebiter/knowledge/controller/KnowledgeSectionAdminController.java) | `KnowledgeSectionKeyChange`, Liste von `KnowledgeSection` |
| PUT | `/api/admin/knowledge-section/listing-position` | [`KnowledgeSectionAdminController.changeKnowledgeSectionListingPositions`](../../code/backend/src/main/java/de/gebiter/knowledge/controller/KnowledgeSectionAdminController.java) | `KnowledgeSectionListingOrder`, Liste von `KnowledgeSection` |

`/api/admin/**` nur für ADMIN, `/api/share/knowledge-section` ohne Token. Antworten bei Fehlern: Key gegen die Key-Regel, fehlender Name, Unterkapitel ohne Kapitel, unbekannte Rubrik bzw. unbekanntes Kapitel darüber 400, unbekannte id 404, Punkt schon vorhanden bzw. neuer Key unter den Geschwistern schon vergeben 409, Reihenfolge, die nicht genau die Geschwister nennt, 400.

## Verwendung im Backend

- [`code/backend/src/main/java/de/gebiter/knowledge/repository/KnowledgeSectionRepository.java`](../../code/backend/src/main/java/de/gebiter/knowledge/repository/KnowledgeSectionRepository.java): `findAllByOrderByListingPositionAscIdAsc`
- [`code/backend/src/main/java/de/gebiter/knowledge/service/KnowledgeSectionService.java`](../../code/backend/src/main/java/de/gebiter/knowledge/service/KnowledgeSectionService.java): `createKnowledgeSection`, `getAllKnowledgeSection` (für jeden, ohne Anmeldung), `getKnowledgeSection`, `changeKnowledgeSection`, `changeKnowledgeSectionKey`, `changeKnowledgeSectionListingPositions`, `requireExistingParent`, `findKnowledgeSection`, `findSiblings`, `describeKnowledgeSection`, `doGetKnowledgeSection`. Die Tabelle ist klein: Der Service liest sie ganz und sucht darin selbst.
- [`code/backend/src/main/java/de/gebiter/knowledge/controller/KnowledgeSectionAdminController.java`](../../code/backend/src/main/java/de/gebiter/knowledge/controller/KnowledgeSectionAdminController.java): `createKnowledgeSection`, `getKnowledgeSection`, `changeKnowledgeSection`, `changeKnowledgeSectionKey`, `changeKnowledgeSectionListingPositions`
- [`code/backend/src/main/java/de/gebiter/knowledge/controller/KnowledgeSectionShareController.java`](../../code/backend/src/main/java/de/gebiter/knowledge/controller/KnowledgeSectionShareController.java): `getAllKnowledgeSection`
- [`code/backend/src/main/java/de/gebiter/knowledge/dto/KnowledgeSectionListingOrder.java`](../../code/backend/src/main/java/de/gebiter/knowledge/dto/KnowledgeSectionListingOrder.java): der Body der neuen Reihenfolge
- [`code/backend/src/main/java/de/gebiter/knowledge/dto/KnowledgeSectionKeyChange.java`](../../code/backend/src/main/java/de/gebiter/knowledge/dto/KnowledgeSectionKeyChange.java): der Body des neuen Keys

## Verwendung im Frontend

- [`code/frontend/src/knowledge/section/KnowledgeSection.ts`](../../code/frontend/src/knowledge/section/KnowledgeSection.ts): die Typen `KnowledgeSection`, `NewKnowledgeSection` (Body beim Anlegen), `KnowledgeSectionLevel`
- [`code/frontend/src/knowledge/section/useKnowledgeSection.ts`](../../code/frontend/src/knowledge/section/useKnowledgeSection.ts): `useKnowledgeSection`, `createKnowledgeSection`, `getKnowledgeSection`, `getAllKnowledgeSection`, `changeKnowledgeSection`, `changeKnowledgeSectionKey`, `changeKnowledgeSectionListingPositions`
- [`code/frontend/src/knowledge/section/knowledgeSectionTree.ts`](../../code/frontend/src/knowledge/section/knowledgeSectionTree.ts): `getKnowledgeRubrics`, `getKnowledgeChapters`, `getKnowledgeSubChapters`: je Ebene die Punkte aus der einen Liste
- [`code/frontend/src/masterdata/MasterDataStore.ts`](../../code/frontend/src/masterdata/MasterDataStore.ts), [`useMasterData.ts`](../../code/frontend/src/masterdata/useMasterData.ts): die Gliederung als Stammdaten (`knowledgeSections`), geladen mit allen anderen nach der Anmeldung über `/api/share/knowledge-section`
- [`code/frontend/src/knowledgemanager/section/KnowledgeSectionTab.tsx`](../../code/frontend/src/knowledgemanager/section/KnowledgeSectionTab.tsx): `KnowledgeSectionTab`, `selectRubric`, `selectChapter`, `followChangedRubricKey`, `followChangedChapterKey` (führen die Wahl in der Adresse nach, wenn sich der Key des gewählten Punkts ändert), `countChaptersOfRubric`, `countSubChaptersOfChapter`; Reiter „Gliederung“ im Modul „Wissensmanager“ (`/knowledge-manager/section`, nur ADMIN): drei Boxen untereinander (Rubriken, Kapitel der gewählten Rubrik, Unterkapitel des gewählten Kapitels), die Wahl steht in der Adresse (`?rubric=MATHE&chapter=GRUNDLAGEN`); nach jeder Änderung lädt er die Stammdaten neu
- [`code/frontend/src/knowledgemanager/section/KnowledgeSectionLevelBox.tsx`](../../code/frontend/src/knowledgemanager/section/KnowledgeSectionLevelBox.tsx): `KnowledgeSectionLevelBox`, `saveKnowledgeSectionOrder`, `getOwnKey`, `createNewKnowledgeSection`, `handleCreateKnowledgeSection`, `handleSaveDisplayName`, `handleSaveKey`, `renderKeyCell`, `renderDisplayNameCell`, `getRowClassName`; eine Ebene als ContentBox mit der zentralen Tabelle (`TABLE_KNOWLEDGE_RUBRIC`, `TABLE_KNOWLEDGE_CHAPTER`, `TABLE_KNOWLEDGE_SUB_CHAPTER`): Klick auf den Namen öffnet `EditDisplayNamePopup`, Klick auf den Key `EditTextPopup`, der Knopf oben rechts `NewKeyDisplayNamePopup`, die Reihenfolge ändert sich am Griff links, der Knopf „Darin“ zeigt die Punkte darunter
- [`code/frontend/src/knowledgemanager/section/knowledgeSectionTexts.ts`](../../code/frontend/src/knowledgemanager/section/knowledgeSectionTexts.ts): alle Texte des Reiters, je Ebene ein Satz Texte
- [`code/frontend/src/knowledgemanager/KnowledgeManager.tsx`](../../code/frontend/src/knowledgemanager/KnowledgeManager.tsx): das Modul mit dem Reiter; Kachel in [`home/homeTiles.ts`](../../code/frontend/src/home/homeTiles.ts), Route in [`App.tsx`](../../code/frontend/src/App.tsx)

- [`code/frontend/src/knowledge/Knowledge.tsx`](../../code/frontend/src/knowledge/Knowledge.tsx) (seit 2026-11-27): das öffentliche Modul `/wissen` lädt die Gliederung selbst, ohne Anmeldung: je Rubrik ein Reiter, je Kapitel ein Kasten mit seinen Seiten, Unterkapitel als Zwischenüberschrift ([`KnowledgeRubricPage.tsx`](../../code/frontend/src/knowledge/KnowledgeRubricPage.tsx), [`KnowledgeChapterBox.tsx`](../../code/frontend/src/knowledge/KnowledgeChapterBox.tsx), [`knowledgePaths.ts`](../../code/frontend/src/knowledge/knowledgePaths.ts): `findKnowledgeRubric`, `findKnowledgeChapter`)

**Seiten im Solr-Kern (seit 2026-11-27):** Die Seiten tragen `rubricKey`, `chapterKey`, `subChapterKey` als Felder ([`solr-cores/KNOWLEDGE.md`](../solr-cores/KNOWLEDGE.md)). `KnowledgeSectionService.changeKnowledgeSectionKey` zieht deshalb ZUERST alle Seiten unter dem Punkt nach ([`KnowledgePageSectionKeyService.changeSectionKeyOfKnowledgePages`](../../code/backend/src/main/java/de/gebiter/knowledge/service/KnowledgePageSectionKeyService.java), Cursor durch den Kern) und ändert Postgres zuletzt; antwortet Solr nicht (503), ändert sich nichts. `requireExistingKnowledgeSection` prüft für den `KnowledgePageService`, dass es das Kapitel bzw. Unterkapitel einer Seite gibt.

## Getestet

2026-11-27, auf dem Pi über HTTP, angemeldet unter dem Konto des Nutzers: `POST /api/admin/knowledge-section` zweimal 201 (Rubrik `MATHE` „Mathe“ id 5, Kapitel `GRUNDLAGEN` „Grundlagen“ id 6), derselbe Rubrik-Key noch einmal 409; ohne Anmeldung gelesen: beide Zeilen da. Das sind die ersten echten Zeilen.

2026-11-27, Key-Änderung mit Seiten im Kern (Wegwerf-Test gegen das echte Solr, Rollback): Kapitel zieht 2 Seiten nach, Unterkapitel 1, Rubrik 3.

2026-11-27, Backend: `./mvnw -q -o -DskipTests clean compile` ohne Fehler; Kontextstart `Gebiter9kApplicationTests` gegen die Pi-DB grün. Dabei hat Hibernate die Tabelle `knowledge_section` angelegt (sechs Spalten wie oben, nur der Primärschlüssel).

2026-11-27, Service gegen die Pi-DB, in einer Transaktion mit Rollback (Wegwerf-Test, danach gelöscht; nachgezählt: 0 Zeilen):

- anlegen auf allen drei Ebenen (Rubrik `ZZWEGWERF`, Kapitel `KAPITELA` und `KAPITELB`, Unterkapitel `UNTER`); die Kapitel bekommen Platz 1 und 2;
- abgelehnt: derselbe Key noch einmal (Rubrik und Kapitel, `DuplicateKeyException`), ein ungültiger Key (`zz klein`), ein Kapitel in einer Rubrik, die es nicht gibt, ein Unterkapitel ohne Kapitel oder in einem Kapitel, das es nicht gibt, ein leerer Anzeigename, eine unbekannte id (`EntityNotFoundException`);
- umbenennen: Keys und Platz bleiben stehen;
- Reihenfolge: zwei Kapitel tauschen; eine unvollständige Liste und eine Liste mit einer fremden id werden abgelehnt;
- Key ändern: Kapitel `KAPITELA` → `KAPITELX` zieht sein Unterkapitel nach, das andere Kapitel bleibt; ein schon vergebener oder ungültiger Key wird abgelehnt; Rubrik `ZZWEGWERF` → `ZZWEGWERFNEU` ändert alle vier Zeilen; Unterkapitel `UNTER` → `UNTERNEU`;
- Rechte: ohne Anmeldung geht `getAllKnowledgeSection`, anlegen nicht; mit der Rolle USER geht Key ändern nicht.

2026-11-27, auf dem Pi (Stand `7453d7d`), von außen: `GET /api/share/knowledge-section` ohne Anmeldung 200 mit `[]`; GET, POST und PUT unter `/api/admin/knowledge-section` ohne Anmeldung 401; angemeldet als ADMIN `GET /api/admin/knowledge-section/1` → 404 (durchgelassen, die Zeile gibt es nicht). Über die Controller ist noch NICHTS angelegt, geändert oder umsortiert worden: Die Schreib-Endpunkte selbst (Body, Statuscodes) sind nur über den Service geprüft, nicht über HTTP.

2026-11-27, Frontend: Typprüfung und Bau ohne Fehler; im Firefox ohne Fenster gegen ein nachgestelltes Backend durchgeklickt: Kachel „Wissensmanager“, zwei Rubriken anlegen, „Darin“ wählt die Rubrik (`?rubric=MATHE`), zwei Kapitel anlegen, Kapitel wählen, Unterkapitel anlegen; denselben Key noch einmal → die Meldung bleibt im Popup; umbenennen; andere Rubrik wählen; „Zurück“ im Browser; Reihenfolge der Rubriken am Griff tauschen. Dazu das Ändern der Keys: Rubrik `MATHE` → `MATHEMATIK` (ihre zwei Kapitel bleiben bei ihr, die Adresse nennt den neuen Key), Kapitel `GRUNDLAGEN` → `BASICS`, Unterkapitel `KOORDINATEN` → `KOORDINATENSYSTEME`, ein schon vergebener Key → die Meldung bleibt im Popup.
