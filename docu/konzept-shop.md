# Konzept: Punkte-Shop, Truhe und Handel

Stand 2026-11-09: Bestandsanalyse und Vorschlag, noch nichts gebaut. Die Entscheidungen des Nutzers vom selben Tag
stehen in Abschnitt 10 und sind eingearbeitet. Der Nutzer: eine solide Grundlage, die noch deutlich verfeinert wird;
einige Tabellen werden sich dabei ändern.

**Stand 2026-11-11:** Die ersten fünf Klassen des Markts sind angelegt, mit geänderten Tabellen: siehe Abschnitt 11. Wo
Abschnitt 11 von den Abschnitten 3 bis 6 abweicht, gilt Abschnitt 11.

- Baut auf `konzept-profilbild-banner-shop.md` auf. Von dort gelten weiter die Grundsätze eines echten Shops (Abschnitt
  4.1) und das Kontobuch.
- Ersetzt die Tabellen von dort (Abschnitt 4.2).

## 1. Was der Nutzer will (2026-11-09)

- **Shop:** Mit Punkten kauft man Grafiken. Der Kauf ist das Recht, die Grafik auf der Plattform zu nutzen.
- **Nutzungsorte:** Wo genau, gibt der Admin je Grafik vor. Beispiele:
  - als eigenes Banner;
  - als Badge im Profil, ähnlich wie Achievements;
  - als Bild in einem Gästebucheintrag (z. B. eine Emoji-Kuh);
  - später als Smiley in einem Chat über WebSockets.
- **Nicht einmalig:** Jeder kann einen Artikel kaufen, solange er im Shop angeboten wird.
- **Saisonware:** Artikel stehen nur zeitweise im Shop, gekauft werden kann nur in diesem Zeitfenster.
- **Nachweis:** Wer hat welches Item wann gekauft, und darf er es benutzen?
- **Weiterverkauf:** Ein User kann ein Item an einen anderen User weiterverkaufen.
- **Eigene Schatztruhe:**
  - Kapitel als Überschriften und Labels vergibt man selbst, zum Sortieren und Wiederfinden.
  - Dazu eine Favoritenliste, deren Reihenfolge man per Drag and Drop ändert.
  - Beim Einfügen stehen die Favoriten in ihrer Reihenfolge vorn, danach die Suche.
- **Sicherheit:** Einfügen darf man nur, was man gekauft hat.
- **Solr:** Für die vielen strukturierten Suchen sieht der Nutzer einen Solr-Kern.

## 2. Bestandsanalyse: was ein Steam-Profil zeigt

| Bei Steam | Was es ist | Für uns |
|---|---|---|
| Steam-Punkte und Punkteshop | Punkte gibt es für Käufe; im Punkteshop gibt man sie für Kosmetik aus | Ja. Kontostand `Users.points` gibt es schon, das Kontobuch kommt; Punkte gibt es fürs Mitmachen |
| Profilhintergrund (auch animiert) | Hintergrund der ganzen Profilseite | Ja, als Banner bzw. Hintergrund des Profils (`PROFILE_BANNER`) |
| Avatar-Rahmen | Rahmen um das Profilbild, überall wo der Avatar steht | Ja (`AVATAR_FRAME`), ein PNG über dem `UsersAvatar` |
| Animierter Avatar | ersetzt das Profilbild | Später, mit Animationen |
| Mini-Profil-Hintergrund | Karte beim Zeigen auf einen Namen in der Freundesliste | Später, wenn es Mini-Profile gibt |
| Sticker und Emoticons | im Chat; Emoticons überall, wo man schreibt; Sticker auch in der Vitrine | Ja: Bild im Gästebuch (`GUESTBOOK_IMAGE`), später Sticker im Chat (`CHAT_STICKER`) |
| Abzeichen, Saison-Abzeichen | im Profil; das Saison-Abzeichen steigt mit Käufen in der Saison | Ja: `PROFILE_BADGE`. Saison-Abzeichen als Idee |
| Vitrinen (Showcases) | Flächen im Profil mit selbst gewählten Items; mehr Plätze mit höherem Level | Ja: `PROFILE_SHOWCASE`; Plätze später nach Rang |
| Profil-Bündel | Avatar, Rahmen, Hintergründe und Farben als ein Paket | Später, als Bündel-Angebot |
| Inventar | alle Items eines Kontos, mit Filtern | Unsere Truhe, dazu Kapitel als Register, Labels und Favoriten (das hat Steam nicht) |
| Tauschangebote | Items direkt zwischen zwei Usern, mit Sperrfrist | Ja, eigene Phase |
| Community-Markt | Items gegen Guthaben verkaufen, Steam nimmt eine Gebühr | Ja, als Marktplatz gegen Punkte; die Gebühr als Punktesenke, eigene Phase |
| Handelbar oder gebunden | Punkteshop-Items hängen am Konto, Items aus Sammelkarten sind handelbar | Nein: Bei uns ist alles sofort handelbar, ohne Sperrfrist |
| Zeitfenster | Artikel ab einem Startzeitpunkt, Saisonware zu den Sales | Ja: Angebot mit von/bis, Saison als Klammer |
| Sammelkarten, Basteln, Edelsteine | Karten aus Spielen, Abzeichen daraus basteln, Items zerlegen | Nein, passt nicht zur Plattform |

