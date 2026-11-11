# Konzept: File-Kern (Uploads, Alben, Cheers)

> Stand 2026-11-06. Gebaut ist nur der SolrManager (Felder in Postgres, Kerne in der YAML, Kopie im Speicher), in Solr
> steht noch nichts. Abschnitt 2 hält fest, was du entschieden hast, Abschnitt 12 die offenen Punkte. Vorbild ist das
> DMS der Vorlage (`code/vorlage/gitfiles`), die Namen wählen wir eigenständig.

## 1. Ziel

User laden Dateien hoch, vor allem Fotos (JPG, PNG), dazu Videos und Dokumente. Schnelle Suche mit Mini-Vorschau direkt
aus Solr. Alben zum Ordnen. Andere können Dateien hoch- oder runterbewerten (Cheers). Dateien weitergeben geht später
über eine Freigabe mit Abholschein.

## 2. Entscheidungen (2026-11-06)

| Thema | Entscheidung |
|---|---|
| Kern | heißt **`FILE`**. Die Kerne stehen nur in der `application.yaml` (`gebiter.solr.core-keys`), ihre Felder in Postgres und als Kopie im Speicher des Backends (2026-11-06) |
| Bytes und ID | Bytes auf dem SFTP, ID jedes Dokuments = **SHA-256-Hex der Bytes**, wie in der Vorlage |
| Dubletten | **kein Merge.** Gibt es die Datei schon: Hat der User Leserecht, zeigen wir ihm die vorhandene Datei mit ihren Metadaten. Sonst nur „Diese Datei gibt es schon, du darfst sie nicht hochladen.“ |
| Vorschau | **nur PNG** als Base64, höchstens 200 × 200 Pixel: Seitenverhältnis bleibt, die längste Seite hat 200 Pixel, das Bild steht mittig in einem quadratischen Feld, der Rest ist transparent. Nichts wird abgeschnitten. Andere Bildformate werden umgewandelt; geht das nicht, gibt es keine Vorschau. |
| Vorschau zuerst für | JPG und PNG (die Masse). HEIC und SVG in einem zweiten Schritt (Apple-Live-Fotos), Video-Vorschau (ein zufälliges Bild aus den ersten 2 Minuten) noch später |
| FileClass | eine Ebene, beliebig viele, vom Admin angelegt, geändert und gelöscht, z. B. `FOTO_URLAUB`, `FOTO_WALLPAPER`, `FOTO_SCREENSHOT`, Videos analog |
| Rechte an der FileClass | je FileClass eine Liste von Rollen zum Lesen und eine zum Schreiben. Hat der angemeldete User eine davon, darf er. Namen eigenständig, siehe 10.1 |
| Endungen | wie in der Vorlage: eigene Entity `FileExtension`, jede Endung einzeln angelegt, je FileClass freigeschaltet (Matrix) |
| Alben | Postgres-Tabelle mit fortlaufender `id`, Besitzer (GUID) und Namen, den der User wählt. Im Solr-Dokument stehen die Album-ids (Hook). **Kein Standard-Album**: Eine Datei hat nur dann ein Album, wenn der User eins anlegt (später direkt in der Upload-Maske) |
| Feld-Leserechte | wie im SolrManager der Vorlage: je Feld die Rollen, mit denen man es in der Antwort bekommt; ohne Rolle fehlt das Feld in der Antwort, das Frontend rechnet damit |
| Cheers | im Solr-Dokument nur die beiden **Zähler** `cheerUpCount` und `cheerDownCount` (zum Sortieren). Wer wie bewertet hat, steht in Postgres in einer Tabelle **`FileCheer`**: je User und Datei ein Up- oder ein Downvote. **Gebaut 2026-11-11** (`entities/FileCheer.md`): eine Tabelle mit Richtung statt zwei Tabellen, damit die Datenbank selbst „eine Stimme je User und Datei“ sichert; abstimmen darf, wer die Datei lesen darf, auch der Autor; nicht anonym; wechseln und zurücknehmen; in der Oberfläche zwei Smileys (begeistert 🤩, angewidert 🤮) statt Daumen; **kein Einfluss auf Suchen und Auflösen**: Dateien kommen sofort aus Solr, die Stimmen lädt jede Anzeige danach getrennt nach (`FileCheerBar` auf der Seite einer Datei, an jeder Bildkachel und am großen Bild der Galerie), die Antwort nennt nie alle User, nur beide Zahlen und die neuesten 15 je Richtung; die Zähler im Dokument zählt das Backend nach jeder Stimme neu |
| EXIF | alle brauchbaren EXIF-Daten samt GPS kommen in den Kern; was wir ausblenden, entscheiden wir später über die Feld-Leserechte |
| Volltext | Tika liest Text und Wörter aus den Dateien |
| Upload-Grenzen | kein Speicherlimit. Je User vorerst **100 Dateien**. Je Datei bis **100 GB**, überall sauber freigeschaltet |
| Freigabe von Dateien | später, nur mit **Abholschein** wie in der Vorlage: eigene Rolle zum Freigeben (nur enge Freunde), mehrere Dateien je Freigabe, eigenes Modul zum Anzeigen, Ablaufdatum und maximale Downloads, beides verlängerbar |
| Stories | **nicht** im File-Kern: später ein eigener Kern `STORY` (mit KI erzeugte Geschichten, z. B. über Ollama) |
| Schreibrolle heißt auch Leserolle | Wer eine AR in die Schreibrollen einer FileClass einträgt, trägt sie zwingend auch in die Leserollen ein. So prüft jede Leseabfrage nur eine Liste (`readerAccessRoleKeys`) |
| Rollenlisten lesbar | `readerAccessRoleKeys` und `writerAccessRoleKeys` bekommt jeder, der die Datei lesen darf |
| Tags | Mehrfachfeld, je Tag ein Wert: leicht zu filtern |
| Löschen | nur weich: `status` auf `DELETED`. Danach findet ein User die Datei weder beim Suchen noch beim Auflösen, nur Admin-Endpunkte zeigen sie. Der Admin löscht endgültig oder stellt wieder her |
| Bearbeiten und weich löschen | darf, wer eine Rolle aus `writerAccessRoleKeys` der Datei im Token hat (Match). **Endgültig löschen nur ADMIN**, über einen Admin-Endpunkt |
| Tika | **nur im Backend**, nie in Solr (kein Solr Cell / ExtractingRequestHandler). Das Backend entscheidet allein, was nach Solr geht |
| Drei Stufen (2026-11-08) | **User-Endpunkte** (`/api/…`): hochladen mit Schreibrolle der FileClass, eigene Dateien ändern und weich löschen. **File-Manager-Endpunkte**: nur AR `FILE_MANAGER` (oder ADMIN), in Spring Security über den Pfad abgesichert; jede Datei ändern, aber nicht löschen. **Admin-Endpunkte** (`/api/admin/file-document`): jede Datei weich löschen (`DELETE`) und endgültig löschen (`DELETE /finally`), nur ADMIN. Weich löschen dürfen nur Autor und Admin (Nutzer 2026-11-09). Der File-Manager ist kein Admin |
| Grenze je User (2026-11-08) | 100 Dateien gilt nur für normale User, nicht für ADMIN und FILE_MANAGER (die müssen auch testen). Später mehr Plätze über Punkte |
| Upload-Zähler (2026-11-08) | `UsersDetail.uploadCount` +1 als letzter Schritt, erst wenn Datei auf dem SFTP und Dokument in Solr gespeichert sind; ein gescheiterter Versuch zählt nicht |
| Viewer (2026-11-08) | eigener Pfad `GET …/view/{id}` (inline) neben `…/download/{id}` (Anhang), derselbe Service. Vorerst so, ggf. später Umbau |
| SVG (2026-11-08) | erst, wenn der Viewer es sicher kann (SVG kann Skripte enthalten) |
| Aussehen der FileClass (2026-11-08) | wie die FileSubClass der Vorlage mit Symbol, bei uns gleich ein ganzes Badge (`BadgeLook`: Symbol, Verlauf, Struktur, Effekte, Farben) als Kachel. Auswahl als Kacheln mit Suchfeld wie in der Vorlage, nur Dateiarten mit Leserecht (Upload: Schreibrecht). Die vier ersten haben ein Start-Aussehen (per SQL), änderbar im Admin |
| Erste FileClasses (2026-11-08) | `FOTO_URLAUB`, `FOTO_WALLPAPER`, `FOTO_SCREENSHOT` (png, jpg, jpeg) und `VIDEO_GAMEPLAY` (mp4, mkv, webm); `USER` darf in alle schreiben. Per SQL angelegt. **`FOTO_ART` dazu am 2026-11-11** (Wunsch des Nutzers: alles Künstlerische wie Animes, Cartoons, Gezeichnetes, Gerendertes aus Blender): Anzeigename „Art“, Platz 4 hinter den anderen Foto-Klassen, Endungen png, jpg, jpeg, Schreibrolle `USER`, Ziel `GALLERY`, Badge mit Palette; per SQL auf dem Pi, Anzeigename und Badge lassen sich im Admin-Tab „FileClass“ ändern. Damit sind die Bildklassen für User: Urlaubsbilder, Wallpaper, Screenshots, Art; Spezielleres (z. B. Memes) soll später über den Shop laufen. **`MEME` dazu am 2026-11-11** (Ansage des Nutzers: „ein nettes Badge“, „Memes sollte jeder hochladen dürfen“): Anzeigename „Meme“, Platz 7, Endungen png, jpg, jpeg, Badge diagonal Gelb → Orange mit Punkten, Glanz und lachendem Smiley; `USER`, `MODERATOR`, `FILE_MANAGER`, `ADMIN` lesen und hochladen, bearbeiten aus; über die Services angelegt. Ziel seit demselben Tag: die Rubrik `MEMES` des Markts. **`PROFILE_BANNER` dazu am 2026-11-11** (Ansage des Nutzers: „Profile-Banner“, mit passender Rubrik im Markt): Anzeigename „Profile-Banner“, Platz 8, Endungen png, jpg, jpeg, Badge Bordeaux mit Streifen, neongelber Schrift und Rahmen, Symbol `card-image`; `USER` liest, `MODERATOR` und `ADMIN` lesen und laden hoch, bearbeiten aus; Ziel: die Rubrik `PROFILE_BANNER` des Markts; über die Services angelegt. Nur die Dateiart: Das Banner im Profil selbst (Seitenverhältnis, Anlegen im Profil) ist noch nicht gebaut |

