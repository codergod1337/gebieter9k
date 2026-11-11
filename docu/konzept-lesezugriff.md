# Konzept: Wer sieht welche Datei (Galerien, Sichtbarkeit, Freunde)

Stand 2026-11-09, dritte Fassung nach den Vorgaben des Nutzers.

Gebaut am 2026-11-09:
- die Felder `galleryIds`, `visibility` und `readableForFriendsOfUsersGuid`;
- der Lesefilter (Abschnitt 4);
- die Freundschaft (Abschnitt 5);
- beim Upload `visibility = NONE` (`gebiter.file.default-visibility`).

Noch offen sind die Galerien selbst und das Setzen der Sichtbarkeit aus der Galerie.

## 1. Vorgaben

- **Lesen steht vollständig im Solr-Dokument.** Suche und Auflösen tragen einen harten Filter aus dem Service.
  - Je Abfrage keine Postgres-Abfrage, keine Auflösung einer Gruppen-id in Postgres.
  - Keine Listen mit tausenden User-GUIDs je Dokument.
- **Zwei Ebenen:**
  - Prämisse 1, die FileClass: Ihre Lese- und Schreibrollen sagen, was in der Theorie höchstens geht.
  - Darüber die Sichtbarkeit, die der Autor je Galerie wählt: nur ich, meine Freunde oder alle.
- **ADMIN und FILE_MANAGER ignorieren die Sichtbarkeitsschranke.** Sie finden und lesen alle Dateien, auch private.
  Für normale User erzwingt das Backend die Schranke.
- **Ändern:** Per Standard der Autor seine eigenen Dateien, ADMIN und FILE_MANAGER alle.
- **Hochladen:** vorerst nur in eine eigene Profil-Galerie. Weitere Wege kommen später.
- **Anonymes Profil:** Von einem anonymen Profil wird nichts geladen, also auch keine Galerien. Das regelt die
  Profilseite, nicht der Solr-Filter.
- **Freundschaft:** beidseitig über einen Freundschaftsantrag (Abschnitt 5).

## 2. Die Freunde-Sichtbarkeit im Dokument

Ein Feld im Dokument trägt höchstens eine GUID: `readableForFriendsOfUsersGuid`.

- Ist eine Datei für Freunde sichtbar, steht dort die GUID des Autors. Das heißt: Die Freunde dieses Users dürfen lesen.
- Sonst ist das Feld leer.
- Der Leser bringt seine eigene Freundesliste mit. Weil Freundschaft beidseitig ist, sind seine Freunde genau die User,
  die auch ihn als Freund haben.
- Der Filter fragt nur: Steht im Feld eine der GUIDs meiner Freunde?

Warum das schnell ist:
- Je Dokument steht nur ein Wert im Feld, keine Liste.
- Die Abfrage ist ein terms-Filter mit den GUIDs meiner Freunde (z. B. 300 Stück). Solr sucht jede GUID einmal im Index
  und vereinigt die Trefferlisten. Es geht nicht Dokument für Dokument eine Liste durch.
- Solr hält den Filter im `filterCache`, die nächste Abfrage desselben Users kostet fast nichts.
- Ändert sich eine Freundschaft, ändert sich nur die Liste des Lesers, kein Dokument.

Die Freundesliste kommt ohne Postgres je Abfrage: Der Service der Freundschaften hält alle Freundschaften als Kopie im
Speicher (GUID → GUIDs der Freunde), wie der `SolrFieldService` die Felder. Nach jeder Änderung zieht er sie nach dem
Commit nach.

## 3. Felder im Kern FILE

| Feld | Typ | Wer setzt | Wozu |
|---|---|---|---|
| `authorUsersGuid` | STRING | Backend | Der Autor (gibt es) |
| `fileClassKey` | STRING | Client beim Upload | Die Klasse (gibt es) |
| `readerAccessRoleKeys` | STRING, Liste | Backend aus der FileClass | Leserollen der Klasse (gibt es) |
| `galleryIds` | LONG, Liste | Backend | Die Galerien der Datei, zum Auflösen aller Bilder einer Galerie (umbenannt am 2026-11-09, vorher `albumIds`) |
| `visibility` | STRING | Backend aus der Galerie | `NONE` (nur ich), `FRIENDS`, `ANY` (alle) |
| `readableForFriendsOfUsersGuid` | STRING | Backend aus der Galerie | Bei `FRIENDS` die GUID des Autors, sonst leer |