## 3. Die Grundidee: Artikel, Angebot, Exemplar

- **Artikel** (`ShopItem`): die Grafik selbst, mit Art und Nutzungsorten. Der Admin legt ihn einmal an.
- **Angebot** (`ShopOffer`): wann und zu welchem Preis ein Artikel im Shop steht.
  - Ein Artikel kann mehrmals angeboten werden, z. B. Winter 2026 und wieder Winter 2027, dann teurer.
  - Gekauft werden kann nur in einem laufenden Angebot.
- **Exemplar** (`ShopItemCopy`): das, was ein User durch den Kauf bekommt, also sein Nutzungsrecht.
  - Jedes Exemplar hat eine eigene GUID, einen Besitzer und eine Geschichte (gekauft, getauscht, verkauft).
  - Ein User darf denselben Artikel mehrmals kaufen, z. B. um Exemplare weiterzuverkaufen.
  - Weiterverkaufen heißt: Das Exemplar wechselt den Besitzer. Es ist sofort handelbar, ohne Sperrfrist.
  - So kann jeder kaufen, und trotzdem ist jederzeit klar, wem was gehört und seit wann.
- **Truheneintrag** (`ShopChestEntry`): wie ein User einen Artikel in seiner Truhe einordnet.
  - **Kapitel** sind die Struktur der Truhe und erscheinen als Register (Tabs). Jeder Eintrag steht in genau einem.
  - **Labels** sind etwas anderes: freie Stichwörter quer zu den Kapiteln, beliebig viele je Eintrag.
  - Dazu der Platz in der Favoritenliste.
  - Er hängt an User und Artikel, nicht am Exemplar.
  - Verkauft man eins von drei Exemplaren, bleibt die Ordnung. Geht das letzte, geht auch der Eintrag, damit nichts
    liegen bleibt.
- **Nutzungsrecht:** Ein User darf einen Artikel an einem Ort nutzen, wenn beides gilt:
  - Er besitzt ein Exemplar davon, das nicht gerade im Handel steckt.
  - Der Artikel erlaubt diesen Ort.

## 4. Tabellen (Postgres, Präfix `shop_`, lose gekoppelt)

Wie überall: keine JPA-Beziehungen. Verweise gehen über Key, id oder GUID. Löschen und Aufräumen machen die Services
selbst.