## 3. Wo was liegt

| Was | Wo |
|---|---|
| Bytes jeder Datei | SFTP, `JJJJ/MM/TT[_n]/<sha256>.bin` (fertig, `de.gebiter.sftp`) |
| Metadaten, Volltext, EXIF, Vorschau, Cheers, Album-ids | Solr-Kern `FILE`, ein Dokument je Datei |
| FileClass, Endungen, Freischaltungen, Felddefinitionen, Alben | Postgres |

## 4. FileClass und Endungen

**`FileClass`**: `key` (Key-Regel, z. B. `FOTO_URLAUB`), `displayName` und `description` (mehrsprachiges JSON),
`listingPosition`, dazu die Rollen zum Lesen und zum Schreiben und die freigeschalteten Endungen.

**`FileExtension`**: wie in der Vorlage. Die Endung selbst ist der Schlüssel, klein, ohne Punkt, `[a-z0-9]{1,20}`
(z. B. `jpg`, `mp4`; unsere Key-Regel passt hier nicht, sie verlangt Großbuchstaben am Anfang und Ende). Dazu
`description`, `listingPosition` und `imagePreview` (ob wir eine Vorschau rechnen).

Rollen und Endungen hängen wie bei ARC-AR über Zuordnungstabellen an der FileClass, eine Zeile je Paar. So bleiben die
Matrizen im Admin gleich gebaut: Pinsel, je Zelle anlegen oder löschen.

Im Admin: Tab „FileClass“ (Tabelle, neu, bearbeiten, löschen), Tab „Endungen“, Matrix „FileClass × Endung“, Matrix
„FileClass × AR“ mit Pinsel Lesen und Schreiben. Beim Upload stehen die Rollen der FileClass auch im Dokument (für den
Filter in 6); ändert der Admin die Rollen einer FileClass, zieht das Backend die Dokumente nach.

## 5. Alben

**`FileAlbum`**: `id` (fortlaufend), `ownerUsersGuid`, `name`. Weitere Felder (Beschreibung, Titelbild) kommen, wenn wir
die Alben bauen. Eine Datei kann in mehreren Alben liegen, im Dokument als Hook `albumIds`.

## 6. Suchen und Auflösen (Wording, verbindlich)

- **Suchen**: Freitext, Vervollständigung beim Tippen, Teiltreffer; die Felder je nach Recht.
- **Auflösen**: ein oder mehrere Felder mit Sollwerten, exakter Treffer. Ergebnis ist eine Liste von Dokumenten oder
  eine leere Liste, nie ein Teilergebnis. Eine Datei per `id` holen ist Auflösen nach `id`; alle Dateien einer FileClass
  holen ist Auflösen nach `fileClassKey`.

Methoden und Endpunkte heißen danach: `resolve…` für Auflösen, `search…` für Suchen.

## 7. Wer welche Dateien und Felder bekommt

- **Dokumentgrenze:** Jede User-Abfrage, Suchen wie Auflösen, trägt fest: `readerAccessRoleKeys` enthält eine Rolle des
  Users, und `status` ist `ACTIVE`. Weil jede Schreibrolle auch Leserolle ist, reicht diese eine Liste.
- **Feldgrenze:** Je Feld genau ein Recht, mit dem man es in der Antwort bekommt („Wer liest“,
  `solr_field.reader_access_role_key`, seit 2026-11-08 keine Liste mehr; leer heißt: kein User, nur das Backend). Das
  Backend baut daraus die Feldliste der Abfrage; fehlt das Recht, fehlt das Feld.
- **Gelöschte Dateien** (`DELETED`) erreichen nur Admin-Endpunkte.

## 8. Felder des Kerns FILE (Tabelle freigegeben 2026-11-06)

