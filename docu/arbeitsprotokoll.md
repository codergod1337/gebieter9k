# Arbeitsprotokoll

Woran Claude gerade arbeitet. Nach einem Absturz steht hier, wo es weitergeht. Der neueste Eintrag steht oben.

- Vor jedem Auftrag: Eintrag mit Uhrzeit, der Ansage des Nutzers und dem Plan.
- Nach jedem Schritt: Stand nachziehen (geänderte Dateien, was als Nächstes kommt).
- Fertiges bleibt als eine Zeile stehen. Einzelheiten stehen in `setup.md` (Bau auf dem Pi) und in den Konzepten.

## Reihenfolge der nächsten Arbeiten (Nutzer, 2026-11-11 14:20)

1. Markt (Shop) bauen.
2. Rechte der FileClass updaten (`WRITER` wird „darf hochladen“, dazu „Metadaten bearbeiten“).
3. Danach den Dateizugriff besprechen, an echten Datensätzen und konkreten Fällen; dann wird noch einmal umgebaut.
4. Die Suche kommt nach dem Markt (`konzept-file-kern.md`, Abschnitt 14).

## 2026-11-11 23:35 – Anleitung für einen neuen Rechner ins Repo (fertig, auf GitHub)

- Ansage: „ist jetzt der Stand endlich auf Git? So komplett, dass wir loslegen können auf einem anderen Rechner. Also
  Doku hat ja hoffentlich alle Anleitungen drin, wie man das Ding initialisiert. Ja, nein, vielleicht.“
- Antwort: Nein. Der Code ist vollständig auf GitHub, aber die Anleitung (`docu/setup.md`, privat, mit echten
  Zugangsdaten) und `code/.env` sind bewusst nicht im öffentlichen Repo; ein frischer Klon hat keine Anleitung.
- Plan: `docu/neuer-rechner.md` schreiben, ohne Geheimes: was man installiert, was man von Hand mitnimmt (`code/.env`,
  `docu/setup.md`, `Vollidiot/`), Zertifikat des Dev-Servers, Backend und Frontend starten, Git und Push. Den Verweis
  in `code/frontend/vite.config.ts` darauf umstellen. Commit und Push.
- Stand 23:50: FERTIG. `docu/neuer-rechner.md` geschrieben (aus `setup.md` Abschnitt 4, `start.sh`, `vite.config.ts`,
  `.env.example`; ohne Zugangsdaten), `vite.config.ts` verweist darauf (nur Kommentar und Fehlermeldung des Dev-Servers,
  kein Bau auf dem Pi nötig). Die Schritte selbst habe ich auf keinem zweiten Rechner ausprobiert.
- OFFEN: Der Nutzer muss `code/.env`, `docu/setup.md` und `Vollidiot/` selbst auf den anderen Rechner bringen.

## 2026-11-11 23:00 – GitHub-Anmeldung über den Browser (fertig)

- Ansage: „Wir brauchen kein Access-Token […] Wir können uns ganz normal im Browser anmelden […] Mach das.“
- Plan: GitHub CLI (`gh`) über Homebrew installieren, `gh auth login --web` (Anmeldung im Browser mit Einmal-Code),
  `gh auth setup-git` (git nimmt für github.com den Zugang von `gh`), danach Push mit dem normalen `git` prüfen.
- Stand 23:25: FERTIG. `gh` 2.103.3 installiert (`brew install gh`), angemeldet als `codergod1337` über den Browser
  (Einmal-Code auf github.com/login/device; der erste Versuch scheiterte, weil der Nutzer den Code nicht sah und den Tab
  schloss, beim zweiten stand der Code vorher im Chat). `gh auth setup-git` hat in `~/.gitconfig` für github.com den
  Helfer `gh auth git-credential` eingetragen. Ab jetzt: einfach `git push`, ohne Schlüsselbund-Fenster.

## 2026-11-11 22:16 – Projekt nach GitHub (fertig, auf GitHub)

- Ansage: „ich habe jetzt auf GitHub ein Repo erstellt, da müssten wir jetzt unseren geistigen Erguss noch hinpushen.
  Kannst du die Git-Ignore vernünftig setzen, dass nur das an Code hochkommt, was wir brauchen. Also tendenziell würde
  ich gerne den Ordner Code und den Ordner Doku in Git pushen. Würde das Sinn machen?
  https://github.com/codergod1337/gebieter9k“
- Plan: 1. ansehen, was in `code/` und `docu/` liegt (Größen, fremde Vorlage, Bau-Ergebnisse). 2. Nach Geheimem suchen
  (`.env`, Zugänge in `setup.md`, Schlüssel, Zertifikate, persönliche Daten), nichts davon darf hoch. 3. `.gitignore`
  im Projektordner: nur `code/` und `docu/`, ohne Bau-Ergebnisse und Geheimes. 4. `git init`, Liste der Dateien prüfen,
  Commit, Remote, Push.
- Stand 22:40: Repository im Projektordner angelegt (`git init`, Zweig `main`), `.gitignore` im Projektordner, ein Commit
  mit 883 Dateien (4,9 MB), Remote `origin` = `https://github.com/codergod1337/gebieter9k.git`.
  - Im Repository: `code/` (Backend, Frontend, `compose.yaml`, `.env.example`, Solr-Configset) und `docu/`.
  - Draußen: `code/.env`, `docu/setup.md` (echte Passwörter und Schlüssel), `code/vorlage/` (eigenes Repository,
    3,5 GB), `node_modules`, `target`, `dist`, `.cert`, dazu alles außerhalb von `code/` und `docu/` (`mounts/`,
    `Vollidiot/`, `.claude/`).
  - Geprüft über genau die Dateien im Commit: kein Wert aus `code/.env` (Passwörter, Host-Key, TOTP-Schlüssel) und
    nicht das Kennwort des Servers; keine Schlüssel- oder Zertifikatsdateien; keine echte Mail-Adresse.
  - Autor des Commits: `codergod1337` mit der noreply-Adresse von GitHub, nur für dieses Repository gesetzt.
  - Das GitHub-Repo ist ÖFFENTLICH und war beim Prüfen leer.
  - PUSH NICHT ERFOLGT: `git push` blieb am macOS-Schlüsselbund hängen (wartet auf Freigabe bzw. Anmeldung am
    Bildschirm), ich habe ihn beendet; auf GitHub ist nichts angekommen. Der Nutzer schiebt selbst:
    `cd /Users/rottenapple69/dev/gebiter9k && git push -u origin main`.
