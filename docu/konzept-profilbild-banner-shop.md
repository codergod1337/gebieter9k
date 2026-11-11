# Konzept: Profilbild, Banner und Punkte-Shop

Stand 2026-11-09, Vorschlag, noch nichts gebaut. Entscheidungen des Nutzers in Abschnitt 6, der Shop wird vor dem Bauen gemeinsam geplant.

## 1. Was es schon gibt

- `Users.points` (long, Standard 0, setzt nur das Backend): der Kontostand. Wofür es Punkte gibt, ist noch offen.
- Upload in den Kern `FILE`: Bytes auf den SFTP, id = SHA-256, Dubletten fallen sofort raus, Vorschau 200 × 200 PNG
  im Feld `previewBase64Png`, Dateiart (`FileClass`) mit Lese- und Schreibrollen.
- Profil im Frontend mit Platzhaltern: `ProfileCover` (Titelbild), `ProfileHero` (Profilbild aus Initialen und Farbe).

## 2. Profilbild (gebaut 2026-11-09)

- **Speicher:** Das Profilbild ist wie in der Vorlage keine Datei im Kern FILE. Es ist ein PNG als Base64 in
  `UsersDetail.profileImageBase64Png` (Postgres, `text`). `null` heißt: Das Profil zeigt die Initialen.
- **Maße (seit 2026-11-09, Nutzer):** zwei Bilder. Groß 400 × 400 fürs Profil (`gebiter.profile-image.size-pixels`),
  klein 96 × 96 als Abklatsch für Avatare im Gästebuch, in Listen und später im Chat
  (`profileImageSmallBase64Png`, `gebiter.profile-image.small-size-pixels`). Der Browser rechnet das kleine beim
  Speichern aus dem großen (stufenweise verkleinert), beide gehen im selben Request. Davor galt 200 × 200. Beide nach
  der Regel der Dateivorschau:
  - das Bild ganz eingepasst, das Seitenverhältnis bleibt;
  - mittig, der Rest transparent (darum PNG);
  - nichts abgeschnitten, nichts vergrößert.
- **Browser:** Er rechnet das PNG (`ImageCropUploadPopup`, `ImageCropper`, `base64Image.ts`).
  - Bild wählen über die `FileDropzone`, nur JPG oder PNG.
  - Drehen um 90°, ein anderes Bild nehmen.
  - „Übernehmen“ nimmt das ganze Bild. Ein freier Ausschnitt ist möglich, mindestens 100 Pixel.
- **Backend:** Es prüft nur noch (`Base64PngService`): zwei PNG, genau 600 × 600 (höchstens 2 MB) und 96 × 96
  (höchstens 64 kB), immer beide oder keins. Die Prüfung in dieser Reihenfolge (seit 2026-11-11):
  1. Länge des Base64 und Größe der Bytes gegen die Grenze.
  2. Wirklich ein Bild, keine Textdatei: die Kennung eines PNG am Anfang der Bytes, dazu Tika als zweite Meinung
     (erkennt den Typ an den Bytes, ohne Dateinamen, wie beim Upload jeder Datei).
  3. Die Maße aus dem Kopf des PNG, noch ohne ein Pixel zu dekodieren. Eine Datei von 100 Bytes kann dort
     30 000 × 30 000 Pixel behaupten; früher wurde erst dekodiert (Gigabytes Speicher) und dann gemessen.
  4. Erst jetzt das Dekodieren. Bytes mit PNG-Kennung, hinter denen nur Text steht, scheitern spätestens hier.
- **Endpunkt:** `PUT /api/users-detail/profile-image` mit `{profileImageBase64Png, profileImageSmallBase64Png}`, nur
  das eigene Bild, GUID aus dem Token. Beide `null` entfernen es.
- **Profilkopf:** Beim Zeigen auf den Avatar erscheinen die Kamera (Zuschnitt) und das Auge (volle 200 × 200). Auf dem
  Handy stehen beide immer da.
- **Anders als in der Vorlage:** Der Zuschnitt läuft über Pointer-Ereignisse, er geht also auch mit dem Finger.

## 3. Banner (Titelbild)

Banner lädt **nur der Admin** hoch. Der User wählt aus dem, was er hat: kostenlose Banner sofort, die anderen später
gekauft im Shop.

- Neue Dateiart `PROFILBANNER`, schreiben nur `ADMIN`, lesen `USER`.
- Neue Entity `ProfileBanner` (Tabelle `profile_banner`): `key` (Key-Regel, z. B. `SONNENUNTERGANG`), `displayName`
  (mehrsprachig), `fileSha256`, `listingPosition`, `free` (ja: jeder darf es wählen, nein: nur wer es besitzt).
