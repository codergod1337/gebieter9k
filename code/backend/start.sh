#!/usr/bin/env bash
# Startet das Backend mit Maven und wählt das Netzwerk-Profil selbst, je nachdem, wo der Pi gerade antwortet:
#   WEB = unterwegs, der SSH-Tunnel läuft: Postgres, Solr und SFTP liegen auf localhost (Hosts *_HOST_WEB)
#   LAN = zu Hause: direkt über die IP des Pi (Hosts *_HOST_LAN)
# Das Profil geht als Umgebungsvariable NETWORK_PROFILE an Spring, application.yaml wählt damit die Hosts aus der .env.
#
# Erkannt wird der Pi am Host-Key seines SFTP-Containers (SFTP_HOST_KEY in der .env), nicht nur an einem offenen Port.
# Ein fremder Rechner unter derselben Adresse, etwa in einem fremden WLAN mit 192.168.1.x, zählt nicht. So schickt das
# Backend seine Kennwörter nie an ihn (Solr meldet sich per Basic Auth über HTTP an, also im Klartext).
#
# Aufruf, von überall:
#   ./start.sh          Backend starten (./mvnw spring-boot:run)
#   ./start.sh test     andere Maven-Ziele mit demselben Profil, z. B. die Tests

set -u

backend_dir="$(cd "$(dirname "$0")" && pwd)"
env_file="$backend_dir/../.env"
# Erst der Tunnel: localhost antwortet sofort oder gar nicht. Das LAN wartet unterwegs bis zum Timeout.
candidate_profiles="WEB LAN"
keyscan_timeout_seconds=2

read_env_value() {
  local key="$1"
  sed -n "s/^${key}=//p" "$env_file"
}

# Erfolgreich, wenn unter host:port ein SSH-Server mit genau diesem Host-Key (Typ und Schlüssel) antwortet.
pi_answers_at() {
  local host="$1"
  local port="$2"
  local expected_host_key="$3"
  local scanned_host_key
  scanned_host_key="$(ssh-keyscan -T "$keyscan_timeout_seconds" -p "$port" -t ed25519 "$host" 2>/dev/null \
    | grep -v '^#' \
    | cut -d ' ' -f 2,3)"
  [ "$scanned_host_key" = "$expected_host_key" ]
}

if [ ! -f "$env_file" ]; then
  echo "Keine .env unter $env_file (Vorlage: code/.env.example)." >&2
  exit 1
fi

sftp_port="$(read_env_value SFTP_HOST_PORT)"
sftp_host_key="$(read_env_value SFTP_HOST_KEY)"
if [ -z "$sftp_host_key" ]; then
  echo "SFTP_HOST_KEY fehlt in $env_file, ohne ihn lässt sich der Pi nicht erkennen." >&2
  exit 1
fi

detected_profile=""
detected_host=""
for profile in $candidate_profiles; do
  sftp_host="$(read_env_value "SFTP_HOST_${profile}")"
  if pi_answers_at "$sftp_host" "$sftp_port" "$sftp_host_key"; then
    detected_profile="$profile"
    detected_host="$sftp_host"
    break
  fi
done

if [ -z "$detected_profile" ]; then
  tunnel_host="$(read_env_value SFTP_HOST_WEB)"
  lan_host="$(read_env_value SFTP_HOST_LAN)"
  echo "Pi nicht erreichbar: weder über den Tunnel ($tunnel_host:$sftp_port) noch im LAN ($lan_host:$sftp_port)." >&2
  echo "Unterwegs zuerst den SSH-Tunnel öffnen. Zu Hause prüfen, ob der Pi und der Container sftp laufen." >&2
  exit 1
fi

echo "Netzwerk-Profil $detected_profile: Pi antwortet unter $detected_host:$sftp_port, Host-Key geprüft."
export NETWORK_PROFILE="$detected_profile"

cd "$backend_dir" || exit 1
if [ "$#" -eq 0 ]; then
  exec ./mvnw spring-boot:run
fi
exec ./mvnw "$@"