- Stand 22:45: GEPUSHT. Ansage des Nutzers: Ich soll selbst pushen. Der Weg: `/usr/bin/git push` (das Git von Apple)
  mit Zeitgrenze. Der GitHub-Zugang liegt im macOS-Schlüsselbund; bei jedem Push fragt der Schlüsselbund am Bildschirm,
  bis der Nutzer „Immer erlauben“ klickt. Beim ersten Push wurde erlaubt: `main` auf GitHub steht auf dem ersten Commit
  (883 Dateien). Der zweite Push (nur dieser Protokoll-Stand) wurde im Dialog abgebrochen (Fehler -128); der Commit
  liegt lokal und geht mit dem nächsten Push mit.
- Stand 22:55: Auch der Protokoll-Commit ist gepusht, lokal und GitHub sind gleich. Geklärt: Der GitHub-Zugang liegt
  seit dem 2026-08-31 im Schlüsselbund (`github.com`, Account `codergod1337`); der Dialog beim Push will das
  Anmeldepasswort des Mac und „Immer erlauben“, nicht das GitHub-Passwort.
- OFFEN: seine Entscheidung, ob das Repo öffentlich bleibt; ob
  `mounts/nginx/conf/default.conf` mit hinein soll.

## 2026-11-11 20:52 – Markt: Kaufen (fertig, auf dem Pi; der Nutzer testet)

- Ansage (2026-11-11, steht seit dem Nachmittag als nächstes Stück): „Ich würde aber auch erst dafür sorgen, dass wir
  erstmal Memes hochladen können. Und auch kaufen können.“ Entschieden: Ein Kauf läuft nie ab; 90 % an den Verkäufer,
  10 % Marktgebühr verschwinden.
- Plan (nur dieses Stück; Nutzen, also Zähler herunter, kommt danach):
  1. Backend: `POST /api/shop-order` mit `{shopOfferId}` → `ShopOrderService.createShopOrder`, alles in einer
     Transaktion: Angebot läuft und zählt in EINER Anweisung hoch (`ShopOfferService`), Beleg `ShopOrder`, Punkte des
     Käufers ab und Anteil an den Verkäufer über `UsersPointBookingService` (neue Gründe `SHOP_PURCHASE`, `SHOP_SALE`),
     Besitz `UsersShopItem` in einer Anweisung (anlegen oder aufstocken). Abgelehnt (409): Angebot läuft nicht mehr,
     Punkte reichen nicht, eigener Artikel, schon dauerhaft im Besitz. Gebühr in der YAML
     (`gebiter.shop.market-fee-percent`).
  2. Die Artikel einer Rubrik kommen mit dem, was der Betrachter davon hat (`ShopItemForClient.ownUsersShopItem`).
  3. Frontend: an der Kachel je Angebot der Knopf „Kaufen“ → Popup zur Bestätigung (was, Preis, Punktestand vorher
     und nachher) → „Für x Punkte kaufen“; danach steht an der Kachel, was man hat. Kontobuch im Profil: Texte für die
     neuen Gründe.
  4. Pi-DB vor dem Start: Prüfregel `users_point_booking_booking_reason_check` mit den neuen Gründen neu anlegen.
  5. Doku: `entities/ShopOrder.md`, `UsersShopItem.md`, `ShopOffer.md`, `ShopItem.md`, `UsersPointBooking.md`,
     `konzept-shop.md`, `setup.md`; Notiz `shop-requirements`.
- Stand 21:05: FERTIG und auf dem Pi (Bau 21:00, Start 17,0 s, kein ERROR).
  - Backend neu: `shop/service/ShopOrderService`, `UsersShopItemService`, `shop/controller/ShopOrderController`,
    `shop/repository/ShopOrderRepository`, `UsersShopItemRepository`, `shop/dto/NewShopOrder`,
    `shop/ShopOrderRejectedException` (409). Geändert: `ShopOfferService` (`getShopOffer`,
    `increaseShopOfferPurchaseCount`), `ShopOfferRepository`, `ShopItemService` (`getShopItem`, Besitz in
    `resolveShopItems`), `ShopItemForClient`, `UsersPointBookingService` (`createShopPurchaseBooking`,
    `createShopSaleBooking`), `UsersPointBookingReason`, `GlobalExceptionHandler`, `application.yaml`.
  - Frontend neu: `shop/ShopOrder.ts`, `shop/useShopOrder.ts`, `shop/UsersShopItem.ts`, `market/BuyShopOfferPopup.tsx`.
    Geändert: `market/MarketCategoryTab.tsx`, `market/marketTexts.ts`, `shop/ShopItem.ts`, `users/UsersPointBooking.ts`.
  - Pi-DB: Prüfregel der Buchungsgründe erneuert.
  - Getestet per Wegwerf-Test gegen die Pi-DB (Rollback, Test gelöscht), siehe `entities/ShopOrder.md`. NICHT geprüft:
    Oberfläche im Browser, zwei wirklich gleichzeitige Käufe.
  - Nach dem Bau nur noch ein Kommentar geändert (`users/model/UsersPointBooking.java`, Javadoc): Mac und Pi
    unterscheiden sich in dieser einen Datei, geht mit dem nächsten Bau mit.
  - Beobachtung aus der Pi-DB: Es gibt genau einen User (332 Punkte), einen echten Artikel und ein echtes Angebot
    (50 Punkte, dauerhaft). Zum Kaufen im Browser braucht es einen zweiten User mit Punkten.
- OFFEN, als Nächstes: Nutzen (Zähler herunter). Davor steht laut Reihenfolge des Nutzers: Regel fürs Bearbeiten je
  FileClass festlegen, sobald Memes hochgeladen und gekauft werden können.

## 2026-11-11 20:38 – Markt: jede Rubrik hat genau eine FileClass, der Upload wählt sie nicht mehr (fertig, auf dem Pi; der Nutzer testet)

- Ansage: „ich würde in einer Rubrik, also eine Rubrik für den Markt, würde ich immer eine File-Class voraussetzen. Und
  dann kannst du dir nämlich auch schenken, dass man beim Upload diese File-Class nochmal extra wählen soll oder kann.
  Weil dann kann man das nämlich hart reincoden. Also wie gesagt, pro Rubrik im Markt erstmal das [eintragen]. Und dann
  kannst du das ans Upload-Skript quasi mitgeben, dass es immer drin ist.“