Jedes Feld hat in Postgres (`solr_field`, SolrManager): Typ, die Schalter indexed (I), stored (S), multiValued (M),
docValues (D), required (R), die Zwillinge Suggest (+Sg) und Ngram (+Ng), wer es setzt, das Suchgewicht (– heißt nicht
durchsucht), wer es liest, Anzeigename, Beschreibung, Position. Erweitert wird Schritt für Schritt.

| Feld | Typ | Schalter | Wer setzt (seit 2026-11-09: „vom Client“, siehe unten) | Suche | Wer liest | Wozu |
|---|---|---|---|---|---|---|
| `id` | STRING | I S D R | Backend | – | USER | SHA-256 der Bytes |
| `sftpPath` | STRING | S R | Backend | – | niemand | Pfad der Bytes, nur fürs Backend |
| `authorUsersGuid` | STRING | I S D R | Backend | – | USER | Autor: wer hochgeladen hat, nicht der Besitzer (bis 2026-11-09 `ownerUsersGuid`) |
| `fileClassKey` | STRING | I S D R | Client beim Anlegen, Wechsel über eigenen Vorgang | – | USER | die FileClass |
| `readerAccessRoleKeys` | STRING | I S M D | Backend (aus der FileClass) | – | USER | Leserollen, Pflichtfilter jeder Abfrage |
| `writerAccessRoleKeys` | STRING | I S M D | Backend (aus der FileClass) | – | USER | Schreibrollen |
| `status` | STRING | I S D R | Backend | – | USER | `ACTIVE`, `DELETED` |
| `fileName` | TEXT_EDGE | I S +Ng | Client beim Anlegen und Ändern | 5 | USER | Dateiname |
| `title` | TEXT_EDGE | I S +Ng | Client beim Anlegen und Ändern | 8 | USER | Titel |
| `fileDescription` | TEXT_SUCHE | I S | Client beim Anlegen und Ändern | 3 | USER | Beschreibung des Users (hieß bis 2026-11-08 `description`) |
| `tikaFileDescription` | TEXT_SUCHE | I S | Backend (Auswertung) | – | USER | Was Tika gelesen hat (Texterkennung eines Bildes, Inhalt eines Dokuments), ohne Leerzeilen (`Helper.removeBlankLines`); getrennt von der Beschreibung des Users, Anzeige und Suche später (hieß bis 2026-11-08 `tikaDescription`) |
| `tags` | STRING | I S M D +Sg | Client beim Anlegen und Ändern | 4 | USER | Schlagwörter, je Tag ein Wert |
| `fileExtension` | STRING | I S D | Backend | – | USER | Endung, klein |
| `mimeType` | STRING | I S D | Backend | – | USER | Typ laut Tika |
| `fileSizeBytes` | LONG | I S D | Backend | – | USER | Größe |
| `galleryIds` | LONG | I S M D | Backend (Vorgang „in Galerie legen“) | – | USER | Galerien (bis 2026-11-09 `albumIds`) |
| `visibility` | STRING | I S D | Backend (Upload NONE, später aus der Galerie) | – | USER | Wer die Datei sieht: NONE, FRIENDS, AUTHENTICATED, ANY |
| `readableForFriendsOfUsersGuid` | STRING | I S D | Backend | – | niemand | Bei FRIENDS die GUID des Autors, seine Freunde dürfen lesen |
| `uploadedAt` | DATE | I S D | Backend | – | USER | hochgeladen am |
| `lastChangedAt` | DATE | I S D | Backend | – | USER | zuletzt geändert |
| `cheerUpCount` | LONG | I S D | Backend | – | USER | Upvotes |
| `cheerDownCount` | LONG | I S D | Backend | – | USER | Downvotes |
| `previewBase64Png` | STRING | S | Backend | – | USER | Vorschau 200 × 200 |
| `searchableText` | TEXT_SUCHE | I S | Backend (Tika) | 1 | niemand | Volltext, geht nie zum Client |
| `imageWidth`, `imageHeight` | LONG | I S D | Backend | – | USER | Bildmaße |
| `capturedAt` | DATE | I S D | Backend (EXIF) | – | USER | Aufnahmezeit |
| `cameraModel` | STRING | I S D +Sg | Backend (EXIF) | – | USER | Kamera |
| `gpsLatitude`, `gpsLongitude` | DOUBLE | I S | Backend (EXIF) | – | ADMIN | GPS, vorerst nur Admin |
| `cursorDate` | DATE | I S D | Backend (Durchläufe) | – | ADMIN | Zuletzt durchlaufen: wann ein Durchlauf über alle Dateien (z. B. neu indizieren) die Datei zuletzt angefasst hat, wie `cursorDate` in der Vorlage. Ein Durchlauf blättert per Solr-Cursor nach `id` (nie nach diesem Feld) und setzt es bei jeder Datei, die er ändert; so lässt er sich verfolgen und nach einem Abbruch fortsetzen. Angelegt 2026-11-08 (Nutzer), Position 280. Den Durchlauf selbst gibt es noch nicht. |

Weitere EXIF-Felder erst, wenn der Tika-Test (11) zeigt, was Tika je Dateityp findet.

**`previewBase64Png` als STRING:** passt, solange das Feld weder `indexed` noch `docValues` hat. Die Grenze von 32766
Bytes je Wert gilt nur für indexierte Werte und docValues, nicht für rein gespeicherte. Einen eigenen Typ für langen Text
gibt es in Solr nicht; es gibt aber die Feld-Eigenschaft `large` (nur stored, nicht multiValued): Solr lädt das Feld dann
erst, wenn es verlangt wird, und hält große Werte nicht im Cache. Kandidaten wären `previewBase64Png` und
`searchableText`; wäre ein weiterer Schalter im SolrManager.

## 9. Upload (Entwurf 2026-11-06, wartet auf dein OK)

Prinzip wie in der Vorlage: die Bytes auf den SFTP, sämtliche Metadaten in den Kern `FILE`. Die Felder wachsen weiter
(SolrManager), der Upload nimmt automatisch jedes Feld, das der Client setzen darf.

### 9.1 Reihenfolge

1. Kern `FILE` in Solr anlegen (9.2) und den Schema-Abgleich bauen (9.3).
2. Die Referenz `wtf` (13).
3. FileClass und Endungen (4) mit den Matrizen im Admin.
4. Upload im Backend (9.4) und im Browser (9.5).

### 9.2 Wie der Kern in Solr entsteht (einmalig, auf dem Pi)

- In `/gebiter9k/code/.env` des Pi `SOLR_CORES=FILE`, dann `docker compose up -d solr`. Die Startkette kopiert das
  Basis-Configset (`docker/solr/configsets/gebiter9k`: nur die Feldtypen, `id`, `_version_`, `_root_`) nach
  `/var/solr/data/FILE`, **nur wenn der Ordner fehlt**. Einen vorhandenen Kern fasst sie nie an.
- Solr ist dabei einige Sekunden weg, Postgres und SFTP laufen weiter.
- Warum nicht das Backend: Im user-managed Modus gibt es keine Configsets-API, die je Kern kopiert; ein gemeinsames
  Configset hieße eine Schemadatei für alle Kerne.

### 9.3 Schema-Abgleich: Postgres → Solr (neu zu bauen)

