# Konzept: Galerie über einen Token freigeben

Stand 2026-11-19: **Stück 1 bis 3 gebaut (Freigabe anlegen, auflisten, löschen; Besucherseite; ZIP), Backend über den
Tunnel gegen den Pi getestet.** Seit 2026-11-20 wird der Link gespeichert und steht in der Liste der Freigaben
(Entscheidung 14), der Admin hat eine Übersicht über alle Freigaben (Abschnitt 9), und Kommentare an Bildern gibt es
seit 2026-11-20 (Abschnitt 7, Entity `docu/entities/FileComment.md`). Seit 2026-11-21 ändert und löscht der Admin in
seiner Übersicht jede Freigabe (Entscheidung 18), und jeder Link hat einen QR-Code (Entscheidung 19). Entity:
`docu/entities/GalleryShare.md`.

**Nicht verwechseln:** Dieses Konzept ist die Freigabe einer ganzen Galerie über einen Link mit Token (Freunde sehen
die Bilder ohne Anmeldung und ohne Passwort). Die ältere Freigabe mit Abholtoken ist ein anderer Anwendungsfall und
bleibt davon getrennt (Nutzer 2026-11-19: „trenne das sauber in zukunft“).

## 1. Was der Nutzer will (2026-11-19)

Beispiel: Er lädt seine Urlaubsbilder in eine Galerie, verschlagwortet und beschreibt sie und gibt die Galerie dann über
einen Link weiter. Wer den Link hat, sieht die Galerie **ohne Anmeldung**.

- Die Kachelansicht der Galerie, der Viewer und der Download: einzelne Bilder, eine Auswahl (beliebig viele Kacheln
  anwählen) oder alle.
- Mehrere Freigaben einer Galerie laufen nebeneinander.
- Will ein Besucher bewerten oder kommentieren, kommt der Hinweis „melde dich kostenlos an“.
- Die Freigabe läuft parallel zu den anderen Wegen (Sichtbarkeit, Freunde, die Freigabe mit Abholtoken) und hängt von
  keinem davon ab.

## 2. Entscheidungen des Nutzers (2026-11-19)

1. **Token im Dokument:** Jedes Bild der Galerie trägt die Freigabe in einem mehrwertigen Feld im Kern `FILE`. Im
   Solr-Manager liest das Feld nur `ADMIN` („Wer liest“).
2. **Wer freigibt:** wer `ADMIN` ist ODER das Recht `FREIGABE` hat, und nur die eigene Galerie.
3. **Laufzeit:** in der eigenen Galerie unter „Freigabe“ einstellbar: dauerhaft, zeitlich begrenzt oder auf Aufrufe
   begrenzt. Das steht in Postgres und wird getrennt geprüft, nicht über den Solr-Filter.
4. **Aufruf:** Ein Bild wird heruntergeladen oder der Viewer lädt es.
5. **Erteilen:** über alle Bilder der Galerie in Solr gehen und die Freigabe hineinschreiben. Die Zahl der Bilder in
   Postgres mitführen, als Fehlerkontrolle.
6. **Der Token ist ein dauerhaftes Access-Token, keine Abholscheine:** Link `<host>/share/galerie/<token>`,
   **ohne Galerie-id**: Die Freigaben stehen in Postgres, der Token löst die Galerie und ihre Bilder auf. Mit genau
   diesem Token holt man auch die Dateien, solange er gültig ist und im Feld des Dokuments steht.
7. **Felder:** Der Admin sieht auf der Seite erst einmal alle. Was ein Besucher sieht, legt der Nutzer fest, wenn das
   Modul steht.
8. **EXIF:** Der Besucher darf sie sehen, und sie bleiben in der Datei. Download ist das Original.
9. **Bewertungen und Kommentare:** werden allen angezeigt, auch Besuchern. Eintragen kann nur ein angemeldeter User.
10. **Große Galerien:** Die Urlaubsgalerie wird 50 bis 100 GB groß. Der Download muss auf dem Pi speicherschonend
    laufen.
11. **Reihenfolge:** Code zuerst lokal, dann testen über die gemappten Ports (Postgres und Solr auf dem Pi werden dabei
    erweitert), danach auf den Pi schieben und neu bauen.
12. **Bezeichnung:** Jede Freigabe hat eine Bezeichnung, z. B. „für Oma“.
13. **Löschen, immer in dieser Reihenfolge:** zuerst die Freigabe aus den Solr-Dokumenten nehmen, erst danach die Zeile
    in Postgres löschen. Geht in Solr etwas schief, stehen die Daten der Freigabe noch in Postgres, und der Vorgang
    lässt sich neu starten.