- Plan:
  1. Backend: `ShopCategory` bekommt das Pflichtfeld `fileClassKey` (anlegen und ändern prüfen, dass es die FileClass
     gibt). Der Upload in eine Rubrik setzt die FileClass im Backend aus der Rubrik, der Client schickt keine mehr.
  2. Die Zuordnungstabelle `ShopCategoryFileClass` (mehrere FileClasses je Rubrik) fällt damit weg: Entity, Repository,
     Service, beide Controller, Frontend-Typ und Hook, die Spalten „Markt: …“ im Tab „FileClass-Ziel“.
  3. Frontend: Rubrik anlegen mit Pflicht-Auswahl der FileClass, in der Tabelle der Rubriken änderbar; im Ablauf „neues
     Angebot“ keine Auswahl der FileClass mehr.
  4. Pi-DB im Bau-Skript: Spalte `shop_category.file_class_key` anlegen, aus `shop_category_file_class` füllen (`MEMES`
     → `MEME`, `PROFILE_BANNER` → `PROFILE_BANNER`), Pflicht setzen, Tabelle `shop_category_file_class` löschen.
  5. Doku: `entities/ShopCategory.md`, `entities/ShopCategoryFileClass.md` löschen, `ShopItem.md`, `README.md`,
     `konzept-shop.md`, `konzept-file-kern.md`, `setup.md`; Notizen `shop-requirements`, `upload-paths-per-purpose`.
- Stand 20:50: FERTIG und auf dem Pi (Bau 20:47, Start 16,3 s, kein ERROR).
  - Backend: `ShopCategory.fileClassKey` (Pflicht), `ShopCategoryService` (`createShopCategory` mit FileClass,
    `changeShopCategory` ändert Name und FileClass, neu `getFileClassKeyOfShopCategory`),
    `FileUploadService.uploadFileIntoShopCategory` setzt die FileClass der Rubrik in die Felder (was der Client schickt,
    zählt nicht). Gelöscht: `ShopCategoryFileClass` samt Repository, Service, zwei Controllern.
  - Frontend: Tab „Rubriken“ mit Spalte „FileClass“ (Klick ändert, `EditShopCategoryFileClassPopup`), „neue Rubrik“ mit
    FileClass als Pflicht (`NewKeyDisplayNamePopup` bekam `extraFields`); `FileUploadForm` kennt `fixedFileClass` (nur
    gezeigt, keine Auswahl); Markt nutzt es; Spalten „Markt: …“ im Tab „FileClass-Ziel“ entfernt. Gelöscht:
    `shop/ShopCategoryFileClass.ts`, `shop/useShopCategoryFileClass.ts`, `admin/fileclass/fileClassShopCategoryTexts.ts`.
  - Pi-DB: Spalte `shop_category.file_class_key` (Pflicht; `MEMES` → `MEME`, `PROFILE_BANNER` → `PROFILE_BANNER`),
    Tabelle `shop_category_file_class` gelöscht.
  - Getestet per Wegwerf-Test gegen die Pi-DB (Rollback, Test gelöscht): 15 Fälle, siehe `entities/ShopCategory.md`.
    NICHT geprüft: Oberfläche im Browser, ganzer Upload mit echter Datei.
  - Doku: `entities/ShopCategory.md`, `ShopItem.md`, `README.md`, `ShopCategoryFileClass.md` gelöscht, `konzept-shop.md`
    (Abschnitt 11), `konzept-file-kern.md` (Upload-Wege), `setup.md`.
- OFFEN, als Nächstes: Kaufen.

## 2026-11-11 18:12 – FileClass „Profile-Banner“ und Rubrik dazu im Markt (fertig, in der Pi-DB)

- Ansage: „Dann kannst du gleich nochmal eine neue File-Class anlegen. Die würde ich Profile-Banner nennen. Passend dazu
  kannst du auch direkt eine Rubrik dazu anlegen im Market.“
- Plan: FileClass `PROFILE_BANNER`, Anzeigename „Profile-Banner“, Badge, Endungen png, jpg, jpeg. Rechte: `USER` lesen;
  `MODERATOR` und `ADMIN` lesen + hochladen (Ansage vom selben Tag: Moderator oder Admin sollen im Markt hochladen
  können; wer sonst darf, hat der Nutzer nicht gesagt, er ändert es in der Matrix „FileClass-AR“). Rubrik
  `PROFILE_BANNER` „Profile-Banner“ und der Haken Rubrik × FileClass, damit „neues Angebot“ dort sofort geht. Alles über
  die Services (Wegwerf-Test mit Commit), kein Code, kein Bau.
- Nur FileClass und Rubrik: Das Banner im Profil selbst (Seitenverhältnis, Anlegen im Profil) ist nicht Teil davon.
- Stand 18:13: ANGELEGT in der Pi-DB (Wegwerf-Test mit Commit, danach gelöscht): FileClass `PROFILE_BANNER` (Platz 8,
  Badge Bordeaux/Neongelb mit Streifen, Symbol `card-image`, png/jpg/jpeg; `USER` L, `MODERATOR` LH, `ADMIN` LH),
  Rubrik `PROFILE_BANNER` „Profile-Banner“ (Platz 2), Haken `PROFILE_BANNER` × `PROFILE_BANNER`. Kein Code geändert,
  kein Bau nötig (keine Kopien im Speicher). Doku: `konzept-file-kern.md` („Erste FileClasses“),
  `entities/ShopCategoryFileClass.md`, `setup.md`.
- OFFEN, als Nächstes: Kaufen.

## 2026-11-11 18:01 – Markt: „neues Angebot“ als geführter Ablauf statt Felder pauschal im Tab (fertig, auf dem Pi; der Nutzer testet)