- Neu im Backend: SolrJ (neueste stabile Version passend zu Solr 10.1), Client `HttpJettySolrClient` wie in der Vorlage
  (nie `HttpJdkSolrClient`, der hängt nach einem Verbindungsabbruch), Basic Auth aus der `.env`.
- `SolrSchemaSyncService`, auf eigenem Thread, beim Start und nach jeder Feldänderung im SolrManager (nach dem Commit):
  1. Schema des Kerns lesen (`GET /solr/FILE/schema/fields?showDefaults=true` und `/schema/copyfields`).
  2. Mit der Kopie im Speicher vergleichen (`solr_field`).
  3. Fehlt ein Feld: `add-field`. Weicht ein Schalter ab: `replace-field`. Zwilling `<name>Suggest` (code_suggest) bzw.
     `<name>Ngram` (text_ngram), jeweils mit `add-copy-field`.
  4. Alle Befehle in einer Anfrage (`POST /solr/FILE/schema`); Solr schreibt danach seine `managed-schema.xml` selbst.
  5. **Gelöscht wird nie.** Ein Feld nur in Solr und ein geänderter Typ werden gemeldet (Typwechsel heißt Neuaufbau).
  6. Bericht je Kern im SolrManager (Box „Abgleich mit Solr“, Knopf „jetzt abgleichen“). Lädt der Kern noch, wartet der
     Abgleich und versucht es erneut.

### 9.4 Upload im Backend: ein Request, ein Durchgang (neu gebaut 2026-11-08)

Vorgabe des Nutzers: Die Datei soll so schnell wie möglich auf der Platte des Backends liegen, der Hash gleich danach
feststehen, eine Dublette sofort verworfen werden. Alles andere (SFTP, Tika, Vorschau) läuft danach im Hintergrund.

`POST /api/file-manager/file-document/upload` (nur FILE_MANAGER und ADMIN; bis 2026-11-11 `/api/file-document/upload`
für jeden USER, siehe 9.6), `multipart/form-data` in fester Reihenfolge: **zuerst `data`** (JSON, jedes Feld
unter seinem Solr-Namen, Referenzen wie `wtf` als Liste), **dann `file`**. Spring-Multipart ist aus
(`spring.servlet.multipart.enabled: false`), sonst würde Spring den ganzen Body erst in Temp-Dateien schreiben. Der Body
geht als Strom an den `FileUploadService`, gelesen vom `MultipartStreamReader` (`de.gebiter.util`; Commons FileUpload 2
gibt es nur als Milestone). Geprüft am 2026-11-08: 2.989 Zufallsrunden mit Grenz-Fallen, Abbruch erkannt, 1,4 GB/s
samt SHA-256.

1. **Form:** erst `data` (höchstens `upload-max-data-size`), dann die Kopfzeilen von `file` (Name mit Endung).
2. **Größe:** Content-Length höchstens `upload-max-file-size` (100 GB), sonst sofort 400.
3. **Felder des Clients:** nur, was er beim Anlegen setzen darf, geprüft nach Typ (400 mit allen Beanstandungen).
4. **FileClass:** Pflicht, muss es geben, der User braucht ein Recht mit dem Schalter „Hochladen“ an ihr (403; bis
   2026-11-11 hieß das Schreibrolle).
5. **Endung:** muss für die FileClass freigeschaltet sein (400).
6. **Grenze je User:** weniger als 100 eigene Dateien (409), nicht für ADMIN und FILE_MANAGER.
   Bis hier ist kein Byte der Datei angenommen.
7. **Platz im Upload-Puffer** reservieren (Größe laut Browser), sonst 503 „Puffer voll“.
8. **Ein Durchgang:** Bytes vom Netz in `<puffer>/<zufall>.part`, SHA-256 und Größe rechnen mit. Wird die Datei größer
   als erlaubt, Abbruch. Danach der Typ aus den ersten Bytes (Tika, Millisekunden).
9. **Dublette:** Gibt es die id schon (egal welcher Status) oder wird sie gerade eingecheckt? Dann `.part` löschen,
   Antwort `EXISTS`.
10. **Einchecken:** `.part` heißt jetzt `<sha256>.bin`, das Dokument geht nach Solr (`analysisStatus = PENDING`, der
    Pfad auf dem SFTP steht schon fest). Scheitert Solr, verschwindet die Datei aus dem Puffer. Antwort `CREATED`.

**Hintergrund-Thread** (`FileAnalysisService`, EIN Thread): Was als `<sha256>.bin` im Puffer liegt, ist seine
Warteschlange (beim Start und alle 5 Minuten nachgesehen, neue Uploads sofort). Je Datei: zuerst auf den SFTP
(`.part`, Größenprüfung, Umbenennen; scheitert das, bleibt sie im Puffer für den nächsten Versuch), dann Tika mit dem
**Pfad** (jede Größe, siehe 11), Vorschau, `DONE`/`FAILED`, dann raus aus dem Puffer. Bis dahin liefern Viewer und
Download die Datei direkt aus dem Puffer. Laufen zwei Backends auf demselben Solr (Pi und Mac), arbeitet jedes nur
seinen eigenen Puffer ab.

**Hängende Auswertungen, täglicher Lauf (2026-11-11, Vorgabe des Nutzers):** Eine Datei kann auf `PENDING` stehen
bleiben, obwohl sie nicht mehr im Puffer liegt; dann kommt von selbst niemand mehr zu ihr. Zwei Wege dahin:

- Die Auswertung stürzt mit einem Java-Error ab (Speicher voll, zu tief verschachteltes Dokument). Beim ersten Mal
  bleibt die Datei bewusst auf `PENDING` (es kann am Augenblick gelegen haben), der Absturz steht mit Ursache im Log.
- Solr antwortet genau in dem Moment nicht, in dem das Ergebnis gespeichert werden soll.

Einmal am Tag, um `gebiter.file.analysis-retry-time` (05:00, Zeitzone `analysis-retry-time-zone` = Europe/Berlin; der
Container läuft in UTC), gibt der Hintergrund-Thread jeder hängenden Datei einen **zweiten Versuch**
(`FileAnalysisService.retryStuckFileDocumentAnalyses`):

1. Suchen: `PENDING`, nicht gelöscht, Upload länger her als `analysis-retry-min-age` (5 h)
   (`FileDocumentResolveService.resolvePendingFileDocumentIdsUploadedBefore`). 05:00 und 5 h heißen zusammen: alles,
   was vor Mitternacht hochgeladen wurde.
2. Liegt die Datei noch im Puffer, ist sie nicht hängend (z. B. war der SFTP lange weg): nichts tun.
3. Liegt sie nicht auf dem SFTP, gibt es keine Bytes für einen zweiten Versuch: Warnung ins Log, Stand bleibt. Sie kann
   noch im Puffer eines anderen Backends liegen (Pi und Mac auf demselben Solr).
4. Sonst: vom SFTP zurück in den Puffer (wie ein Upload: `.part` mit reserviertem Platz, dann `<sha256>.bin`) und noch
   einmal durch die Auswertung. Klappt es, steht `DONE` im Dokument. Scheitert es oder stürzt es wieder ab, `FAILED`:
   Dann liegt es an der Datei, und ein Admin muss sie sich ansehen (Ursache im Log, Suchwort „zweiten Versuch“).

