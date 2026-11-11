# Watchdog auf dem Pi 5

Stand: 2026-11-06, **eingerichtet und geprüft**.

## Wozu

Hängt der Pi komplett (Kernel oder systemd reagieren nicht mehr), startet er nach 60 Sekunden von selbst neu. Er soll
**nie aus Langeweile** neu starten, nur wenn wirklich nichts mehr geht.

## Wie es funktioniert

- Im Pi 5 steckt ein Hardware-Watchdog (`Broadcom BCM2835 Watchdog timer`, Gerät `/dev/watchdog0`). Das ist ein Zähler
  im Chip, der unabhängig vom Betriebssystem läuft. Läuft er ab, setzt er den Pi hart zurück.
- **systemd** (Prozess 1, das Herz des Systems) meldet sich regelmäßig beim Watchdog und setzt den Zähler damit zurück.
  Solange systemd und der Kernel laufen, kommt die Meldung, und es passiert nichts.
- Der Chip selbst kann nur etwa 15 Sekunden zählen. Der Kernel überbrückt das: Er meldet sich selbst beim Chip, solange
  systemd sich innerhalb der eingestellten 60 Sekunden bei ihm gemeldet hat.
- Bleibt die Meldung von systemd **60 Sekunden** aus, meldet sich auch der Kernel nicht mehr beim Chip, und der setzt
  den Pi zurück. Hängt der Kernel selbst, meldet er sich ebenfalls nicht mehr: dasselbe Ergebnis.

**Was KEINEN Neustart auslöst:** hohe Last, voller Arbeitsspeicher (solange der Kernel noch arbeitet), ein langsames
oder abgestürztes Programm, ein hängender Docker-Container, kein Netz. Es zählt nur, ob das System selbst noch lebt.
Bewusst **nicht** installiert ist das Paket `watchdog` (ein Dienst, der zusätzlich Last, Speicher oder Netz prüft und
dann neu startet): Das könnte auch bei vorübergehender Last neu starten, und genau das wollen wir nicht.

**Grenze:** Ist der Chip selbst oder die Stromversorgung das Problem, hilft der Watchdog nicht.

## Die Einstellung

Raspberry Pi OS schaltet den Watchdog schon selbst ein, mit genau diesen Werten (Datei
`/usr/lib/systemd/system.conf.d/40-rpi-enable-watchdog.conf` aus dem Paket `raspberrypi-sys-mods`). Damit das nicht
von einem Paket-Update abhängt, stehen die Werte zusätzlich in einer eigenen Datei unter `/etc`. Die wird als letzte
gelesen und gewinnt:

`/etc/systemd/system.conf.d/90-gebiter9k-watchdog.conf`

```
[Manager]
RuntimeWatchdogSec=60s
RebootWatchdogSec=2min
```

- `RuntimeWatchdogSec=60s`: 60 Sekunden ohne Meldung von systemd, dann Neustart durch den Chip.
- `RebootWatchdogSec=2min`: Hängt ein Neustart selbst (z. B. ein Dienst lässt sich nicht beenden), erzwingt der Chip ihn
  nach 2 Minuten.

## So wurde es eingerichtet (als `thomas` auf dem Pi)

1. Prüfen, was der Watchdog kann und ob er schon läuft:

   ```
   sudo wdctl
   systemctl show -p RuntimeWatchdogUSec -p RebootWatchdogUSec
   ```

   Antwort am 2026-11-06 (vorher schon aktiv):

   ```
   Device:        /dev/watchdog0
   Identity:      Broadcom BCM2835 Watchdog timer [version 0]
   Timeout:       60 seconds
   RuntimeWatchdogUSec=1min
   RebootWatchdogUSec=2min
   ```

2. Eigene Datei anlegen und systemd neu einlesen lassen (`daemon-reexec` startet nur systemd selbst neu, nicht den Pi):

   ```
   sudo mkdir -p /etc/systemd/system.conf.d
   sudo tee /etc/systemd/system.conf.d/90-gebiter9k-watchdog.conf >/dev/null <<'EOF'
   [Manager]
   RuntimeWatchdogSec=60s
   RebootWatchdogSec=2min
   EOF
   sudo systemctl daemon-reexec
   ```

3. Prüfen, dass unsere Datei als letzte gilt:

   ```
   systemd-analyze cat-config systemd/system.conf | grep -E '^(# /|RuntimeWatchdog|RebootWatchdog)'
   systemctl show -p RuntimeWatchdogUSec -p RebootWatchdogUSec
   ```

   Antwort (gekürzt):

   ```
   # /usr/lib/systemd/system.conf.d/40-rpi-enable-watchdog.conf
   RuntimeWatchdogSec=1m
   RebootWatchdogSec=2m
   # /etc/systemd/system.conf.d/90-gebiter9k-watchdog.conf
   RuntimeWatchdogSec=60s
   RebootWatchdogSec=2min
   RuntimeWatchdogUSec=1min
   RebootWatchdogUSec=2min
   ```

## Nachsehen, ob der Watchdog zugeschlagen hat

```
cat /sys/class/watchdog/watchdog0/bootstatus      # 0 = letzter Start war kein Watchdog-Neustart
journalctl -b -1 -n 50 --no-pager                  # die letzten Zeilen vor dem vorigen Start
journalctl -b -k --no-pager | grep -i watchdog     # Meldungen des Watchdogs seit diesem Start
```

## Ändern oder abschalten

Zeit ändern: in `/etc/systemd/system.conf.d/90-gebiter9k-watchdog.conf` den Wert anpassen, dann
`sudo systemctl daemon-reexec`. Abschalten: dort `RuntimeWatchdogSec=0` setzen (die Datei einfach zu löschen reicht
nicht, dann gilt wieder die Vorgabe des Pakets mit 1 Minute).
