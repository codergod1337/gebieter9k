# Konzept: Gästebuch

Stand 2026-11-09: Gesamtansatz mit den Entscheidungen des Nutzers vom selben Tag (Abschnitt 7). **Gebaut am
2026-11-09**: Backend und Frontend (Abschnitt 8), auf dem Pi 5 ausgeliefert. Offen: Abschnitt 6, Punkt 4.

## 1. Was es können soll (Nutzer 2026-11-09)

- Jeder schreibt bei einem User ins Gästebuch, auch ins eigene.
- Jeder Eintrag lässt sich kommentieren. Die Kommentare bilden einen Verlauf unter dem Eintrag, wie Rückfrage und
  Rückantwort beim To-do-Job: der Besitzer des Gästebuchs und andere User im Wechsel.
- Smiley-Reaktionen auf Einträge.
- **Darstellung:** „<User> hat … geschrieben“, mit Profilbild, wenn er eins hat. Später sein eigenes Banner als leicht
  durchsichtiger Hintergrund des Eintrags.
- **Später:** Bilder aus der eigenen Galerie oder aus dem Shop in einen Eintrag posten. Die sind dann immer öffentlich.

## 2. Klassen im Backend (Paket `de.gebiter.guestbook`)

Alles in Postgres. Das Gästebuch ist kein Solr-Kern, gelesen wird je Profil seitenweise. Lose gekoppelt, ohne
JPA-Beziehungen.

| Entity (Tabelle) | Felder | Wozu |
|---|---|---|
| `Guestbook` (`guestbook`, gibt es) | `id`, `profileUsersGuid` (wessen Gästebuch), `authorUsersGuid`, `entryText`, `writtenAt` | Ein Eintrag, nie geändert |
| `GuestbookComment` (`guestbook_comment`) | `id`, `guestbookId`, `authorUsersGuid`, `commentText`, `writtenAt` | Ein Kommentar unter einem Eintrag, der Verlauf in der Reihenfolge `writtenAt`, nie geändert |
| `GuestbookReaction` (`guestbook_reaction`) | `id`, `guestbookId`, `guestbookCommentId` (leer bei einer Reaktion auf den Eintrag selbst), `usersGuid`, `reactionEmoji`, `reactedAt` | Ein Smiley auf einen Eintrag oder einen Kommentar; je User mehrere, jedes Emoji je Ziel einmal |
| später `GuestbookAttachment` (`guestbook_attachment`) | `id`, `guestbookId`, `attachmentKind` (`FILE_DOCUMENT`, `SHOP_ITEM`), `attachmentReference` (SHA-256 der Datei bzw. Key des Shop-Artikels), `listingPosition` | Bilder im Eintrag |

- **Reaktionen:**
  - Gespeichert wird das Emoji selbst. Erlaubt ist jedes Standard-Emoji des Unicode-Katalogs, das Backend prüft: genau
    ein Emoji.
  - Nur in eine Richtung: Ein Smiley bleibt stehen und lässt sich nicht zurücknehmen.
  - Ein User darf mehrere verschiedene Smileys an dasselbe Ziel hängen, dasselbe Emoji je Ziel nur einmal.
  - Wird ein Eintrag oder Kommentar gelöscht, gehen seine Smileys mit.
- **Bilder (später):** Kommt ein Bild aus dem Kern FILE in einen Eintrag, setzt das Backend in seinem Solr-Dokument
  `visibility = ANY`, solange es dort steht. So bleibt die Lesegrenze im Dokument
  (`docu/konzept-lesezugriff.md`). Die Vorschau kommt aus `previewBase64Png`, das Original über den File-Endpunkt.
- **Zähler:** Jeder neue Eintrag zählt `UsersDetail.writtenGuestbookEntryCount` beim Autor hoch. Punkte dafür kommen
  später.

## 3. Wer was darf

- **Lesen und Schreiben folgen derselben Regel wie das Laden des Profils** (`Users.profileVisibility`):
  - Wer das Profil sehen darf, sieht das Gästebuch und darf Einträge, Kommentare und Smileys schreiben.
  - Ist das Profil nur für Freunde, dürfen nur Freunde.
  - Ein unsichtbares (anonymes) Profil lädt nichts und nimmt nichts an.
  - Ins eigene Gästebuch schreibt der Besitzer immer.
- **Ändern gibt es nicht:** Einträge und Kommentare bleiben, wie sie sind, oder werden gelöscht. Es gibt keinen
  PUT-Weg.
- **Löschen:**
  - Der Autor löscht seinen Eintrag bzw. Kommentar.
  - Der Besitzer des Gästebuchs löscht jeden Eintrag und jeden Kommentar in seinem Gästebuch.
  - ADMIN und Moderator löschen überall, über eigene Admin-Endpunkte.
  - Ein Eintrag geht mit seinen Kommentaren und Reaktionen weg.

