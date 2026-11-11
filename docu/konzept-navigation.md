# Konzept: Navigation, Zurück und Zustand in der Adresse

Stand 2026-11-09, gebaut und auf dem Pi 5. Vorgabe des Nutzers am selben Tag:

- In jeder Unterseite ein Zurück-Knopf zum Modul, aus dem man kam.
- Zurück aus einem Treffer zeigt die zwischengespeicherte Ansicht.
- Vor und Zurück im Browser funktionieren.
- Jeder Zustand steht als Parameter in der Adresse, damit er sich sicher wiederherstellen lässt.
- Das gilt für jedes neue Modul.

## 1. Die vier Bausteine (Paket `navigation/`)

| Baustein | Datei | Was |
|---|---|---|
| Origin | `origin.ts`, `useOrigin.ts`, `OriginBackButton.tsx` | Woher man kam. Er reist als Router-State mit, der Header zeigt „Zurück zu <Name>“. |
| Zustand in der Adresse | `useUrlParam.ts`, `useUrlTextParam.ts` | Seite, Filter, Auswahl und Suchtext als Parameter (`?fileClass=FOTO&page=2`). |
| Ansichts-Cache | `viewCache.ts`, `useCachedLoadedData.ts`, `useSessionState.ts` | Geladene Listen bleiben im Speicher. Zurück zeigt sie sofort, ohne Request. |
| Scroll-Gedächtnis | `ScrollMemory.tsx` | Die Scrollhöhe je Eintrag im Verlauf. Zurück landet an derselben Stelle. |

## 2. Was aus der Vorlage kommt und was besser ist

- **Origin wie in der Vorlage** (`components/Origin.ts`): `path`, `label` und die Kette über `state`, damit man Schritt
  für Schritt zurückkommt. Höchstens 10 Stufen.
- **Besser 1: Zurück springt im Verlauf.**
  - Die Vorlage legt beim Klick auf „Zurück zu …“ einen neuen Eintrag an. Danach führt der Zurück-Knopf des Browsers
    wieder in die Unterseite.
  - Bei uns merkt sich der Origin den Platz der Seite im Verlauf (`historyIndex`, das `idx` von React Router 8).
    „Zurück zu …“ springt genau dorthin. Der Knopf im Header und der des Browsers sind dasselbe.
  - Ohne Platz, etwa bei kaputtem State, öffnet er die Adresse des Origins.
- **Besser 2: Der Origin trägt die Parameter.** `path` ist die Adresse samt Parametern, nicht nur der Pfad.
- **Besser 3: Der Origin bleibt beim Ändern der Parameter.** In der Vorlage fiel der Router-State beim Nachführen der
  Adresse weg, bei uns gibt `useUrlParamsChanger` ihn immer mit.
- **Besser 4: Das Scroll-Gedächtnis arbeitet je Eintrag im Verlauf** (`location.key`), wie der Browser selbst.
  - Die Vorlage merkte sich die Höhe je Routenmuster in den UsersSettings. Ein neuer Link landete dort mitten in der
    Seite.
  - Bei uns gilt:
    - Zurück und Vor stellen die Höhe wieder her.
    - Ein neuer Link auf eine andere Seite fängt oben an.
    - Ändern sich nur die Parameter derselben Seite (Blättern, Filter), bleibt die Höhe. Wohin es dann geht, entscheidet
      die Seite; das Gästebuch etwa rollt an seinen Anfang.
    - Ein ersetzter Eintrag (Tippen) bleibt stehen.
  - Gespeichert wird im sessionStorage des Tabs. Das übersteht ein Neuladen, nicht aber das Schließen des Tabs. Lädt
    eine Seite noch nach, holt es den Sprung bis zu 2 s lang nach, wie in der Vorlage.
- **Besser 5: Der Ansichts-Cache gilt allgemein** statt nur für die Suche. Er wird je Bereich geleert (z. B.
  `FILE_DOCUMENT`), und zwar zentral im API-Hook nach jedem erfolgreichen Schreiben, damit keine Stelle es vergisst.
  Beim Abmelden wird er ganz geleert.

## 3. Regeln für jedes Modul

1. **Tabs im Subheader** geben keinen Origin mit, sie sind der Anfang.
2. **Eine Unterseite öffnen** (Datei, Bearbeiten, später Treffer der Suche, Profil eines anderen Users):
   - Die öffnende Seite gibt den State mit: `const originState = originNavigation.createOriginStateHere('<Name>')`.
   - Das geht als `navigate(pfad, { state: originState })` oder als `<Link to={pfad} state={originState}>`.
   - Der Name ist der des Tabs oder der Seite, z. B. „Dateien“, „Hochladen“, „User“ oder der Dateiname.