14. **Der Link wird gespeichert (2026-11-20):** „das token im link ist einfach ein zugangslink den ich anderen schicken
    werde“. Der Besitzer sieht den Link in der Liste seiner Freigaben jederzeit wieder und kann ihn kopieren. Der Token
    steht dafür in Postgres an der Freigabe.
15. **Kommentare in der Kachelansicht asynchron (2026-11-20):** „kommentare würde ich auch schon in der kachelansicht
    asychron nachladen, die brauch ich noch nicht instantan“. Die Kacheln kommen sofort, die Kommentare lädt die Ansicht
    danach nach (Abschnitt 7).
16. **Neue Bilder gehören dazu (2026-11-20):** „dass auch weitere Bilder, die in einer Galerie hochgeladen werden, dann
    auch freigegeben werden, solange diese Freigabe existiert“. Jedes Bild, das in eine freigegebene Galerie
    hochgeladen wird, trägt alle ihre Freigaben (Abschnitt 4.4).
17. **Übersicht für den Admin (2026-11-20):** „eine allgemeine Freigabenübersicht […] um alle Freigaben anzuzeigen für
    einen Admin“ (Abschnitt 9).
18. **Der Admin ändert und löscht (2026-11-21):** „ich will im admin freigabemodul auch die freigabe bearbeiten
    können […] also löschen oder eben bearbeiten, limits ändern oder sonstiges“ (Abschnitt 9).
19. **QR-Code zum Link (2026-11-21):** „einen qr code als popup […], dass freunde sich den freigabelink speichern
    können“, und: „Bau den QR-Code auch gefälligst so, dass ich ihn für alle anderen Links auch benutzen kann.“ Der
    QR-Code ist deshalb ein globaler Baustein und hängt am globalen Link-Baustein (Abschnitt 4.7).

## 3. Sicherheit: zwei Schlösser

Ein Besucher bekommt ein Bild nur, wenn **beides** stimmt:

| Schloss | Wo | Frage |
|---|---|---|
| Freigabe | Postgres, Tabelle `gallery_share` | Gibt es sie? Nicht abgelaufen? Aufrufe übrig? |
| Bild | Solr, Feld `galleryShareTokenHashes` im Dokument | Trägt das Bild genau diese Freigabe, und ist es nicht gelöscht? |

- **In Solr steht nur der Hash**, der SHA-256 des Tokens, nie der Token. Grund: Das Doku-Werkzeug schreibt das erste
  Dokument eines Solr-Exports nach `docu/solr-cores/FILE.md` (öffentliches Repo), und Solr schreibt jeden Filter in
  sein Log. Mit dem Hash lässt sich kein Link bauen.
- **In Postgres steht der Token selbst** (Spalte `share_token`, Entscheidung 14), daneben sein Hash zum Nachschlagen.
  Nur der Besitzer der Galerie bekommt ihn (`POST /api/gallery-share`, `POST /api/gallery-share/resolve`), dazu der
  Admin in seiner Übersicht (`GET /api/admin/gallery-share`, Abschnitt 9). Folge, die
  man kennen muss: Wer die Tabelle `gallery_share` lesen kann (Datenbank-Zugang, ein Dump), hat die Links.
- **Ein Hash ohne Zeile öffnet nichts.** Bleibt nach einem Fehler ein Hash in einem Dokument stehen, fehlt das erste
  Schloss.
- **Der Besucher schickt keine Galerie-id.** Im Link steht nur der Token; welche Galerie gemeint ist, steht in der
  Zeile der Freigabe.
- **Der Token:** 32 Byte aus `SecureRandom` als 64 Hex-Zeichen (`Helper.createRandomHexToken`,
  `gebiter.gallery-share.token-bytes`). Er lässt sich nicht erraten und geht ohne Umkodierung in eine Adresse.
- **Werte in Solr-Filtern** gehen nur über den term-Parser hinein, wie überall.
- **Das Feld setzt nur das Backend.** Im Solr-Manager: „vom Client“ aus, „Wer liest“ `ADMIN`.

## 4. Stück 1: Freigabe anlegen (Backend gebaut)

### 4.1 Tabelle `gallery_share` (Entity `GalleryShare`)

