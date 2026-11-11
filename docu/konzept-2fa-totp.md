# 2FA: Authenticator-App (TOTP) und E-Mail

Stand 2026-11-08. **Gebaut:** Die Authenticator-App ist **Pflicht beim Login** (Abschnitt 3); Einrichten und Testen im
Profil (Rubrik „Sicherheit“), Abschalten mit Code oder Schlüssel, Entfernen durch den Admin, Passwort ändern, Test-Mail
über SMTP. **Noch nicht:** Wiederherstellungscodes.

## 1. Wie eine Authenticator-App funktioniert (einfach erklärt)

**Das Bild dazu:** Du und der Server bekommt je eine identische Wunderuhr. Beide Uhren kennen dasselbe geheime Rezept.
Alle 30 Sekunden zeigt jede Uhr eine neue 6-stellige Zahl, und weil Rezept und Uhrzeit gleich sind, zeigen beide immer
dieselbe Zahl. Wer die Zahl vom Handy abliest und sie dem Server sagt, beweist damit: Ich habe die Uhr mit dem Rezept.

### Schritt 1: Einrichten (einmalig)

- Der Server würfelt für dich ein Geheimnis: 20 Zufallsbytes. Das ist das Rezept.
- Er zeigt es als QR-Code. Darin steht eine Adresse wie
  `otpauth://totp/gebiter9k:alice?secret=JBSWY3DPEHPK3PXP&issuer=gebiter9k&algorithm=SHA1&digits=6&period=30`
  (hier mit einem Spielgeheimnis).
- Du scannst ihn mit der App. Ab jetzt kennen Handy und Server dasselbe Geheimnis.
- Das ist der **einzige** Moment, in dem das Geheimnis übertragen wird. Danach reden Handy und Server nie wieder
  miteinander. Die App funktioniert sogar im Flugmodus.
- **Ein QR-Code für alle Apps:** Das Format ist ein offener Standard (RFC 6238, „TOTP“). Google Authenticator, Microsoft
  Authenticator, Aegis, 2FAS, Apples Passwörter-App und Bitwarden lesen denselben Code.
  - Google Authenticator: „+“ → „QR-Code scannen“.
  - Microsoft Authenticator: „+“ → „Anderes Konto (Google, Facebook usw.)“.
  - Das Popup verlinkt beide für Android (Google Play) und iPhone (App Store), Links geprüft am 2026-11-08
    (`AuthenticatorAppLinks.tsx`).

### Schritt 2: Rechnen (alle 30 Sekunden, auf beiden Seiten gleich)

1. Welcher 30-Sekunden-Abschnitt ist gerade? Sekunden seit dem 1.1.1970 geteilt durch 30, abgerundet, z. B.
   `59 012 345`.
2. Diese Zahl und das Geheimnis kommen in einen festen „Mixer“ (HMAC-SHA1, eine Standard-Rechenvorschrift). Heraus
   kommt ein Zahlensalat.
3. Aus dem Salat werden nach fester Regel 6 Ziffern geschnitten, z. B. `492 039`.

### Schritt 3: Prüfen

Du tippst die 6 Ziffern ein, der Server rechnet dasselbe mit seinem gespeicherten Geheimnis und vergleicht. Er probiert
auch den Abschnitt davor und danach, falls Handy- oder Pi-Uhr ein paar Sekunden falsch gehen.

### Abschalten und Notfall

- Das Geheimnis ist der eigentliche Schlüssel: Wer es hat, kann in jeder App die Codes rechnen. App und Geheimnis sind
  also gleichwertig.
- Abschalten verlangt im Profil einen gültigen Code. Den hat, wer die App hat, oder wer das Geheimnis aufgeschrieben hat
  und es in eine neue App einträgt.
- Abschalten geht im Profil mit einem gültigen Code **oder mit dem Schlüssel** (gebaut 2026-11-08). Der Schlüssel wird
  beim Einrichten rot markiert, mit blinkendem Ausrufezeichen: notieren, er wird nur jetzt gezeigt.