## 4. Services und Endpunkte

- **Services:** `GuestbookService`, `GuestbookCommentService` und `GuestbookReactionService`, jeder nur mit seinem
  eigenen Repository.
  - Ob man ein Profil sehen darf, fragt jeder über den `UsersService`.
  - Wer gerade fragt, kommt aus dem `CurrentUsersProvider`, die GUID nie vom Client.
- **Endpunkte**, Daten im Body:

| Endpunkt | Methoden |
|---|---|
| `/api/guestbook` | POST `{profileUsersGuid, entryText}`, DELETE `{id}` |
| `/api/guestbook/resolve` | POST `{profileUsersGuid, page}`, liefert eine Seite des Gästebuchs |
| `/api/guestbook-comment` | POST `{guestbookId, commentText}`, DELETE `{id}` |
| `/api/guestbook-reaction` | POST `{guestbookId, guestbookCommentId, reactionEmoji}`, kein Löschen |
| `/api/admin/guestbook…` | Löschen für ADMIN und Moderator |

- **Eine Seite des Gästebuchs** (`GuestbookPage`, ein DTO, neueste Einträge zuerst, Seitengröße in der YAML) bringt
  alles, was die Darstellung braucht, in einer Antwort:
  - die Einträge;
  - je Eintrag und je Kommentar die Zahl je Emoji und die eigenen Emojis;
  - einmal je vorkommendem Autor: GUID, Username und Profilbild (später das Banner) als `authorsByUsersGuid`.

  So steht jedes Profilbild nur einmal in der Antwort, auch wenn ein Autor zehnmal schreibt.

## 5. Frontend (Modul-Paket `guestbook/`)

- **Daten:** `Guestbook.ts` mit Typen und `useGuestbook` mit einer Funktion je Endpunkt.
- **`GuestbookBox`:** im Profil, ersetzt die Dummy-Box. Oben das Schreibfeld, darunter die Einträge seitenweise.
- **`GuestbookEntryCard`:** ein Eintrag.
  - Kopf: Avatar, „<Username> hat geschrieben“, Zeit, mit Recht der Mülleimer.
  - Darunter der Text und die `GuestbookReactionBar`: Smileys mit Zahl, die eigenen hervorgehoben, dazu ein Knopf, der
    den Emoji-Wähler öffnet.
  - Darunter `GuestbookCommentThread`: der Verlauf mit kleinem Avatar je Kommentar und einem Feld zum Antworten.
  - Später das Banner des Autors leicht durchsichtig als Hintergrund der Karte.
- **`UsersAvatar` (neu, global in `components/`):** der Avatar eines Users, Profilbild oder Initialen auf dem Verlauf
  aus der GUID.
  - In den Größen `small` (Kommentar), `medium` (Eintrag) und `large` (Profilkopf).
  - Er ersetzt die drei Stellen, die das heute je für sich machen: Profilkopf, Freunde, Gästebuch.
- **`EmojiPicker` (neu, global):** die Standard-Emojis nach Gruppen mit Suche. Nach demselben Muster wie die anderen
  Auswahlen, wiederverwendbar für jede Stelle, die später Emojis braucht.
- **Löschen** über den globalen `ConfirmDeletePopup`.

## 6. Reihenfolge beim Bauen

1. Backend: `Guestbook` vervollständigen, `GuestbookComment`, `GuestbookReaction`, die Services mit den Rechten,
   die Endpunkte, `GuestbookPage`.
2. `UsersAvatar` als globale Komponente, in Profilkopf und Freunde-Box einsetzen.
3. Frontend: `GuestbookBox`, `GuestbookEntryCard`, `GuestbookCommentThread`, `GuestbookReactionBar`.
4. Später: Banner als Hintergrund, `GuestbookAttachment` mit Bildern aus Galerie und Shop.

## 7. Entscheidungen des Nutzers (2026-11-09)

1. Kommentieren und Schreiben darf, wer das Profil sehen darf: dieselbe Regel wie beim Laden des Profils. Nur Freunde
   heißt nur Freunde, unsichtbar heißt niemand.
2. Smileys: viele, die Standard-Emojis („ich bin immer ein Freund von allen“).
3. Einträge und Kommentare werden nie geändert, nur gelöscht. Kein PUT-Weg.
4. Smileys nur in eine Richtung, mehrere je User, nicht löschbar. Sie gehen mit ihrem Eintrag bzw. Kommentar weg,
   damit sich nichts in der Datenbank ansammelt.

## 8. Wie es gebaut ist (2026-11-09)

**Backend** (`de.gebiter.guestbook`):