Beispiel: Ein PDF von gestern 14:10 steht noch auf `PENDING`, weil Tika mit „Speicher voll“ abgestürzt ist. Um 05:00
holt der Lauf es vom SFTP und wertet es noch einmal aus. Im Log steht „Hängende Auswertungen: 1 Dateien seit über 300
Minuten auf PENDING, 1 ein zweites Mal ausgewertet“.

Der Lauf plant am Ende selbst den nächsten (kein Spring-Scheduling, derselbe eine Thread), die Uhrzeit stimmt deshalb
auch über die Zeitumstellung. Getestet am 2026-11-11 (Wegwerf-Tests, danach gelöscht): Absturz im ersten Versuch lässt
`PENDING`, im zweiten setzt er `FAILED`; gegen den Solr und SFTP des Pi wurde eine hängende Testdatei vom SFTP geholt
und auf `DONE` gebracht (0,3 s), eine zu junge und eine ohne Bytes blieben unberührt, danach alles wieder entfernt.

**Wie groß darf ein PDF sein? (gemessen 2026-11-11, auf dem Mac, Heap auf 256 MB begrenzt):** Ein PDF mit 2000 Seiten
dicht gesetztem Text (7,6 Millionen Zeichen) liest Tika in 0,9 s bis zur letzten Seite, Spitze 134 MB Heap. Bei 10 000
Seiten hört es nach 1 s an der Grenze `tika-max-text-characters` (10 Millionen Zeichen) auf, Spitze 179 MB; das ist ein
geordnetes Ende, kein Absturz, der Text bis dahin bleibt. Das Backend auf dem Pi darf bis 4,2 GB Heap nehmen (ein
Viertel der 16 GB, keine Grenze am Container). Nicht gemessen: eingescannte Bücher (Seiten als Bilder, Texterkennung je
Seite) und PDFs mit vielen Bildern.

**Upload-Puffer** (`FileStagingService`): `gebiter.file.staging-directory` (Mac: `mounts/staging`, im Container
`FILE_STAGING_DIR`), höchstens `staging-max-size` (200 GB), laufende Uploads zählen mit ihrer angekündigten Größe. Nie
`/tmp`: auf dem Pi liegt `/tmp` im RAM.

**Rollback / kein Müll:**
- Abbruch im Browser, Fehler bei einer Prüfung oder Dublette: `.part` sofort gelöscht, in Solr steht nichts.
- Solr scheitert beim Einchecken: die Datei aus dem Puffer gelöscht.
- Endgültiges Löschen durch den Admin: Solr, Puffer, SFTP. Läuft die Übertragung gerade, räumt der Hintergrund-Thread den
  SFTP danach selbst auf.
- Absturz: Der Start-Runner löscht alle `.part`. Eine `.bin` ohne Dokument räumt der Hintergrund-Thread weg.

Dazu `GET /api/file-document/existence/{sha256}` für den Browser: gibt es die Datei, und wenn er sie lesen darf, das Dokument.

### 9.5 Im Browser

- Modul „Dateien“ mit Kachel (USER), Tab „Hochladen“.
- Oben die FileClass (nur die, die der User hochladen darf) und die Felder, die der Client setzen darf
  (heute `title`, `fileDescription`, `tags`, dazu `wtf`), sie gelten für alle Dateien der Liste.
- Das Upload-Feld (`FileDropzone`), bis 25 Dateien, je Datei eine Zeile.
- Leere Dateien (0 Bytes) nimmt die `FileDropzone` gar nicht erst an, mit Hinweis (2026-11-08).
- Je Datei sofort: Endung gegen die FileClass, SHA-256 im Browser in Stücken (`hash-wasm`, jede Größe, geprüft mit
  5 GiB), dann der Existenzcheck. **Alle Dateien gleichzeitig**, je eine in einem eigenen Web Worker
  (`sha256Worker.ts`), so viele wie der Rechner Kerne meldet (Nutzer 2026-11-08: im Browser volle Kraft).
- „Hochladen“ **reiht ein**: zwei Kanäle (`VITE_UPLOAD_MAX_PARALLEL_UPLOADS`), belegt, solange etwas wartet. Während
  Uploads laufen, ist nichts gesperrt: Dateien ablegen, Felder ändern, weitere einreihen. Eine wartende Datei rechnet ihre
  Prüfsumme weiter und fällt als Dublette heraus, bevor sie hochgeht; beginnt ihr Upload, hört die Prüfsumme auf.
- Fortschritt je Datei, je Klick auf „Hochladen“ am Ende ein Toast.

### 9.6 Upload-Wege: wozu was da ist (2026-11-11)

Drei Dinge entscheiden, ob ein Upload angenommen wird. Jedes hat genau eine Aufgabe:

| Was | Aufgabe | Wo gepflegt | Im Code |
|---|---|---|---|
| **FileClass** | sagt, **was** die Datei ist (Urlaubsfoto, Dokument, später E-Book, Markt-Artikel) und welche Endungen dazu passen | Admin-Tabs „FileClass“, „FileClass × Endung“ | `FileClass`, `FileClassFileExtension` |
| **Schalter „Hochladen“ der FileClass** (bis 2026-11-11 „Schreibrolle“) | sagt, **wer** Dateien dieser FileClass hochladen darf: jeder User mit einem Recht, bei dem er an ist | Admin-Matrix „FileClass × AR“, Pinsel „LH“ oder „LBH“ | `FileClassAccessRole.uploadGranted` |
| **Ziel der FileClass** | sagt, über **welchen Weg** sie hereinkommen darf | Admin-Matrix „FileClass-Ziel“ | `FileClassDestination`, `FileClassDestinationAssignment` |

**Je Zweck ein eigener Upload-Weg:** ein eigener Endpunkt mit eigener Service-Methode und eigenen Regeln. Alle Wege
laufen durch denselben Kern (`FileUploadService.doUploadFromMultipart`: Felder, Schreibrolle, Ziel, Endung, Grenze, Bytes,
Dublette, Einchecken); ein neuer Weg ist deshalb nur ein dünner Endpunkt mit seiner eigenen Regel.

| Weg | Endpunkt | Wer | Welche FileClasses | Eigene Regel |
|---|---|---|---|---|
| Galerie (gebaut) | `POST /api/gallery/upload` → `FileUploadService.uploadFileIntoGallery` | jeder User mit Schreibrolle | nur die am Ziel `GALLERY` | Die Galerie gehört dem User; das Dokument bekommt Galerie, Sichtbarkeit und Platz |
| File-Manager (gebaut) | `POST /api/file-manager/file-document/upload` → `FileUploadService.uploadFile` | nur FILE_MANAGER und ADMIN (Pfadregel und `@PreAuthorize`), dazu die Schreibrolle | jede, ohne Ziel | keine: der Weg für besondere Dinge |
| Gebietermarkt (gebaut 2026-11-11) | `POST /api/shop-item/upload` → `FileUploadService.uploadFileIntoShopCategory` | jeder User mit dem Schalter „Hochladen“ an der FileClass der Rubrik | keine Wahl: immer die eine FileClass der Rubrik (`ShopCategory.fileClassKey`), das Backend setzt sie | Die Rubrik muss es geben; das Dokument ist für jeden Angemeldeten sichtbar; nach dem Einchecken entsteht der Artikel (`ShopItem`) |