- Admin-Tab „Banner“: Upload über die `FileDropzone`, Name, Position per Drag and Drop.
- Neues Feld `UsersDetail.profileBannerKey`. Setzen prüft: Das Banner ist kostenlos oder der User besitzt es (Abschnitt
  4).
- Ein Banner ist breit (z. B. 1500 × 500). Die Vorschau 200 × 200 reicht dafür nicht, das Bild kommt über den Download.
  Weil der Name der Datei ihr Hash ist, ändert sich der Inhalt nie: Der Browser darf es dauerhaft zwischenspeichern
  (`Cache-Control: immutable`).

## 4. Punkte-Shop

**Weitergedacht am 2026-11-09 in `konzept-shop.md`:** Artikel, Angebote mit Zeitfenster, Exemplare, Truhe, Handel und
Solr-Kerne. Von hier gelten weiter die Grundsätze (4.1) und das Kontobuch; die Tabellen in 4.2 sind überholt.

Ein kleiner, echter Online-Shop zum Lernen. Bezahlt wird mit Punkten statt mit Geld, sonst gelten dieselben Regeln wie in
einem echten Shop.

### 4.1 Grundsätze

- **Der Preis kommt nie vom Client.** Der Client nennt nur, was er kaufen will. Den Preis liest das Backend selbst.
- **Alles oder nichts.** Punkte abbuchen, Bestellung anlegen, Besitz eintragen: eine Transaktion. Bricht etwas ab,
  ist nichts passiert.
- **Kein Doppelkauf.** Doppelklick oder Wiederholung nach Netzfehler legt keine zweite Bestellung an: Der Client
  schickt eine eigene GUID je Kaufversuch mit, die es nur einmal geben darf. Kommt sie wieder, kommt die erste Bestellung
  zurück.
- **Kein Minus.** Zwei gleichzeitige Käufe können das Konto nicht überziehen. Die Abbuchung ist ein einziges
  `UPDATE users SET points = points - :preis WHERE guid = :guid AND points >= :preis`. Ändert sie keine Zeile, reicht
  das Guthaben nicht (409).
- **Gebaut 2026-11-09 (Kontobuch):** Stand in `users.points` (nie aufsummiert), Kontobuch `users_point_booking`
  (`UsersPointBooking`: Betrag +/−, Stand danach, Grund `UsersPointBookingReason`, Bezug `referenceKey`/`referenceId`,
  `bookedAt`, `bookedByUsersGuid`, `null` = System; eindeutig je Grund und Bezug). Einzige Stelle, die bucht:
  `UsersPointBookingService` (je Vorgang eine Methode, bisher `createAchievementRewardBooking`); `users.points` ändert
  nur `UsersService.changeUsersPoints` (atomar, nie ins Minus) in derselben Transaktion. Kontoauszug:
  `POST /api/users-point-booking/resolve`, Box „Punktekonto“ im eigenen Profil. Keine doppelte Buchführung (Nutzer).
  Der Shop heißt beim Nutzer „Gebietermarkt“.
- **Buchungen statt Überschreiben.** Jede Änderung am Kontostand ist eine Buchungszeile, wie bei einer Bank. Nichts
  wird geändert oder gelöscht, eine Korrektur ist eine Gegenbuchung. `Users.points` bleibt der schnell lesbare Stand
  und wird in derselben Transaktion mitgeführt.
- **Nur für sich selbst.** Gekauft wird immer für den User aus dem Token, nie für eine GUID aus dem Body.

### 4.2 Tabellen

| Entity (Tabelle) | Felder | Wozu |
|---|---|---|
| `ShopItem` (`shop_item`) | `key`, `itemType` (Enum: `PROFILE_BANNER`, später `BADGE`, `TITLE` …), `referencedKey` (z. B. der Key des Banners), `displayName`, `description`, `pricePoints`, `status` (`ACTIVE`/`INACTIVE`), `listingPosition` | Was es zu kaufen gibt und zu welchem Preis |
| `ShopOrder` (`shop_order`) | `id`, `orderGuid` (vom Client, eindeutig), `usersGuid`, `shopItemKey`, `pricePoints` (der Preis beim Kauf, eingefroren), `status` (`COMPLETED`/`REFUNDED`), `orderedAt` | Die Bestellung, auch wenn sich der Preis später ändert |
| `UsersOwnedShopItem` (`user_owned_shop_item`) | `id`, `usersGuid`, `shopItemKey`, `acquiredAt`, `shopOrderId` (leer bei Geschenk) | Was der User besitzt; eindeutig je User und Artikel |
| `UsersPointBooking` (`user_point_booking`) | `id`, `usersGuid`, `amountPoints` (+/−), `bookingReason` (Enum: `SHOP_PURCHASE`, `SHOP_REFUND`, `ADMIN_CORRECTION`, später `UPLOAD`, `CHEER_RECEIVED` …), `shopOrderId`, `bookedAt`, `balanceAfter` | Das Kontobuch |