| Entity (Tabelle) | Felder | Wozu |
|---|---|---|
| `ShopItem` (`shop_item`) | `key`, `itemKind` (`PROFILE_BANNER`, `AVATAR_FRAME`, `PROFILE_BADGE`, `STICKER` …), `displayName` und `description` (jsonb, mehrsprachig), `fileSha256` (die Grafik im Kern FILE), `status` (`ACTIVE`, `RETIRED`) | Der Artikel |
| `ShopItemUsePlace` (`shop_item_use_place`) | `id`, `shopItemKey`, `usePlace` (`PROFILE_BANNER`, `AVATAR_FRAME`, `PROFILE_BADGE`, `PROFILE_SHOWCASE`, `GUESTBOOK_IMAGE`, `CHAT_STICKER`), eindeutig je Paar | Wo der Artikel genutzt werden darf, vom Admin je Artikel gesetzt |
| `ShopSeason` (`shop_season`) | `key` (z. B. `WINTER_2026`), `displayName`, `startsAt`, `endsAt` | Die Klammer für Saisonware, oben im Schaufenster |
| `ShopOffer` (`shop_offer`) | `id`, `shopItemKey`, `shopSeasonKey` (leer: ohne Saison), `pricePoints`, `startsAt`, `endsAt` (leer: offen), `listingPosition`; limitierte Auflage (`maxCopies`, `soldCopies`) erst mit dem Marktplatz | Wann und zu welchem Preis |
| `ShopOrder` (`shop_order`) | `id`, `orderGuid` (vom Client, eindeutig), `usersGuid`, `shopOfferId`, `shopItemKey`, `pricePoints` (eingefroren), `status` (`PAID`, `DELIVERED`, `REFUNDED`), `orderedAt`, `deliveredAt` | Die Bestellung; „Versand“ ist das Anlegen des Exemplars |
| `ShopItemCopy` (`shop_item_copy`) | `id`, `copyGuid`, `shopItemKey`, `ownerUsersGuid`, `status` (`OWNED`, `IN_TRADE`, `ON_MARKET`, `REVOKED`), `acquiredAt`, `shopOrderId` (woher) | Das Exemplar, das Nutzungsrecht. `IN_TRADE` und `ON_MARKET` sind keine Sperrfrist, sie verhindern nur, dass ein Exemplar zweimal zugleich angeboten wird |
| `ShopItemCopyEvent` (`shop_item_copy_event`) | `id`, `shopItemCopyId`, `eventKind` (`PURCHASED`, `TRADED`, `SOLD`, `REFUNDED`, `REVOKED`), `fromUsersGuid`, `toUsersGuid`, `pricePoints`, `happenedAt` | Die Geschichte jedes Exemplars, nur Anfügen, nie Ändern |
| `ShopChestEntry` (`shop_chest_entry`) | `id`, `usersGuid`, `shopItemKey`, `shopChestChapterId` (leer: ohne Kapitel), `listingPosition` (im Kapitel), `favoriteListingPosition` (leer: kein Favorit) | Die eigene Ordnung in der Truhe, eindeutig je User und Artikel |
| `ShopChestChapter` (`shop_chest_chapter`) | `id`, `usersGuid`, `chapterName`, `listingPosition` | Selbst vergebene Kapitel, die Register (Tabs) der Truhe |
| `ShopChestLabel` (`shop_chest_label`) | `id`, `usersGuid`, `labelName` | Selbst vergebene Labels, einmal anlegen, überall nutzen, umbenennen wirkt überall |
| `ShopChestLabelAssignment` (`shop_chest_label_assignment`) | `id`, `shopChestLabelId`, `shopChestEntryId` | Welcher Eintrag welche Labels trägt |
| `ShopEquippedItem` (`shop_equipped_item`) | `id`, `usersGuid`, `usePlace`, `slotPosition`, `shopItemCopyId`, eindeutig je User, Ort und Platz | Was gerade angelegt ist: Banner, Rahmen, die Plätze der Vitrine |
| `UsersPointBooking` (`users_point_booking`) | wie im ersten Entwurf, dazu die Gründe `TRADE`, `MARKET_SALE`, `MARKET_FEE` | Das Kontobuch |
| später `ShopTrade`, `ShopTradeCopy` | Angebot zwischen zwei Usern: Exemplare und Punkte je Seite, `status` (`OPEN`, `ACCEPTED`, `DECLINED`, `COUNTERED`, `WITHDRAWN`), `previousShopTradeId` (das Angebot, auf das dieses ein Gegenangebot ist) | Tauschangebote mit Zustimmung oder Gegenangebot |
| später `ShopMarketListing` | Exemplar, Verkäufer, Preis, Status, Käufer | Marktplatz |

**Gästebuch:** `GuestbookAttachment` aus dem Gästebuch-Konzept mit `attachmentKind = SHOP_ITEM` und dem Key des Artikels.
Gespeichert wird der Artikel, nicht das Exemplar.

**Grafiken:**
- Sie liegen wie jede Datei im Kern FILE, mit der neuen FileClass `SHOP_GRAFIK` (schreiben nur ADMIN, lesen USER).
- Erlaubt sind PNG, animierte Grafiken und SVG. SVG geht, weil nur der Admin Shop-Grafiken hochlädt. SVG, das User
  hochladen, wird nie direkt angezeigt.