| Feld | Typ | Was |
|---|---|---|
| `id` | Long | |
| `galleryId` | Long | die freigegebene Galerie |
| `label` | String, Pflicht | die Bezeichnung, z. B. „für Oma“ (höchstens `gebiter.gallery-share.label-max-length`) |
| `shareToken` | String, Pflicht, eindeutig | der Token für den Link, 64 Hex-Zeichen (seit 2026-11-20) |
| `shareTokenHash` | String, 64, eindeutig | SHA-256 des Tokens; derselbe Wert steht in den Solr-Dokumenten |
| `expiresAt` | Zeitpunkt, darf fehlen | bis wann sie gilt |
| `maxAccessCount` | Long, darf fehlen | wie viele Aufrufe höchstens |
| `accessCount` | long | wie viele Aufrufe es schon gab |
| `fileCount` | long | in wie vielen Bildern der Hash stehen soll |
| `createdAt` | Zeitpunkt | wann angelegt |

Dauerhaft heißt: `expiresAt` und `maxAccessCount` fehlen beide. Höchstens eins von beiden darf gesetzt sein. Wem die
Freigabe gehört, steht nicht in der Tabelle: Das sagt die Galerie.

### 4.2 Feld im Kern `FILE`

`galleryShareTokenHashes` (`gebiter.file.field.gallery-share-token-hashes`): STRING, mehrwertig, indexiert, gespeichert,
„vom Client“ aus, Suchgewicht -1, „Wer liest“ `ADMIN`. Angelegt am 2026-11-19: Zeile `solr_field` id 42 und Feld im Schema des Kerns `FILE` auf dem Pi.

### 4.3 Ablauf beim Anlegen (`GalleryShareService.createOwnGalleryShare`)

1. Prüfen: Recht (`ADMIN` oder `FREIGABE`), Bezeichnung, Grenzen, die Galerie gehört dem User.
2. Token würfeln, die Zeile mit ihm und seinem Hash anlegen.
3. Alle aktiven Bilder der Galerie lesen und den Hash aufnehmen: Atomic Update `add-distinct`, eine Anfrage, ein Commit.
   `add-distinct` statt `set`, damit zwei gleichzeitig angelegte Freigaben sich nicht gegenseitig überschreiben.
4. Die Zahl der beschriebenen Bilder als `fileCount` festhalten.
5. Antwort: die Freigabe mit ihrem Token (`GalleryShareForClient`), so wie sie auch die Liste liefert.

Scheitert Schritt 3, rollt die Transaktion zurück, und der Hash kommt aus den schon beschriebenen Bildern wieder heraus.

### 4.4 Die Zahl der Bilder bleibt aktuell

| Anlass | Stelle | Wirkung |
|---|---|---|
| Upload in die Galerie | `FileUploadService.uploadFileIntoGallery` | das neue Dokument bekommt die Hashes aller Freigaben der Galerie; nach dem Anlegen `fileCount` +1 |
| Bild weich gelöscht | Meldung `FileDocumentSoftDeletedEvent`, gehört vom `GalleryShareService` | `fileCount` -1 |

**Die Kontrolle:** `POST /api/gallery-share/resolve` liefert je Freigabe `fileCount` (Postgres) und `sharedFileCount`
(Solr: aktive Dokumente, die den Hash tragen). Sind die Zahlen verschieden, stimmt etwas nicht. Beispiel: Eine Freigabe
und ein Upload laufen im selben Moment; das neue Bild bekommt den Hash nicht mehr, gezählt wird es trotzdem: Postgres 10,
Solr 9.

**Neue Bilder einer freigegebenen Galerie (Entscheidung 16, geprüft 2026-11-20):** Der Upload in die Galerie
(`POST /api/gallery/upload`, `FileUploadService.uploadFileIntoGallery`) liest zu Beginn der Anfrage alle Freigaben der
Galerie (`GalleryShareService.prepareGalleryShareUpload`) und schreibt ihre Hashes gleich mit ins neue Dokument. Das
Bild gehört damit vom ersten Moment an zu jeder Freigabe; nachträglich wird nichts geschrieben. Ein anderer Weg, auf
dem ein Bild in eine Galerie kommt, existiert nicht (kein Verschieben, kein Wiederherstellen gelöschter Bilder).

**Bekannte Lücke (entschieden 2026-11-20: bleibt so, kein Code dafür):** Die Freigaben werden gelesen, BEVOR die Bytes der Datei
ankommen, das Dokument entsteht erst danach. Wird in dieser Zeit eine Freigabe angelegt, trägt das Bild sie nicht.
Beispiel: Ein Video von 3 GB lädt 20 Minuten in die Galerie „Urlaub“; in Minute 5 entsteht die Freigabe „für Oma“. Das
Anlegen findet das Video noch nicht in Solr, der Upload hat „für Oma“ nicht gelesen: Oma sieht das Video nicht, in der
Liste steht „41 von 42“. Betroffen sind nur Dateien, die genau beim Anlegen unterwegs sind (höchstens
`VITE_UPLOAD_MAX_PARALLEL_UPLOADS`, also 2). Ein Weg, das ohne neuen Link zu richten, fehlt: Löschen und neu Anlegen
ändert den Link. Der Nutzer dazu: „sehe auch keinen Grund für so einen Blödsinn extra Code zu opfern“.