Lose Kopplung wie überall: keine JPA-Beziehungen, Verweise über Keys und ids. Die Eindeutigkeit von `orderGuid` und von
User + Artikel prüft der Service; ein Unique-Constraint in der Datenbank fängt den Rest ab.

### 4.3 Ablauf eines Kaufs

1. Der User klickt „Kaufen“. Ein Popup fragt: „SONNENUNTERGANG für 500 Punkte kaufen? Danach hast du 1.200 Punkte.“
2. `POST /api/shop-order` mit `{shopItemKey, orderGuid}`.
3. Der `ShopOrderService` prüft in einer Transaktion: Gibt es die `orderGuid` schon, kommt die alte Bestellung zurück.
   Der Artikel ist aktiv, der User besitzt ihn noch nicht. Dann bucht er ab (bedingtes `UPDATE`), legt Bestellung,
   Buchung und Besitz an.
4. Antwort: die Bestellung und der neue Kontostand. Das Profil kann das Banner sofort wählen.

Rückerstatten darf nur der Admin: Gegenbuchung, Bestellung auf `REFUNDED`, Besitz weg. Ein Banner, das der User gerade
trägt, fällt dann auf das Standard-Banner zurück.

### 4.4 Endpunkte

Die Rechteregeln gelten wie überall (Controller-Regeln, Methoden-Naming, Rechte über `@PreAuthorize`).

- `ShopItemController` (`/api/shop-item`, USER): alle aktiven Artikel lesen.
- `ShopItemAdminController` (`/api/admin/shop-item`, ADMIN): Artikel anlegen, ändern, Reihenfolge.
- `ShopOrderController` (`/api/shop-order`, USER): kaufen, eigene Bestellungen lesen.
- `ShopOrderAdminController` (`/api/admin/shop-order`, ADMIN): alle Bestellungen, rückerstatten.
- `UsersPointBookingController` (`/api/users-point-booking`, USER): eigenes Kontobuch lesen.
- `UsersPointBookingAdminController` (`/api/admin/users-point-booking`, ADMIN): Korrekturbuchung.

### 4.5 Frontend

- Kachel „Shop“ (USER). Tabs:
  - „Angebote“: Kacheln mit Bild, Name, Preis und „Kaufen“; Gekauftes trägt „im Besitz“.
  - „Meine Käufe“: Bestellungen als Tabelle.
  - „Punktekonto“: Kontostand und Buchungen.
- Profil, Einstellungen: Profilbild aus den eigenen `PROFILBILD`-Dateien wählen oder neu hochladen. Banner aus den
  kostenlosen und den gekauften wählen.
- Admin: Tabs „Banner“ und „Shop-Artikel“, dazu Korrektur und Rückerstattung.

## 5. Reihenfolge (Vorschlag)

1. Profilbild: Dateiart, Feld am `UsersDetail`, Auswahl im Profil, Anzeige in Hero, Gästebuch und Freunden.
2. Banner: Entity, Admin-Tab, Auswahl der kostenlosen im Profil.
3. Kontobuch `UsersPointBooking`: Ab dann ändert sich `Users.points` nur noch über eine Buchung.
4. Shop: Artikel, Kauf, Besitz, Rückerstattung; kostenpflichtige Banner werden kaufbar.

## 6. Entscheidungen des Nutzers (2026-11-09)

1. **Tabellen:** Alles, was zum Shop gehört, bekommt eigene Tabellen mit dem Präfix `shop_`, so wie alles zum User mit
   seinem Präfix beginnt. Keine zweite Datenbank. Die einzelnen Entities planen wir noch gemeinsam.
2. **Nur angemeldet:** Der Shop hat keinen öffentlichen Endpunkt, wer kauft, ist registriert.
3. **Was es gibt:** Badges und Grafiken (z. B. Banner), die der Admin hochlädt. Gekauft wird das Nutzungsrecht auf dem
   eigenen Profil. Es wird nichts wirklich verkauft: Der Shop ist zum Üben der Technik eines echten Online-Shops,
   einschließlich „Versand“ (die Zustellung des Nutzungsrechts als eigener Schritt einer Bestellung).
4. **Standard-Banner:** Es gibt immer ein kostenloses Standard-Banner. Alles Weitere kostet Punkte, die User sollen
   dafür grinden.
