# Infrastruktur

PostgreSQL, Solr und der SFTP-Dateispeicher laufen in Docker, seit 2026-11-06 auf dem Raspberry Pi 5. Backend und
Frontend laufen beim Entwickeln auf dem Mac und greifen im Heimnetz direkt über die IP des Pi auf die Dienste zu
(Profil `LAN`, Hosts `*_HOST_LAN` in der `.env`). Unterwegs per SSH-Tunnel mit Profil `WEB` (Hosts
`*_HOST_WEB` = `localhost`), siehe `docu/setup.md` (5.8). `application.yaml` wählt den Host über
`${POSTGRES_HOST_${NETWORK_PROFILE}}`, ebenso für Solr und SFTP. `NETWORK_PROFILE` ist eine Umgebungsvariable und
steht nicht in der `.env`: Das Backend startet mit `code/backend/start.sh`, das erkennt das Profil bei jedem Start am
Host-Key des SFTP-Containers, erst unter `localhost` (Tunnel), dann unter der IP des Pi (`docu/setup.md` 5.15).

| Dienst | Image | Adresse | Port im Container | Daten |
|---|---|---|---|---|
| PostgreSQL | `postgres:18.6` | `${POSTGRES_HOST_<PROFIL>}:${POSTGRES_HOST_PORT}` | 5432 | `mounts/postgres/18/` |
| Solr | `solr:10.1.0` (standalone, `--user-managed`) | `http://${SOLR_HOST_<PROFIL>}:${SOLR_HOST_PORT}/solr` | 8983 | `mounts/solr/` |
| SFTP | `gebiter9k-sftp` (gebaut aus `atmoz/sftp`, fester Commit) | `${SFTP_HOST_<PROFIL>}:${SFTP_HOST_PORT}` | 22 | `mounts/sftp/sftproot/` |

Die Host-Ports stehen in `code/.env`. Docker veröffentlicht sie auf allen Schnittstellen des Pi, im Heimnetz sind die
Dienste also erreichbar. Von außen nicht: Die FritzBox gibt nur SSH frei. Jeder Dienst hat sein eigenes Kennwort.

## Bedienung

Alle Befehle im Ordner `code/`:

```bash
docker compose up -d --wait   # starten und warten, bis die Dienste laufen
docker compose ps             # Status
docker compose logs -f solr   # Logs eines Dienstes
docker compose down           # stoppen (Daten bleiben in mounts/)
```

Beim ersten Start baut Compose das SFTP-Image aus dem Git-Repo von `atmoz/sftp`, das dauert
ein bis zwei Minuten. Auf Docker Hub gibt es das Image nur für amd64, der Pi ist arm64.

## Zugangsdaten

Die Zugangsdaten stehen in `code/.env` (Vorlage: `code/.env.example`). Die Datei ist nur
für den eigenen Benutzer lesbar und liegt nicht im Git. Ihre Werte dürfen nur ASCII-Zeichen enthalten.

Es gibt je Dienst genau einen Benutzer:

- **Postgres:** `POSTGRES_USER` mit `POSTGRES_PASSWORD`, Datenbank `POSTGRES_DB`
- **Solr:** `SOLR_USER` (`admin-solr`) mit `SOLR_PASSWORD` (BasicAuth, Rolle `admin`)
- **SFTP:** `SFTP_USER` (`admin-sftp`) mit `SFTP_PASSWORD`, in sein Home gesperrt (chroot), sieht nur `/sftproot`

Die Passwörter kommen als Compose-Secrets in die Container: als Dateien unter
`/run/secrets/`, nicht als Umgebungsvariablen.

## Solr

Aufgebaut wie in der Vorlage. Die Startkette in `compose.yaml` läuft bei **jedem** Start:

1. Je Kern aus `SOLR_CORES` (kommagetrennt, leer = keiner) den Ordner `mounts/solr/data/<kern>` aus dem
   Basis-Configset `code/docker/solr/configsets/gebiter9k` anlegen, nur wenn er fehlt. Vorhandene Kerne bleiben unberührt.
2. `mounts/solr/data/security.json` neu schreiben, mit Benutzer und Passwort aus der `.env`.

Ein neuer Benutzer oder ein neues Passwort für Solr gilt deshalb nach `docker compose up -d`.

## SFTP und Host-Key

Der Container nutzt einen festen Host-Key, `mounts/sftp/ssh_host_ed25519_key`. Das Backend akzeptiert nur den
Server mit genau diesem Schlüssel (`SFTP_HOST_KEY` in der `.env`, Host-Key-Pinning gegen Man-in-the-Middle).
Steht unter der Adresse ein anderer Server, kommt keine Verbindung zustande.

```
mounts/sftp/
  ssh_host_ed25519_key       privater Host-Key, chmod 600
  ssh_host_ed25519_key.pub   öffentlicher Teil, steht in der .env als SFTP_HOST_KEY
  sftproot/                  die Dateien
```

Fingerprint prüfen, z. B. bevor man sich mit FileZilla verbindet:

```bash
ssh-keyscan -p <SFTP_HOST_PORT> <SFTP_HOST_LAN>
ssh-keygen -lf ../mounts/sftp/ssh_host_ed25519_key.pub
```

Ein neues Schlüsselpaar heißt: `SFTP_HOST_KEY` in jeder `.env` ändern, die diesen Server anspricht.

Ein neues SFTP-Passwort gilt erst, wenn der Container neu erzeugt wird:

```bash
docker compose up -d --force-recreate sftp
```

Auf dem Pi (Linux) muss `sftproot` dem User im Container gehören, sonst scheitert jeder Upload mit 503:

```bash
sudo chown 1001:100 ../mounts/sftp/sftproot
```

Das Backend meldet beim Start im Log `SFTP-Server <host>:<port> erreichbar, Host-Key geprüft, Anmeldung als <user> ok`.
Steht dort `SFTP-Vorwärmen fehlgeschlagen`, versucht es der Broker alle 30 Sekunden erneut. Ursache ist fast immer ein
Container, der nicht läuft, ein Host-Key, der nicht zum Container passt, oder ein anderes Passwort.

## Was nur beim ersten Start passiert

Die folgenden Schritte laufen nur, solange `mounts/postgres` leer ist:

- **Postgres:** `initdb` mit UTF-8 und dem `builtin`-Locale `C.UTF-8`, dazu
  Benutzer und Datenbank aus der `.env`.

Ein geänderter Postgres-Benutzer oder ein geändertes Postgres-Passwort in der `.env` wirkt deshalb **nicht** auf einen
bestehenden Bestand: `ALTER ROLE … PASSWORD …` ausführen oder den Bestand zurücksetzen (siehe unten).

## Komplett zurücksetzen

Damit gehen alle Daten verloren (der Host-Key in `mounts/sftp` bleibt):

```bash
docker compose down
rm -rf ../mounts/postgres/* ../mounts/solr/* ../mounts/sftp/sftproot/*
docker compose up -d --wait
```