3. **In der Unterseite zurück** über `originNavigation.goBackToOrigin('<Tab-Pfad>')`:
   - bei Abbrechen, nach dem Speichern und nach dem Löschen;
   - der Tab-Pfad gilt nur, wenn kein Origin da ist (direkt aufgerufene Adresse).
4. **Jeder Zustand der Ansicht steht in der Adresse**, sprechende Namen:
   - **PUSH**, also ein neuer Eintrag im Verlauf: andere Seite, anderer Filter, andere Dateiart, ein Element groß
     öffnen.
   - **REPLACE**, also den Eintrag ersetzen: Tippen in ein Suchfeld (`useUrlTextParam`, nach 250 ms Pause), Vor und
     Zurück innerhalb einer geöffneten Ansicht, eine unmögliche Seite korrigieren.
   - Seiten stehen ab 1 in der Adresse (`page=2`), im Code ab 0 (`parseUrlPage` und `formatUrlPage`). Seite 1 lässt
     den Parameter weg.
   - Geblättert wird über die globale `PageNavigation` mit Seitenzahlen (‹ 1 … 4 5 [6] 7 8 … 20 ›). Ein Klick auf die
     aktuelle Seite legt keinen Eintrag an.
   - **Nicht** in die Adresse kommen Arbeitsschritte: Markierungen, offene Popups, halb ausgefüllte Formulare.
5. **Listen aus dem Backend** laden über `useCachedLoadedData('<BEREICH>', anfrage, laden)`. Die Anfrage enthält
   alles, was die Daten bestimmt. Der API-Hook des Bereichs leert ihn nach jedem Schreiben mit `clearViewCacheScope`.
6. **Zustände, die keine Adresse und kein Backend wiederherstellen kann** (z. B. „Zuletzt hochgeladen“), kommen in
   `useSessionState('<SCHLÜSSEL>', start)`. Sie gelten bis zum Abmelden oder Neuladen.
7. **Wiederverwendbar über Props:** Jede Liste, die Unterseiten öffnet, reicht den State an ihre Links durch, z. B.
   `FileDocumentActionButtons` mit `linkState`.

## 4. Wo es schon gilt (2026-11-09)

| Modul | Adresse | Origin |
|---|---|---|
| File-Manager, Tab „Dateien“ | `?fileClass=…&page=…`, Cache `FILE_DOCUMENT` | Datei und Viewer mit „Zurück zu Dateien“ |
| File-Manager, Tab „Hochladen“ | „Zuletzt hochgeladen“ bleibt in `useSessionState` | Datei mit „Zurück zu Hochladen“ |
| Datei | – | Bearbeiten und Viewer mit „Zurück zu <Dateiname>“; Löschen springt zum Origin |
| Viewer | – | „Details“ springt zurück, wenn man von der Datei kam, sonst öffnet er sie mit „Zurück zu Viewer“ |
| Administration | – | Alle Bearbeiten- und Neu-Seiten mit „Zurück zu <Tab>“, Abbrechen und Speichern springen zurück |
| Profil, Gästebuch | `?guestbookPage=…`, 10 Einträge je Seite, `PageNavigation` | – |
| Icon-Manager | `?q=…&view=…&page=…&symbol=…` | – |
| Gebietermarkt (2026-11-11) | die Rubrik steht im Pfad: `/market/category/<Key>`, je Rubrik ein Tab; Artikel im Cache `SHOP_ITEM` | Datei mit „Zurück zu <Rubrik>“ |

**Uploads (Nutzer 2026-11-09):** Wer hochlädt, lässt die Seite offen; wer sie verlässt, bricht ab. Bis dahin liefen
die Requests nach dem Verlassen unsichtbar weiter, die Warteschlange schob sogar alle eingereihten Dateien nach. Jetzt
bricht `useFileUploadList` beim Verlassen ab:

- laufende Uploads über `abortSignal`, neu in `ApiRequest`;
- die Warteschlange und die Prüfsummen.

Das Backend verwirft die halbe Teil-Datei selbst (`finally` mit `deletePartFile`).

## 5. Die zentrale Suche (später)

Sie bekommt dasselbe wie in der Vorlage:

- `?q=` mit `useUrlTextParam`; Filter-Chips als `f=feld:wert` (PUSH);
- die Treffer über `useCachedLoadedData` im Bereich `SEARCH`, geleert nach jedem Schreiben an Dokumenten;
- jeder Treffer öffnet sich mit `createOriginStateHere('Suche')`.

Zurück aus einem Treffer zeigt damit dieselben Treffer sofort, an derselben Stelle.