### 4.5 Endpunkte

| Methode | Pfad | Was |
|---|---|---|
| POST | `/api/gallery-share` | eigene Galerie freigeben: `{galleryId, label}`, dazu wahlweise `expiresAt` oder `maxAccessCount` |
| POST | `/api/gallery-share/resolve` | die Freigaben einer eigenen Galerie, je mit ihrem Token für den Link: `{galleryId}` |
| DELETE | `/api/gallery-share` | eine Freigabe einer eigenen Galerie löschen: `{id}` |
| GET | `/api/admin/gallery-share` | nur ADMIN: alle Freigaben aller Galerien (Abschnitt 9) |
| PUT | `/api/admin/gallery-share` | nur ADMIN: Bezeichnung und Laufzeit einer beliebigen Freigabe ändern: `{id, label, expiresAt, maxAccessCount}` |
| DELETE | `/api/admin/gallery-share` | nur ADMIN: eine beliebige Freigabe löschen: `{id}` |

### 4.6 Löschen (gebaut)

Die Reihenfolge ist fest (Entscheidung 13): **erst Solr, dann Postgres.** Solange die Zeile steht, weiß das Backend,
welcher Hash aus den Dokumenten muss.

**Freigabe löschen** (`GalleryShareService.deleteOwnGalleryShare`), darf der Besitzer der Galerie, auch ohne das Recht
zum Anlegen:

1. Prüfen: Es gibt die Freigabe, ihre Galerie gehört dem User.
2. Alle Dokumente lesen, die den Hash tragen. Gesucht wird nach dem Hash, nicht nach der Galerie, und in jedem Status:
   So kommt er auch aus weich gelöschten Bildern heraus.
3. Den Hash aus diesen Dokumenten nehmen (Atomic Update `remove`, eine Anfrage, ein Commit).
4. Nachlesen: Trägt noch ein Dokument den Hash, bricht das Löschen ab, die Zeile bleibt.
5. Die Zeile in Postgres löschen.

Beispiel für den Neustart: Die Galerie hat 200 Bilder, Solr fällt in Schritt 3 aus. Die Zeile steht noch, der Link
öffnet noch. Der Besitzer klickt noch einmal auf Löschen: Schritt 2 findet genau die Bilder, die den Hash noch tragen.

**Galerie löschen** (`GalleryService.deleteOwnGallery`): Vor allem anderen geht die Meldung `GalleryDeletedEvent` hinaus
(Muster `FileExtensionDeletedEvent`, so braucht der `GalleryService` den `GalleryShareService` nicht, kein Kreis). Der
`GalleryShareService` löscht daraufhin jede Freigabe der Galerie wie oben. Scheitert das, bleibt die Galerie bestehen.
Danach wie bisher: Die Bilder verlieren die Galerie und werden privat, die Galerie wird gelöscht.

**Bekannter Rest:** Läuft genau während des Löschens ein Upload in dieselbe Galerie, kann das neue Bild den Hash noch
bekommen. Er öffnet nichts (die Zeile ist weg, der Token war Zufall und kommt nie wieder), steht aber als Rest im
Dokument.

### 4.7 Oberfläche in der eigenen Galerie (gebaut)

Die eigene Galerie hat im Subheader den Reiter „Freigabe“ (`GallerySharePage`, Adresse
`/profile/<guid>/galleries/<id>/share`; Nutzer 2026-11-20: ein eigener Reiter, nicht unter allen Bildkacheln). Darin
steht die Box „Freigaben von „<Galerie>“ über einen Link“ (`GalleryShareBox`):

- die Liste der Freigaben als Tabelle (Bezeichnung, Link, gilt, Aufrufe, Bilder, angelegt), je Zeile Löschen nach der
  Sicherheitsabfrage. Weicht die Zahl der Bilder in Solr von der in Postgres ab, stehen beide da („8 von 9“);