**Warum der File-Manager-Weg zu ist (Punkt 10 der Durchsicht, 2026-11-11):** Bis dahin lag er unter
`/api/file-document/upload` und nahm Requests von jedem angemeldeten User an, obwohl nur FILE_MANAGER und ADMIN den Tab
sehen. Stand auf dem Pi: An `FOTO_URLAUB`, `FOTO_WALLPAPER`, `FOTO_SCREENSHOT`, `VIDEO_GAMEPLAY` und `DOKUMENT` darf die
Rolle `USER` schreiben; am Ziel `GALLERY` sind nur die drei Foto-Klassen freigegeben. Ein normaler User konnte mit einem
selbst gebauten Request trotzdem ein Word-Dokument (`DOKUMENT`) oder ein Video hochladen, ohne Galerie: Die Ziel-Liste
galt nur in der Oberfläche. Jetzt lädt ein normaler User nur noch über ein Ziel hoch.

**Folge für `VIDEO_GAMEPLAY` und `DOKUMENT`:** Sie haben kein Ziel. Normale User können sie nicht mehr hochladen, bis es
einen Weg dafür gibt (die Galerie zeigt bisher nur Bilder). FILE_MANAGER und ADMIN laden sie über den File-Manager hoch.

**Richtung, noch nicht gebaut und noch nicht im Detail geklärt (Nutzer 2026-11-11):**
- Marktplatz: eigene FileClass und eigener Weg („Marketplace-Inserter“); ein User soll sich in seiner Galerie keinen
  eigenen Datei-Markt bauen können. Stand 2026-11-11: Jede Rubrik des Gebietermarkts hat genau eine FileClass
  (`ShopCategory.fileClassKey`, gewählt im Tab „Rubriken“), der Upload wählt keine mehr, und der Upload-Weg ist gebaut
  (Tabelle oben; `konzept-shop.md`, Abschnitt 11).
- E-Books: lädt kein normaler User hoch; einzelne gibt der Betreiber über ein Abhol-Token frei (`/api/share`).
- KI-Trainingsdaten: Tausende bis Zehntausende Bilder über eigene Endpunkte und Freigaben.
- Rechte trennen, **gebaut 2026-11-11**: Je FileClass und Recht gibt es drei eigene Schalter, lesen, bearbeiten,
  hochladen (`entities/FileClassAccessRole.md`); die eine Stufe `READER`/`WRITER` ist weg. Hochladen prüft den Schalter
  „Hochladen“. „Bearbeiten“ wird gespeichert, aber noch nicht ausgewertet: Bis die Regel steht, bearbeitet der Autor
  seine eigene Datei wie bisher.
- Noch offen, Vorgabe des Nutzers 2026-11-11: Beim Bearbeiten gilt „beides“, entweder ein Recht (AccessRole) oder der
  Autor; bei allen FileClasses, die User hochladen dürfen, bearbeitet nur der Autor. Wer wo standardmäßig bearbeitet,
  wird festgelegt, wenn Memes hochgeladen und gekauft werden können.

Getestet am 2026-11-11 (Wegwerf-Test, danach gelöscht): Es gibt genau zwei Upload-Endpunkte
(`/api/file-manager/file-document/upload`, `/api/gallery/upload`). Der Upload ohne Ziel wird mit der Rolle USER
abgewiesen („Access Denied“), mit FILE_MANAGER oder ADMIN angenommen; der Galerie-Upload bleibt für USER offen.

## 10. Download (im Detail gemeinsam durcharbeiten, bevor gebaut wird)

- Höchstens **zwei Endpunkte**: der normale Download (angemeldet) und der per Abholschein (ohne Anmeldung). Nach unserer
  Pfadregel liegt der zweite zwingend unter `/api/share/…`, deshalb zwei Endpunkte; beide rufen denselben Kern im
  Service: Datei auflösen, Rechte prüfen, nur dann die Bytes streamen. Sonst führt kein Weg zu den Bytes.
- Einfach und sicher: Der Client nennt nur die Datei (bzw. den Abholschein), den Pfad auf dem SFTP kennt nur das Backend.
- Die `id` (SHA-256-Hex) darf im GET-Pfad stehen (2026-11-06: Hex-Werte sind wie Keys erlaubt, nie Text mit Leerzeichen,
  `/`, `+` oder anderen Sonderzeichen). Der Controller prüft die Form, bevor irgendetwas anderes passiert.
- **Die Mechanik des Abholscheins** gehen wir vor der Umsetzung gemeinsam durch. Schon entschieden (2026-11-06): Einen
  Abholschein erstellen darf nur, wer die AR `FREIGABE` hat (Positionen Trusted User, Moderator, Admin); der Moderator
  (AR `MODERATOR`) darf Abholscheine anderer löschen.

## 11. Tika-Test-Upload

Ein Admin lädt eine beliebige Datei hoch, das Backend gibt sie an Tika und verwirft sie danach. Die Antwort enthält
**wirklich alles**, was Tika findet; was wir davon brauchen, entscheiden wir danach. So sehen wir je Dateityp, was Tika
liefert und was nicht, und legen danach die weiteren Felder an.

- Eigenes Modul mit eigener Kachel „Tika-Test“ auf der Startseite (nur ADMIN), weil dort später weitere Tests dazukommen.
- Endpunkt `POST /api/admin/tika-probe`.
- Dateien können beliebig groß sein, größer als der RAM: Sie werden durchgeleitet, nie am Stück abgelegt.
- Tika 4.2.0, die neueste stabile Version laut Maven Central (Stand 2026-10-28).
- **Gebaut 2026-11-06.** Die Datei geht roh als Request Body, ohne Namen und ohne JSON: Tika erkennt allein aus den
  Bytes, so sehen wir, was das Frontend später mitschicken muss. Antwort: je Dokument (die Datei selbst, dann jedes
  eingebettete, z. B. Dateien in einem ZIP oder Bilder in einem Word-Dokument) alle Metadaten und der Text, vollständig.
- **Bewusst ohne Grenzen**, wir wollen sehen, wo es kracht. Das Risiko für den Speicher ist der Text: Tika hält ihn
  komplett, bei einem Video ist er klein, bei einer riesigen Textdatei riesig.
- ~~Regel für den späteren User-Upload: Dateien über 2 GB gehen nicht an Tika.~~ Aufgehoben 2026-11-08 (Nutzer): Tika
  bekommt in der Auswertung den **Pfad** der Datei und springt über, was es nicht braucht; geprüft mit einem 50-GB-MP4
  und 64 MB Heap (0,5 s, keine Temp-Datei). Text höchstens `tika-max-text-characters`. Grenze von Tika 4.2.0 selbst: Der
  MP4-Leser hört an einer Box über 2 GiB auf. Stehen die Metadaten vorn (Web-Videos), findet er alles; stehen sie hinter
  den Videodaten (Kameras, iPhone), nichts. MKV liest Tika gar nicht. Abhilfe später vielleicht ffprobe.