- Die Vorschau ist `previewBase64Png` (200 × 200), das Original kommt über den File-Endpunkt. Es gibt keine eigenen
  Bild-Endpunkte.
- Die Maße je Art (z. B. Banner 1500 × 500) stehen in der YAML.

## 5. Solr: finden in Solr, entscheiden in Postgres

Kaufen, Einfügen und Tauschen sind wie Geld. Sie laufen in Postgres-Transaktionen, denn nur dort ist Alles oder
Nichts sicher. Solr ist der schnelle Index zum Finden und Filtern:

- Er wird nach dem Commit nachgeführt, wie bei den anderen Kernen.
- Er lässt sich jederzeit aus Postgres neu aufbauen („neu indexieren“ für den Admin).
- Jede bindende Prüfung liest Postgres, nie Solr: Darf er kaufen, besitzt er das Exemplar, ist der Ort erlaubt?

Zwei Kerne:

- **`SHOP_OFFER`, das Schaufenster.** Ein Dokument je Angebot, mit den Feldern des Artikels:
  - Name, Beschreibung, Stichwörter;
  - Art, Nutzungsorte, Saison;
  - Preis, `startsAt` und `endsAt`, die Vorschau.
  - „Jetzt kaufbar“ ist ein Filter `startsAt ≤ NOW ≤ endsAt`. An den Saisongrenzen muss nichts neu indexiert werden,
    und der Preis stimmt je Angebot.
  - Lesen: jeder Angemeldete. „Demnächst“ und Abgelaufenes sieht nur der Admin.
- **`SHOP_CHEST`, die Truhe.** Ein Dokument je Truheneintrag, also je User und Artikel:
  - der Besitzer (`ownerUsersGuid`) als harter Filter wie beim Lesezugriff auf Dateien: nur die eigenen, der Admin
    alle;
  - vom Artikel: Name, Stichwörter, Art, Nutzungsorte, Vorschau;
  - von der Ordnung: Kapitel (id und Name), Labels, Favoritenplatz;
  - die Zahl der Exemplare.
  - **Der Wähler beim Einfügen** fragt nur: eigene Einträge, mit Exemplar, Nutzungsort passt. Dazu Freitext über Name,
    Stichwörter, Labels und Kapitel. Sortiert: Favoriten nach Platz, dann Kapitel, dann Name.
- **Marktplatz (später):** Entweder ein eigener Kern `SHOP_MARKET` oder Angebote von Usern im Schaufenster. Das
  entscheiden wir, wenn wir den Marktplatz bauen.

## 6. Abläufe

1. **Kaufen.** `POST /api/shop-order` mit `{shopOfferId, orderGuid}`, alles in einer Transaktion:
   - Kennt er die `orderGuid` schon, kommt die alte Bestellung zurück.
   - Das Angebot läuft gerade.
   - Später, bei limitierter Auflage: `UPDATE … SET sold_copies = sold_copies + 1 WHERE sold_copies < max_copies`.
   - Punkte abbuchen mit dem bedingten `UPDATE` aus dem ersten Entwurf (kein Minus).
   - Bestellung `PAID`.
   - „Versand“: Exemplar, Ereignis `PURCHASED` und, wenn noch keiner da ist, Truheneintrag anlegen. Dann Bestellung
     `DELIVERED`.
   - Nach dem Commit: Solr nachführen.
2. **Einfügen, z. B. ein Bild im Gästebuch.**
   - Der Wähler zeigt die Truhe (Solr).
   - Beim Speichern prüft der `GuestbookService` in Postgres: Exemplar im Besitz und Ort `GUESTBOOK_IMAGE` erlaubt.
     Erst dann legt er den Anhang an.
   - Ein gepostetes Bild bleibt stehen, auch wenn das Exemplar später verkauft wird. Das Recht galt beim Posten, der
     Zeitstempel des Eintrags belegt das. Es fehlt danach nur in der Truhe für künftige Posts.
3. **Anlegen (Banner, Rahmen, Vitrine).** `PUT /api/shop-equipped-item` mit `{usePlace, slotPosition, shopItemKey}`.
   Er prüft den Besitz und hängt ein eigenes Exemplar an den Platz.