- `GuestbookService` ist die eine Stelle für alle Rechte. `GuestbookCommentService` und `GuestbookReactionService`
  prüfen nichts, sie arbeiten nur mit ihrem Repository.
- Ob jemand das Profil sehen darf, entscheidet `UsersService.isProfileVisibleToCurrentUsers`. Die Regel: das eigene
  Profil immer; ANY und AUTHENTICATED ja; FRIENDS über die Freundesliste im Speicher; NONE und gelöschte User nein.
- Ein unsichtbares Gästebuch antwortet wie „gibt es nicht“ (404).
- Smileys: `Helper.requireSingleEmoji` prüft auf genau ein Graphem mit Emoji-Zeichen. Das Anlegen ist idempotent:
  Dasselbe Emoji desselben Users am selben Ziel gibt es nur einmal.
- Autoren erscheinen immer mit Name und kleinem Profilbild. Es gilt die Sichtbarkeit des Gästebuchs, nicht die des
  Autors (Nutzer 2026-11-09): Wer öffentlich schreibt, muss damit leben, dass man seine Personalien lesen kann.
- `deletableByCurrentUsers` gilt für den Autor und für den Besitzer des Gästebuchs. Die Admin-Endpunkte
  `/api/admin/guestbook` und `/api/admin/guestbook/comment` stehen nur ADMIN offen. Der Moderator kommt später.
- YAML `gebiter.guestbook`: `page-size` 10 (Nutzer 2026-11-09: höchstens 10 Einträge untereinander, dann blättern),
  `entry-text-max-length` 4000, `comment-text-max-length` 2000.

**Frontend:**

| Datei | Was |
|---|---|
| `components/UsersAvatar.tsx` | global: Profilbild oder Initialen auf dem Verlauf aus der GUID, `small`/`medium` rund, `large` (Profilkopf) abgerundet; im Profilkopf, in der Freunde-Box und im Gästebuch |
| `components/seededRandom.ts` | Zufall aus einem Seed (vorher `profile/profileDisplay.ts`, das es nicht mehr gibt) |
| `components/emojiCatalog.ts`, `useEmojiCatalog.ts` | die Standard-Emojis aus `emojibase-data` 18.0.0 (deutsche Namen und Suchwörter), als eigene Datei erst beim ersten Öffnen geladen (rund 90 kB gepackt); ohne Hautfarben-Bausteine und ohne einzelne Flaggen-Buchstaben. Alle 1923 Emojis bestehen die Backend-Prüfung (getestet) |
| `components/EmojiPicker.tsx`, `EmojiPickerPopup.tsx` | global: Suchfeld (Fokus sofort darin, Enter nimmt den ersten Treffer), Gruppen als Reiter mit Hoverlay, Raster, darunter das Emoji, auf das man zeigt, groß mit Namen |
| `guestbook/Guestbook.ts`, `useGuestbook.ts` | Typen und eine Funktion je Endpunkt, inklusive der beiden Admin-Löschwege, die die Oberfläche noch nicht nutzt |
| `guestbook/GuestbookBox.tsx` | im Profil: Schreibfeld, je Seite 10 Einträge, darunter die Seitenzahlen (globale `PageNavigation`); Seite in der Adresse (`?guestbookPage=`), beim Blättern rollt die Seite an den Anfang des Gästebuchs; nach einem neuen Eintrag Seite 1 |
| `guestbook/GuestbookEntryCard.tsx` | ein Eintrag: Kopf, Text, Smileys, Verlauf |
| `guestbook/GuestbookCommentThread.tsx`, `GuestbookCommentItem.tsx` | der Verlauf (älteste zuerst) und ein Kommentar mit kleinem Avatar |
| `guestbook/GuestbookReactionBar.tsx` | Smileys als Pillen mit Zahl, die eigenen hervorgehoben und gesperrt; ein Klick auf eine fremde Pille vergibt dasselbe Emoji, der Knopf öffnet den `EmojiPickerPopup` |
| `guestbook/GuestbookHead.tsx`, `GuestbookTextForm.tsx`, `GuestbookDeleteButton.tsx` | gemeinsam für Eintrag und Kommentar: Kopf mit Avatar, Name und Zeit; Textfeld mit Knopf; Mülleimer mit `ConfirmDeletePopup` |

- Nach jeder Änderung lädt die Box die aktuelle Seite neu. Ist eine Seite durch Löschen leer geworden, springt sie auf
  die letzte Seite, die es noch gibt.
- CSS: Aufbau in `base.css` (Abschnitte UsersAvatar, Emojis, EmojiPicker, Gästebuch), Farben im Theme.
- Das Gästebuch zeigt im Moment nur das eigene Profil. Fremde Profile kommen mit der Profilseite für andere User.