- Ansage (gekürzt): „Du kannst doch nicht dieses […] Angebot Hochlade-Interface pauschal in den Market Store packen […]
  Du musst doch das auf einen extra Knopf legen mit neues Angebot erstellen oder sowas. Du musst es geführt sein. Ich
  will als allererstes mal die Datei hochladen. Gucken, ob das überhaupt funktioniert. Wenn die Datei oben ist, dann
  sage ich ob es dauerhaft oder befristet ist. Bei befristet kann ich dann sagen, wann, ansonsten blendest du das erst
  gar nicht ein. Und dann, ob ich das so verkaufe, dass der User das dauerhaft nutzen kann, also unbegrenzt. Oder ob
  ich nur eine Anzahl an Nutzungen verkaufe. Da kannst du selber ein Wording überlegen […] entweder setze ich dann
  einen Haken bei unbegrenzt oder wenn nicht, dann kommt die Eingabe mit, wie oft darf es benutzen.“
- Umbau: Die Angebots-Box und die Upload-Maske verschwinden aus dem Tab der Rubrik. Dort steht oben rechts der Knopf
  „neues Angebot“ (wer in die Rubrik hochladen darf). Er öffnet ein Popup mit Schritten: (1) Datei hochladen (der
  globale Upload-Ablauf), (2) Laufzeit: dauerhaft oder befristet, „bis wann“ nur bei befristet, (3) Nutzung: Haken
  „unbegrenzt“, ohne Haken „wie oft“, (4) Preis, dazu nur ohne „unbegrenzt“ wahlweise eine Stückzahl; dann „Angebot
  erstellen“.
- Backend dazu: Der Upload in eine Rubrik legt wieder NUR den Artikel an (ohne Angebot). Neu `POST /api/shop-offer`:
  Angebot zu einem eigenen Artikel (Verkäufer oder ADMIN). Artikel ohne Angebot zeigen an der Kachel „noch kein
  Angebot“, der Verkäufer kann es von dort nachholen.
- Stand 18:09: fertig und auf dem Pi (Start 17,0 s, kein ERROR). Backend: `shop/ShopAccessDeniedException` (403 im
  `GlobalExceptionHandler`), `NewShopOffer` mit `fileDocumentId`, `ShopItemService.createShopOfferOfOwnShopItem`,
  `ShopOfferService.createShopOffer`, `ShopOfferController` (`POST /api/shop-offer`); Upload-Daten und
  `FileUploadFacts` wieder ohne Angebot. Frontend: `market/NewShopOfferPopup.tsx` (neu), `market/shopOfferInput.ts`
  (Prüfung je Schritt), `shop/useShopOffer.ts` (neu), `market/MarketUploadBox.tsx` (nur noch der Upload-Schritt),
  `market/MarketCategoryTab.tsx` (Knopf, Kachel-Fuß); `market/MarketOfferFields.tsx` gelöscht. Wegwerf-Test grün und
  gelöscht. Doku: `entities/ShopOffer.md` neu geschrieben, `ShopItem.md`, `konzept-shop.md` 11, `setup.md`. Notiz
  `guided-creation-flow` angelegt.
- NICHT geprüft: die Oberfläche (Popup, Schritte) und ein ganzer Upload mit echter Datei.
- OFFEN, als Nächstes: Kaufen.

## 2026-11-11 17:48 – Markt: Angebot gleich beim Hochladen, Rubrik nicht mehr „leer“ (fertig, auf dem Pi; der Nutzer testet den echten Upload)

- Ansage: „Aber jetzt fehlt doch noch das neue Entity, oder nicht? Ich muss ja jetzt den Market Angebote machen können.
  Sprich, ein Moderator oder ein Admin soll auf jeden Fall eine Datei hochladen können. Und zusätzlich gleich sagen
  können, was das Offer ist, also ob es temporär ist, ob es nur eine bestimmte Frist gibt, bestimmte Anzahl an
  Downloads, was der Preis ist, ob unbegrenzt oder irgendein anderes Limit. Das sehe ich jetzt noch nicht. […] ich finde
  es relativ leer und finde nichts, wie man was hinzufügen kann.“
- Damit ist meine alte Frage beantwortet: Das Hochladen im Markt legt das Angebot gleich mit an.
- Ursache für „leer“: Der Haken „Markt: Memes“ an `MEME` fehlte, ohne ihn zeigt der Tab der Rubrik keine Upload-Maske.
  Ich setze ihn selbst und zeige im Tab künftig einen klaren Hinweis, wenn in einer Rubrik nichts hochgeladen werden
  kann.
- Plan: (1) Backend: `NewShopOffer` im Teil `data` des Markt-Uploads, vor dem ersten Byte geprüft; nach dem Einchecken
  entstehen Artikel UND Angebot in einer Transaktion; `ShopOfferService`, `ShopOfferRepository`; die laufenden Angebote
  kommen mit den Artikeln einer Rubrik zum Client. (2) Frontend: über der Upload-Maske im Markt die Felder des Angebots
  (Preis, dauerhaft oder Anzahl Nutzungen, Frist, Stückzahl), an jeder Kachel das Angebot. (3) Haken setzen, Test, Pi.
- Kaufen kommt danach.
- Stand 17:51: Backend fertig und kompiliert: `shop/dto/NewShopOffer`, `shop/repository/ShopOfferRepository`,
  `shop/service/ShopOfferService` (`requireValidNewShopOffer`, `createShopOfferOfUploadedShopItem`,
  `getRunningShopOffersByShopItemId`); `FileUploadIntoShopCategoryData` und `FileUploadFacts` tragen das Angebot;
  `ShopItemService.prepareShopCategoryUpload` prüft es vor dem ersten Byte, `createShopItemOfUploadedFile` legt Artikel
  und Angebot in einer Transaktion an; `ShopItemForClient` hat `runningShopOffers`. Regel aus der Ansage vom 2026-11-10:
  mit Stückzahl kein dauerhafter Kauf. Als Nächstes das Frontend (Angebotsfelder über der Upload-Maske, Angebot an der
  Kachel, Hinweis statt leerer Rubrik), dann Haken `MEMES` × `MEME` setzen, Test, Pi.
- Stand 17:55: Frontend fertig (`shop/ShopOffer.ts`, `market/MarketOfferFields.tsx`, `market/shopOfferInput.ts`,
  `market/shopOfferSummary.ts`; `MarketUploadBox`, `MarketCategoryTab`, `useShopItem`, `ShopItem.ts` angepasst;
  `gallery/GalleryImageTile.tsx` hat neu den optionalen Fuß `footer`). Wegwerf-Test grün und gelöscht. Haken `MEMES` ×
  `MEME` in der Pi-DB GESETZT. Auf dem Pi gebaut (Start 17,1 s, kein ERROR). Doku nachgezogen: `entities/ShopOffer.md`,
  `ShopItem.md`, `ShopCategoryFileClass.md`, `konzept-shop.md` 11, `setup.md`.