4. **Tauschangebot (Phase 5), von Person zu Person.**
   - A bietet Exemplare und Punkte, B gibt Exemplare und Punkte. Die Exemplare von A sind solange `IN_TRADE`.
   - B stimmt zu, lehnt ab oder macht ein Gegenangebot. Das Gegenangebot ist ein neues Angebot mit
     `previousShopTradeId`, das alte steht dann auf `COUNTERED`. Das geht hin und her, bis einer zustimmt oder ablehnt.
   - Die Gebühr für den Handel von Person zu Person steht in der YAML. Sie ist eine andere als die des Marktplatzes,
     die Höhe legen wir noch fest.
   - Stimmt B zu, läuft alles in einer Transaktion:
     - Die Besitzer wechseln über bedingte `UPDATE`s (`WHERE owner = A AND status = 'IN_TRADE'`).
     - Die Punkte werden gebucht, die Ereignisse `TRADED` angelegt.
     - Angelegtes fällt ab, die Truheneinträge werden nachgezogen.
   - Ablehnen, Zurückziehen oder Ablauf geben die Exemplare frei.
5. **Marktplatz (Phase 6).**
   - Ein Exemplar steht zum Preis im Markt (`ON_MARKET`).
   - Beim Kauf gehen die Punkte vom Käufer zum Verkäufer, abzüglich der Gebühr des Marktplatzes (YAML, Höhe noch
     offen). Das Exemplar wechselt den Besitzer.
   - Hier entscheiden wir auch über limitierte Auflagen.

## 7. Endpunkte (grob, nach den Controller-Regeln)

- `/api/shop-offer` (USER): Schaufenster auflösen und suchen. `/api/admin/shop-offer`, `/api/admin/shop-item` und
  `/api/admin/shop-season` für den Admin.
- `/api/shop-order` (USER): kaufen, eigene Bestellungen. `/api/admin/shop-order`: alle, rückerstatten.
- `/api/shop-chest` (USER): eigene Truhe suchen; Kapitel, Platz und Favoriten setzen. Dazu `/api/shop-chest-chapter`
  und `/api/shop-chest-label`.
- `/api/shop-equipped-item` (USER): anlegen und ablegen.
- `/api/users-point-booking` (USER): das eigene Kontobuch.
- Später `/api/shop-trade` und `/api/shop-market-listing`.

## 8. Frontend

- **Modul „Shop“** als Kachel, mit den Tabs:
  - Schaufenster: Saison oben, Filter nach Art und Nutzungsort, Suche, Kacheln mit Preis und „noch 3 Tage“;
  - Truhe;
  - Handel (später);
  - Punktekonto.
- **Truhe:**
  - Kapitel als Überschriften, die Artikel darin sortieren, beides per Drag and Drop (`SortableArea`).
  - Labels als Chips, oben die Favoritenleiste, ebenfalls per Drag and Drop.
- **`ShopItemPicker`** (global, nach dem Muster des `EmojiPicker`):
  - Props: Nutzungsort und `onPick`.
  - Erst die Favoriten, dann die Suche über Freitext, Labels und Kapitel.
  - Nur, was man besitzt und dort nutzen darf.
  - Genutzt im Gästebuch, später im Chat.
- **Navigation** nach `konzept-navigation.md`: Filter des Schaufensters in der Adresse, die Seite eines Artikels mit
  Origin.

## 9. Reihenfolge (Nutzer 2026-11-09: erst Artikel und Kaufen, dann Anzeigen)

Gebaut wird in schmalen Stücken, jedes Stück ist von vorn bis hinten benutzbar. Nur das nächste Stück wird genau
geplant; Truhe, Handel, Marktplatz und Chat stehen oben nur als Richtung und werden erst geplant, wenn sie dran sind.

**Erstes Stück: das Banner.**

1. FileClass nur für Banner, schreiben nur ADMIN. Das Seitenverhältnis wird beim Hochladen per Zuschnitt erzwungen, das
   Backend prüft die Maße.
2. Profilkopf: Das Titelbild bekommt ein festes Seitenverhältnis und zeigt das Banner, mit einem kostenlosen
   Standard-Banner.
3. Punkte: Kontobuch mit Korrekturbuchung durch den Admin, damit es Punkte zum Kaufen gibt.
4. Artikel und Angebot mit Zeitfenster, Kaufen (Bestellung, Exemplar), das Banner im Profil anlegen.