- in der Spalte „Link“ steht der Link zum Weitergeben, zum Anklicken (die Besucherseite geht in einem neuen Tab auf),
  mit dem Knopf zum Kopieren und daneben dem Knopf für den QR-Code (seit 2026-11-21): Ein Klick zeigt den Link groß
  als QR-Code in einem Popup, darunter die Adresse als Text. Beispiel: Der Besitzer öffnet am Laptop den QR-Code von
  „für Oma“, ein Freund scannt ihn mit der Kamera seines Handys, die Galerie geht dort ohne Anmeldung auf, und er
  speichert die Seite als Lesezeichen. Der Code wird im Browser gezeichnet (`components/QrCode`, npm `qrcode`), der
  Link geht dafür an keinen fremden Dienst. Knopf samt Popup sind der globale Baustein `components/QrCodeButton`; der
  globale `CopyableLink` bietet ihn über die Angabe `qrCode` an, also an jedem Link der Plattform;
- rechts im Kopf „neue Freigabe“ als geführter Ablauf (`NewGallerySharePopup`): 1. Bezeichnung, 2. Laufzeit (dauerhaft,
  bis zu einem Zeitpunkt, für eine Zahl von Aufrufen; die Eingabe erscheint erst mit der Wahl), 3. der Link zum
  Kopieren, ebenfalls mit QR-Code.
- Den Knopf sieht nur, wer `ADMIN` ist oder das Recht `FREIGABE` hat (`VITE_GALLERY_SHARE_ACCESS_ROLE_KEY`). Ohne das
  Recht steht im Fuß der Box, wer anlegen darf; vorhandene Freigaben sieht und löscht der Besitzer weiter.

**Der Link bleibt abrufbar** (Entscheidung 14, gebaut 2026-11-20): Er steht nach dem Anlegen im dritten Schritt und
danach dauerhaft in der Liste, solange es die Freigabe gibt. Beispiel: Die Freigabe „für Oma“ ist drei Wochen alt, der
Besitzer öffnet seine Galerie, klickt in der Zeile „für Oma“ auf „kopieren“ und schickt den Link noch einmal. Bis zum
2026-11-19 war der Link nur einmal beim Anlegen zu sehen (gespeichert war nur der Hash); das war nicht gewollt.

## 5. Stück 2: Besucherseite (gebaut)

Seite `<host>/share/galerie/<token>` (`GalleryShareVisitorPage`), ohne Anmeldung, auch für Angemeldete erreichbar.
Dieselbe Bildkachel und derselbe Viewer wie in der Galerie, mit den Adressen unter dem Token.

### 5.1 Adressen (Nutzer 2026-11-19)

Alles hängt unter dem Token. Für diese Adressen gilt die Ausnahme von der Regel „GET nur mit einem Wert“: zwei Werte
(Token und Datei-id), beide reines Hex mit fester Länge.

| Methode | Pfad | Was | zählt als Aufruf |
|---|---|---|---|
| GET | `/api/share/token/{token}` | die Standardansicht: die Galerie und die erste Seite ihrer Bilder | nein |
| POST | `/api/share/token/{token}/resolve` | eine weitere Seite, Body `{"page": 2}` | nein |
| GET | `/api/share/token/{token}/comment/{fileId}` | die Kommentare eines Bildes, nur lesen (seit 2026-11-20) | nein |
| GET | `/api/share/token/{token}/view/{fileId}` | ein Bild für den Viewer (HEIF als JPEG) | 1 |
| GET | `/api/share/token/{token}/download/{fileId}` | ein Bild herunterladen, das Original | 1 |
| POST | `/api/share/token/{token}/selection` | eine Auswahl als ZIP; Formularfeld `fileIds`, ids durch Komma getrennt | je Bild 1 |
| GET | `/api/share/token/{token}/download/all` | alle Bilder als ZIP | je Bild 1 |

Controller `GalleryShareShareController` (der Name folgt der Regel `XShareController` zur Klasse `GalleryShare`), Service
`GalleryShareVisitorService`.

### 5.2 Was bei jeder Anfrage geprüft wird

Nichts davon lässt sich überspringen, und jede Anfrage prüft neu:

1. **Form des Tokens** (64 Zeichen Hex, Kleinbuchstaben), bevor irgendetwas anderes mit ihm geschieht.
2. **Schloss eins, Postgres** (`GalleryShareService.getValidGalleryShare`): Gibt es eine Freigabe mit dem SHA-256 des
   Tokens? Nicht abgelaufen? Aufrufe übrig? Jeder dieser Fälle sieht gleich aus: 404, „Diese Freigabe gibt es nicht,
   oder sie gilt nicht mehr.“
