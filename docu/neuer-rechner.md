# Neuer Rechner: Projekt aus dem Repo einrichten

> Diese Anleitung ist öffentlich und enthält keine Zugangsdaten. Die private Anleitung mit den echten Werten ist
> `docu/setup.md`; sie liegt mit Absicht nicht im Repo.

Wozu: auf einem zweiten Rechner weiterentwickeln. Backend und Frontend laufen dann auf diesem Rechner. Postgres, Solr
und SFTP bleiben auf dem Server (Docker, Überblick in [`infrastruktur.md`](infrastruktur.md)). Beide Rechner arbeiten
also mit denselben Daten.

## 1. Was im Repo fehlt und von Hand mitkommt

Das Repo enthält nur `code/` und `docu/`. Vier Dinge fehlen mit Absicht:

| Datei oder Ordner | Wozu | Ohne sie |
|---|---|---|
| `code/.env` | Passwörter, Adressen, Host-Key des SFTP, Schlüssel der 2FA | Das Backend startet nicht. |
| `docu/setup.md` | Private Anleitung: Server aufsetzen, SSH-Tunnel, Bau auf dem Server, alle Zugänge | Alles rund um den Server ist nicht nachlesbar. |
| `Vollidiot/` (im Projektordner neben `code/`) | Arbeitsnotizen und Regeln für Claude Code | Claude kennt die Regeln des Projekts nicht. |
| `mounts/nginx/conf/default.conf` | nginx des Servers | Nur nötig, wenn dieser Rechner den ganzen Stack selbst betreiben soll. |

Diese Dateien vom ersten Rechner kopieren, z. B. mit `scp` oder einem USB-Stick. Nie über Git, Mail oder Chat. Danach:

```
chmod 600 code/.env docu/setup.md
```

Ohne den ersten Rechner: `cp code/.env.example code/.env` und die Werte eintragen. Die Passwörter der drei Dienste,
`SFTP_HOST_KEY` und `TOTP_ENCRYPTION_KEY` müssen genau die des Servers sein.

## 2. Werkzeuge

- Git, Bash, OpenSSH (`ssh-keyscan`) und `openssl`.
- Java 25.
- Node 26.13.0 über nvm (`code/frontend/.nvmrc`).
- Für die Auswertung hochgeladener Dateien: Tesseract (Texterkennung, mit Deutsch) und libheif (HEIC vom iPhone).
  - Mac: `brew install tesseract tesseract-lang libheif`
  - Debian: `sudo apt install tesseract-ocr tesseract-ocr-deu libheif-examples libheif-plugin-libde265`
- Docker braucht dieser Rechner nicht.
- Windows ist ungeprüft: `code/backend/start.sh` braucht eine Bash mit `ssh-keyscan` (WSL oder Git Bash).

## 3. Schritte

1. **Klonen.** Der Projektordner heißt `gebiter9k`, darin liegen `code/` und `docu/`.

   ```
   mkdir -p ~/dev && cd ~/dev
   git clone https://github.com/codergod1337/gebieter9k.git gebiter9k
   cd gebiter9k
   ```

2. **Die Dateien aus Abschnitt 1 hineinlegen**, mindestens `code/.env`.

3. **Zertifikat des Dev-Servers erzeugen.** Der Dev-Server läuft nur über https, weil der Browser sonst die
   Krypto-API (Passwort-Hash beim Login), Web Locks und die Zwischenablage nicht hergibt. Ohne Zertifikat bricht
   `npm run dev` mit einer Meldung ab.

   ```
   cd code/frontend && mkdir -p .cert
   openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes -days 825 \
     -keyout .cert/dev-key.pem -out .cert/dev-cert.pem -subj "/CN=gebiter9k Dev-Server" \
     -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1" \
     -addext "basicConstraints=critical,CA:FALSE" -addext "extendedKeyUsage=serverAuth" \
     -addext "keyUsage=critical,digitalSignature"
   chmod 600 .cert/dev-key.pem
   ```

   Soll der Dev-Server auch von anderen Rechnern im LAN erreichbar sein, Adresse und Namen dieses Rechners in
   `subjectAltName` ergänzen (`IP:<Adresse>`, `DNS:<Name>`).

4. **Backend starten.**

   ```
   cd code/backend && ./start.sh
   ```

   Das Skript erkennt selbst, wie der Server erreichbar ist (zu Hause direkt im LAN, unterwegs über den SSH-Tunnel),
   und startet dann `./mvnw spring-boot:run`. Erwartet:
   - zuerst `Netzwerk-Profil LAN: Pi antwortet unter …, Host-Key geprüft.`
   - am Ende `Started Gebiter9kApplication`.

   Meldet es `Pi nicht erreichbar`: zu Hause prüfen, ob der Server läuft; unterwegs zuerst den SSH-Tunnel öffnen
   (private `setup.md`, Abschnitt 5.8). Der erste Start dauert länger, weil Maven sich und die Abhängigkeiten lädt.

5. **Frontend starten.**

   ```
   cd code/frontend && nvm install && npm ci && npm run dev
   ```

   Dann https://localhost:3000 öffnen. Firefox warnt beim ersten Mal wegen des selbst signierten Zertifikats:
   „Erweitert …“, dann „Risiko akzeptieren und fortfahren“.

6. **Anmelden** mit dem vorhandenen Konto und der Authenticator-App. Es ist dieselbe Datenbank wie auf dem ersten
   Rechner, es wird nichts neu angelegt. `FORCE_ADMIN` bleibt aus.

7. **Prüfen**, dass das Backend gegen den Server startet:

   ```
   cd code/backend && ./start.sh test -Dtest=Gebiter9kApplicationTests
   ```

## 4. Git auf dem neuen Rechner

```
cd ~/dev/gebiter9k
git config user.name "codergod1337"
git config user.email "73815018+codergod1337@users.noreply.github.com"
brew install gh
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
```

`gh auth login` zeigt im Terminal einen Einmal-Code (acht Zeichen, kein 2FA-Code) und öffnet nach Enter den Browser:
Code einfügen, „Continue“, „Authorize github“. Danach geht `git push` ohne weitere Abfrage.

## 5. Zu beachten

- **Zwei Rechner, ein Datenbestand.** Ändert der Code eine Entity, zieht Hibernate die Tabelle beim Start nach
  (`ddl-auto: update`), und zwar in der Datenbank des Servers. Das wirkt sofort auch für den anderen Rechner und den
  Server selbst.
- **Upload-Puffer.** Eine Datei, die über das Backend dieses Rechners hochgeladen wird, liegt zuerst lokal in
  `mounts/staging` (neben `code/`, wird selbst angelegt). Das Backend erst beenden, wenn sie „ausgewertet“ ist.
- **Bau auf dem Server.** Der Stand kommt per Archiv und `scp` auf den Server, nicht über Git (private `setup.md`,
  Abschnitt 5.16). Dafür braucht dieser Rechner den SSH-Zugang zum Server.
- **Nie ins Repo:** `code/.env`, `docu/setup.md`, Schlüssel, Zertifikate, alles unter `mounts/`. Die `.gitignore` im
  Projektordner hält das fest.

## 6. Den Server von null aufsetzen

Das steht nur in der privaten `docu/setup.md`, Abschnitt 5 (Docker, Compose, nginx, Zertifikate, Tunnel). Ein
Überblick ohne Zugangsdaten steht in [`infrastruktur.md`](infrastruktur.md).