Danach, jeweils erst dann genau geplant: weitere Artikelarten (Rahmen, Badges, Sticker), die Truhe, Bilder im
Gästebuch, Handel, Marktplatz, Chat.

## 10. Entscheidungen des Nutzers (2026-11-09)

1. **Mehrfach kaufen:** Ja, ein User darf denselben Artikel mehrmals kaufen. Handeln ist erlaubt.
2. **Verkauftes Gästebuch-Bild:** Es bleibt stehen. Es verschwindet nur aus der Truhe des Users für künftige Posts; der
   Zeitstempel des Eintrags belegt, dass das Recht beim Posten galt.
3. **Kapitel und Labels:** Beides, es ist Unterschiedliches. Kapitel sind die Struktur und erscheinen als Register
   (Tabs), Labels sind freie Stichwörter.
4. **Weiterverkauf:** Beides, ein Marktplatz und ein persönlicher Handel mit Angebot, dann Zustimmung oder
   Gegenangebot. Gebühren ja, auf dem Marktplatz eine andere als von Person zu Person. Die Höhe legen wir noch fest.
5. **Sperrfrist:** Nein, alles ist sofort handelbar. Es gibt keine dauerhaft gebundenen Artikel.
6. **Limitierte Auflage:** Ja, das soll es geben. Wie genau, entscheiden wir, wenn wir den Marktplatz bauen.
7. **Grafiken:** PNG und animierte. Weil der Admin die volle Kontrolle über die Shop-Grafiken hat, auch SVG. Bauchschmerzen
   macht nur SVG, das User hochladen und das direkt angezeigt würde.
8. **Öffentlich:** Banner und GUID sind immer öffentlich. Alles andere regelt die Sichtbarkeit des Profils: nur Freunde,
   nur angemeldete User, alle oder keiner.
9. **Uploads:** Wer hochlädt, lässt die Seite offen. Wer sie verlässt, bricht den Upload ab. Seit 2026-11-09 so gebaut,
   siehe `konzept-navigation.md`.

## 11. Gebaut: die Tabellen des Markts (2026-11-11)

Wünsche des Nutzers vom 2026-11-10 und 2026-11-11, die die Abschnitte 3 bis 6 ändern:

- Der Artikel ist immer eine Datei im Solr-Kern FILE, mit ihrer id. Eigene Felder für die Grafik hat der Artikel nicht.
- Gekauft wird dauerhaft (beliebig oft nutzen) oder eine Anzahl Nutzungen (10 gekauft = 10 Posts, je Post zählt ein
  Zähler herunter).
- Ein Angebot steht ohne Ende, bis zu einem Zeitpunkt oder nur in einer Stückzahl im Markt.
- Das Angebot verschwindet irgendwann. Was der User hat, bleibt mit seinen Nutzungen stehen, losgelöst vom Angebot.
- Eine Entity verwaltet alles, was ein User zur Verfügung hat. Sie ersetzt das Exemplar (`ShopItemCopy`) aus Abschnitt 3
  durch einen Zähler je User und Datei.
- Aufbau wie die Galerien: ein Shop-Manager, darin Rubriken, in den Rubriken die Bilder zum Kauf.

Angelegt am 2026-11-11, Paket `de.gebiter.shop.model`. Die fünf Tabellen stehen in der Pi-DB (von Hibernate angelegt,
leer). Von vorn bis hinten gebaut sind bisher nur die Rubriken: Service, Endpunkte und der Tab „Rubriken“ im Modul
„Achievements & Markt“ ([ShopCategory](entities/ShopCategory.md)). Dazu kommen die Artikel und ihre Angebote (Hochladen und Anzeigen, siehe unten) und seit dem Abend des 2026-11-11 das Kaufen mit Beleg und Besitz (siehe unten):