3. **Schloss zwei, Solr** (`FileDocumentResolveService.createGalleryShareFilterQueries`, die eine Stelle für jeden
   Leseweg eines Besuchers). Ein Bild gehört nur dazu, wenn es den Hash dieser Freigabe trägt, in der Galerie der
   Freigabe steht (die id kommt aus Postgres, nie vom Besucher) und aktiv ist.
4. **Zählen vor dem ersten Byte** (`GalleryShareService.countGalleryShareAccesses`): Eine SQL-Anweisung zählt und
   prüft zugleich noch einmal Ablauf und Grenze. Zwei gleichzeitige Abrufe können die Grenze so nie gemeinsam
   überschreiten. Abgewiesene Abrufe zählen nicht.

Dazu:

- **Kein Besucherweg fragt nach dem angemeldeten User.** Rollen und GUID gibt es dort nicht. Die Leserollen der
  FileClass und die Sichtbarkeit gelten für die Freigabe bewusst nicht: Sie ist ein eigener Weg, den der Besitzer
  ausdrücklich geöffnet hat.
- **Jede Anfrage nach einem Bild zählt**, auch eine nach einem Byte-Bereich (Range). Sonst ließe sich eine Grenze der
  Aufrufe mit Teil-Anfragen umgehen. Die Kacheln (Vorschau aus dem Dokument) zählen nicht.
- **Felder:** Ein Besucher ohne Anmeldung bekommt nur `gebiter.gallery-share.visitor-field-names` (id, Dateiname,
  Beschreibung, Tags, Endung, Typ, Größe, Datum, Stimmen, Vorschau, Bildmaße, Aufnahmedatum, Kamera). Pfad auf dem
  SFTP, die Hashes der Freigaben und „lesbar für Freunde von“ weist das Backend schon beim Start ab, falls sie in der
  Liste stehen. Ein angemeldeter Betrachter bekommt die Felder, die er nach seinen Rechten ohnehin liest (der Admin
  also alle). GPS steht nicht in der Liste; im heruntergeladenen Original bleiben alle EXIF-Daten (Entscheidung 8).
- **Deckel für Besucher:** höchstens `max-parallel-deliveries` (4) Abrufe gleichzeitig, davon höchstens
  `max-parallel-zip-downloads` (2) ZIP. Wird in `delivery-wait` (10 s) kein Platz frei: 429 mit `Retry-After`. Der
  SFTP-Broker hat 10 Verbindungen, so bleibt für angemeldete User immer Platz.
- **Der Token steht in der Adresse:** nginx schreibt `/api/share/token/…` und `/share/galerie/…` in kein Log; die
  Antworten tragen `Referrer-Policy: no-referrer`. Das Backend loggt nie den Token, nur die id der Freigabe.
- **Auslieferung** wie bei jeder Datei: `nosniff`, `Content-Security-Policy: sandbox`, inline nur erlaubte Typen.

### 5.3 Oberfläche

- Kacheln wie in der Galerie; in der Kopfzeile jeder Kachel ein Kästchen zum Auswählen, darunter der Download des
  Bildes. Über den Kacheln: „Alle auf dieser Seite auswählen“, „Auswahl aufheben“, „Auswahl herunterladen (n)“. Die
  Auswahl bleibt beim Blättern erhalten. Rechts im Kopf „Alle herunterladen“.
- Die Auswahl geht als Formular (POST) an das Backend, „alle“ ist ein Link: Nur so schreibt der Browser das ZIP direkt
  auf die Platte, statt viele GB im Speicher zu halten.
- **Stimmen:** Die Zahlen (begeistert, angewidert) sieht jeder. Ein Klick ohne Anmeldung zeigt „Melde dich doch
  kostenlos an, dann kannst du die Bilder bewerten und kommentieren.“ mit dem Knopf zur Anmeldung.
- Im Fuß: Zahl der Bilder, „Link gültig bis …“, „noch n Aufrufe“.

## 6. Stück 3: Auswahl und alle als ZIP (gebaut)

`FileDownloadService.streamFileDocumentsAsZip`, gebaut für Galerien von 50 bis 100 GB auf dem Pi (Entscheidung 10):

- **Nichts liegt je als Ganzes im Speicher oder auf der Platte.** Datei für Datei läuft vom SFTP (oder aus dem
  Upload-Puffer) durch einen festen Puffer direkt in die Antwort. Der Speicherbedarf ist gleich, ob das ZIP 10 MB oder
  100 GB hat. Kein `/tmp` (auf dem Pi RAM).