- Gespeichert ist er nur verschlüsselt, auch der Admin sieht ihn nie. Wer beides verliert (Handy weg, nichts notiert),
  wendet sich an den Admin: Er entfernt die App unter „User bearbeiten“ ohne Code (gebaut 2026-11-08).
  Wiederherstellungscodes fehlen noch.

### Warum das sicher ist

- Der Mixer lässt sich nicht rückwärts drehen: Wer einen Code sieht, kommt weder an das Geheimnis noch an den nächsten
  Code.
- Ein Code gilt nur 30 Sekunden, und der Server merkt sich den zuletzt benutzten: Ein abgefangener Code geht kein
  zweites Mal.
- 6 Ziffern sind eine Million Möglichkeiten. Wenn der Login danach fragt, ist nach 5 falschen Versuchen Schluss.
- Kostenlos: Es redet niemand mit Google, kein Konto, keine Schnittstelle, keine Gebühr.

## 2. Was gebaut ist

### Profil, Rubrik „Sicherheit“

| Zeile | Was sie tut |
|---|---|
| Passwort | Popup: bisheriges + zweimal neues Passwort. Beide gehen nur als SHA-256 ans Backend, das bisherige muss stimmen. |
| Authenticator-App (2FA) | Nicht eingerichtet: „QR-Code anzeigen“ → QR + Schlüssel zum Abtippen (rot markiert: notieren!) → ersten Code bestätigen. Aktiv: „Testen“ (Code prüfen wie später der Login), „Mit diesem Code abschalten“ oder „Mit dem Schlüssel abschalten“. |
| E-Mail (2FA), nur Admin | Popup: Test-Mail an eine frei eingegebene Adresse über den SMTP-Zugang aus der `.env` (Vorstufe der 2FA per E-Mail). |
| Diese Sitzung | Platz, nächste Erneuerung, Abmelden (wie vorher). |

### Backend

- `de.gebiter.security.service.TotpService`: die Rechnung nach RFC 6238 nur mit dem JDK (HmacSHA1), `otpauth`-Adresse,
  Prüfung mit ±1 Schritt und Schutz gegen doppelte Codes, Verschlüsselung der Geheimnisse mit AES-256-GCM. Geprüft am
  2026-11-08 gegen alle sechs Prüfwerte aus RFC 6238 Anhang B.
- `UsersTotp` (Tabelle `users_totp`): usersGuid (eindeutig), secretEncrypted, confirmedAt (leer = Einrichten offen),
  lastUsedTimeStep, createdAt. Das Geheimnis verlässt das Backend nur einmal, beim Einrichten.
- `UsersTotpService` / `UsersTotpController` unter `/api/users-totp` (jeder nur seine eigene App):
  `POST /setup`, `GET`, `POST /check {code}`, `PUT /confirm {code}`, `DELETE {code}` oder `DELETE {secretBase32}`
  (Schlüssel: Base32, Leerzeichen und Kleinschreibung egal, Vergleich in gleich langer Zeit).
- `UsersTotpAdminController` unter `/api/admin/users-totp` (nur ADMIN): `GET /{usersGuid}` (Stand),
  `DELETE {usersGuid}` (entfernt ohne Code, steht im Log). Im Frontend die Box „Authenticator-App (2FA)“ unter
  „User bearbeiten“.
- Passwort: `PUT /api/users-credential {currentSha256HexPassword, newSha256HexPassword}`
  (`UsersCredentialService.changeOwnUsersCredential`).
- Test-Mail: `POST /api/admin/mail-test {recipient, subject, text}` (nur ADMIN, Empfänger leer = `MAIL_TEST_RECIPIENT`),
  `GET /api/admin/mail-test` (Zugang ohne Passwort).