| Entity (Tabelle) | Felder | Wozu | Doku |
|---|---|---|---|
| `ShopCategory` (`shop_category`) | `key`, `displayName`, `fileClassKey` (Pflicht), `listingPosition` | Die Rubrik mit ihrer einen FileClass | [ShopCategory](entities/ShopCategory.md) |
| `ShopItem` (`shop_item`) | `id`, `fileDocumentId` (eindeutig), `shopCategoryKey`, `sellerUsersGuid` | Der Artikel: diese Datei steht in dieser Rubrik zum Kauf, eingestellt von diesem User | [ShopItem](entities/ShopItem.md) |
| `ShopOffer` (`shop_offer`) | `id`, `shopItemId`, `pricePoints`, `permanent`, `grantedUsageCount`, `startsAt`, `endsAt`, `maxPurchaseCount`, `purchaseCount` | Das Angebot: Preis, Form des Kaufs, wie lange | [ShopOffer](entities/ShopOffer.md) |
| `UsersShopItem` (`users_shop_item`) | `id`, `usersGuid`, `fileDocumentId`, `permanent`, `remainingUsageCount`, eindeutig je User und Datei | Was ein User hat; zeigt auf die Datei, nicht aufs Angebot | [UsersShopItem](entities/UsersShopItem.md) |
| `ShopOrder` (`shop_order`) | `id`, `usersGuid`, `shopOfferId`, `fileDocumentId`, `pricePoints`, `permanent`, `grantedUsageCount`, `orderedAt` | Der Beleg eines Kaufs, festgeschrieben | [ShopOrder](entities/ShopOrder.md) |

**Beispiel.** Die Emoji-Kuh ist die Datei `9f86…0a08` im Kern FILE und Artikel 7 in der Rubrik `STICKER`.

1. Zwei Angebote: Angebot 21 dauerhaft für 500 Punkte, ohne Ende. Angebot 22 ein 10er-Paket für 80 Punkte, bis zum
   1. Dezember und höchstens 10 Mal.
2. Bob kauft Angebot 22: 80 Punkte gehen ab (Kontobuch), Beleg 41 entsteht, Bob bekommt die Zeile „Bob, Kuh, nicht
   dauerhaft, Rest 10“. Das Angebot steht auf 1 von 10 verkauft.
3. Bob postet die Kuh dreimal im Gästebuch: Rest 7.
4. Am 1. Dezember verschwindet Angebot 22 aus dem Markt. Bobs Zeile bleibt, Rest 7.
5. Kauft Bob noch ein 10er-Paket, steht dieselbe Zeile auf Rest 17. Kauft er Angebot 21, steht sie auf dauerhaft.

**Entschieden (Nutzer 2026-11-11):** Ein Kauf läuft nie ab: „Was man hat, hat man, bis man es benutzt hat.“ Nur die
Angebote im Markt laufen ab.

**Kachel und Rubrik als Ziel (gebaut 2026-11-11, Nutzer: „eine Kachel … wo wir die Rubriken schon mal anzeigen“, „in der
File-Class die Rubriken als Destination hinzufügen“):**

- Modul „Gebietermarkt“ für jeden angemeldeten User: Kachel auf der Startseite, `/market`, je Rubrik ein Tab im
  Subheader. Eine Rubrik zeigt ihre Artikel und im Fuß ihre FileClass.
- **Überholt am selben Tag:** Zuerst legte der Admin je Rubrik mehrere erlaubte FileClasses fest (Tabelle
  `shop_category_file_class`, Spalten „Markt: <Rubrik>“ im Tab „FileClass-Ziel“). Das ist wieder weg, siehe den
  nächsten Absatz.

**Eine FileClass je Rubrik (gebaut 2026-11-11, Nutzer: „in einer Rubrik für den Markt würde ich immer eine File-Class
voraussetzen. Und dann kannst du dir nämlich auch schenken, dass man beim Upload diese File-Class nochmal extra wählen
soll“):**

- `ShopCategory` hat das Pflichtfeld `fileClassKey`. Der Admin wählt die FileClass beim Anlegen der Rubrik (Popup „Neue
  Rubrik“: Key, Anzeigename, FileClass) und ändert sie in der Zeile (Klick auf die Kachel in der Spalte „FileClass“).
- Der Upload in eine Rubrik fragt nicht nach der FileClass: Das Backend setzt die der Rubrik fest ins Dokument, was der
  Client dazu schickt, zählt nicht. Im Ablauf „neues Angebot“ steht die FileClass nur noch als Kachel über dem
  Upload-Feld, mit ihren erlaubten Endungen.
- Den Knopf „neues Angebot“ bekommt, wer die FileClass der Rubrik hochladen darf (Schalter „Hochladen“).
- Die Tabelle `shop_category_file_class` und alles dazu (Entity, Service, Endpunkte, Spalten im Tab „FileClass-Ziel“)
  ist gelöscht.