- Eine Galerie (Postgres) trägt ihre Sichtbarkeit.
- Kommt eine Datei in eine Galerie, schreibt das Backend `visibility` und `readableForFriendsOfUsersGuid` ins Dokument.
- Ändert der Autor die Sichtbarkeit einer Galerie, setzt das Backend beide Felder in allen Dokumenten mit dieser
  `galleryIds` neu (Atomic Update).
- Dabei darf es Postgres lesen, denn es schreibt. Die Suche liest nur die Felder.

## 4. Der Lesefilter, an genau einer Stelle

Eine Methode im `FileDocumentResolveService` baut ihn, alle Lesewege nutzen sie: Suche, Auflösen, Galerie-Kacheln,
Download, Viewer. Werte gehen nur über den term- und terms-Parser hinein.

| Leser | Filter |
|---|---|
| ADMIN oder FILE_MANAGER | `status:ACTIVE` |
| angemeldeter User | `status:ACTIVE AND readerAccessRoleKeys:(<meine Rollen>) AND ( authorUsersGuid:<ich> OR visibility:(AUTHENTICATED ANY) OR readableForFriendsOfUsersGuid:(<meine Freunde>) )` |
| ohne Anmeldung | später, wenn es öffentliche Profile ohne Login gibt: `visibility:ANY` und eine FileClass, die das erlaubt |

- Die Leserollen der FileClass sind die Obergrenze, die Sichtbarkeit schränkt darunter ein.
- Darunter bleibt „Wer liest“ je Feld (z. B. GPS nur ADMIN).
- Die Galerie-Kacheln kommen mit diesem Filter und `galleryIds:<id>` direkt aus Solr, mit dem Vorschaubild aus
  `previewBase64Png`. Das große Bild für Viewer und Download kommt einzeln vom SFTP, nach demselben Filter.

## 5. Freundschaft beidseitig (gebaut 2026-11-09)

- **`UsersFriendRequest`** (Tabelle `users_friend_request`): `id`, `requesterUsersGuid`, `acceptorUsersGuid`,
  `requestedAt`, `accepted` (`null` offen, `true` angenommen, `false` abgelehnt). Die ganze Anfrage steht in dieser
  einen Tabelle.
  - Ein neuer Antrag scheitert, wenn die beiden schon befreundet sind, wenn ein offener Antrag in einer der beiden
    Richtungen besteht oder wenn jemand sich selbst fragt.
  - Beantworten darf nur der Empfänger, und nur einmal.
- **`UsersFriendship`** (Tabelle `users_friendship`): `usersGuid`, `friendUsersGuid`, je Paar eindeutig.
  - Annehmen schreibt beide Richtungen.
  - Kündigen löscht beide, also zwei Schreibvorgänge.
  - Jeder bekommt seine Liste mit einer Abfrage nach seiner GUID.
- **Hauptspeicher:** Der `UsersFriendshipService` hält alle geladenen Listen (GUID → Freundes-GUIDs).
  - Der `SessionService` lädt die Liste bei jedem Login und Token-Refresh neu.
  - Annehmen und Kündigen ziehen die Listen beider User sofort nach dem Commit nach.
  - `CurrentUsersProvider.currentUsersFriendUsersGuids()` liest von dort, ohne Postgres.
  - Ins Token kommt die Liste nicht: Ab etwa 80 Freunden würde das Cookie größer als die 4 KB eines Browsers.
- **Endpunkte, immer die eigenen, GUID aus dem Token:**
  - `/api/users-friend-request`: POST `{acceptorUsersGuid}` (fragen), GET (offene Anträge an mich und von mir), PUT
    `{id, accepted}` (beantworten).
  - `/api/users-friendship`: GET (meine Freunde), DELETE `{friendUsersGuid}` (kündigen).
- Das einseitige `UsersGroup` ist entfernt, aus dem Code und aus der Datenbank (Tabelle `users_group` gelöscht 2026-11-09).
- Die Freundes-GUIDs schickt nie der Client mit. Das Backend setzt sie aus dem Speicher in den Lesefilter.

## 6. Geprüft am 2026-11-09 gegen das echte Solr

Geprüft als normaler User mit der Rolle USER, ohne ADMIN:

| Fall | Ergebnis |
|---|---|
| Fremder, Datei auf NONE | sieht sie nicht |
| Autor, Datei auf NONE | sieht sie |
| Freund, Datei auf FRIENDS mit der GUID des Autors im Freunde-Feld | sieht sie |
| Fremder, Datei auf FRIENDS | sieht sie nicht |
| Fremder, Datei auf AUTHENTICATED | sieht sie |