- Fehlt etwas in der `.env`, antwortet das Backend 503 mit dem Namen des Schlüssels (`MissingConfigurationException`).

### Einstellungen

- `application.yaml`, `gebiter.totp.*`: issuer, secret-bytes, code-digits, period, allowed-time-step-drift,
  encryption-key, encryption-iv-bytes, encryption-tag-bits.
- `.env`: `TOTP_ENCRYPTION_KEY`, 32 Zufallsbytes als Base64 (`openssl rand -base64 32`), am 2026-11-08 gesetzt. Wer
  ihn wechselt, muss alle Apps neu einrichten.
- `.env`: `SMTP_*`, `MAIL_FROM`, `MAIL_TEST_RECIPIENT` (siehe `docu/setup.md` 4.3c).
- Die Uhr des Pi muss stimmen; Raspberry Pi OS stellt sie per NTP (`timedatectl`).

## 3. Login mit Pflicht-2FA (gebaut 2026-11-08)

Wunsch des Nutzers: 2FA fest einbauen, ohne den simulierten Bestätigungslink. Wer noch keine App hat, richtet sie bei
der Anmeldung ein; vorher gibt es keine Sitzung. Das gilt auch für den ersten Admin: Er richtet seine App bei der ersten
Anmeldung ein, eine Ausnahme gibt es nicht.

1. **Passwort:** `POST /api/share/users-login-2fa {email, sha256HexPassword}` → Wartezeile (`users_login_2fa`) mit
   **Anmeldeschein** (`loginToken`, gespeichert nur als SHA-256, gilt `gebiter.login.two-factor-validity` = 10 Minuten)
   und `secondFactor`: `TOTP_CODE` (App aktiv) oder `TOTP_SETUP` (keine App: erste Anmeldung, abgeschaltet, vom Admin
   entfernt).
2. **Nur beim Einrichten:** `POST /api/share/users-login-2fa/totp-setup {loginToken}` → QR-Adresse und Schlüssel, wie im
   Profil (`UsersTotpService.createUsersTotpSetup`, ein offenes Einrichten wird ersetzt).
3. **Einlösen:** `POST /api/share/session {loginToken, code}` → Sitzung (JWT und Refresh-Token als Cookies). Bei aktiver
   App prüft der Code, beim Einrichten bestätigt er sie (`UsersTotpService.redeemUsersTotpCode`, ein Code gilt nur
   einmal). Falscher Code: 401 mit „noch N Versuche“; nach `gebiter.login.max-failed-codes` (5) ist der Schein weg, dann
   von vorn mit dem Passwort.
4. **Sperre je User** (Vorgabe des Nutzers 2026-11-08): Falsche Codes zählen auch über alle Anmeldungen hinweg
   (`users_totp.failed_code_count`). Nach `gebiter.totp.max-failed-codes-in-a-row` (20) am Stück nimmt der Login
   `gebiter.totp.lock-duration` (30 Minuten) lang keinen Code an, auch keinen richtigen (`code_locked_until`), Meldung
   „noch N Minuten gesperrt“, im Log eine Warnung. Ein angenommener Code setzt den Zähler zurück; entfernt der Admin die
   App, ist auch die Sperre weg.

Weggefallen: der Bestätigungslink (`/confirm`, Seite `/login/confirm`, `gebiter.login.confirm-url`), das Abholen im
Sekundentakt. Im Frontend: `useLoginWith2fa` (Phasen form → totpCode/totpSetup → done), Schritt
`LoginSecondFactorStep`; Login, Registrierung und Profil teilen `TotpSetupInstructions` und `TotpCodeField`.

## 4. Nächste Schritte

1. **Notfall:** 10 Wiederherstellungscodes (nur einmal gezeigt, nur ihr Hash gespeichert). Admin-Reset und Abschalten
   mit dem Schlüssel sind gebaut (2026-11-08).
2. **E-Mail als zweiter Faktor:** erst, wenn der Versand zuverlässig klappt.