## 12. Noch offen

1. ~~Namen für die Rollenlisten~~ Entschieden: `readerAccessRoleKeys` und `writerAccessRoleKeys`.
2. ~~Bearbeiten und weich löschen~~ Entschieden: Match auf `writerAccessRoleKeys`; endgültig löschen nur ADMIN.
3. ~~Felder des Backends beim Upload~~ Entschieden: Der Service übernimmt aus dem Body nur Felder mit `solr_field.client_value_accepted` („vom Client“, seit 2026-11-09 statt der Schreibregel: ein Kann, kein Muss; Herr der Information ist sonst das Backend oder Tika). `fileName` kommt aus dem Namen der hochgeladenen Datei, nie aus dem Body. Die FileClass ist beim Bearbeiten nie änderbar.
4. ~~Download per GET mit der `id`~~ Entschieden: Hex-Werte sind im GET-Pfad erlaubt.
5. ~~Tika-Test, Übertragung~~ Entschieden: roher Request Body, ohne Namen.
6. ~~Tika-Test, Text~~ Entschieden: vollständig, ohne Grenze (nur im Test).
7. Wer die Leserolle einer FileClass hat, sieht alle Dateien dieser Klasse von allen Usern. Private Fotos bräuchten eine
   FileClass, deren Leserolle nur wenige haben, oder die spätere Freigabe. So gewollt?

## 13. Referenzen (die Hooks der Vorlage)

Was die Vorlage „Hooks“ nannte, heißt bei uns **Referenzen**: Felder mit festem Aufbau (exakter Wert, mehrfach,
filterbar, Vervollständigung), die in jedem Kern gleich heißen und so über Kerne hinweg auffindbar machen.

**Erste Referenz: `wtf`** (Wunsch 2026-11-06), genutzt wie in der Vorlage: beliebige Markierungen an einer Datei, an
denen Code und Masken sie wiederfinden, z. B. `PROFILE_BANNER` für die Bilder der Profilbanner oder `TEST_DATA` für
Testdaten. Entwurf:

- Entity `SolrReference` (Tabelle `solr_reference`): `key` = Feldname in Solr (Feldnamen-Regel, z. B. `wtf`),
  `displayName` und `description` (mehrsprachig), `listingPosition`. Kopie im Speicher wie bei den Feldern.
- Je Kern eine Zeile in `solr_field` mit festen Einstellungen: STRING, indexed, stored, multiValued, docValues,
  Suggest-Zwilling, „vom Client“ an. Je Kern änderbar nur „Wer liest“ und Suchgewicht.
  Kennzeichen an der Zeile: `solrReferenceKey`. Das Backend legt die Zeile an, wenn eine Referenz oder ein Kern
  entsteht, und löscht sie mit der Referenz.
- SolrManager: Tab „Referenzen“; im Kern-Tab stehen sie unter einer Linie hinter den Feldern.

Weitere Ideen, nichts entschieden: Personen auf einem Foto (User-GUIDs), Orte, Anlässe (z. B. „Urlaub Kroatien 2026“),
Genres (Stories und Dateien), Story-Bezug, Spiele (Steam).

## 14. Später

Freigabe per Abholschein (eigene Rolle, mehrere Dateien, Ablaufdatum, maximale Downloads), Alben in der Upload-Maske,
HEIC/SVG und Apple-Live-Fotos, Video-Vorschau, Kern `STORY`, mehr Upload-Plätze durch Cheers.

**Vorgemerkt für die Suche (2026-11-11; die Suche kommt nach dem Markt, Vorgabe des Nutzers):**

- `searchableText`: im Solr-Manager „Wer liest“ leeren (Tabelle `solr_field`, heute `USER`). Ein Rechte-Problem ist es
  nicht, wer die Datei lesen darf, sieht denselben Text in `tikaFileDescription`; aber bei Dokumenten geht der Text so
  bei jedem Laden doppelt mit, angezeigt wird das Feld nirgends. Suche und Highlighting brauchen es nicht in der Antwort.
- Highlighting wie in der Vorlage (`SolrDocumentDmsService.searchDmsDocuments`): `hl` über die Textfelder, Methode
  `unified`, die Fundstelle zwischen zwei Markierzeichen, das Frontend färbt sie ein. Anders als dort soll der Ausschnitt
  aus dem Volltext mit zum Client (dort nur „Volltext hat getroffen“). Solr baut den Ausschnitt aus dem gespeicherten
  Text; das Feld selbst steht nie in der Feldliste der Antwort.
- Getroffen werden ganze Wörter samt Wortstämmen und Teilen zusammengesetzter Wörter (Feldtyp `text_suche`), kein
  Edge-N-Gram.

## 15. Nächste Schritte

1. ~~SolrManager~~ gebaut 2026-11-06: Kerne in der YAML, Felder mit allen Eigenschaften in Postgres, Kopie im Speicher.
2. Die Felder aus 8 im SolrManager anlegen.
3. ~~Tika-Test-Upload (11)~~ gebaut 2026-11-06.
4. Bevor irgendetwas nach Solr geschrieben wird: genau erklären, wie Kernordner, Schema und Felder in Solr entstehen.
   Erklärt in 9.2 und 9.3 (2026-11-06), wartet auf dein OK.
5. Referenz `wtf` (13) gebaut. FileClass und Endungen (4): Backend gebaut 2026-11-08 (Paket `de.gebiter.file`:
   `FileClass`, `FileExtension`, `FileClassAccessRole` mit `FileClassAccessLevel` READER/WRITER, `FileClassFileExtension`;
   Admin-Endpunkte zum Anlegen und Ändern, User-Endpunkte nur Liste; Löschen fehlt noch). Admin-Tabs und Matrizen offen.