- **Ohne Kompression** (Stufe 0): Bilder und Videos sind schon komprimiert.
- **ZIP64** schreibt Java von selbst ab 4 GB oder 65 535 Einträgen.
- **nginx puffert nicht** (`proxy_buffering off`, schon seit 2026-11-10) und bricht nicht ab, solange Daten fließen.
- **Keine Datenbank-Transaktion** während des Streamens: Ein ZIP von 100 GB läuft Stunden.
- **Dateinamen bereinigt** (`Helper.createSafeFileName`): keine Pfadtrenner, keine Steuerzeichen, kein `..`; gleiche
  Namen bekommen „ (2)“, „ (3)“.
- **Geht bei uns mittendrin etwas schief** (eine Datei fehlt auf dem SFTP), bekommt das ZIP kein Inhaltsverzeichnis,
  und die Verbindung schließt ohne sauberes Ende: Der Browser meldet den Download als fehlgeschlagen. Ein ZIP, das
  vollständig aussieht und dem Bilder fehlen, kann so nicht entstehen.
- **Vor dem ersten Byte** steht fest, welche Bilder hineinkommen: Bei einer Auswahl muss jedes gewählte Bild zur
  Freigabe gehören, sonst gibt es kein ZIP. Die Aufrufe für alle Bilder werden zusammen gezählt; reichen sie nicht,
  gibt es kein ZIP. Eine Auswahl hat höchstens `selection-max-file-count` (2000) Bilder.

**Grenzen, die man kennen muss:**

- Die Gesamtgröße steht vorher nicht fest (die Antwort geht in Stücken hinaus): Der Browser zeigt keinen
  Fortschritt in Prozent.
- Ein abgebrochener ZIP-Download lässt sich nicht fortsetzen, er beginnt von vorn. Für 100 GB über eine wackelige
  Leitung ist die Auswahl in mehreren Teilen der sichere Weg.

## 7. Stück 4: Bewertungen und Kommentare

- **Gebaut:** Die Stimmen sind auf der Besucherseite für alle zu sehen, mit dem Hinweis zur Anmeldung beim Klick.
- **Gebaut 2026-11-20: Kommentare an Bildern** (Entity `FileComment`, `docu/entities/FileComment.md`; Nutzer: „so eine
  Sprechblase neben die Smileys“):
  - An jeder Bildkachel steht neben den beiden Smileys die Sprechblase mit der Zahl der Kommentare. Ein Klick öffnet
    das Bild groß; dort steht der Verlauf rechts neben dem Bild (auf einem schmalen Bildschirm darunter) mit dem Feld
    zum Schreiben. Derselbe Bereich steht auf der Seite einer Datei.
  - Entscheidung 15 gilt: Die Kacheln kommen sofort, die Zahl lädt jede Kachel danach selbst nach, den Verlauf erst,
    wer ihn öffnet.
  - Besucher über den Link lesen mit (Entscheidung 9): Die Zahl je Bild kommt mit der Seite der Freigabe, der Verlauf
    über `…/comment/{fileId}`. Statt des Felds zum Schreiben steht „Zum Kommentieren anmelden“. Die Autoren kommen
    mit dem Verlauf, nach der Sichtbarkeit ihres Profils (privat: „Anonym“).
  - Gezeichnet wird mit globalen Bausteinen, die auch das Gästebuch nutzt (`components/CommentItem`, `AuthorHead`,
    `RichTextForm`, `ConfirmDeleteButton`).
  - Erstes Stück: keine Antworten auf Kommentare, keine Smileys an Kommentaren, kein Löschen durch den Admin.

## 8. Noch offen

1. ~~Kommentare an Bildern~~: gebaut 2026-11-20 (Abschnitt 7). Offen daran: Löschen durch den Admin.
2. Welche Felder ein Besucher sieht: legt der Nutzer fest, sobald er die Seite gesehen hat (Entscheidung 7). Bis dahin
   gilt die Liste aus der YAML.
3. ~~Das Recht `FREIGABE` gibt es in `access_role` noch nicht~~: seit 2026-11-20 angelegt.
4. ~~Die Lücke beim Upload während des Anlegens einer Freigabe~~: entschieden, bleibt so (Abschnitt 4.4).

## 9. Übersicht des Admins über alle Freigaben (gebaut 2026-11-20, Ändern und Löschen 2026-11-21)

Der Admin sieht alle Freigaben aller Galerien an einer Stelle (Entscheidung 17): in der Administration der Reiter
„Freigaben“ (`/admin/gallery-share`, `admin/galleryshare/GalleryShareTab`).