- NICHT geprüft: ein ganzer Upload mit echter Datei und die Oberfläche (ich kann mich nicht anmelden).
- OFFEN, als Nächstes: Kaufen (Plan steht im Eintrag „Markt Stück 3“ weiter unten).

## 2026-11-11 17:09 – Markt Stück 3: Memes in eine Rubrik hochladen (fertig, auf dem Pi; der Nutzer testet den echten Upload)

- Ansage: „Ich würde aber auch erst dafür sorgen, dass wir erstmal Memes hochladen können. Und auch kaufen können.“
- Plan (wie der Galerie-Upload gebaut ist): neuer Upload-Weg `FileUploadService.uploadFileIntoShopCategory` über dem
  gemeinsamen Kern; `data` nennt die Rubrik und die Felder; geprüft: Rubrik gibt es, FileClass ist in der Rubrik erlaubt
  (`ShopCategoryFileClass`), Schalter „Hochladen“. Nach dem Einchecken entsteht der Artikel (`ShopItem`). Endpunkt
  `POST /api/shop-item/upload`; der Pfad muss in die Upload-Liste der nginx-`default.conf`. Frontend: Hochladen im Tab
  der Rubrik über den globalen Upload-Ablauf, darunter die Artikel der Rubrik als Kacheln mit Vorschau.
- Kaufen (Stück 4) kommt danach als eigener Eintrag.
- Stand 17:12: Backend fertig und kompiliert: `FileUploadService.uploadFileIntoShopCategory` (Kern bekommt
  `shopCategoryKey`, `FileUploadFacts.shopCategoryKey`), `file/dto/FileUploadIntoShopCategoryData`,
  `shop/service/ShopItemService` (`prepareShopCategoryUpload`, `createShopItemOfUploadedFile`, `resolveShopItems`),
  `shop/repository/ShopItemRepository`, `shop/controller/ShopItemController` (`POST /api/shop-item/upload`,
  `POST /api/shop-item/resolve`), `shop/dto/ShopItemForClient`, `ShopItemResolveRequest`; `ShopItem` hat neu
  `sellerUsersGuid` (Spalte `seller_users_guid`, darf NULL sein, Hibernate legt sie an). nginx: `shop-item/upload` steht
  in der Upload-Liste von `mounts/nginx/conf/default.conf` (muss mit auf den Pi, vorher `nginx -t`).
  Dateien im Markt sind für jeden Angemeldeten sichtbar (`visibility` AUTHENTICATED).
- Als Nächstes das Frontend: `shop/ShopItem.ts`, `shop/useShopItem.ts`, `market/MarketUploadBox.tsx`, Artikel als
  Kacheln im Tab der Rubrik. Dann Test, Bau auf dem Pi (mit nginx), Doku.
- Stand 17:18: Frontend fertig (`shop/ShopItem.ts`, `shop/useShopItem.ts`, `shop/shopItemViewCacheScope.ts`,
  `market/MarketUploadBox.tsx`, `market/MarketCategoryTab.tsx` neu geschrieben). Wegwerf-Test grün und gelöscht (ohne
  echte Datei: 404/400/403, Artikel anlegen, auflösen). Auf dem Pi gebaut mit neuer nginx-Datei (`nginx -t` ok), Start
  16,8 s, kein ERROR, 22 MB an den neuen Upload-Pfad kommen durch. Doku nachgezogen: `entities/ShopItem.md`,
  `konzept-shop.md` 11, `konzept-file-kern.md` 9.6, `konzept-navigation.md` 4, `setup.md`.
- NICHT geprüft: ein ganzer Upload mit echter Datei bis zur Kachel (ich kann mich nicht anmelden). Der Nutzer muss
  vorher im Tab „FileClass-Ziel“ den Haken „Markt: Memes“ an `MEME` setzen.
- OFFEN, als Nächstes (noch nicht begonnen): Stück 4 Kaufen. Geplant: Angebot je Artikel anlegen (Verkäufer, im
  kleinen Popup an der Kachel: Preis, dauerhaft oder Anzahl Nutzungen, bis wann, Stückzahl), Kaufen in einer
  Transaktion (Angebot läuft, Stückzahl in einer Anweisung hochzählen, Punkte des Käufers ab, 90 % an den Verkäufer,
  10 % Marktgebühr verschwinden, Beleg `ShopOrder`, Besitz `UsersShopItem`). Achtung: neue Buchungsgründe im
  Kontobuch brauchen vor dem Deploy die neue Prüfregel an `users_point_booking.booking_reason` in der Pi-DB.

## 2026-11-11 16:56 – FileClass-Rechte: Lesen, Bearbeiten, Hochladen; FileClass MEME (fertig, auf dem Pi)

- Ansage (gekürzt): „du solltest die File Class überarbeiten, dass wir da lesen, editieren und hochladen haben als
  Felder […] dann ist es von der File Class abhängig, ob das jeder User darf, also per se hochladen oder nicht. […] Und
  du kannst auch noch die File Class Meme hochladen oder erstellen. Da ein nettes Badge und da dann auch die Rechte,
  also Memes sollte jeder hochladen dürfen. […] bei editieren würde ich beides reinschreiben. Entweder ist es dann ein
  Access Role Key oder aber […] wenn wir halt einen Autor haben, dann ist der der Einzige, der da editieren soll und
  darf. […] das gilt eigentlich bei allen File Classes, die User hochladen dürfen. […] Ich würde aber auch erst dafür
  sorgen, dass wir erstmal Memes hochladen können. Und auch kaufen können. Und dann gucken wir immer noch, wer an
  welcher Stelle dann sinnvollerweise das standardmäßig editieren darf und wer nicht.“
- Reihenfolge daraus: (1) Stufen der FileClass-Rechte trennen: Lesen, Bearbeiten, Hochladen (heute nur Lesen und
  Schreiben), (2) FileClass `MEME` mit Badge, hochladen darf jeder User, (3) Memes im Markt hochladen, (4) kaufen,
  (5) erst danach festlegen, wer wo standardmäßig bearbeiten darf. Meine frühere Frage 1 (Angebot gleich beim
  Hochladen) ist damit nicht beantwortet, ich entscheide beim Bauen und sage es.