5. **Tauschen:** User können erworbene Items untereinander tauschen. Das kommt als eigener Teil in die Planung (Angebot,
   Annahme, Übergabe des Besitzes in einer Transaktion).
6. **Öffentlich (entschieden 2026-11-09):** Banner und GUID sind immer öffentlich. Alles andere, auch das Profilbild,
   regelt die Sichtbarkeit des Profils (nur Freunde, nur angemeldete User, alle oder keiner).
7. **Sichtbarkeit einstellbar (gebaut 2026-11-09):** Im Profil, Box „Einstellungen“, über `VisibilityPicker` (wie überall):
   Nur ich, Ich und meine Freunde, Alle User, Alle; für Profil und Freundesliste. `PUT /api/users/visibility`.
8. **Anonym (entschieden 2026-11-09):** Wer ganz anonym ist (Nur ich), den sehen nur er selbst und der Admin. Alle
   anderen sehen statt des Profilbilds einen Smiley, der je User aus der GUID fest gewählt wird (wie die Farbe des
   Avatars), und „Anonym“ statt des Namens. Gebaut wird das mit der Profilseite für andere User.
9. **Gästebuch-Autoren (entschieden 2026-11-09):** Es gilt die Sichtbarkeit des Gästebuchs, auf dessen Profil man
   schreibt, nicht die des Autors. Wer öffentlich in ein Gästebuch schreibt, muss damit leben, dass man seine
   Personalien lesen kann; das gilt in beide Richtungen. So ist es schon gebaut.
10. **Admin (entschieden 2026-11-09):** Er sieht alle Profile, aber nur über die Admin-Endpunkte. Die Regel für User hat
    keinen Sonderweg für ihn, so kann kein User über einen normalen Endpunkt fremde Daten ziehen.
12. **Profilkopf (gebaut 2026-11-09):**
    - Das Banner liegt hinter der ganzen Box. Unten ein durchscheinender Streifen mit Leuchtlinie, auf der Linie das
      eckige Profilbild.
    - Das Zahnrad im Kopf öffnet das Popup „Profilkopf einstellen“: Status-Text (`UsersDetail.statusText`, höchstens
      160 Zeichen) und Tempo der Banner-Drift (`UsersDetail.bannerDriftSpeedPercent`, 0 bis 150 %, leer = 100 %).
    - Beides steht in `UsersDetail`, nicht in den UsersSettings: Es gehört zum Profil, und jeder Besucher, der das
      Profil sehen darf, sieht es so (Nutzer 2026-11-09).
    - Im Fuß: Uploads, Downloads und Gästebuch; „Gästebuch“ springt zum Gästebuch. Rechte und Punkte sind dort
      ausgeblendet, die Punkte stehen oben rechts im Banner.
14. **Profil anderer User (gebaut 2026-11-09):** `/profile/<guid>`, `/profile` führt zum eigenen. Name und Profilbild
    eines Users führen überall auf sein Profil (zuerst im Gästebuch, `UsersProfileLink`), auch wenn es privat ist.
    Sichtbar: Kopf ohne Bearbeiten und Gästebuch. Privat: Banner, „Anonym“, Smiley aus der GUID und die GUID, sonst
    nichts. Die E-Mail-Adresse zeigt der Kopf nur im eigenen Profil.
15. **Profilbild 600 × 600 (2026-11-09):** groß 600 × 600, höchstens 2 MB; klein weiter 96 × 96. Im Profilkopf wird
    es beim Zeigen 268 CSS-Pixel groß, auf Bildschirmen mit doppelter Pixeldichte 536 echte Pixel.
13. **Standard für neue User (2026-11-09):** Profil und Freundesliste sind öffentlich (`ANY`, auch ohne Anmeldung),
    aus der YAML (`gebiter.users.default-profile-visibility`, `default-friend-list-visibility`). Bestehende User
    behalten ihre Einstellung.
11. **Die Regel wird überall genutzt (gebaut 2026-11-09):** Die Sichtbarkeit steht an `Users`, das immer zuerst lädt.
    - `GET /api/users/{guid}` liefert `UsersForClient`: den ganzen User nur, wenn man das Profil sehen darf. Sonst nur
      die GUID mit `profileVisible: false`, und der Client lädt vom Rest nichts.
    - `GET /api/users-detail/{guid}` gibt es nur bei Sichtbarkeit, sonst 404.
    - Alle User und alle Details ganz liest nur der Admin (`/api/admin/users`, `/api/admin/users-detail`); die
      Admin-Tabs nutzen diese Wege.
    - Geprüft gegen die Pi-DB: alice selbst sieht sich bei „Nur ich“; ein Fremder bekommt bei NONE und FRIENDS nur die
      GUID und 404 für die Details, bei AUTHENTICATED alles.
