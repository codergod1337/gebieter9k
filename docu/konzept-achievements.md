# Konzept: Achievements

Stand 2026-11-09, mit dem Nutzer abgestimmt, **gebaut** (erstes Achievement `ONLINE_STUNDE`: 3600 s, wiederholbar, 10 Punkte).

## Tabellen

| Tabelle | Inhalt |
|---|---|
| `achievement` (gibt es) | was man tun muss, `badgeLook` (Symbol, Farben, Design); neu: `trackingKey`, `thresholdValue`, `repeatable`, `rewardPoints` |
| `achievement_tracking` (neu) | universelles Protokoll: `usersGuid`, `trackingKey`, `amount`, `runningValue` (Kontrollcounter nach dem Ereignis), `occurredAt` (Server-Uhr) |
| `users_achievement` (neu) | `usersGuid`, `achievementKey`, `achievedAt`, `achievementTrackingId`; wiederholbare mehrfach |

Geprüft wird nur beim Schreiben einer neuen Protokollzeile, gegen die Schwellen ihres `trackingKey` im Speicher. Kein
Lauf über alle User. Abschluss: Zeile in `users_achievement`, `rewardPoints` aufs Punktekonto (`Users.points`).

## Erstes Achievement: „1 Stunde online“

- Wiederholbar, 10 Punkte je Abschluss, rund um die Uhr möglich, keine Obergrenze.
- Signal ist die Verlängerung des Tokens, fest alle 15 Minuten. Den Termin setzt der Server ins Token (YAML), das
  Frontend plant danach; F5 ändert ihn nicht.
- Bei jeder Verlängerung, gemessen an der letzten `ONLINE_PRESENCE`-Zeile des Users (alle Tabs und Geräte zusammen):
  - unter 14 Minuten: ignorieren, keine Zeile (F5, zweiter Tab, Skript);
  - 14 bis 17 Minuten: Serie läuft, `runningValue` + echte verstrichene Sekunden;
  - über 17 Minuten: Tab war zu, Serie beginnt neu bei 0.
- Jedes Vielfache von 3600 Sekunden im `runningValue` = ein Abschluss. Ein Toast beim Erreichen ist noch nicht
  gebaut; zu sehen ist es in der Box „Achievements“ im Profil.

## Gegen Cheaten

- Zeit kommt nur von der Server-Uhr.
- Höchstens eine Buchung je 15 Minuten je User, egal wie viele Tabs, Geräte oder Aufrufe.
- Gebucht wird nur tatsächlich verstrichene Zeit; F5 und Skripte erzeugen keine.
- Fehlt ein Check (Lücke über 17 Minuten), verfällt die angefangene Stunde.

## Gebaut (2026-11-09)

| Teil | Wo |
|---|---|
| Tracking-Arten | `achievement/model/AchievementTrackingKey` (bisher `ONLINE_PRESENCE`) |
| Protokoll, Abschlüsse | `AchievementTracking` (`achievement_tracking`), `UsersAchievement` (`users_achievement`) |
| Buchen | `AchievementTrackingService`: nach dem Commit von Login und Verlängerung (`UsersOnlineCheckInEvent` aus dem `SessionService`), ein Schloss für alle Buchungen, eigene Transaktion, letzte Spur je User im Speicher |
| Prüfen, Punkte | `UsersAchievementService.createReachedUsersAchievements`, Schwellen aus `AchievementService.getTrackedAchievements` (Speicher), Punkte über `UsersService.increaseUsersPoints` |
| Termin der Verlängerung | `SessionInfo.tokenRenewalDueAt` = Ausstellung + `gebiter.jwt.renewal-interval` (15 min), auch nach F5 derselbe |
| Verlängerung scheitert | Abgemeldet ist man nur, wenn das Backend ablehnt (401 und jeder andere Fehler unter 500). Kommt keine Antwort oder ein Serverfehler (Backend startet neu, 502 von nginx; WLAN nach dem Standby noch weg), bleibt die Sitzung im Browser stehen und der `SessionProvider` versucht es nach 30 s noch einmal (seit 2026-11-11). Sicherheit unverändert: Die Sitzung im Browser ist nur Anzeige, jeden Request prüft das Backend am JWT; kam nur die Antwort nicht an, lehnt das Backend den nächsten Versuch mit dem alten Refresh-Token ab und man ist abgemeldet wie zuvor |
| Grenzen | `gebiter.achievement.online-presence.min-interval` (14 min), `max-gap` (17 min) |
| Anzeige | Box „Achievements“ im eigenen Profil (`GET /api/users-achievement`, Achievements aus den Stammdaten über `GET /api/achievement`); Admin-Formular mit Tracking-Art, Schwelle, wiederholbar, Punkte |

Getestet gegen die Pi-Daten (Transaktion zurückgerollt): F5 und zweiter Tab ohne Buchung, Hämmern ohne zweite Buchung,
Skript mit 27 Aufrufen in 14 Minuten bucht genau 14 Minuten, Lücke über 17 Minuten startet neu, zweites Gerät hält die
Serie, nach 60 Minuten ein Abschluss und 10 Punkte.

## Gebaut (2026-11-10): Online-Anzeige, Tätigkeiten, Modul

- **Online-Anzeige:** „Online (N)“ im Header, „online seit“ im Profil eines anderen (nur bei sichtbarem Profil, kein
  „zuletzt online“). Online = Check-in in einer Sitzung in den letzten 17 Minuten; Abmelden der letzten Sitzung = sofort
  offline, der nächste Login beginnt eine neue Serie. `GET /api/users-online/count`, `GET /api/users-online/{guid}`.
- **Tätigkeiten mit Punkten:** `PointActivity` (Key, Name, Beschreibung, Punkte). Start: Gästebucheintrag 2,
  Kommentar 1, Bild in eine Galerie 20. Gebucht ins Kontobuch als `ACTIVITY_REWARD` mit Bezug (id bzw. SHA-256), je
  Bezug einmal; neue Punkte nie rückwirkend.
- **Modul „Achievements & Markt“** (`/achievement-manager`, nur ADMIN): Achievements und Tätigkeiten, später der
  Gebietermarkt.