- So gebaut: `FileClassAccessRole` hat statt `accessLevel` (READER/WRITER) drei Schalter `readGranted`, `editGranted`,
  `uploadGranted`; das Enum `FileClassAccessLevel` ist gelöscht. Bearbeiten und Hochladen schließen Lesen ein (Service).
  Hochladen prüft `uploadGranted`. `editGranted` wird gespeichert, aber noch NICHT ausgewertet (Ansage: erst hochladen
  und kaufen, dann die Regel fürs Bearbeiten); bis dahin bearbeitet der Autor wie bisher. Im Solr-Dokument bleiben die
  Schreibrollen (`writerAccessRoleKeys`) die Rechte mit „Hochladen“.
- ACHTUNG Pi-DB, noch NICHT gemacht: Tabelle `file_class_access_role` braucht die drei neuen Spalten; die alte Spalte
  `access_level` muss weg. Plan in zwei Schritten, damit das laufende Backend nicht bricht: (A) vor dem Test die drei
  Spalten anlegen und aus `access_level` füllen (READER → lesen; WRITER → lesen + hochladen), `access_level` darf NULL
  sein; (B) direkt vor dem Start des neuen Backends noch einmal füllen, dann `access_level` löschen.
- Stand 16:59: Backend umgestellt und kompiliert (`file/model/FileClassAccessRole.java`,
  `file/service/FileClassAccessRoleService.java`, `file/controller/FileClassAccessRoleAdminController.java`,
  `file/service/FileUploadService.java`). Als Nächstes das Frontend: `file/FileClassAccessRole.ts`,
  `file/useFileClassAccessRole.ts`, `admin/fileclass/FileClassAccessRoleMatrixTab.tsx`, `admin/fileclass/FileClassTab.tsx`,
  `gallery/GalleryUploadBox.tsx`, `filemanager/upload/FileUploadTab.tsx`, `filemanager/files/FileDocumentListTab.tsx`.
- Stand 17:04: Frontend umgestellt, Typprüfung ohne Fehler (Matrix „FileClass-AR“ mit Pinseln ·, L, LH, LB, LBH; Tab
  „FileClass“ mit Spalten Lesen, Bearbeiten, Hochladen; Texte in `admin/fileclass/fileClassAccessTexts.ts`).
- Pi-DB Schritt A ERLEDIGT: `file_class_access_role` hat `read_granted`, `edit_granted`, `upload_granted`; die 24
  vorhandenen Zeilen sind gefüllt (READER → lesen; WRITER → lesen + hochladen; bearbeiten überall aus). `access_level`
  steht noch und darf NULL sein. Schritt B (Spalte löschen, Vorgaben der neuen Spalten entfernen) läuft im Bau-Skript
  zwischen Bauen und Starten.
- FileClass `MEME` ANGELEGT (über die Services, Wegwerf-Test mit Commit, danach gelöscht): Platz 7, Anzeigename „Meme“,
  Badge diagonal Gelb → Orange mit Punkten, Glanz, lachendes Smiley; Endungen png, jpg, jpeg; USER, MODERATOR,
  FILE_MANAGER, ADMIN: lesen + hochladen, bearbeiten aus. Die Rubrik des Nutzers heißt `MEMES` („Memes“); den Haken
  „Markt: Memes“ an `MEME` setzt der Nutzer selbst im Tab „FileClass-Ziel“ (nicht von mir gesetzt).
- Stand 17:07: Auf dem Pi gebaut, Schritt B gelaufen (`access_level` gelöscht; 28 Zeilen: 28 lesen, 0 bearbeiten, 27
  hochladen), Start 16,6 s, kein ERROR, neuer Stand im Bundle. Doku nachgezogen: `entities/FileClassAccessRole.md`,
  `entities/README.md`, `konzept-file-kern.md` (9.4, 9.5, 9.6, „Erste FileClasses“), `konzept-shop.md`,
  `entities/ShopCategoryFileClass.md`, `setup.md`. Nicht angefasst: die Beschreibungen der Solr-Felder
  (`writerAccessRoleKeys` heißt dort weiter „Schreibrollen“), ältere Konzepte mit dem Wort „Schreibrolle“.
- OFFEN, als Nächstes (Ansage: „erstmal Memes hochladen können. Und auch kaufen können“): Stück 3 Hochladen in eine
  Rubrik des Markts, Stück 4 Angebot und Kaufen. Danach erst die Regel fürs Bearbeiten (mein Vorschlag steht im
  Bericht an den Nutzer: Schalter „Bearbeiten“ je Recht = jede Datei der FileClass; dazu an der FileClass ein
  Schalter „Autor bearbeitet seine Datei“).

## 2026-11-11 16:40 – Markt: Kachel, Rubriken als Ziel einer FileClass, Hochladen (Stück 1 und 2 fertig, auf dem Pi; Stück 3 offen)

- Ansage: „Weil es dann auch eine Kachel machen mit Marketplace oder Market Store oder irgendwie sowas. Wo wir dann die
  Rubriken schon mal anzeigen können. Und eventuell auch Dinge dazu hochladen können. Weil pro Rubrik würde ich auch
  noch festlegen, welche File-Classes da hochgeladen werden dürfen. Sprich, wir brauchen eine Verknüpfung zwischen
  File-Class-Destination und Rubrik. Dass ich in der File-Class die Rubriken als Destination hinzufügen kann. Und dann
  würde ich quasi dort mit einem schönen Interface Dinge oder Angebote hochladen wollen oder erstellen wollen, dass die
  andere User dann kaufen können.“
- Damit ist Frage 1 beantwortet: Die Datei eines Artikels kommt über einen eigenen Upload-Weg im Markt herein, je
  Rubrik mit eigenen FileClasses.
- Stücke in dieser Reihenfolge: (1) Kachel und Modul „Gebietermarkt“ mit den Rubriken, (2) Rubrik als Ziel einer
  FileClass (Verknüpfung, Admin-Matrix), (3) Hochladen in eine Rubrik (eigener Endpunkt, Datei + Artikel),
  (4) Angebot zu einem Artikel, (5) Kaufen.