- Beispiel: Rubrik „Memes“ hat `MEME` (USER „LH“): Bob klickt „neues Angebot“, legt `katze.png` ab und lädt hoch, ohne
  etwas zu wählen; das Dokument hat `fileClassKey` `MEME`. Rubrik „Profile-Banner“ hat `PROFILE_BANNER` (USER nur „L“):
  Bob sieht dort keinen Knopf.

**Hochladen in eine Rubrik (gebaut 2026-11-11, Nutzer: „erstmal Memes hochladen können“):** eigener Upload-Weg des
Markts (`POST /api/shop-item/upload` → `FileUploadService.uploadFileIntoShopCategory`) über dem gemeinsamen Upload-Kern.
Geprüft wird der Schalter „Hochladen“ der FileClass der Rubrik; nach dem Einchecken entsteht
der Artikel (`ShopItem`), Verkäufer ist der Uploader, die Datei ist für jeden Angemeldeten sichtbar. Im Tab der Rubrik
steht oben die Upload-Maske (der globale Ablauf), darunter die Artikel als Bildkacheln. Einzelheiten:
[ShopItem](entities/ShopItem.md). FileClass `MEME` ist angelegt, jeder User darf sie hochladen.

**„Neues Angebot“ als geführter Ablauf (gebaut 2026-11-11, zweite Fassung nach der Ansage des Nutzers):** Im Tab einer
Rubrik stehen keine Eingabefelder mehr, nur die Artikel und oben rechts der Knopf „neues Angebot“. Er öffnet ein Popup
mit Schritten: (1) Datei hochladen, (2) Laufzeit: dauerhaft oder befristet, „Bis wann?“ nur bei befristet, (3) Nutzung:
Haken „Unbegrenzt“, ohne Haken die Anzahl, (4) Preis, ohne „Unbegrenzt“ wahlweise eine Stückzahl; dann „Angebot
erstellen“. Der Upload legt nur den Artikel an; das Angebot kommt über `POST /api/shop-offer` (Verkäufer oder ADMIN).
Einzelheiten: [ShopOffer](entities/ShopOffer.md). Die erste Fassung (Angebotsfelder und Upload-Maske pauschal im Tab)
hat der Nutzer am selben Tag verworfen.

**Kaufen (gebaut 2026-11-11, Nutzer: „erstmal Memes hochladen können. Und auch kaufen können“):** An der Kachel eines
Artikels steht je laufendem Angebot der Knopf „Kaufen“ (nicht am eigenen Artikel, nicht bei dauerhaftem Besitz). Er
öffnet die Bestätigung mit Vorschau, dem, was man bekommt, Preis und Punktestand vorher und nachher; erst „Für x Punkte
kaufen“ kauft. `POST /api/shop-order` mit `{shopOfferId}` → `ShopOrderService.createShopOrder`, alles in einer
Transaktion: Angebot zählt in einer Anweisung hoch (nur solange es läuft), Beleg, Punkte über das Kontobuch (Käufer
−Preis, Verkäufer +Preis abzüglich 10 % Marktgebühr, abgerundet; die Gebühr verschwindet), Besitz anlegen oder
aufstocken. Abgelehnt mit 409: eigener Artikel, schon dauerhaft im Besitz, Punkte reichen nicht, Angebot läuft nicht
mehr. Danach steht an der Kachel „Du hast es dauerhaft.“ bzw. „Du hast noch 10 Nutzungen.“ Einzelheiten und Beispiel:
[ShopOrder](entities/ShopOrder.md), [UsersShopItem](entities/UsersShopItem.md).

**Nächste Stücke, in dieser Reihenfolge:**

1. Nutzen: Zähler herunter, wenn ein gekaufter Artikel benutzt wird (z. B. im Gästebuch gepostet).
2. Ein Angebot ändern oder beenden, weitere Angebote zu einem vorhandenen Artikel.

**Später, nur als Richtung:** Verkauf durch User mit 10 % Marktgebühr (Verkäufer am Artikel, Gebühr und Auszahlung am
Beleg), Protokoll je Nutzung, eigene FileClass und eigener Upload-Weg für Markt-Artikel, Nutzungsorte, Truhe, Handel.