- **Endpunkt:** `GET /api/admin/gallery-share` (`GalleryShareAdminController`, nur ADMIN), Service
  `GalleryShareService.getAllGalleryShare`. Antwort: je Freigabe ein `GalleryShareForAdmin`: die Freigabe, wie sie ihr
  Besitzer sieht (`GalleryShareForClient`, also mit Token und beiden Zahlen der Bilder), dazu `galleryTitle` und
  `ownerUsersGuid`. Die neueste Freigabe steht oben.
- **Tabelle:** Besitzer (Avatar und Name, führt aufs Profil), Galerie (Titel, führt zur Galerie), dann dieselben
  Spalten wie in der Liste des Besitzers (`galleryShareColumns.tsx`): Bezeichnung, Link mit „kopieren“ (globaler
  Baustein `components/CopyableLink`), gilt, Aufrufe, Bilder, angelegt. Im Fuß die Zahl der Freigaben. Eigene
  Komponenten hat der Reiter nicht: `Table`, `UsersGuidName`, `StatusMark` und `ContentBox` sind global.
- **Ändern in der Zeile (Entscheidung 18, gebaut 2026-11-21),** wie in jeder Tabelle über ein kleines Popup:
  - Klick auf die **Bezeichnung** öffnet das Popup für den Text (`components/EditTextPopup`).
  - Klick auf **„Gilt“** öffnet das Popup für die Laufzeit (`gallery/EditGalleryShareDurationPopup`): dieselben
    Eingaben wie beim Anlegen (`GalleryShareDurationFields`: dauerhaft, bis zu einem Zeitpunkt, für eine Zahl von
    Aufrufen), vorbelegt mit dem Stand der Freigabe; darunter steht, wie viele Aufrufe schon gezählt sind.
    Beispiel: „Für alle“ gilt dauerhaft und hat 2 Aufrufe; der Admin wählt „Für eine Zahl von Aufrufen“, trägt 500
    ein, in der Zeile steht danach „für 500 Aufrufe“. Der Link ist derselbe geblieben.
  - Endpunkt `PUT /api/admin/gallery-share`, Service `GalleryShareService.changeGalleryShare`. Geändert wird nur die
    Zeile in Postgres, mit einer gezielten Anweisung (`GalleryShareRepository.changeLabelAndLimits`): Die Zähler
    (`accessCount`, `fileCount`) fasst sie nicht an, damit ein Aufruf, der im selben Moment gezählt wird, nicht
    überschrieben wird. Token, Galerie und die Bilder in Solr bleiben, wie sie sind.
  - Regeln: höchstens eine Grenze; ein NEUER Ablauf muss in der Zukunft liegen, ein unveränderter darf vergangen
    sein (so lässt sich an einer abgelaufenen Freigabe noch die Bezeichnung ändern); eine Zahl von Aufrufen unter
    den schon gezählten ist erlaubt und verbraucht den Link sofort. Die Zahl der bisherigen Aufrufe setzt niemand
    zurück.
- **Löschen (Entscheidung 18, gebaut 2026-11-21):** der Mülleimer am Ende der Zeile, nach der Sicherheitsabfrage.
  Endpunkt `DELETE /api/admin/gallery-share`, Service `GalleryShareService.deleteGalleryShare`, derselbe Kern wie
  beim Besitzer (Abschnitt 4.6: erst Solr, dann Postgres). Geht auch für einen Rest, dessen Galerie es nicht mehr
  gibt: Gesucht wird nach dem Hash, nicht nach der Galerie.
- Angelegt wird eine Freigabe weiter in ihrer Galerie, im Reiter „Freigabe“. Der Besitzer ändert dort nichts (nur
  anlegen und löschen); das Ändern gibt es bisher nur für den Admin.
- **Der Admin sieht den Link jeder Freigabe.** Er liest ohnehin jede Datei; der Link ist kein Geheimnis vor ihm.
- **Reste fallen auf:** Steht eine Freigabe an einer Galerie, die es nicht mehr gibt, bleibt sie in der Liste, mit der
  Warnung „Galerie gibt es nicht mehr“ und ohne Besitzer. Beispiel: „8 von 9“ in der Spalte „Bilder“ zeigt hier für
  jede Galerie, wo der Stand in Solr von dem in Postgres abweicht.
- Eine fremde private Galerie öffnet der Klick auf den Titel nicht (der Admin hat beim Lesen von Galerien keinen
  Sonderweg); ihre Bilder sieht er über den Link der Freigabe.
- Ein Besitzer mit privatem Profil erscheint wie überall als „Anonym“ (`UsersGuidName`).