Danach stehen alle 14 Dateien wieder auf NONE, keine trägt etwas im Freunde-Feld.

## Status einer Datei und Feinheiten des Zugriffs (Nutzer 2026-11-09)

**Status (Feld `status`, Werte in `gebiter.file.status-*`):**

| Status | Lesen (User) | Ändern | Suche |
|---|---|---|---|
| `ACTIVE` aktiv | ja, nach Rechten und Sichtbarkeit | ja, nach Rechten | ja |
| `DEACTIVATED` deaktiviert | ja | nein, die Felder sind gesperrt | ja |
| `ARCHIVED` archiviert | ja (für normale User nur noch lesbar) | nein | offen |
| `DELETED` gelöscht (Soft Delete) | nein, nur der Admin über seine Endpunkte | nein | nein |

Gebaut: Werte in YAML und Stammdaten, Legende auf der Seite einer Datei, Lesefilter „alles außer gelöscht“, Ändern nur
bei aktiv. Weich löschen (DELETED) dürfen Autor und Admin (Nutzer 2026-11-09), der File-Manager nicht. Archivieren kommt
später (Nutzer 2026-11-09), damit auch die Frage, ob archivierte Dateien in der Suche bleiben.

**Lesen je GUID: nein (Nutzer 2026-11-09).** Keine eigene Leserliste je Datei: Die Referenz ist die Freundesliste.
Sichtbar ist eine Datei für alle, nur für den Autor oder für seine Freunde (dazu „Alle User“ für Angemeldete). Freunde
fügt man über Anträge hinzu: auf dem Profil eines anderen „Freund hinzufügen“, im eigenen Profil die Box „Freunde“
(Anfragen annehmen/ablehnen, Freundschaft beenden).

**Zugriff:**
- Lesen (R) und Schreiben (W) je FileClass über Rollen, wie gebaut. Schreiben heißt: Dateien dieser FileClass
  hochladen.
- **Exklusivrechte des Autors:** Wer hochgeladen hat, darf seine Datei ändern; andere mit derselben Rolle pauschal
  nicht. Jede Datei bearbeiten dürfen nur ADMIN und FILE_MANAGER.
- **Bearbeiten (E) als weiteres Feld**, aber nicht über Rollen, sondern **je GUID**: Der Autor gibt einzelnen Usern
  Bearbeiten frei. Das bricht die bisherige Regel „keine GUID-Listen im Dokument“ bewusst.
  - **Gebaut (2026-11-09):** Solr-Feld `editorUsersGuids` (STRING, mehrwertig, setzt nur das Backend, Anzeigename
    „Bearbeiter“), höchstens `gebiter.file.editor-users-max-count` (20) GUIDs; Endpunkt `PUT /api/file-document/editors`
    `{id, editorUsersGuids}`. Freigeben dürfen Autor (mit Schreibrolle), FILE_MANAGER, ADMIN; die GUIDs müssen
    bestehende, nicht gelöschte User sein, der Autor fällt heraus. Freigegebene dürfen die Datei lesen und ihre
    Metadaten bearbeiten, aber nicht Sichtbarkeit, Freigaben oder Löschen.
  - Zwei Stufen im Backend (`FileDocumentAccessService`) und im Client (`FileDocumentForClient`): `changeable`
    (bearbeiten: Autor, Bearbeiter, FILE_MANAGER, ADMIN), `manageable` (Sichtbarkeit, Freigaben: Autor, FILE_MANAGER,
    ADMIN) und `deletable` (weich löschen: Autor und ADMIN, Nutzer 2026-11-09; der FILE_MANAGER nicht).
  - Referenzen wie `wtf` setzen nur FILE_MANAGER und ADMIN, auch beim Upload (`prepareClientFieldValues`).
  - Oberfläche: Auf der Seite einer Datei zeigt „E“ in der Sprechblase, wer bearbeiten darf; ein Klick öffnet für den,
    der freigeben darf, die Liste seiner Freunde zum Anhaken. Jedes Feld (Tags, Beschreibung, Dateiname, Markierungen,
    weitere Angaben) bearbeitet man per Klick im eigenen Popup; eine Bearbeiten-Seite gibt es nicht mehr.
- Lesen je GUID gibt es nicht; Freunde sind die Referenz (siehe oben).