- Entschieden beim Lesen (meine Wahl, dem Nutzer zu sagen): Die Zuordnung steht in einer eigenen Tabelle
  `shop_category_file_class` (`ShopCategoryFileClass`: Rubrik + FileClass), nicht als neue Spalte an
  `file_class_destination_assignment`. Grund: Das Ziel dort ist ein festes Enum mit eindeutigem Paar; eine Rubrik als
  dritte, meist leere Spalte bräuchte zwei Handgriffe an der Pi-DB (Eindeutigkeit, Prüfregel des Enums). In der
  Oberfläche stehen die Rubriken trotzdem als weitere Spalten im Tab „FileClass-Ziel“ neben „Galerie“.
- Stand 16:42: Backend für Stück 2 fertig und kompiliert: `shop/model/ShopCategoryFileClass`, Repository, Service
  (`ShopCategoryFileClassService`), `ShopCategoryFileClassController` (GET Liste) und `…AdminController` (POST, GET je
  id, DELETE), dazu `ShopCategoryService.existsShopCategory`. Als Nächstes das Frontend: Typ und Hook in `src/shop/`,
  Spalten je Rubrik in `admin/fileclass/FileClassDestinationTab.tsx`, neues Modul `src/market/` mit Kachel und Route.
- Stand 16:45: Frontend fertig, Typprüfung ohne Fehler: `shop/ShopCategoryFileClass.ts`, `useShopCategoryFileClass.ts`;
  Rubrik-Spalten in `admin/fileclass/FileClassDestinationTab.tsx` (Texte `fileClassShopCategoryTexts.ts`); Modul
  `market/` (`Market.tsx`, `MarketStartTab.tsx`, `MarketCategoryTab.tsx`, `marketPaths.ts`, `marketTexts.ts`), Kachel
  in `home/Home.tsx`, Routen `/market` und `/market/category/<Key>` in `App.tsx`. Wegwerf-Test gegen die Pi-DB grün und
  gelöscht; Hibernate hat `shop_category_file_class` angelegt (leer). In `shop_category` steht eine Rubrik des Nutzers.
- Als Nächstes: sauber bauen, auf den Pi, prüfen, Doku (`entities/ShopCategoryFileClass.md`, `ShopCategory.md`,
  `konzept-shop.md` 11, `konzept-navigation.md` 4, `setup.md`).
- Stand 16:47: Stück 1 (Kachel und Modul „Gebietermarkt“) und Stück 2 (Rubrik als Ziel einer FileClass) sind auf dem Pi
  gebaut und geprüft (Start 16,9 s, kein ERROR, neue Endpunkte ohne Anmeldung 401, neuer Stand im Bundle). Doku
  nachgezogen: `entities/ShopCategoryFileClass.md` (neu), `entities/ShopCategory.md`, `entities/README.md`,
  `konzept-shop.md` 11, `konzept-navigation.md` 4, `konzept-file-kern.md` 9.6, `setup.md` 5.16.
- NICHT begonnen: Stück 3, Hochladen in eine Rubrik. Plan steht in `konzept-shop.md` 11 unter „Nächste Stücke“. Der
  Nutzer soll erst Kachel und Spalten ansehen (ich sehe die Oberfläche nicht).

## 2026-11-11 16:20 – Administration: User anlegen (fertig, auf dem Pi)

- Ansage: „Wo soll das vielleicht im Admin-Modul auch noch ein User hinzufügen […] da will ich den New Entity-Button
  für einen User und dann legen wir auch gleich ganz akkurat wie beim Registrieren auch mit ID Passwort ist aber
  optional, Standard ist ansonsten das gehashte 123 und noch keine 2FA, das muss dann der User selber machen.“
- So verstanden: im Tab „User“ der Administration oben rechts „neuer User“, kleines Popup mit denselben Angaben wie die
  Registrierung, dazu die GUID („ID“) als Kann-Feld. Passwort leer → Standard `123` (gehasht wie im Frontend, dann
  BCrypt), der Wert steht in der YAML. Keine 2FA: Der User richtet die Authenticator-App bei der ersten Anmeldung ein.
- Der Markt wartet solange: Frage 1 (wie kommt die Datei eines Artikels herein) ist noch offen.
- Stand 16:24: Code fertig, kompiliert, Typprüfung ohne Fehler. Backend: `users/dto/NewUsers.java` (neu),
  `UsersService.createUsersWithPassword` (neu, ADMIN, eine Transaktion), `UsersAdminController.createUsers` nimmt jetzt
  `NewUsers`, YAML `gebiter.users.start-password`. Frontend: `admin/users/NewUsersPopup.tsx`, `newUsersTexts.ts` (neu),
  Knopf in `admin/users/UsersTab.tsx`, Typ `NewUsers` in `users/Users.ts`. Als Nächstes: Wegwerf-Test gegen die Pi-DB,
  Doku (`entities/Users.md`, `UsersCredential.md`), Bau auf dem Pi.
- Stand 16:26: Wegwerf-Test gegen die Pi-DB grün und gelöscht (Rollback, kein Test-User übrig). `entities/Users.md`
  nachgezogen. Lokal sauber gebaut. Jetzt Bau auf dem Pi (Backend und Frontend, wie setup.md 5.16).
- Stand 16:28: Auf dem Pi gebaut und geprüft (Start 16,3 s, kein ERROR, `/api/admin/users` ohne Anmeldung 401, neuer
  Stand im Bundle). `setup.md` nachgezogen (Tabelle der Zugänge, Eintrag in 5.16). Nichts mehr offen an diesem Schritt.
  Im Browser hat es noch niemand gesehen: Der Nutzer schaut selbst (ich kann mich wegen der Authenticator-App nicht
  anmelden).
- Als Nächstes: zurück zum Markt, Frage 1 ist offen (wie kommt die Datei eines Artikels herein).

## 2026-11-11 14:41 – Markt: Rubriken im Shop-Manager (fertig, auf dem Pi)

- Ansage: „Nein, Kauf soll nicht ablaufen. Was man hat, hat man, bis man es benutzt hat. Nur die Shop-Einträge, also die
  Angebote im Shop“ (laufen ab). Zu den Feldern der fünf Klassen kam kein Einwand.