6. ~~Upload, Ansicht, Bearbeiten, Viewer, Download~~ gebaut 2026-11-08 (File-Manager). Endpunkte:
   - User `/api/file-document`: `POST /upload` (Multipart erst `data`, dann `file`, als Strom), `GET /existence/{sha256}`, `GET /field-name-set`,
     `GET /{id}` (Dokument + `changeable`), `POST /resolve` (`{exactValueByFieldName, page}`), `GET /view/{id}` (inline nur
     `gebiter.file.inline-mime-types`), `GET /download/{id}` (beide mit Range), `PUT` (eigene Datei), `DELETE` (eigene, weich).
   - File-Manager `/api/file-manager/file-document` (FILE_MANAGER oder ADMIN): `PUT`, `DELETE` (weich) für jede Datei.
   - Admin `/api/admin/file-document`: `DELETE` endgültig, nur für DELETED (Solr, dann SFTP).
   - Grenze je User: Solr-Zählung (`authorUsersGuid` + ACTIVE) plus laufende Uploads, nur für normale User.
   Offen: Tab „Gelöscht“ (Admin: Liste, wiederherstellen, endgültig löschen), Suche, der bewegte Teil der Live Photos (MOV).
   **Upload und Auswertung getrennt (2026-11-08):** Der Upload speichert nur den Pflichtteil (Hash, Typ aus den ersten
   Bytes, SFTP, Dokument mit `analysisStatus = PENDING`) und antwortet sofort; das Frontend lädt zwei Dateien gleichzeitig.
   Tika samt Texterkennung, EXIF und Vorschau macht danach der `FileAnalysisService` im Hintergrund, EINE Datei nach der
   anderen; die Warteschlange ist Solr selbst (PENDING wird beim Start und regelmäßig nachgesucht). Erkannter Text eines
   Bildes kommt ins Feld `tikaFileDescription` (zweite Beschreibung, nicht in der Suche), Text anderer Dateien zusätzlich in
   den Volltext. (Hieß bis 2026-11-08 `ocrDescription`, umbenannt, weil seitdem auch der Inhalt von Dokumenten dort steht;
   Werte umgezogen, altes Feld aus Definition und Solr-Schema gelöscht.)
   Gemessen: Texterkennung 6–64 s je 60-Megapixel-Foto. Später an derselben Stelle: Schlagworte durch ein Bildmodell.
   **HEIC (iPhone, Standbild eines Live Photos) gebaut 2026-11-08:** Endung `heic` (mit Vorschau) für FOTO_URLAUB und
   FOTO_WALLPAPER. Kein Browser außer Safari zeigt HEIC, Java liest es nicht: `HeifService` (Paket `de.gebiter.heif`)
   wandelt es mit `heif-dec` aus libheif in JPEG (`gebiter.heif.*`). Der Viewer bekommt bei jedem Aufruf ein frisches
   JPEG (~0,5 s bei 36 Megapixeln), der Download das Original. Die Auswertung wandelt einmal und lässt Tika, Texterkennung
   und Vorschau auf dem JPEG laufen; libheif dreht das Bild aufrecht und übernimmt EXIF (Aufnahme, Kamera, GPS), der Typ
   im Dokument bleibt `image/heic`. Offen: der bewegte Teil eines Live Photos (eigene MOV-Datei, HEVC).
   **FileClass DOKUMENT gebaut 2026-11-08** („Dokumente“: Bewerbungen, Rezepte, Tagebuch; Badge Word-Blau → Excel-Grün,
   `bootstrap/file-earmark-text`; USER WRITER): Endungen docx, doc, xlsx, xls, txt (ohne Vorschau, nur Download). Tika
   liest den Inhalt in `tikaFileDescription` (sichtbar) und den Volltext `searchableText` (Suche, für niemanden lesbar). Der
   Typ im Dokument ist immer ohne Parameter (`text/plain`, nicht `text/plain; charset=…`). doc und xls können Makros
   enthalten (docx und xlsx nicht); Office blockiert Makros aus dem Netz von sich aus.
   **Endungen nach Gruppen, Löschen, Viewer (2026-11-08, Wunsch des Nutzers, nach der Vorlage):**
   - doc und xls gelöscht (zu riskant), dafür odt und ods (LibreOffice) an DOKUMENT.
   - Neue Entity `FileExtensionGroup` (Tabelle `file_extension_group`: Key, Anzeigename, Platz; Vorlage:
     FileExtensionCollection), `FileExtension.fileExtensionGroupKey` (null = ohne Gruppe). Gruppen BILD, VIDEO, DOKUMENT.
     Endpunkte `/api/file-extension-group` (Liste) und `/api/admin/file-extension-group` (POST, GET, PUT,
     PUT /listing-position, DELETE).
   - Endungen: PUT `/api/admin/file-extension/listing-position` (alle Endungen, Gruppen hintereinander) und DELETE.
   - Löschen ohne Service-Zirkel: Der löschende Service meldet ein Event in seiner Transaktion
     (`FileExtensionDeletedEvent`, `FileExtensionGroupDeletedEvent`), der zuständige Service räumt sein eigenes Repository
     auf (Freischaltungen weg bzw. Endungen ohne Gruppe). Seit 2026-11-11 genauso beim weichen Löschen einer Datei:
     `FileDocumentWriteService` meldet `FileDocumentSoftDeletedEvent` (id der Datei und ihre Galerien), der
     `GalleryService` lässt die übrigen Bilder der Galerie aufrücken (`konzept-galerie.md`, Abschnitt 7).
   - Tab „Endungen“: oben Gruppen, darunter die Endungen je Gruppe mit Zwischenüberschrift, beides per Drag and Drop
     sortierbar, Bearbeiten, Löschen mit Rückfrage; Gruppe per Dropdown im Formular der Endung.
   - Matrix „FileClass-Endung“ wie die Vorlage: oben FileClasses (Badge), links die Endungen nach Gruppen; Gruppenzeile
     mit Zähler x/y, Klick schaltet die ganze Gruppe; Pinsel, Malen, Schraffur bis zur Bestätigung, Toast.
     Nicht übernommen: Anzeigeorte (gibt es bei uns nicht), Form je Gruppe, Schalter „heikel“ an der Endung.
   - Viewer wie die Vorlage: docx über docx-preview 0.4.1, xlsx und ods über SheetJS 0.20.3 (vom CDN der SheetJS, das
     npm-Paket ist veraltet), txt roh (UTF-8, sonst Windows-1252, höchstens 500 000 Zeichen). Word und Tabelle lädt der
     Browser erst bei Bedarf. Links aus Dokumenten behalten ihr Ziel nur bei http, https und mailto. odt nur Download.
   - **Kein fremdes HTML oder Skript aus einem Dokument (2026-11-10):** Ein Dokument ist eine fremde Datei; was der
     Viewer daraus baut, läuft in der Seite dessen, der es ansieht.
     - Word (`FileDocumentWordViewer`): docx-preview rendert eingebettetes HTML (`altChunk`) nicht
       (`renderAltChunks: false`). Sonst setzte es dieses HTML als iframe ohne Sandbox in die Seite. Text, Bilder,
       Tabellen und Formatierung baut docx-preview selbst aus einzelnen Elementen, die bleiben.
     - Tabellen (`FileDocumentSpreadsheetViewer`): SheetJS baut kein eigenes HTML je Zelle (`cellHTML: false`), und die
       fertige Tabelle geht vor dem Einsetzen durch `components/sanitizeHtml.ts`: nur `table`, `tbody`, `tr`, `td`,
       `th`, `a`, `br` mit `rowspan`, `colspan`, `href`. SheetJS 0.20.3 maskiert weder den Text formatierter Zellen
       noch das Zahlenformat (`data-z`); der Zelltext `<b>x</b>` steht jetzt wörtlich da.
     - `components/sanitizeHtml.ts` ist die eine Stelle im Frontend, die fremdes HTML nach einer Erlaubt-Liste
       bereinigt; der Rich-Text (`richTextHtml.ts`) nutzt sie mit seiner eigenen Liste und ohne Attribute.
     - Geprüft mit Wegwerf-Tests (jsdom): docx mit `altChunk` ergibt ohne die Option einen iframe mit dem fremden
       HTML, mit ihr keinen; präparierte Mappe (formatierter Zelltext, Zahlenformat) ergibt nach dem Sanitizer weder
       Tag noch Attribut, verbundene Zellen, Links und Zeilenumbrüche bleiben.
7. Die Mechanik des Abholscheins durchsprechen, dann bauen.
