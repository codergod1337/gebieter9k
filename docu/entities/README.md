# Entities

Je Entity eine Doku (Regel des Nutzers vom 2026-11-09): Zweck, Tabelle, Beispiel-JSON, Felder, alle Endpunkte,
die sie oder ihre DTOs übertragen, und alle Methoden in Backend und Frontend, die sie benutzen. Der Code verweist
zurück (Javadoc der Entity und der Controller, Kommentar am Frontend-Typ). Erzeugt mit
`python3 docu/tools/generate_entity_docs.py`; nach jeder Änderung neu erzeugen.

- [AccessRole](AccessRole.md): Ein einzelnes Recht, identifiziert über seinen eindeutigen `key` (keine id).
- [AccessRoleCollection](AccessRoleCollection.md): Eine Position: eine Bündelung von `AccessRole`s, identifiziert über ihren eindeutigen `key` (keine id).
- [AccessRoleCollectionRole](AccessRoleCollectionRole.md): Welche `AccessRole` zu welcher `AccessRoleCollection` gehört: Ein Eintrag ist ein Recht in einer Collection, verknüpft über die Keys.
- [AccessRoleUsersAssignment](AccessRoleUsersAssignment.md): Welche `AccessRole` welchem User zugewiesen ist: Ein Eintrag ist ein Recht an einem User.
- [Achievement](Achievement.md): Ein Achievement, ähnlich wie bei Steam: ein Abzeichen, das man sich freischaltet, z.
- [AchievementTracking](AchievementTracking.md): Eine Zeile im universellen Protokoll für Achievements (Nutzer 2026-11-09): was ein User getan hat, mit dem Kontrollcounter danach.
- [DiscardedSymbol](DiscardedSymbol.md): Ein Symbol, das im Icon-Manager gelöscht wurde: Es gefällt nicht und taucht nirgends mehr zur Auswahl auf.
- [FileCheer](FileCheer.md): Die Stimme eines Users zu einer Datei: begeistert (cheerUp) oder angewidert (cheerDown), je User und Datei höchstens eine.
- [FileClass](FileClass.md): Eine Dateiart, z.
- [FileClassAccessRole](FileClassAccessRole.md): Welche `de.gebiter.access.model.AccessRole` an den Dateien einer `FileClass` was darf, als drei Schalter: lesen, bearbeiten, hochladen.
- [FileClassDestinationAssignment](FileClassDestinationAssignment.md): Welche `FileClass` an welchem Ziel (`FileClassDestination`) angeboten wird, z.
- [FileClassFileExtension](FileClassFileExtension.md): Welche `FileExtension` eine `FileClass` annimmt: Eine Datei lässt sich nur hochladen, wenn ihre Endung für die gewählte FileClass freigeschaltet ist.
- [FileExtension](FileExtension.md): Eine Dateiendung, die das System kennt, wie in der Vorlage jede einzeln angelegt.
- [FileExtensionGroup](FileExtensionGroup.md): Eine Übergruppe der Endungen, z.
- [Gallery](Gallery.md): Eine Galerie im Profil (Konzept `docu/konzept-galerie.md`): Titel, Beschreibung und Sichtbarkeit legt der Besitzer selbst fest.
- [Guestbook](Guestbook.md): Ein Eintrag im Gästebuch eines Users: wer ihn wo geschrieben hat und was.
- [GuestbookComment](GuestbookComment.md): Ein Kommentar unter einem Gästebucheintrag.
- [GuestbookReaction](GuestbookReaction.md): Ein Smiley auf einen Gästebucheintrag oder einen seiner Kommentare (Vorgabe des Nutzers 2026-11-09): nur in eine Richtung, nicht zurücknehmbar.
- [PointActivity](PointActivity.md): Eine Tätigkeit, für die es Punkte gibt (Nutzer 2026-11-09), z.
- [Rank](Rank.md): Ein Rang der Rangleiter, von Stufe 1 (Leibeigener) bis Stufe 50 (General des Schreckens).
- [ShopCategory](ShopCategory.md): Eine Rubrik im Gebietermarkt, z. B. „Sticker“; jeder Artikel steht in genau einer, und jede Rubrik hat genau eine FileClass.
- [ShopItem](ShopItem.md): Ein Artikel im Gebietermarkt: eine Datei aus dem Solr-Kern FILE, die in einer Rubrik zum Kauf steht.
- [ShopOffer](ShopOffer.md): Ein Angebot im Gebietermarkt: zu welchem Preis, in welcher Form (dauerhaft oder Anzahl Nutzungen) und wie lange ein Artikel zu kaufen ist.
- [ShopOrder](ShopOrder.md): Der Beleg eines Kaufs im Gebietermarkt: wer, welches Angebot, welche Datei, zu welchem Preis, wann; hier steht auch, wie ein Kauf abläuft.
- [SolrField](SolrField.md): Ein Feld eines Solr-Kerns, so wie wir es in Postgres definieren: Name, Typ, die Schalter für Solr, die Zwillinge, wer das Feld in einer Antwort bekommt, wer es setzen darf und wie schwer es in der Suche wiegt.
- [SolrReference](SolrReference.md): Eine Referenz, bei uns der Name für die Hooks der Vorlage: ein Feld mit festem Aufbau (exakter Wert, mehrfach, filterbar, Vervollständigung), das in JEDEM Kern gleich heißt und so über Kerne hinweg auffindbar macht.
- [Users](Users.md): Ein Benutzer.
- [UsersAchievement](UsersAchievement.md): Ein erreichtes Achievement eines Users (Nutzer 2026-11-09): wer, welches, wann.
- [UsersContact](UsersContact.md): Eine Kontaktangabe eines Users, z.
- [UsersCredential](UsersCredential.md): Das Passwort eines Users – nur setzbar und prüfbar, nie lesbar.
- [UsersDetail](UsersDetail.md): Erweiterte Profildaten eines Users – das, was andere sehen, wenn sie auf sein Profil kommen: Profilbild, Status-Text, Banner-Drift, Avatar-Farben und Zähler.
- [UsersFriendRequest](UsersFriendRequest.md): Ein Freundschaftsantrag, die ganze Anfrage in einer Tabelle (Vorgabe des Nutzers 2026-11-09): wer fragt (`requesterUsersGuid`), wer annimmt oder ablehnt (`acceptorUsersGuid`), wann gefragt wurde und die Antwort.
- [UsersFriendship](UsersFriendship.md): Ein Eintrag in der Freundesliste eines Users: `usersGuid` hat `friendUsersGuid` als Freund.
- [UsersLogin2fa](UsersLogin2fa.md): Die Wartezeile der 2FA zwischen „Passwort stimmt“ und „angemeldet“.
- [UsersPointBooking](UsersPointBooking.md): Doku: `docu/entities/UsersPointBooking.md`.
- [UsersProfileFeature](UsersProfileFeature.md): Freigeschaltete Profil-Features eines Users: Ein Eintrag ist ein Feature, das er sich z.
- [UsersRefreshToken](UsersRefreshToken.md): Ein Glied der Kette einer Sitzung: der Teil, der eine Anmeldung über das kurze JWT hinaus trägt und sich widerrufen lässt.
- [UsersSetting](UsersSetting.md): Eine Einstellung eines Users als Schlüssel-Wert-Paar: seine Preferences, z.
- [UsersShopItem](UsersShopItem.md): Was ein User von einem Artikel des Gebietermarkts zur Verfügung hat: dauerhaft oder noch eine Anzahl Nutzungen.
- [UsersTotp](UsersTotp.md): Die Authenticator-App (TOTP) eines Users: das gemeinsame Geheimnis, verschlüsselt, und ob es bestätigt ist.