- Plan: `ShopCategory` von vorn bis hinten: Repository, Service, Admin-Controller `/api/admin/shop-category`, Tab
  „Rubriken“ im Modul „Achievements & Markt“, Doku, dann Bau auf dem Pi (dabei legt Hibernate die fünf Tabellen an).
  Kein Löschen einer Rubrik: Das gehen wir vorher gemeinsam durch.
- Stand 14:44: Backend fertig und kompiliert: `shop/repository/ShopCategoryRepository`, `shop/service/ShopCategoryService`,
  `shop/controller/ShopCategoryAdminController` (POST, GET je Key, PUT, PUT `/listing-position`) und
  `ShopCategoryController` (GET Liste). Als Nächstes das Frontend: `src/shop/` (Typ, Hook),
  `src/achievementmanager/shopcategory/` (Tab wie der Tab „AR“: Bearbeiten in der Zeile, Anlegen im Popup), Tab und
  Route eintragen. Danach Test, Doku, Bau auf dem Pi.
- Stand 14:48: Frontend fertig (`src/shop/ShopCategory.ts`, `useShopCategory.ts`,
  `src/achievementmanager/shopcategory/ShopCategoryTab.tsx`, `shopCategoryTexts.ts`, `shopCategoryPaths.ts`; Tab in
  `AchievementManager.tsx`, Route in `App.tsx`), `npx tsc -b` ohne Fehler. Wegwerf-Test gegen die Pi-DB grün und
  gelöscht (mit Rollback). Dabei hat Hibernate die fünf Tabellen in der Pi-DB angelegt (`shop_category`, `shop_item`,
  `shop_offer`, `shop_order`, `users_shop_item`), alle leer. Achtung: Maven gegen den Pi nur ohne Sandbox starten,
  sonst bekommt Java „No route to host“.
- Stand 14:51: Auf dem Pi gebaut und geprüft (Start 17,1 s, kein ERROR, neue Endpunkte ohne Anmeldung 401, neuer Stand
  im Bundle). Doku nachgezogen: `docu/entities/ShopCategory.md` (Endpunkte, Verwendung, Test), Stand in den vier
  anderen Entity-Dokus, `konzept-shop.md` Abschnitt 11, `setup.md` 5.16. Nichts mehr offen an diesem Schritt.
- Als Nächstes (noch nicht begonnen, wartet auf die Ansage des Nutzers): Artikel anlegen, also eine Datei aus dem Kern
  FILE in eine Rubrik stellen. Dafür fehlt die Entscheidung, über welchen Weg die Datei hereinkommt (eigene FileClass
  und eigenes Ziel für Markt-Artikel, `upload-paths-per-purpose`).

## 2026-11-11 14:21 – Markt: Klassen anlegen (fertig)

- Ansage: „Dann würde ich sagen, bauen wir jetzt einfach mal die Dinge, die jetzt zu bauen sind. […] Dass wir erstmal
  den Shop machen. Die File-Class-Rechte updaten. Und uns dann die ganze Geschichte angucken.“
- Davor die Frage: Reichen `ShopCategory`, `ShopItem`, `ShopOffer`? Der Artikel ist immer eine Datei im Kern FILE (id).
  Ein Kauf gilt dauerhaft oder für eine Anzahl Nutzungen. Ein Angebot steht dauerhaft, bis zu einem Datum oder nur in
  einer Stückzahl im Markt. Das Angebot verschwindet irgendwann; was der User hat, bleibt mit seinen Nutzungen
  (losgelöst). Eine Entity verwaltet alles, was ein User zur Verfügung hat.
- Plan: fünf Klassen im Paket `de.gebiter.shop`: `ShopCategory`, `ShopItem`, `ShopOffer`, `UsersShopItem` (je User und
  Datei: dauerhaft ja/nein, restliche Nutzungen; zeigt auf die Datei, nicht aufs Angebot), `ShopOrder` (Beleg des Kaufs).
  Erst nur die Klassen und kompilieren, kein Start gegen die Pi-DB, damit keine Tabellen entstehen, bevor die Felder
  besprochen sind.
- Stand 14:27: Die fünf Klassen liegen in `code/backend/src/main/java/de/gebiter/shop/model/`
  (`ShopCategory`, `ShopItem`, `ShopOffer`, `UsersShopItem`, `ShopOrder`). `./mvnw -q -o -DskipTests clean compile`
  läuft ohne Fehler. Sonst ist im Code nichts geändert.
- Doku dazu: `docu/entities/ShopCategory.md`, `ShopItem.md`, `ShopOffer.md`, `UsersShopItem.md`, `ShopOrder.md`,
  Einträge in `docu/entities/README.md`, Abschnitt 11 in `docu/konzept-shop.md` (Tabellen und Beispiel mit Bob).
- NICHT gemacht: kein Start des Backends, kein Bau auf dem Pi. In der Pi-DB gibt es die fünf Tabellen noch nicht; sie
  entstehen beim ersten Start (Hibernate). Erst die Felder besprechen, sonst bleiben Spalten als Leichen zurück.
- Bewusst weggelassen, kommt später: Verkäufer am Artikel (Verkauf durch User, 10 % Gebühr), Protokoll je Nutzung.
- Rückfrage 1 beantwortet (Nutzer): Ein Kauf läuft nie ab, nur die Angebote im Markt.
- Als Nächstes, nach dem Ja des Nutzers zu den Feldern: Rubriken im Shop-Manager (Repository, Service,
  Admin-Controller, Tab im Modul „Achievements & Markt“), dann Artikel, Angebote, Kaufen.

## 2026-11-11 14:07 – Absturz von VS Code, Stand geprüft (fertig)

- Der Mac lief durch, nur VS Code wurde kurz vor 14:06 beendet. Sitzung davor:
  `36c37ac6-9f8f-4819-b7d2-72cb8d8fdd0d`.
- Letzter Bau auf dem Pi um 03:37 (Admin-Konto nur mit `FORCE_ADMIN`, `FOTO_ART`, Texte der Stimmen). Um 07:00 die
  Liste für die Suche notiert.
- Danach wurde nichts geschrieben. Welcher Umbau lief, ist unbekannt; der Nutzer weiß es auch nicht mehr.
- Geprüft: Frontend (`npx tsc -b`) und Backend (`./mvnw -q -o compile`) ohne Fehler. Mac und Pi gleich (745
  Quelldateien, SHA-256). Der Pi antwortet (Startseite 200, `/api/file-cheer` ohne Anmeldung 401).
