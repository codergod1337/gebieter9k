# Arbeitsprotokoll

Woran Claude gerade arbeitet. Nach einem Absturz steht hier, wo es weitergeht. Der neueste Eintrag steht oben.

- Vor jedem Auftrag: Eintrag mit Uhrzeit, der Ansage des Nutzers und dem Plan.
- Nach jedem Schritt: Stand nachziehen (geänderte Dateien, was als Nächstes kommt).
- Fertiges bleibt als eine Zeile stehen. Einzelheiten stehen in `setup.md` (Bau auf dem Pi) und in den Konzepten.

## Reihenfolge der nächsten Arbeiten (Nutzer, 2026-11-11 14:20)

1. Markt (Shop) bauen.
2. Rechte der FileClass updaten (`WRITER` wird „darf hochladen“, dazu „Metadaten bearbeiten“).
3. Danach den Dateizugriff besprechen, an echten Datensätzen und konkreten Fällen; dann wird noch einmal umgebaut.
4. Die Suche kommt nach dem Markt (`konzept-file-kern.md`, Abschnitt 14).

## 2026-11-26 20:43 – Galerie: Bild nicht mehr im Popup, sondern unter dem Subheader, mit Lupe, Zoom und Ziehen

- Ansage (kam um 20:39 während der Arbeit an der Wissensdatenbank, „wenn du damit fertig bist“): „noch mal was zum
  viewer, hier will ich das nicht in einem popup, wenn ich ein bild ansehe, also wenn ich auf eine bildkachel klicke,
  will ich dass das bild unterhalb des subheders angezeigt wird. dass wir für große bilder die maximale breite der
  seite haben. sprich default das bild SKALIERT auf die volle seitenbreite, wenn es breiter sein solle als die
  bildschirmbreite. ansonsten einfach bild in voller breite. […] wenn ich nochmal auf das bild klicke mit einem lupen
  plus symbol! dann will cih das bild in nativer größ angezeigt mit scrollbalken und ich würde gerne auch mit
  gedrückter rechter maustaste das bild draggen also verschieben können - ich meine kompfortables scrollen. in der
  nativen ansicht will ich dann auch mit mausrad wieder raus und reinscrollen können, also zwischen der nativen
  bildgröße und der browser breiten skalierung in mehreren stufen teilweise rein und rauszoomen. also wie in jedem
  etwas besseren grafikprogramm“
- So verstanden: Klick auf eine Bildkachel öffnet das Bild nicht mehr im Popup (`GalleryImageViewerPopup`), sondern
  als Ansicht direkt unter dem Subheader, über die ganze Breite der Seite. Ist das Bild breiter als das Fenster, wird
  es auf die Fensterbreite verkleinert, sonst steht es in seiner eigenen Größe. Mauszeiger über dem Bild: Lupe mit
  Plus; ein Klick zeigt es in nativer Größe mit Scrollbalken. Dort: rechte Maustaste gedrückt halten verschiebt,
  Mausrad zoomt in mehreren Stufen zwischen „auf Fensterbreite“ und „nativ“.
- Plan: erst nur lesen (`GalleryImageViewerPopup`, `GalleryPage`, `GalleryShareVisitorPage`, `usePanScroll`), dann
  eintragen, was genau umgebaut wird.
- Gelesen (20:46). Umbau, nur Frontend:
  1. Global neu: `components/ZoomableImage.tsx` + `components/useImageZoom.ts`: Bild eingepasst auf die Breite seines
     Platzes (nie größer als nativ), Lupe mit Plus, Klick → native Größe in einem Bereich mit Scrollbalken, dort Mausrad
     = Zoom in Stufen (Faktor 1,25, zwischen „eingepasst“ und „nativ“, um den Mauszeiger herum), rechte Maustaste
     verschiebt (`usePanScroll`, wie in der Matrix), Klick passt wieder ein.
  2. `gallery/GalleryImageViewer.tsx` ersetzt `GalleryImageViewerPopup.tsx` (wird gelöscht): Leiste (zurück zu den
     Bildern, voriges, nächstes, Überschrift, Stimmen, Herunterladen) direkt unter dem Subheader, darunter das Bild über
     die ganze Breite der Seite, darunter die Kommentare. Die Adresse bleibt (`?image=…`).
  3. Umstellen: `GalleryPage`, `GalleryShareVisitorPage` (Besucherseite der Freigabe, dort ohne Subheader) und, weil
     es dieselbe Aufgabe ist (Regel „eine Komponente je Aufgabe“), die Bildanzeige in `file/document/FileDocumentViewerPage`.
  4. CSS: Main gibt dem großen Bild die ganze Breite (`.main-content:has(> .gallery-viewer)`), alte Regeln des Popups
     und `file-viewer-image-*` raus.

## 2026-11-26 20:15 – Wissensdatenbank: Modul mit Demokapitel bauen (Frontend, ohne Solr-Kern)

- Ansage: „ich hab keine lust das nun ein xtes mal im detail zu erklären und du bist erneut zu dumm, ich will dass du
  nun ein wissensdatenbank modul anlegst noch ohne solr kern einfach mit einem demokapitel und zwar grundlagen/
  koordinaten transformation“
- Keine Rückfragen mehr, bauen. Was offen war, lege ich selbst fest und nenne es im Bericht (alles leicht zu ändern):
  Ordner `src/knowledge/`, Bezeichner englisch wie im übrigen Code, Adresse deutsch
  (`/wissen/grundlagen/koordinatentransformation`), das Paket lädt der Browser erst beim Öffnen, kein neues npm-Paket.
- Plan: Modul ohne Login (Subheader, Reiter „Grundlagen“), Kapitel „Grundlagen“ mit der Seite
  „Koordinatentransformation“ (kartesisch ↔ polar): Skizze als SVG, die Herleitungen Schritt für Schritt, der bewegte
  Term gleich gefärbt und sichtbar von der alten an die neue Stelle geführt. Formeln als eigene Term-Klassen (je Klasse
  eine Datei), gezeichnet mit HTML und CSS. Inhalte stehen fürs Demo im Code; der Solr-Kern kommt später.
- Danach: Typprüfung, Bau, im Firefox ansehen, Konzept umschreiben (Überholtes raus), `konzept-navigation.md`.
  Kein Commit, kein Bau auf dem Pi ohne Ansage.
- Geändert gegenüber dem Plan: Das Paket ist fest in der App, kein Nachladen (mit den Inhalten später in Solr bleibt
  es klein, und so stehen die Routen wie bei jedem Modul in `App.tsx`).
- **Stand 20:40, fertig (lokal, nicht committet, nicht auf dem Pi):**
  - Neu: `code/frontend/src/knowledge/` (Modul, `math/`, `derivation/`, `basics/coordinatetransformation/`), 50 Dateien.
    Geändert: `src/App.tsx` (drei Routen vor der Prüfung der Sitzung), `src/styles/base.css` (Abschnitte Formeln,
    Herleitung, Wissensdatenbank, Skizze am Ende), `public/themes/default.css` (Abschnitt Wissensdatenbank am Ende).
  - `npx tsc -b` und `npm run build` ohne Fehler. Im Firefox ohne Fenster gegen den gebauten Stand geprüft: `/wissen`
    springt zu `/wissen/grundlagen`, Klick in der Liste öffnet die Seite, 4 Herleitungen, je Klick eine Zeile mehr,
    4 Kopien mitten im Flug, danach keine mehr, Adresse `?xCoordinateStep=3&…`, Neuladen mit Stand ohne Flug, „Schritt
    zurück“ nimmt die Zeile weg, unbekanntes Kapitel zeigt den Hinweis, schmale Breite geht, keine Fehler der Seite.
  - Doku: `konzept-wissensdatenbank.md` neu geschrieben (Überholtes raus), Zeile in `konzept-navigation.md` 4.
  - Hilfsskripte und Fotos nur im Scratchpad; Hilfsprozesse beendet.
- Als Nächstes an der Wissensdatenbank: Der Nutzer sieht sich das Demo an. Offene Fragen in Konzept, Abschnitt 5.

## 2026-11-26 20:08 – Wissensdatenbank: wie liegt eine Formel im Dokument? (nur Plan, kein Code)

- Ansage: „wir müssen noch überlegen wie wir es geau ablegen, ich glaube richtext format ist scheisse, da wir ja
  maximale freiheit benötigen für formeln oer maybe auch mini svg dass wir äquivalenzumformungen eindeutig animieren
  können wo welcher wert "hingeht"“
- Damit entschieden (Nutzer): kein Rich-Text als Format des Inhalts.
- Nachgesehen (nur gelesen, Dokus im Netz): KaTeX und MathJax können einem Teilstück einer Formel eine Kennung geben
  (KaTeX `\htmlId` hinter der Option `trust`, MathJax `\cssId{id}{math}`). Kein Paket gewählt, keine Version geprüft.
- Dem Nutzer vorgelegt, EINE Entscheidung: wie eine Formel abgelegt wird. (1) Formeltext (LaTeX) mit markierten
  Termen, (2) eigener Baum aus Termen als JSON, (3) fertige Zeichnung (SVG/MathML) je Schritt. Meine Empfehlung: (1),
  dazu SVG als eigener Baustein für Skizzen; Pfeil oder Gleiten rechnet das Frontend beim Anzeigen, abgelegt wird nur
  die Quelle. Wartet auf seine Entscheidung.
- Geparkt, weiter offen: die drei Rückfragen von 20:06 (Kern-Key und Feldnamen, Referenzen, Status).
- **20:12, Antwort des Nutzers:** „ne du nervst mich weil du schon wieder dumm bist“. Die drei Möglichkeiten sind also
  NICHT angenommen und gelten nicht als Plan. Meine Vermutung, nicht bestätigt: Er hatte gesagt „wir müssen noch
  überlegen“, und ich habe drei fertige Lösungen zum Auswählen hingelegt und seine SVG-Idee gleich abgeräumt.
  Zurückgefragt, wie er sich die Animation einer Umformung vorstellt. Nichts entschieden, kein Code.

## 2026-11-26 20:04 – Wissensdatenbank: neue Richtung, Inhalte in einem eigenen Solr-Kern (nur Plan, kein Code)

- Ansage: „ich glaube wir machen das aber als neuen solrkern. sprich ein solr wissens kern dokument pro seite. also
  eine seite, ob wir es dann je unterpunkt machen oder gröber oder feiner würde ich mich noch nicht festlegen wollen.
  ich stelle mit eine art richtext format vor das wir im solr dokument ablegen und dann im frontend rendern. zusätzlich
  brauchen wir noch eine paar hooks also referenzfelder statusfelder und auch schlagwortfelder“
- Das kippt zwei Punkte im Konzept vom 2026-11-24: „Inhalte stehen im Code des Pakets“ und „kein Backend“.
- Plan: nur lesen, wie ein Kern heute entsteht (YAML, `de.gebiter.solr`, `docu/solr-cores`, `SolrReference` = Hooks,
  `SolrField`, Export/Sicherung), dann dem Nutzer sagen, wie ich es verstanden habe, meine Zweifel, den neuen groben
  Plan und den ersten Schritt. Konzept erst umschreiben, wenn die Richtung bestätigt ist. Kein Code.
- **Stand 20:06, nur gelesen:** `docu/solr-cores/README.md` und `FILE.md`, `entities/SolrReference.md`,
  `application.yaml` (`gebiter.solr`, `gebiter.rich-text`), `SolrCoreExportService`, `SolrCoreAdminController`,
  `compose.yaml` (Startkette Solr), `components/richTextHtml.ts`. Befund: Kern = `core-keys` (YAML) + `SOLR_CORES`
  (`.env`) + Felder im Solr-Manager; Referenzen stehen automatisch in JEDEM Kern; der heutige Rich-Text kann keine
  Formel, keine Farbe, kein Bild; Export nur per Knopf (einziger Aufrufer `SolrCoreAdminController`), Einspielen fehlt.
- Geändert: `konzept-wissensdatenbank.md`, neuer Abschnitt 0 (neue Richtung, was damit überholt ist). Die Abschnitte
  1 bis 6 sind noch die alte Fassung.
- Dem Nutzer gesagt: zwei Zweifel (1. das Format: Rich-Text reicht für Formeln und „Schieben“ nicht, Vorschlag
  Bausteine als JSON, interaktive Elemente bleiben Code und werden per Key eingebunden; 2. der Text läge nur in Solr,
  Einspielen fehlt), neuer grober Plan in sechs Stücken, erster Schritt = Kern mit Grundfeldern.
- Rückfragen an den Nutzer, offen: 1. Kern-Key `KNOWLEDGE` und englische Feldnamen wie im Kern FILE? 2. Welche
  Referenzen (gelten in jedem Kern) und was davon ist eher ein normales Feld des Kerns? 3. Welche Status?
  Bis zu den Antworten kein Code.

## 2026-11-26 20:00 – Wissensdatenbank: Modul planen (nur Plan, kein Code)

- Ansage: „so“, dann: „wir wollten ein wissensdantenbank modul planen, dazu haben wir notizen angelegt“
- Vorgefunden (19:43): lokal = `origin/main` = `7b0992f`; nicht committet sind dieses Protokoll und
  `docu/konzept-wissensdatenbank.md`. Den Pi heute nicht angesehen.
- Plan: die Notizen lesen (`konzept-wissensdatenbank.md`, Regel `knowledge-base-module`), im Frontend nur lesen (Routen
  ohne Login, Subheader, Header ohne Sitzung). Dann dem Nutzer den groben Gesamtplan und den ersten Schritt nennen und
  darüber reden. Kein Code, bevor Name, Adresse und Sprache der Bezeichner feststehen.
- **Stand 20:02:** gelesen, nicht geändert: `App.tsx`, `layout/AppHeader.tsx`, `components/Subheader.tsx`,
  `gallery/GalleryShareVisitorPage.tsx`, `package.json`, `vite.config.ts`. Befund: Das Gerüst braucht keinen Umbau am
  Seitengerüst (Header ohne Sitzung zeigt nur die Marke, Route ohne Login steht vor der Prüfung der Sitzung).
  Geändert: `konzept-wissensdatenbank.md`, Abschnitt 6 (neue Frage 6 „Laden des Pakets“, Befund am Code).
- Dem Nutzer genannt: grober Gesamtplan in sechs Stücken, erster Schritt = Gerüst, drei Rückfragen (Adresse, Sprache
  der Bezeichner, Laden des Pakets). Wartet auf seine Antworten; bis dahin kein Code.

## 2026-11-24 09:45 – Wissensdatenbank: Plan als Konzept anlegen (nur Doku, kein Code)

- Ansage: „wir haben ja schon einen kleinen plan wie unsere wissensdatenbank ausehen soll, lege doch das in einem
  paket-plan im fullstack projekt an, dass wenn ich das projekt dann öffne, du weisst worum es geht und ich es dir
  nicht noch mal erklären muss“
- Herkunft: Sitzung im Ordner `~/Dokumente/coding/pythonpower`. Das interaktive Lernskript war dort am selben Tag als
  Python-Projekt begonnen worden; der Nutzer hat entschieden, dass es stattdessen ein eigenes großes Paket im Frontend
  von gebiter9k wird, ohne Login.
- Plan: `docu/konzept-wissensdatenbank.md` anlegen (was es werden soll, Entscheidungen, nächstes Stück, offene Fragen),
  dazu `Vollidiot/knowledge-base-module.md` mit Zeile in `Vollidiot/MEMORY.md`, damit es beim Öffnen des Projekts
  geladen wird. Am Code nichts ändern.
- **Stand 09:46:** angelegt sind `docu/konzept-wissensdatenbank.md`, `Vollidiot/knowledge-base-module.md` und die Zeile
  „Wissensdatenbank“ am Ende von `Vollidiot/MEMORY.md`. Am Code nichts geändert, nichts gebaut, nichts committet.
- Gelesen, nicht geändert: `code/frontend/src/App.tsx` (Routen, öffentliche Besucherseite in Zeile 121),
  `code/frontend/package.json`, die Regeln zu Frontend-Struktur, Naming, Security, Doku und Arbeitsweise.
- Als Nächstes: wartet auf die Antworten des Nutzers zu den offenen Fragen 1 und 2 im Konzept (Name und Adresse des
  Pakets, Sprache der Bezeichner). Danach das Gerüst (Konzept, Abschnitt 4, Punkt 1).

## 2026-11-23 22:57 – Zurück zum Pi (Stand feststellen, Auftrag noch offen)

- Ansage: „so nun arbeiten wir an unserem pi wieder weiter“
- Vorgefunden: lokal = `origin/main` = `7b0992f`, geändert ist nur dieses Protokoll (Einträge von heute zum
  Firmen-VPN, nicht committet). Firmen-VPN ist AUS. Laptop im fremden WLAN (`192.168.10.35`).
- Plan: nur lesend prüfen, ob der Pi von hier erreichbar ist (SSH-Port, https) und wie er dasteht (Last, RAM,
  Temperatur, Container, Stand des Klons). Dann dem Nutzer den Stand und die offenen Stücke nennen; was gebaut wird,
  sagt er.
- **Stand 22:59, nur gelesen, auf dem Pi nichts geändert:**
  - Von hier erreichbar: SSH-Port 6969 offen (direkt, ohne Tor), https 200, ausgeliefert wird `index-CDBQLgR3.js`
    (der Stand vom 2026-11-22).
  - Pi: läuft seit 12 Tagen, Last 0,00, 12 GiB RAM verfügbar, Platte 12 %, 46,6 °C. Alle 5 Container laufen (`backend`
    und `frontend` seit dem Bau gestern, 25 h), Backend-Log der letzten 26 h ohne ERROR und ohne WARN. Klon auf
    `7b0992f`, sauber bis auf die drei alten `._`-Dateien. Images `:vorher` sind noch der Stand von vor zwei Tagen.
  - `uptime` zählt 3 Sitzungen: Desktop-Autologin und `tty1`, beide seit dem Start am 2026-11-11, dazu meine eigene.
    Keine fremde Anmeldung.
  - Mein Fehler: Beim ersten Versuch liefen die Befehle, bevor die SSH-Verbindung stand (`setsid ssh -f` kehrt sofort
    zurück); auf dem Pi kam dabei nichts an. Seitdem ohne `setsid` und mit Warten auf `-O check`.
  - SSH wieder geschlossen, Hilfsskript auf dem Pi und im Scratchpad gelöscht.
- 23:02, Frage des Nutzers: „also wir haben den aktuellen stand schon gebuildet?“ Antwort: ja, belegt durch die
  Lage von 22:59 (Klon `7b0992f` = lokal = GitHub, Images und Container 25 h alt, also vom Bau am 2026-11-22 22:12,
  ausgeliefertes Bundle wie im Bau-Eintrag). Lokal ungebaut ist nichts: geändert ist nur dieses Protokoll.
- Als Nächstes: wartet auf die Ansage des Nutzers, welches Stück drankommt.

## 2026-11-23 15:57 – Firmen-Server `…16.120`: Bestandsaufnahme, warum das alte Compose nicht hochfährt (NUR LESEN)

- Ansage (gekürzt): Zugangsdaten im Chat bekommen. „Unser Compose läuft unter Opt Homepaling [Spracheingabe, also
  irgendwo unter `/opt`]. […] Das müsste mit intern und extern sein. Aber das externe haben wir nie ins Leben gerufen.
  […] die oberste Direktive ist, schreib keinen Scheiß rein. Und erstmal Bestandsaufnahme machen. Vor allem auch,
  warum es nicht hochfährt. Denn die Logs müssten voll sein.“
- Regel für diesen Server (Memory `pahling-live-system-read-only`): Live-Daten, nur lesen. Kein `up`/`down`/`restart`,
  nichts löschen, nichts bearbeiten, bevor der Nutzer zu genau dem Schritt Ja sagt. Befunde nur mit Beleg.
- Plan: 1. Zugangsdaten als Kommentarzeile unten in `code/.env` ablegen (dort liest das Askpass-Skript sie; nie
  ausgeben). 2. VPN aufbauen, EINE SSH-Anmeldung (Steuer-Socket, damit es bei einer bleibt). 3. Nur lesend:
  System (Platte, Inodes, Speicher, Laufzeit), `/opt` durchsehen (Ordner intern/extern, Compose-Dateien), Zustand von
  Docker und der Container, Logs der Container und des Docker-Dienstes. Werte aus `.env`-Dateien dort nicht ausgeben.
  4. Befund mit Befehl und Ausgabe melden, SSH und VPN wieder schließen.
- **Stand 16:04, Bestandsaufnahme fertig, auf dem Server NICHTS geändert** (Einzelheiten in `setup.md` 8.1):
  - Zugangsdaten liegen als Kommentarzeile `# srv120 …` unten in `code/.env` (von mir eingetragen). Eine Anmeldung per
    SSH, Host-Key beim ersten Mal in `known_hosts` übernommen.
  - Ursache: Das Backend ist nicht abgestürzt, es ist AUS. Der Rechner (virtuelle Maschine) wurde heute von seinem
    Wirt sauber heruntergefahren und gut eine Stunde später wieder gestartet. Vier Container kamen von selbst zurück
    (`restart: unless-stopped`), das Backend nicht: In der Compose-Datei steht bei ihm `restart: "no"`. Seitdem hat
    niemand versucht, es zu starten (Startzeit des Containers unverändert vom September, kein Log nach dem Herunterfahren).
  - Folge: Der Webserver davor antwortet auf jeden API-Aufruf mit 502, der Login geht nicht, auch die Meldungen des
    ERP-Systems laufen ins Leere.
  - Sonst unauffällig: Datenbank gesund, Suche und Webserver laufen, Platte 85 % (8,7 GB frei), Speicher frei, Logs
    je Container auf 5 × 20 MB begrenzt. Der „externe“ Teil hat Compose-Dateien, aber keine Container.
  - Mein Fehler dabei: eine unbegrenzte Suche im Systemjournal (viereinhalb Monate) lief über 80 s und brach ab;
    geprüft, kein Prozess blieb hängen. Seitdem nur begrenzte Abfragen (`-n`, `--since/--until`, `timeout`).
  - SSH und VPN wieder geschlossen, Hilfsdateien gelöscht.
- 16:06, nach dem Ja des Nutzers („ja, startet es mal bitte“): `docker start container_home_backend`. Start in 13,6 s,
  kein ERROR, kein WARN, der Webserver davor kommt wieder durch (401 statt 502). SSH und VPN geschlossen. Den Login
  selbst prüft der Nutzer. Offen: `restart: "no"` beim Backend (bleibt nach dem nächsten Neustart wieder aus).
- 16:11, nur gelesen: Die Neustart-Regel steht seit dem ersten Commit der Compose-Datei so, ein anderer Autostart
  fehlt. Datenbank sauber herunter- und hochgefahren, gesund. Von außen kommt 403, bevor die Anfrage den Server
  erreicht (durch das VPN direkt antwortet er mit 200); Ursache davor nicht geklärt, prüft jemand in der Firma.

## 2026-11-23 15:24 – OpenVPN (Zweck noch offen, nichts installiert, nichts geändert)

- Ansage: „so heute haben wir mal was anderes, wir brauchen open vpn“
- Nur nachgesehen, nichts geändert:
  - Laptop: im fremden WLAN (`192.168.10.35`, nicht das Heimnetz `192.168.1.x`). `openvpn`,
    `network-manager-openvpn(-gnome)` und `wireguard-tools` sind NICHT installiert; NetworkManager 1.52.1 ist da,
    `/dev/net/tun` gibt es. Installieren braucht sudo, das gibt der Nutzer ein.
  - Von hier aus offen: `gebieter.ddns.net:6969` (SSH zum Pi) und `:443` (https). Andere Freigaben an der FritzBox
    kenne ich nicht; ein eigener Port für OpenVPN (üblich 1194/UDP) ist dort bisher nicht freigegeben.
  - Auf dem Pi habe ich noch NICHT nachgesehen (erst, wenn feststeht, dass er beteiligt ist).
- Zu beachten, falls der Server auf den Pi soll: Regel „niemand kommt physisch an den Pi“ (nichts an Netz, Firewall,
  Paketen ohne Absprache), und die FritzBox lässt sich von unterwegs nur ändern, wenn der Fernzugang dort an ist.
- Antwort des Nutzers (15:25): Der Laptop soll sich als Client in ein Firmen-VPN einwählen (Adresse auf Port 443,
  Anmeldung mit Windows-Domäne und Benutzer). Der Pi ist NICHT beteiligt. Adresse und Benutzer stehen bewusst nicht
  hier (Protokoll liegt im öffentlichen Repo, fremde Firma); sie kommen nach `setup.md`, sobald es läuft.
- Stand 15:26, geprüft von außen, nichts geändert:
  - Die Gegenstelle ist eine WatchGuard-Firewall (Anmeldeseite „WatchGuard Access Portal“). Auf Port 443/TCP antwortet
    ein echter OpenVPN-Server (Handshake beantwortet). OpenVPN ist also richtig (bei WatchGuard heißt das „Mobile VPN
    with SSL“). Die Domäne wird in den Benutzernamen geschrieben (`domäne\benutzer`), eine Auswahl gibt es nicht.
  - Pakete aus Debian 13: `openvpn` 2.6.14-1+deb13u3, `network-manager-openvpn(-gnome)` 1.12.3-1~deb13u1.
- Plan: 1. Der Nutzer installiert die drei Pakete (sudo). 2. Er holt die Profildatei `client.ovpn` nach der Anmeldung
  von der Firewall (Seite `/sslvpn.html`) oder vom Admin der Firma; sie enthält Zertifikate und einen Schlüssel, also
  außerhalb des Projekts ablegen (`~/vpn/`), nie ins Repo. 3. Ich lese die Datei (ohne den Schlüssel auszugeben),
  richte die Verbindung ein, der Nutzer gibt das Kennwort selbst ein. 4. Prüfen (Adresse im Tunnel, Routen), dann
  `setup.md` nachziehen.
- Offen: Welche Schreibweise der Domäne stimmt (mit oder ohne `.de`), zeigt die Anmeldung an der Seite der Firewall;
  dort höchstens je ein Versuch, sonst sperrt das Windows-Konto womöglich.
- Stand 15:31: Der Nutzer hat von der Firma nur Adresse, Benutzer und Kennwort, keine Datei. Das ist bei WatchGuard
  üblich (der Windows-Client holt das Profil selbst); unter Linux holen wir es einmal von Hand. Die drei Pakete sind
  noch NICHT installiert. Die Abruf-Adresse des WatchGuard-Clients (`/?action=sslvpn_download&filename=client.wgssl`)
  antwortet ohne Anmeldedaten mit 502 (anders als die Portalseite); ob sie mit Anmeldedaten die Datei liefert, ist
  nicht geprüft.
- Als Nächstes (Nutzer): Pakete installieren; im Firefox an der Firewall anmelden, dann `/sslvpn.html` öffnen und
  sagen, ob dort das Profil zum Herunterladen steht. Sonst zweiter Weg: kleines Skript, das das Profil über die
  Abruf-Adresse holt und das Kennwort verdeckt abfragt (nicht im Chat, nicht in einer Datei).
- 15:40, Ansage des Nutzers: Ich soll mich selbst anmelden und das Profil holen; das Kennwort steht als
  Kommentarzeile ganz unten in `code/.env`. (Zu Recht verärgert: Ich hatte ihn durch Browser-Schritte geschickt.)
- **Stand 15:50, VPN eingerichtet und geprüft** (Einzelheiten mit echten Werten in `setup.md` Abschnitt 8):
  - Pakete hat der Nutzer installiert. Anmeldung am Portal klappt, dort gibt es aber keinen Profil-Download (die alte
    Download-Seite gibt es auf der Firewall nicht mehr). Profil über die Abruf-Adresse des WatchGuard-Programms geholt
    (Domäne im Benutzernamen), Prüfsummen stimmen, liegt in `~/vpn/pahling/` (außerhalb des Projekts, Rechte 600).
  - In den NetworkManager importiert, Verbindung `pahling`. Nachgetragen: Benutzer, `data-ciphers` mit `AES-256-CBC`
    (sonst „failed to negotiate cipher“), `ipv4.never-default yes` (sonst geht der ganze Internetverkehr in den Tunnel
    und das Internet ist weg), `ipv4.ignore-auto-dns yes` (die DNS-Server der Firma antworten von außen nicht).
  - Probe (aufbauen, ansehen, abbauen): Tunnel steht, die Firmennetze antworten, Internet läuft daneben. Der Server
    `…16.120` antwortet auf Ping und hat Port 22 offen. Die Verbindung ist danach wieder AUS.
  - Zwischendateien im Scratchpad (Sitzungs-Cookie, Archiv, Skripte) gelöscht.
- 15:49, Ansage des Nutzers: Über das VPN auf `…16.120`; dort fährt das alte Docker Compose nicht mehr hoch, Ursache
  prüfen. **Live-Daten: nur lesen, nichts ändern, nichts behaupten, was nicht belegt ist.** Die Zugangsdaten gibt er
  noch.
- Als Nächstes: wartet auf die Zugangsdaten für `…16.120`. Dann VPN aufbauen, nur lesend nachsehen (Zustand der
  Container, Logs, Platte, Speicher), Befund mit Beleg melden; jede Änderung erst nach seinem Ja.

## 2026-11-22 22:07 – Push `7b0992f` auf den Pi bringen (pull, bauen, prüfen)

- Ansage: „es ist in git gepusht“
- Geprüft: lokal = `origin/main` = `7b0992f` („pray beacoup6“).
- Plan (feste Regel: Code kommt nur über Git auf den Pi, nach dem Push bauen, ohne zu fragen): 1. Regeln und
  `setup.md` 5.16 nachlesen. 2. Commit auf Zugangsdaten prüfen. 3. Pi erreichen (SSH-Port testen), Lage ansehen,
  Images sichern. 4. `git pull`, bauen, erst dann starten, Log des Starts lesen (zwei neue `@Value`, neue Tabelle
  `gallery_uploader`, neue Spalte `users_detail.upload_frame_color`). 5. Von außen prüfen, was ohne Anmeldung geht.
- **Stand 22:12, fertig und auf dem Pi** (Einzelheiten in `setup.md` 5.16):
  - Im Commit kein Passwort und kein Schlüssel aus `code/.env`, nicht das Kennwort des Pi. Lokal
    `./mvnw -o -DskipTests clean compile` ohne Fehler.
  - Direkter Tunnel (Port 6969 offen); Kontextstart `Gebiter9kApplicationTests` grün (26,9 s). Er hat in der Pi-DB die
    Tabelle `gallery_uploader` (mit `uq_gallery_uploader`) und die Spalte `users_detail.upload_frame_color` angelegt.
  - Pi vorher Last 0,01, 12 GiB RAM frei, 44,4 °C; Images als `:vorher` gesichert; Pull von `5e334d3` auf `7b0992f`,
    Klon sauber; Bau `backend` 23 s, `frontend` 7 s; Start 17,3 s, kein ERROR, kein WARN; alle 5 Container laufen.
  - Die sechs neuen Endpunkte ohne Anmeldung 401. Von außen: neues Bundle `index-CDBQLgR3.js` mit den neuen Texten.
    Der echte Freigabelink zeigt im Firefox weiter 10 Kacheln, kein Fehler.
  - Hilfsdateien auf dem Pi gelöscht, Tunnel geschlossen.
- NICHT gesehen auf dem Pi: alles hinter der Anmeldung. Der Nutzer testet; dafür braucht er ein zweites Konto.

## 2026-11-22 21:33 – Galerie: Uploadberechtigte bauen (Antworten des Nutzers auf die fünf Fragen)

- Ansage (gekürzt, wörtlich): „ich würde galerien, die andere uploader freigegeben haben bei den jeweiligen uploadern
  in ihren galerien kursiv und farblich markiert anzeigen. […] man hat einen endpunkt eigene galerien und einen endpunkt
  für die ids bei denen man auch hochladen darf […] zu 2. ja 3. gute frage, ich würde das im userprofil noch auswählbar
  machen, für dich als info […] später im shop weitere border stylings, wie zum beispiel der rahmen des profilbildes
  […] kaufen und für sich immer eins aktivieren […] das machen wir im detail später. […] 4. ja stimmt […] das würde
  ich auch so lassen, aber wir müssen ja ohne probleme die findbar machen können bei denen es öffentlich ist oder wenn
  sie freunde sind und die einstellung auf freunde ist. den username würde ich aber immer findbar machen wollen 5. bob
  findet die galerie in SEINEM profil in galerien, hinter seinen eigenen will ich KURSIV also in der tabelle weiter
  unten dann die angezeigt haben bei denen er hinzugefügt wurde“.
- Entschieden (Nutzer):
  - 2: Der Besitzer löscht jedes Bild seiner Galerie, der Uploader nur seine eigenen; die Sichtbarkeit eines Bildes in
    einer fremden Galerie ändert der Uploader nicht.
  - 3: Die Rahmenfarbe wählt jeder User in seinem Profil. NUR ALS RICHTUNG, nicht jetzt: später Rahmen-Stylings im
    Markt (kaufen, eins aktivieren), dann ersetzt das Styling die Farbe.
  - 4: Die Liste zeigt nie die E-Mail-Adresse, die Adresse trifft nur vom Anfang her. Über den Usernamen ist JEDER
    findbar; über die E-Mail nur, wessen Profil der Suchende sehen darf (öffentlich, oder „Freunde“ und befreundet).
    So von mir verstanden.
  - 5: Im EIGENEN Profil unter „Galerien“: erst die eigenen, dahinter kursiv und farblich markiert die, bei denen man
    eingetragen ist. Zwei Endpunkte (eigene Galerien; Galerien, in die man hochladen darf).
  - 1 blieb ohne ausdrückliche Antwort; von mir nach dem Anwendungsfall „gemeinsame Ablage“ entschieden: Besitzer und
    Uploadberechtigte sehen immer die ganze Galerie.
- Plan: 1. Regeln und Code lesen (Sitzungsspeicher der Freunde, Rechte an Dateien, Reiter „Freigabe“, Liste der
  Galerien, Profil-Einstellungen). 2. Backend: Entity der Uploadberechtigten mit Service und Controller, Lesefilter,
  Rechte (bearbeiten, löschen), Upload, Vervollständigung von Usern, Rahmenfarbe im Profil. 3. Frontend: globale
  Vervollständigung, Box „Uploadberechtigte“ im Reiter „Freigabe“, Liste der Galerien, Rahmen und Legende an den
  Kacheln, Farbwahl im Profil. 4. Bauen (Backend, Frontend), Doku je Entity und Konzepte nachziehen.
- Stand etwa 21:45 (Uhrzeit nachträglich geschätzt), **Backend geschrieben und übersetzt (`./mvnw -o compile` ohne Fehler), nichts gestartet, nichts auf dem
  Pi, nicht committet**:
  - Neu: Entity `GalleryUploader` (Tabelle `gallery_uploader`: `id`, `galleryId`, `uploaderUsersGuid`, je Galerie und
    User einmal), `GalleryUploaderRepository`, `GalleryUploaderService`, `GalleryUploaderController`
    (`/api/gallery-uploader`: POST eintragen, GET eigene Einträge, POST `/resolve` die einer Galerie, DELETE
    austragen), DTOs `NewGalleryUploader`, `GalleryUploaderResolveRequest`, `GalleryUploaderDeleteRequest`.
  - Im Hauptspeicher wie die Freundesliste (geladen bei Login und Refresh im `SessionService`, nach jeder Änderung
    nachgezogen): die eigenen Galerien je User (`GalleryService`) und die fremden Galerien, in die er hochladen darf
    (`GalleryUploaderService`); der `CurrentUsersProvider` liefert beide (`currentUsersOwnGalleryIds`,
    `currentUsersUploaderGalleryIds`).
  - Lesefilter (`FileDocumentResolveService.createVisibilityFilterQuery`): zusätzlich „Bild liegt in einer eigenen
    Galerie oder in einer, in die ich hochladen darf“.
  - Rechte (`FileDocumentAccessService`): Besitzer der Galerie bearbeitet und löscht jedes Bild seiner Galerie; der
    Autor bestimmt über ein Bild in einer fremden Galerie nicht mehr (Sichtbarkeit, Bearbeiter).
  - `GalleryService`: Uploadberechtigte sehen die Galerie immer, `prepareOwnGalleryUpload` heißt jetzt
    `prepareGalleryUpload` (Besitzer oder Uploadberechtigter), neu `checkVisibleGalleryExists`.
  - Vervollständigung: `POST /api/users/search` (`UsersService.searchUsers`, `UsersForSearch`, `UsersSearchRequest`),
    YAML `gebiter.users.search-email-min-length: 4`, `search-max-results: 10`.
  - Rahmenfarbe: `UsersDetail.uploadFrameColor`, `PUT /api/users-detail/upload-frame-color`, steht auch in
    `UsersAvatarForClient`.
- Stand etwa 21:53 (Uhrzeit nachträglich geschätzt), **Frontend geschrieben, `npm run build` (tsc und Vite) ohne
  Fehler**:
  - Global neu in `components/`: `UsersSearchInput` (Vervollständigung von Usern), `UsersUploadFrameSwatch`
    (Farbfeld zur Rahmenfarbe), `UsersUploadFrameLegend` (Legende Farbe → User). Die Vorschlagsliste heißt jetzt
    allgemein `.suggestion-list`/`.suggestion-list-entry` (vorher `.values-input-suggestions`), `ValuesInput` und
    `UsersSearchInput` teilen sie. `Table` kann jetzt feste Zeilen (`isRowFixed`) und eine Klasse je Zeile
    (`rowClassName`).
  - `users/`: `UsersForSearch.ts`, `getUsersUploadFrameColor.ts`, `useUsers.searchUsers`,
    `useUsersDetail.changeOwnUsersDetailUploadFrameColor`, `forgetUsersAvatarForClient`.
  - `gallery/`: `GalleryUploader.ts`, `useGalleryUploader.ts`, `galleryUploaderTexts.ts`,
    `galleryUploaderColumns.tsx`, `GalleryUploaderBox.tsx`, `NewGalleryUploaderPopup.tsx`, `GallerySharedMark.tsx`;
    geändert `GallerySharePage` (zweite Box), `GalleryPage` (Knopf „neue Bilder“ auch für Uploadberechtigte, Stift
    für den Besitzer an jedem Bild, Rahmen und Legende), `GalleryImageTile` (`frameColor`), `GalleryListTab` und
    `GalleryTile` und `galleryColumns` (gemeinsame Galerien hinter den eigenen, kursiv, Marke „gemeinsam“).
  - Profil: `ProfileHeadSettingsPopup` und `ProfileHero` (Rahmenfarbe wählen und speichern).
  - CSS: `base.css` (Lage, Maße, kursiv) und `themes/default.css` (Farben, Rahmen).
- Stand 21:59, **im Firefox ohne Fenster gesehen, mit einem nachgestellten Backend im Scratchpad** (Bob als normaler
  User, Alice als Besitzerin der Galerie „Urlaub 2026“ auf „Nur ich“, Carla, dazu ein privates Profil), kein Fehler der
  Seite:
  - Bobs Liste der Galerien: 2 eigene Kacheln, dahinter die gemeinsame kursiv auf neongelbem Grund mit gestrichelter
    Kante, Marke „gemeinsam“, „von alice“; Fuß „2 Galerien, am Griff verschieben · 1 gemeinsame Galerie eines anderen
    Users“. Auf dem Handy als Tabelle, die gemeinsame Zeile kursiv, ihr Griff gesperrt (die Zeile mit Marke und
    Besitzer lag erst über dem Titel, behoben).
  - Alices Galerie als Bob: 5 Kacheln, jede in der Farbe ihres Uploaders umrandet, Legende mit 4 Usern (das private
    Profil als „Anonym“), Knopf „neue Bilder“ da, Stift nur an Bobs zwei Bildern.
  - Reiter „Freigabe“ einer eigenen Galerie: zwei Boxen; „neuer Uploadberechtigter“: „a“ findet alice und das private
    Profil über den Usernamen, „dora@“ (Adresse des privaten Profils) findet nichts, „alice@“ findet alice; wählen,
    speichern, Zeile und Rückmeldung erscheinen.
  - Profil, Zahnrad: Abschnitt „Rahmenfarbe deiner Bilder in gemeinsamen Galerien“ mit Farbfeld und Farbwähler.
  - NICHT gesehen: alles gegen das echte Backend (Hochladen als Uploadberechtigter, Lesefilter in Solr, Löschen
    durch den Besitzer, Speichern der Farbe).
- Stand 22:04, **Doku und Regeln nachgezogen, dem Nutzer berichtet**:
  - Kontextstart (`./start.sh test -Dtest=Gebiter9kApplicationTests`) NICHT gelaufen: Der Pi war weder über einen
    Tunnel noch im LAN erreichbar. Stattdessen am Code geprüft: kein Kreis in den Abhängigkeiten (nur Controller nutzen
    den `SessionService`), die neuen Abfragenamen der Repositories passen zu den Feldern. Offen bleibt der echte Start
    (zwei neue `@Value` im `UsersService`); er legt in der Pi-DB die Tabelle `gallery_uploader` und die Spalte
    `users_detail.upload_frame_color` an.
  - Doku: neu `entities/GalleryUploader.md` (von Hand, Grundgerüst aus dem Werkzeug, das in einer Kopie im Scratchpad
    lief); ergänzt `entities/Gallery.md`, `Users.md`, `UsersDetail.md`, `README.md`, `konzept-galerie.md` (Abschnitt
    10), `konzept-lesezugriff.md` (Lesefilter, Rechte), `konzept-file-kern.md`.
  - Regeln (`Vollidiot/`): neu `gallery-uploaders-shared-gallery.md`; ergänzt `platform-how-it-works.md`,
    `frontend-structure.md`, `log-current-work.md`, Index.
  - Nicht committet, nichts auf dem Pi. Der Nutzer pusht vom Laptop selbst; danach auf dem Pi pull, bauen, prüfen.
- Von mir entschieden und dem Nutzer zur Entscheidung genannt: Besitzer und Uploadberechtigte sehen die ganze Galerie;
  Austragen lässt die Bilder in der Galerie; der Besitzer ändert an fremden Uploads nicht die Sichtbarkeit je Bild;
  Rahmen und Legende nur, sobald außer dem Besitzer jemand beteiligt ist; kein Höchstwert für Uploadberechtigte.

## 2026-11-22 21:17 – Galerie: weitere User dürfen in eine fremde Galerie hochladen (Anforderungen prüfen)

- Ansage (gekürzt, wörtlich): „jeder galleriebesitzer soll user hinzufügen können die bilder in seine galerie hochladen
  dürfen. so soll es ermöglicht werden dann man eine gemeinsagme ablage für urlaubsbilder hat. das möchte ich dann auch
  mit dem bildkachel rahmen angezeigt haben wer der uploader ist, also eindeutige einfärbung für den uploader. dazu
  brauchen wir bei der freigabe auch eine separate user als uploadberechtiger interface. dazu kannst du gleich eine
  globale user vervollständigungskomponente machen. die soll die usernamen autovervollständigen oder nach 4 zeichen auch
  die useremail vervollständigen, in die liste will ich dann natürlich die jeweilige userguid einlocken.
  schreibbrechtigt ist dann IMMER der galeriebesetzer, bei allen uploads in seiner galerie auch für die uploads von
  anderen usern. und die anderen user dürfen auch ihre eigenen uploads in einer fremden galerie bearbeiten. ist die das
  als anforderungskatalog genau genug?“
- Plan: nur lesen, nichts bauen. 1. Den heutigen Stand der Galerie nachlesen (Entity `Gallery`, Upload
  `POST /api/gallery/upload`, Lesefilter, Bearbeiten-Regel `isFileDocumentChangeableByCurrentUsers`, Reiter „Freigabe“,
  Kachel) und was es zur Vervollständigung von Usern schon gibt. 2. Die Anforderungen dagegenhalten: was ist damit
  eindeutig, was ist offen. 3. Antworten, offene Punkte als nummerierte Fragen.
- Stand 21:30, nur gelesen, nichts gebaut. Gesehen:
  - Hochladen, Sortieren, Ändern der Galerie heute nur der Besitzer (`GalleryService.doGetOwnGallery`,
    `prepareOwnGalleryUpload`); eine fremde Galerie sieht man nur über Profil- und Galerie-Sichtbarkeit
    (`doGetVisibleGallery`).
  - Lesefilter (`FileDocumentResolveService.createVisibilityFilterQuery`): Autor ODER AUTHENTICATED/ANY ODER
    Bearbeiter ODER Freund des Besitzers. Einen Weg „Besitzer der Galerie“ oder „Uploadberechtigter“ gibt es nicht:
    In einer Galerie „Nur ich“ sähe der Besitzer (ohne ADMIN) fremde Uploads nicht, der Uploader nur seine eigenen.
  - Rechte an einer Datei (`FileDocumentAccessService`): bearbeiten (Autor, Bearbeiter), bestimmen (Autor), weich
    löschen (Autor, ADMIN). Der Besitzer der Galerie kommt darin nicht vor.
  - Eine Vervollständigung von Usern gibt es nicht (weder Endpunkt noch Komponente); `FileEditorsPopup` bietet nur
    die eigenen Freunde mit Haken an. Andere bekommen von einem User nie die E-Mail-Adresse (`UsersForProfile`).
  - Farben: Jeder User hat Avatar-Farben in `UsersDetail`, eindeutig sind die nicht.
- Antwort an den Nutzer: Kern ist genau genug; fünf Punkte offen, als nummerierte Fragen mit Empfehlung gestellt
  (1 wer sieht was, 2 darf der Besitzer fremde Uploads löschen, 3 woher die Farbe, 4 E-Mail in der Vervollständigung,
  5 wo findet der Uploader die Galerie). Gebaut wird nach seinen Antworten.

## 2026-11-21 21:02 – Frage: Jupyter-Notebooks in der App darstellen, sinnvoll?

- Ansage: „wenn ich jupyter notebooks darstellen möchte, könnten wir das in unsere app integrieren? oder wäre das nicht
  so sinnvoll“
- Nur gelesen, nichts gebaut. Gesehen: Der Viewer (`frontend/src/file/document/`) hat schon je Typ einen eigenen
  Baustein (`fileDocumentViewerKind.ts`: Bild, Video, Word mit docx-preview, Tabelle mit SheetJS, Text), die Bytes
  kommen über `/api/file-document/download/<id>`; fremdes HTML wird nirgends ausgeführt (`inline-mime-types`,
  `renderAltChunks: false`, `removeUnsafeLinks`).
- Antwort: Anzeigen passt als weiterer Viewer (`NOTEBOOK`), ohne neuen Endpunkt; Ausführen (Kernel) nicht auf dem Pi.
  Offen und nicht geprüft: welchen Typ Tika für `.ipynb` meldet, welche Markdown-Bibliothek, Volltext für die Suche
  (roh wäre es JSON samt Base64-Bildern). Die Vorlage `code/vorlage/gitfiles` liegt auf dem Laptop nicht, dort konnte
  ich nicht nachsehen.
- Zwei Rückfragen an den Nutzer gestellt (nur ansehen oder auch ausführen; über welchen Upload-Weg).
- Entschieden (Nutzer): „ok dann machen wir das nicht. machen wir dann eigenes github repo wenn wir dazu kommen“. Kein
  Notebook-Viewer in der App; die Notebooks bekommen später ein eigenes GitHub-Repo. Nichts gebaut, nichts offen.

## 2026-11-21 20:55 – Frage: Trägt jedes später hochgeladene Bild die Freigabe seiner Galerie?

- Ansage: „wenn eine galerie freigegeben ist, stellst du sicher, dass so lange dir freigabe existiert und aktiv ist,
  jedes weitere bild das in dieser galerie dann hochgeladen wird auch freigegeben ist“
- Plan: nur lesen. 1. Im Code den Upload in eine Galerie nachlesen (`FileUploadService.uploadFileIntoGallery`,
  `GalleryShareService.prepareGalleryShareUpload`) und jeden anderen Weg, auf dem ein Bild in eine Galerie kommt oder
  sein Dokument neu geschrieben wird. 2. Auf dem Pi an den echten Freigaben nachzählen (Postgres und Solr, nur lesend):
  aktive Bilder der Galerie gegen Bilder mit dem Hash der Freigabe, besonders die nach dem Anlegen hochgeladenen.
- Ansage mittendrin (gegen 20:58): „warum schreibst du ein prüfscript […]? schau dir den […] code an und verifiziere das“.
  Das Skript war da einmal gelaufen (nur lesend, vom Pi wieder gelöscht); danach nur noch Code gelesen.
- Stand 21:00, Antwort: ja, am Code belegt, nichts geändert.
  - Einziger Weg in eine Galerie: `POST /api/gallery/upload` → `FileUploadService.uploadFileIntoGallery`. Er holt vor
    den Bytes `GalleryShareService.prepareGalleryShareUpload` (Hashes ALLER Freigaben der Galerie, ohne Filter auf
    Ablauf oder verbrauchte Aufrufe) und schreibt sie in demselben Solr-Schreiben ins neue Dokument, das es anlegt
    (`doCheckInFile` → `createFileDocumentFromUpload`), Status sofort ACTIVE. `galleryIds` setzt sonst niemand.
  - Alle späteren Schreibzugriffe (Auswertung, Sortieren, Sichtbarkeit, Bearbeiten) sind Atomic Updates einzelner
    Felder; das Feld `galleryShareTokenHashes` ist im Kern gespeichert (stored, docValues), es bleibt also stehen.
  - Ob die Freigabe gilt, entscheidet bei jedem Aufruf Postgres (`getValidGalleryShare`); eine abgelaufene und später
    verlängerte Freigabe zeigt deshalb auch die Bilder, die dazwischen hochgeladen wurden.
  - Nicht belegt: Es gibt keinen automatischen Test für diesen Weg, und auf dem Pi ist seit dem Anlegen der Freigabe 15
    (2026-11-20 21:05 MEZ) kein Bild hochgeladen worden (Galerie 5 „test 1“: 10 aktive Bilder, 10 mit dem Hash, Zähler
    10; neuestes Bild von 16:51 MEZ).

## 2026-11-21 16:54 – Meldung: trotz Login erscheint wieder das Login-Modul

- Ansage: „hast du jetzt den login verkackt? also dass es nun trotz login, das login modul anzeigt?“
- Lage: Auf dem Pi habe ich seit gestern nichts gebaut und nichts gestartet. Was ich heute am Pi getan habe: zweimal
  `psql` nur lesend, und um 16:47 von hier über den Tunnel ein Kontextstart des Backends gegen die Pi-DB (zwei Tests).
- Plan: 1. Im Code nachsehen, was ein Start des Backends an den Sitzungen in der Datenbank ändert. 2. Log des Backends
  auf dem Pi und die Sitzungen in der Pi-DB ansehen. 3. Die Anmeldung von außen nachstellen, soweit es ohne 2FA geht.
- Stand 16:57, Ursache im Log des Pi gefunden, NICHT der Code von heute (der war da noch gar nicht auf dem Pi):
  - Mein Test-Start von 16:47 hat an der Pi-DB nichts geändert (Log: alle Grunddaten „vorhanden“, FORCE_ADMIN aus,
    Solr-Abgleich 0 neu). Auf dem Pi lief bis 16:58 der Stand von gestern, Container 19 Stunden ohne Neustart.
  - nginx-Log (Uhrzeiten hier in MEZ), alles vom iPhone, Konto `7777…`: 16:51:56 `POST /api/share/session/refresh` →
    **499** (das Handy hat die Anfrage abgebrochen, das Backend hatte den Refresh-Token da schon getauscht; die Antwort
    mit dem neuen Token kam nie an). 16:51:59 schickt das Handy deshalb den alten, schon verbrauchten Token noch
    einmal → Backend-Log WARN „Refresh-Token von User 7777… wiederverwendet (ein schon verbrauchter Token tauchte
    wieder auf): alle Sitzungen beendet“ (`UsersRefreshTokenService.consumeUsersRefreshToken`, Regel „Diebstahl“).
    Danach jede Erneuerung 401.
  - 16:52:35 bis 16:53:01 vier Mal `POST /api/share/users-login-2fa` (Schritt 1, E-Mail und Passwort) → 401 mit
    129 Byte, das ist genau die Meldung „E-Mail-Adresse oder Passwort ist falsch.“ (die Meldung „abgelaufen“ hätte
    153). Schritt 1 antwortet so nur bei unbekannter E-Mail-Adresse oder falschem Passwort. Kein Aufruf von Schritt 2.
  - 16:53:22 bis 16:53:30 drei Mal Startseite: `GET /api/session` 200 (das JWT der beendeten Sitzung gilt noch ein
    paar Minuten), direkt danach die Erneuerung 401 → die Oberfläche zeigt das Login-Modul.
  - Pi-DB um 17:00: Für das Konto `7777…` steht keine Zeile in `users_refresh_token` (keine Sitzung); seit dem
    Neustart 16:58 kam kein Login-Versuch mehr an.
  - Dem Nutzer als EIN Problem mit Vorschlag vorgelegt (Schonfrist für einen gerade verbrauchten Token); gebaut wird
    nichts vor seinem Ja.

## 2026-11-21 17:02 – Frage: warum ist der Refresh-Token weg, und welche E-Mail-Adresse hat das Admin-Konto?

- Ansage: „und warum ist mein refresh token ausgelaufen, schau mal bitte in die datenbank mein admin konto sollte doch
  [seine Gmail-Adresse] als email gehabt haben“ (Adresse hier ausgelassen, das Protokoll liegt im öffentlichen Repo).
- Plan: nur lesen. 1. In der Pi-DB die Konten ansehen (`users`: GUID, Name, E-Mail, Status, Position), dazu
  `users_credential`, `users_totp`, `users_refresh_token`. 2. Im Code und in der YAML nachsehen, was das Admin-Konto
  `7777…` ist und wer es anfasst (`gebiter.admin-users`, FORCE_ADMIN auf dem Pi). 3. Antworten, was belegt ist.
- Stand 17:04, nur gelesen, nichts geändert:
  - Der Refresh-Token ist NICHT abgelaufen (er gilt 14 Tage ab jeder Erneuerung): Alle Sitzungen des Kontos `7777…`
    hat um 16:51:59 die Regel „wiederverwendeter Token“ gelöscht (Eintrag oben). In `users_refresh_token` steht für
    das Konto keine Zeile mehr; seit dem Neustart 16:58 kam kein Login-Versuch beim Pi an.
  - Pi-DB, Tabelle `users`: 2 Konten, keins gelöscht. Das Admin-Konto `7777…` hat Username `alice` und als
    E-Mail-Adresse `alice` (Position ALLMAECHTIGER, Recht ADMIN, Passwort gesetzt, App bestätigt am 2026-11-08). Ein
    Konto mit seiner Gmail-Adresse gibt es nicht. Der Name vor dem `@` steht nur einmal in der Datenbank: als
    Kontaktangabe INSTAGRAM des Admin-Kontos (`users_contact`, ohne `@gmail.com`).
  - Woher `alice`: Der Start-Runner legt das Konto mit `gebiter.admin-users.email: alice` an (so seit dem ersten
    Commit vom 2026-11-11) und fasst die Adresse danach nie wieder an; FORCE_ADMIN steht auf dem Pi nicht in der
    `.env`. Eine Spur, dass die Adresse je anders war, gibt es nicht (keine Historie in der DB, nichts in Doku, Git
    oder den `.env`-Dateien).
  - Folge: Wer sich mit der Gmail-Adresse anmeldet, bekommt „E-Mail-Adresse oder Passwort ist falsch“. Das passt zu
    den vier abgelehnten Versuchen von 16:52 (welche Adresse getippt wurde, steht in keinem Log).
  - Dem Nutzer als EINE Frage vorgelegt: Soll die E-Mail-Adresse des Admin-Kontos auf seine Gmail-Adresse?
  - Antwort 17:08: „ah ok ne das ist dann ok hatte ich so nicht auf dem schirm“. **Entschieden: Die E-Mail des
    Admin-Kontos bleibt `alice`,** an der Datenbank wird nichts geändert. Nicht wieder fragen.
  - Zum Vorschlag „Schonfrist für einen gerade verbrauchten Refresh-Token“ kam keine Antwort: bleibt offen, gebaut
    wird daran nichts ohne sein Ja.
  - Seine Adresse steht absichtlich nicht in diesem Protokoll (öffentliches Repo).

## 2026-11-21 16:56 – Push `5e334d3` auf den Pi bringen (pull, bauen, prüfen)

- Ansage: „code ist Auf git, du kannst auf dem pi also pullen und bauen!“
- Geprüft: lokal = `origin/main` = `5e334d3` („pray beacoup5“, 28 Dateien: alles von heute), Arbeitsverzeichnis sauber;
  16 Werte aus `code/.env` und das Kennwort des Pi gegen den Commit geprüft, kein Treffer.
- **Stand 17:00, fertig und auf dem Pi** (Einzelheiten in `setup.md` 5.16): Pi vorher Last 0,0, 12 GiB RAM frei,
  45,8 °C; Images als `:vorher` gesichert; Pull von `d8c4e69` auf `5e334d3`, Klon sauber; Bau `backend` 23 s,
  `frontend` 7 s; Start 17,3 s, kein ERROR, kein WARN; alle 5 Container laufen. `GET`/`PUT`/`DELETE
  /api/admin/gallery-share` ohne Anmeldung 401. Von außen: neues Bundle `index-D17nU8za.js` mit den neuen Texten.
  **Der echte Freigabelink zeigt im Firefox die Galerie mit 10 Kacheln, kein Fehler** (vorher leere Seite).
  Hilfsdateien auf dem Pi gelöscht.
- NICHT gesehen auf dem Pi: Admin-Reiter (Ändern, Löschen, QR-Code), braucht die Anmeldung. Der Nutzer testet.
- Lokal nicht committet: dieses Protokoll, `setup.md` (privat), `Vollidiot/` (Regeln).

## 2026-11-21 16:28 – Weiße Seite beim Freigabelink; Admin-Reiter „Freigaben“: bearbeiten, löschen, QR-Code

- Ansage (gekürzt, wörtlich): „ich will im admin freigabemodul auch die freigabe bearbeiten können […] also löschen
  oder eben bearbeiten, limits ändern oder sonstiges! zusätzlich will ich dann einen qr code als popup bekommen können,
  dass freunde sich den freigabelink speichern können […] gerade habe ich aber auch dea problem, dass ich, wenn ich auf
  den einzigen freigabelink in der datenbank klicke, es zunächst was läd und dann aber nur eine weisse sweite kommt,
  bitte prüfe das und sieh es dir genau an“.
- Plan: 1. Zuerst der Fehler (weiße Seite): Besucherseite `/share/galerie/<token>` mit dem einen echten Link im
  Firefox (headless, Marionette) öffnen, Konsole und Antworten der API ansehen, Ursache im Code suchen, beheben.
  2. Admin-Reiter „Freigaben“: Bearbeiten in der Zeile (Mini-Popup wie jede Tabelle) und Löschen; dazu die
  Admin-Endpunkte. 3. QR-Code des Links als Popup (global, auch in der Box der eigenen Galerie). 4. Doku
  (`entities/GalleryShare.md`, Konzept) nachziehen.
- Stand 16:33, Schritt 1 (weiße Seite) **Ursache belegt und behoben, noch nicht auf dem Pi**:
  - Nachgestellt mit der einen echten Freigabe (id 15, „Für alle“, Galerie 5 „test 1“, 10 Bilder) im Firefox ohne
    Fenster gegen die Seite zu Hause: 4 s Ladeanzeige, ab Sekunde 5 ist `#root` leer. Fehler des Browsers: React 310
    („Rendered more hooks than during the previous render“) aus `index-Be0ndiTE.js`.
  - Ursache: `gallery/GalleryShareVisitorPage.tsx`, der `useCallback` für `loadSharedFileCommentThread` (gestern mit
    den Kommentaren eingebaut) stand HINTER dem vorzeitigen `return` der Ladeanzeige. Erster Durchlauf ohne ihn, der
    zweite (Galerie da) mit ihm: React bricht die ganze Seite ab. Die API war in Ordnung (200).
  - Behoben: Der Hook steht jetzt vor dem `return`. Alle `.ts`/`.tsx` nach demselben Muster durchsucht: sonst kein
    Treffer. `npm run build` ohne Fehler; den gebauten Stand lokal ausgeliefert (API von zu Hause) und angesehen:
    Titel „test 1“, 10 Kacheln, am Desktop (1300 px) und am Handy (400 px).
- Stand 16:36, Schritt 2 Backend gebaut (`./mvnw -q -DskipTests clean compile` rc=0, noch nicht gegen die Pi-DB):
  - `GalleryShareRepository.changeLabelAndLimits` (gezielte Anweisung, fasst die Zähler nicht an),
    `GalleryShareService.changeGalleryShare` und `deleteGalleryShare` (beide `@PreAuthorize ADMIN`; privater Kern
    `doGetGalleryShare`; `requireValidLimits` mit `expiresAtNewlySet`: ein unveränderter, vergangener Ablauf darf
    bleiben), neu `dto/GalleryShareChangeRequest`, `GalleryShareAdminController`: `PUT` und `DELETE
    /api/admin/gallery-share`.
- Nachricht 16:38 dazwischen: „Bau den QR-Code auch gefälligst so, dass ich ihn für alle anderen Links auch benutzen
  kann. Du tendierst ja zu Einzelscheiße.“ So gebaut: nichts am QR-Code hängt an der Galerie.
- Stand 16:41, Schritt 3 Frontend gebaut (`npm run build` ohne Fehler):
  - Global neu: `components/QrCode` (zeichnet jeden Wert; der QR-Code der Authenticator-App nutzt ihn jetzt,
    `auth/totp/TotpQrCode.tsx` gelöscht, Klassen `.qr-code`/`.qr-code-area` in `base.css`), `components/QrCodeButton`
    (Knopf samt Popup, Klasse `control-button-qr` im Theme), `components/EditTextPopup`. `CopyableLink` hat die Angabe
    `qrCode`: Damit steht der QR-Knopf neben „kopieren“, an jedem Link nutzbar.
  - Galerie-Paket neu: `galleryShareDurationInput.ts`, `GalleryShareDurationFields.tsx` (Eingaben der Laufzeit, beim
    Anlegen und Ändern dieselben), `EditGalleryShareDurationPopup.tsx`. Geändert: `galleryShareColumns.tsx` (Angabe
    `editing`: Bezeichnung und „Gilt“ anklickbar; QR-Code am Link in beiden Listen), `NewGallerySharePopup.tsx`
    (Schritt 2 über den gemeinsamen Baustein, am Ende der Link mit QR-Code), `useGalleryShare.ts`
    (`changeGalleryShare`, `deleteGalleryShare`), `GalleryShare.ts` (`GalleryShareChange`), `galleryShareTexts.ts`,
    `admin/galleryshare/GalleryShareTab.tsx` (Popups für Bezeichnung und Laufzeit, Mülleimer mit Sicherheitsabfrage).
- Geprüft (16:42 bis 16:48; Uhrzeiten dieses Eintrags nach den Zeitstempeln der Dateien):
  - Oberfläche im Firefox ohne Fenster mit einem nachgestellten Backend (Skript im Scratchpad: liefert `dist` aus,
    beantwortet `/api` aus dem Speicher, drei Beispiel-Freigaben; keine echten Daten): Admin-Reiter lädt; QR-Popup
    („QR-Code von „für Oma““, Hinweis, Adresse); Bezeichnung „für Oma“ → „für Oma und Opa“; Laufzeit „dauerhaft“ →
    ohne Zahl die Meldung „Bitte gib eine ganze Zahl ab 1 ein“, mit 500 → „für 500 Aufrufe“; ein Zeitpunkt ist
    vorbelegt und geht unverändert genau so zurück (`2026-12-31T22:59:00Z`); Löschen nach der Sicherheitsabfrage, die
    Zeile ist weg; am Handy (400 px) dasselbe Popup. Reiter „Freigabe“ der eigenen Galerie: drei QR-Knöpfe, nichts
    anklickbar zum Ändern; „neue Freigabe“ bis zum Link durchgeklickt (Fehlermeldungen ohne Zeitpunkt und in der
    Vergangenheit, dann 30.06.2027 18:00), QR-Code im letzten Schritt. Kein Fehler in der Seite.
  - QR-Bild gegengelesen: Die 41 × 41 Module des Bilds aus dem Popup sind genau der QR-Code des Links der Zeile
    (0 Abweichungen; Gegenprobe mit einem anderen Link: 244).
  - Backend über den Tunnel (direkt, Port 6969): `Gebiter9kApplicationTests` grün (Start 24,6 s, kein ERROR, kein
    WARN) und ein Wegwerf-Test `GalleryShareChangeThrowawayTest` (gelöscht) an der echten Freigabe 15 in einer
    Transaktion, die zurückrollt: ohne ADMIN abgelehnt (Ändern und Löschen); auf 500 Aufrufe, auf einen Zeitpunkt,
    wieder dauerhaft; derselbe Zeitpunkt noch einmal geht, ein neuer in der Vergangenheit nicht, beide Grenzen nicht,
    leere Bezeichnung nicht, 0 Aufrufe nicht; unbekannte id → „gibt es nicht“; Token und beide Zähler unverändert.
    Danach in der Pi-DB gegengelesen: `15 | Galerie 5 | Für alle | dauerhaft | 2 Aufrufe | 10 Bilder`, wie vorher.
    Tunnel geschlossen.
  - NICHT geprüft: das Löschen durch den Admin gegen den echten Solr (derselbe Kern wie das Löschen des Besitzers, am
    2026-11-20 getestet; die eine echte Freigabe lösche ich nicht zur Probe). Der QR-Code der Authenticator-App
    (derselbe Baustein, im Profil nur mit Anmeldung zu sehen).
- Doku nachgezogen: `entities/GalleryShare.md` (DTO, zwei Endpunkte, Methoden, neue Dateien), `entities/Gallery.md`
  (zwei Endpunkte), `konzept-galerie-freigabe.md` (Entscheidungen 18 und 19, 4.5, 4.7, Abschnitt 9). Regeln:
  `Vollidiot/gallery-share-key-link.md`, `frontend-structure.md`, `rechner-debian-laptop.md`, `MEMORY.md`.
- **Stand 16:51: fertig, lokal, NICHT committet, NICHT auf dem Pi.** Die weiße Seite beim Freigabelink besteht auf dem
  Pi, bis der Stand dort ist. Als Nächstes: Commit und Push durch den Nutzer, dann `git pull` und Bau auf dem Pi
  (erst `backend`, dann `frontend`; keine Änderung an der Datenbank nötig), danach den echten Link ansehen.
- Aufgefallen, dem Nutzer als EINE Frage vorgelegt: In der Spalte „Link“ bricht die Adresse mit ihren 64 Zeichen Token
  über etwa 15 Zeilen um (jede Zeile der Tabelle rund 330 px hoch, am Handy rutschen die Knöpfe aus dem Bild).

## 2026-11-20 21:50 – Push des Nutzers auf den Pi bringen (pull, bauen, prüfen)

- Ansage: „ja ist gepusht mach weiter“.
- Geprüft: lokal = `origin/main` = `d8c4e69` („pray beacoup3“, 109 Dateien: alles von heute Abend), Arbeitsverzeichnis
  sauber.
- Plan (Regel: Code nur über Git, niemand kommt an den Pi): 1. Geänderte Dateien auf Zugangsdaten prüfen. 2. Weil eine
  neue Entity (`FileComment`) und ein neuer YAML-Wert dabei sind: vor dem Bau den Kontextstart testen
  (`Gebiter9kApplicationTests` über den Tunnel; legt dabei die Tabelle `file_comment` in der Pi-DB an). 3. Auf dem Pi:
  Zustand ansehen, laufende Images als `:vorher` sichern, `git pull --ff-only`, erst `backend`, dann `frontend` bauen,
  erst danach starten. 4. Prüfen: Log, neue Endpunkte, Bundle, Tabelle.
- Zugangsdaten: 21 Werte aus `code/.env` gegen den Commit geprüft, kein Kennwort und kein Schlüssel darin (ein Treffer
  ist nur `POSTGRES_USER`, der wie das Projekt heißt).
- Kontextstart-Test über den Tunnel (direkt über Port 6969 geöffnet): grün, 26,5 s, kein ERROR, kein WARN.
- Stand 21:56, **fertig und auf dem Pi** (Einzelheiten in `setup.md` 5.16):
  - Pi vorher: Last 0,0, 12 GiB RAM frei, 44 °C. Pull von `179c751` auf `d8c4e69`, Klon sauber.
  - Bau `backend` 23 s, `frontend` 7 s; Backend gestartet in 17,0 s, kein ERROR, kein WARN. Alle 5 Container laufen.
  - Tabelle `file_comment` steht in der Pi-DB (5 Spalten, 0 Zeilen).
  - Besucherweg mit der einen echten Freigabe geprüft (zählt nicht als Aufruf): Standardansicht 200 mit 10 Bildern und
    dem Feld `commentCountsByFileDocumentId`, Kommentare des ersten Bildes 200 (leer), unbekannter Token 404.
  - Von außen: Startseite 200, im Bundle `index-Be0ndiTE.js` und im CSS stehen die neuen Texte, Pfade und Klassen.
  - Die Tags `:vorher` zeigen jetzt auf die Images von 18:02. Hilfsdateien auf dem Pi gelöscht, Tunnel geschlossen.
- NICHT gesehen: alles mit Anmeldung (2FA). Der Nutzer testet: Header und Galerien-Liste auf dem Handy, Sprechblase
  und Kommentieren (großes Bild, Seite einer Datei), Besucherseite, Admin-Reiter „Freigaben“, Gästebuch, Füße der Tabs.
- Lokal nicht committet: dieses Protokoll, `setup.md` (privat), `entities/FileComment.md` (Abschnitt „Getestet“).

## 2026-11-20 21:24 – Bauen: Header mobil, Galerien mobil als Tabelle, Kommentare an Bildern, Fuß-Baustein

- Ansage: „ja baue alle punkte so“ (Antwort auf die vier Fragen von 21:20).
- Uhrzeiten in diesem und im vorigen Eintrag nach der Systemuhr berichtigt (ich hatte sie zuerst geschätzt).
- Zu Frage 2 (Tabelle nur mobil oder überall) sagt das „so“ nichts Eigenes; es gilt seine Ansage von 21:08 („ich rede
  jetzt nur von der mobilen Ansicht“): mobil Tabelle, am Desktop bleiben die Kacheln. Nicht noch einmal fragen.
- Plan: 1. Header mobil (`OnlineUsersCount` nur Punkt und Zahl, Position als Medaille über `AccessRoleCollectionBadge`
  mit neuem Schalter). 2. Globaler Baustein für den Fuß „Fehler / lädt / Anzahl“, alle Tabs umstellen. 3. Galerien
  mobil über die zentrale `Table`; Backend: letztes Bild und Freigaben je Galerie. 4. Kommentare an Bildern: Entity
  `FileComment`, Endpunkte, Kommentar-Bausteine des Gästebuchs nach `components/`, Sprechblase neben den Smileys,
  Bereich am großen Bild und auf der Seite der Datei, Besucherseite lesend. 5. Je Schritt bauen, Doku nachziehen.
- Stand 21:27, Schritt 1 Header gebaut (`npm run build` ohne Fehler, nicht in der Oberfläche gesehen):
  `layout/OnlineUsersCount.tsx` (mobil nur Punkt und Zahl), `auth/access/AccessRoleCollectionBadge.tsx` (neuer Schalter
  `compact`: Medaillon, ohne Symbol zwei Buchstaben), `layout/OwnAccessRoleCollection.tsx` (mobil das Medaillon, im
  Popup weiter die Pille), `styles/base.css` (Maß des Medaillons im Header, engerer Abstand unter 768 px).
- Stand 21:31, Schritt 2 Fuß-Baustein gebaut (`npm run build` ohne Fehler): neu `components/LoadStatus.tsx` und
  `api/getFirstErrorDetail.ts`. Umgestellt 16 Stellen: Achievement-, ShopCategory-, PointActivity-, AccessRole-, Users-,
  FileClass-, Rank-, SolrCoreFields-, AccessRoleCollection-, GalleryShare-, FileExtension- (zwei Füße) und
  FileDocumentListTab (Fuß mit Blättern), dazu die Meldung über den vier Matrizen. Vom alten Muster ist nichts übrig.
- Stand 21:37, Schritt 3 Galerien mobil gebaut (Backend `clean compile` rc=0, `npm run build` ohne Fehler, nicht in
  der Oberfläche gesehen, nicht gegen Solr getestet):
  - Backend: `FileDocumentResolveService.resolveLastUploadedAtOfGallery`; `GalleryForClient.lastUploadedAt`;
    `GalleryService.resolveOwnGalleryIds`; `GalleryShareRepository.findByGalleryIdInOrderByIdAsc`;
    `GalleryShareService.getAllOwnGalleryShare`; `GalleryShareController`: `GET /api/gallery-share`.
  - Frontend neu: `components/InfoHint.tsx` (das „i“ mit Hoverlay, global; die Startseite nutzt es jetzt auch, die
    Klasse `.tile-corner-hint` heißt `.info-hint`), `gallery/galleryColumns.tsx`. Geändert: `gallery/GalleryListTab.tsx`
    (mobil die zentrale `Table`, am Desktop weiter `GalleryTile`; Fuß mit Anzahl über `LoadStatus`), `Gallery.ts`,
    `useGalleryShare.ts` (`getAllOwnGalleryShare`), `galleryTexts.ts`, `base.css` (`.gallery-table-title*`).
- Stand 21:47, Schritt 4 Kommentare an Bildern gebaut (Backend `clean compile` rc=0, `npm run build` ohne Fehler):
  - Backend neu: `file/model/FileComment` (Tabelle `file_comment`, legt Hibernate beim nächsten Start auf dem Pi an),
    `file/repository/FileCommentRepository`, `file/service/FileCommentService`, `file/controller/FileCommentController`
    (`POST`, `GET /{id}`, `GET /count/{id}`, `DELETE` unter `/api/file-comment`), DTOs `FileCommentCount`,
    `FileCommentDeleteRequest`, `FileCommentForClient`, `FileCommentThread`, `NewFileComment`; YAML
    `gebiter.file.comment-text-max-length: 2000`, `FileConfig.commentTextMaxLength`.
  - Backend geändert: `GalleryShareVisitorService` (`resolveSharedGallery` mit der Zahl der Kommentare je Bild, neu
    `getSharedFileCommentThread`), `SharedGalleryForClient.commentCountsByFileDocumentId`,
    `GalleryShareShareController`: `GET /api/share/token/{shareToken}/comment/{fileDocumentId}`.
  - Frontend, Bausteine aus dem Gästebuch nach `components/` gezogen: `AuthorHead` (vorher `GuestbookHead`),
    `CommentItem` (neu, `GuestbookCommentItem` nutzt ihn), `RichTextForm` (vorher `GuestbookTextForm`),
    `ConfirmDeleteButton` (vorher `GuestbookDeleteButton`); CSS-Klassen umbenannt (`author-head*`, `comment-thread`,
    `comment-item*`, `rich-text-form`). Das Gästebuch nutzt jetzt diese Bausteine; sein Aussehen sollte gleich sein,
    gesehen habe ich es nicht.
  - Frontend neu: `file/FileComment.ts`, `file/useFileComment.ts`, `file/comment/FileCommentBubble.tsx`,
    `FileCommentSection.tsx`, `fileCommentTexts.ts`. Eingehängt in `gallery/GalleryImageTile.tsx` (Sprechblase neben
    den Smileys), `GalleryImageViewerPopup.tsx` (Verlauf neben dem Bild), `GalleryPage.tsx`,
    `GalleryShareVisitorPage.tsx` (nur lesen, „Zum Kommentieren anmelden“), `file/document/FileDocumentDetailPage.tsx`.
  - Geprüft mit einem Wegwerf-Test `RepositoryQueriesThrowawayTest` (gelöscht): Die JPA-Schicht baut sich ohne
    Datenbankverbindung auf, also stimmen die Entities und alle Abfragen der Repositories (auch die neuen).
  - Von mir entschieden: Besucher bekommen die Zahl je Bild mit der Seite (eine Abfrage) statt je Kachel; löschen dürfen
    Autor des Kommentars und Autor der Datei, ein Admin-Endpunkt fehlt noch; keine Punkte fürs Kommentieren.
- Doku nachgezogen: neu `entities/FileComment.md`; `entities/README.md`, `Gallery.md`, `GalleryShare.md`,
  `Guestbook.md`, `GuestbookComment.md`, `Users.md`, `konzept-galerie-freigabe.md` (Abschnitt 7 gebaut, Adresse
  `…/comment/{fileId}`), `konzept-galerie.md` (neuer Abschnitt 9), `konzept-gaestebuch.md`, `konzept-navigation.md`.
- NICHT getestet: nichts davon gegen die Pi-DB und den Solr, nichts in der Oberfläche (der Tunnel ist zu, die Anmeldung
  braucht 2FA). Der Nutzer sieht an: Header auf dem Handy; Galerien-Liste auf dem Handy; Sprechblase an einer Bildkachel,
  Kommentieren am großen Bild und auf der Seite einer Datei; die Besucherseite einer Freigabe; das Gästebuch (soll
  aussehen wie vorher); die Füße der Admin-Tabs.
- Lokal nicht committet (im Index stehen nur die drei Umbenennungen der Gästebuch-Bausteine). Als Nächstes: sein Push,
  dann `git pull` und Bau auf dem Pi.

## 2026-11-20 21:08 – Sitzung merken, mobile Ansicht (Header, Galerien), eigenen Code prüfen, Kommentare an Bildern

- Ansage (gekürzt, wörtlich): 1. „warum kann ich verdammt nochmal nicht den VS Code hier den aktuellen Zustand […]
  abspeichern in unserem Projekt? Ich habe da extra einen Workspace angelegt. […] Jedes Mal, wenn ich einen Laptop neu
  starte, kann ich mit einem neuen Chatverlauf mit dir beginnen. Und du […] weiß nichts mehr.“ 2. Mobile Ansicht:
  „Online 1“ und die Gruppe (eigene ARC) im Header kompakter, „weil der Platz nicht ausreicht“; „Bevor du da aber
  irgendwas lospusht, bitte davor einen Ansatz vorschlagen und eine Skizze im Chat.“ 3. Mobil die Galerien nicht als
  Kachel wie ein Bild, sondern „mehr in einem Tabellendesign“: Überschrift, Beschreibung als Hoverlay, wie viele
  Bilder, wann das letzte, wann erstellt, wer Zugriff hat bzw. welche Freigaben laufen; „kannst du auch einen neuen
  Vorschlag machen“. 4. „Du machst hier […] schon wieder lauter Gallery-Komponenten […] Du sollst solid arbeiten. […]
  Tabellen sind allgemeingültige Komponenten. Entweder […] recyceln […] oder wir bauen eine neue […] globale
  Komponenten“; „die ganze Gülle, die du gerade hier zusammengepfuscht hast, nochmal überprüfen“. 5. „Die Kommentare
  möchte ich auch noch drin haben […] Da sollst du einen vernünftigen Vorschlag machen. Also ich hätte irgendwie so
  eine Sprechblase neben die Smileys“.
- Zur Frage von 21:05 (Lücke beim Upload während des Anlegens einer Freigabe) kam keine Antwort: bleibt liegen, nicht
  noch einmal fragen.
- Plan: 1. Nachsehen, warum eine neue Sitzung hier ohne Regeln beginnt (Einstellungen von Claude Code im Workspace,
  Speicherort `Vollidiot`), Ursache nennen, beheben oder ihm die Zeilen zum Einfügen geben. 2. Den Code von heute Abend
  (Admin-Reiter „Freigaben“) gegen die Regeln prüfen: Was davon ist allgemeingültig und gehört nach `components/`?
  Umbauen, bauen. 3. Für Header mobil, Galerieliste mobil und Kommentare an Bildern nur lesen und je einen Ansatz mit
  Skizze im Chat vorlegen; gebaut wird davon nichts vor seinem Ja.
- Nachricht 21:10 dazu: Die Lücke beim Upload ist ihm „komplett egal“, kein Code dafür („Sorg du lieber mal, dass die
  ganze Codestruktur vernünftig aussieht“). Eingetragen als entschieden: `Vollidiot/decided-leave-as-is.md`,
  `gallery-share-key-link.md`, Konzept 4.4 und 8.
- Stand 21:12, Punkt 1 (Sitzung): Ursache gefunden. Auf dem Laptop gab es keine Einstellung von Claude Code, die auf
  `Vollidiot` zeigt (kein `.claude/` im geöffneten Ordner `fullstackprojekt`, auch keins im Projekt); jede neue Sitzung
  nahm den leeren Standard-Ordner und kannte keine Regel. Behoben: `fullstackprojekt/.claude/settings.local.json` mit
  `autoMemoryDirectory` = `…/gebieter9k/Vollidiot` (liegt außerhalb des Git-Repos). Wirkt ab der nächsten Sitzung,
  hier nicht prüfbar. Die Chatverläufe selbst liegen auf dem Laptop (5 Sitzungen zu diesem Ordner) und lassen sich in
  der Erweiterung über den Verlauf wieder öffnen; in den Projektordner lassen sie sich nicht legen.
- Stand 21:17, Punkt 2 (eigener Code): geprüft und umgebaut (`npm run build` ohne Fehler, Backend unverändert rc=0).
  - Fund: Ich hatte drei kleine Galerie-Zellkomponenten angelegt (`GalleryShareLinkCell`, im Reiter
    `GalleryShareOwnerCell` und `GalleryShareGalleryCell`). Alle drei weg.
  - Neu und global: `components/CopyableLink.tsx` (Adresse zum Anklicken mit `CopyButton`). Nutzen jetzt: die Spalte
    „Link“ beider Listen (`galleryShareColumns.tsx`) und der letzte Schritt von `NewGallerySharePopup` (vorher ein
    Eingabefeld mit Kopierknopf, jetzt derselbe Baustein).
  - `admin/galleryshare/GalleryShareTab.tsx` besteht nur noch aus globalen Bausteinen (`ContentBox`, `Table`,
    `UsersGuidName`, `StatusMark`, `Link` mit Origin wie in `FileDocumentListTab`).
  - `galleryShareColumns.tsx`: keine Aufrufe mehr als Argumente (je Zelle erst die Freigabe in eine Variable).
  - Offen gelassen und ihm als eine Frage vorgelegt: Der Fuß „Fehler / Ladeanzeige / Anzahl“ steht in 16 Tabs von Hand.
- Stand 21:20, Punkt 3: gelesen `layout/AppHeader`, `OnlineUsersCount`, `OwnAccessRoleCollection`, `LookBadge`
  (Form `medal`), `gallery/GalleryListTab`, `GalleryTile`, `components/Table` (blendet unwichtige Spalten mobil aus,
  Tipp auf die Zeile zeigt alle), `guestbook/*`, `file/cheer/FileCheerBar`, `GalleryImageTile`. Drei Vorschläge mit
  Skizze im Chat vorgelegt, nichts davon gebaut. Wartet auf seine Antworten.
- Lokal nicht committet: alles von heute Abend.

## 2026-11-20 20:54 – Freigabe: neue Bilder einer freigegebenen Galerie; Admin-Modul „alle Freigaben“

- Ansage (gekürzt, wörtlich): „wenn ich eine Galerie schon freigegeben habe und dann noch Bilder hochlade, müssen wir
  sicherstellen, dass auch weitere Bilder, die in einer Galerie hochgeladen werden, dann auch freigegeben werden,
  solange diese Freigabe existiert. […] Und ich will auch nochmal eine allgemeine Freigabenübersicht haben. Wo wir dann
  ein Interface brauchen, um alle Freigaben anzuzeigen für einen Admin. Also rede ich jetzt von einem Admin-Modul.“
- Plan, in seiner Reihenfolge: 1. Prüfen, was der Code heute tut, wenn ein Bild in eine freigegebene Galerie kommt
  (`FileUploadService.uploadFileIntoGallery`, `GalleryShareService`; dazu jeder andere Weg, auf dem ein Bild in eine
  Galerie kommt oder sie verlässt). Lücken schließen. 2. Admin-Modul: `GalleryShareAdminController`
  (`/api/admin/gallery-share`), Service-Methode für alle Freigaben, Seite im Frontend nach dem Muster der vorhandenen
  Admin-Module. 3. Kompilieren, bauen, Doku (`GalleryShare.md`, `Gallery.md`, Konzept).
- BEFUND 21:00 zu Punkt 1 (nur gelesen, nichts geändert): Der Upload in eine freigegebene Galerie ist seit dem
  2026-11-19 gebaut: `FileUploadService.uploadFileIntoGallery` holt über `GalleryShareService.prepareGalleryShareUpload`
  die Hashes aller Freigaben der Galerie und schreibt sie ins neue Dokument, danach `fileCount` +1. Einen anderen Weg
  in eine Galerie gibt es nicht (`galleryIds` ist kein Feld „vom Client“, kein Verschieben, kein Wiederherstellen).
  LÜCKE: Die Freigaben werden gelesen, bevor die Bytes ankommen; eine Freigabe, die während eines laufenden Uploads
  angelegt wird, fehlt an den Dateien, die gerade unterwegs sind (höchstens 2 gleichzeitig). Steht im Konzept 4.4
  („Bekannte Lücke“). NICHT behoben: dem Nutzer als eine Frage vorgelegt (ja/nein), erst danach bauen.
- Stand 21:05, Punkt 2 gebaut (`./mvnw -q -o -DskipTests clean compile` rc=0, `npm run build` ohne Fehler):
  - Backend neu: `gallery/controller/GalleryShareAdminController` (`GET /api/admin/gallery-share`),
    `gallery/dto/GalleryShareForAdmin`; geändert: `GalleryShareService.getAllGalleryShare` (nur ADMIN),
    `GalleryService.resolveGalleriesForGalleryShares`, `GalleryShareRepository.findAllByOrderByIdDesc`, Javadoc in
    `GalleryShare` und `GalleryShareForClient` (den Token sieht auch der Admin).
  - Frontend neu: `admin/galleryshare/GalleryShareTab.tsx` und `gallerySharePaths.ts` (Reiter „Freigaben“ der
    Administration, `/admin/gallery-share`), `gallery/galleryShareColumns.tsx` (die Spalten einer Freigabe, jetzt für
    beide Listen), `gallery/GalleryShareLinkCell.tsx` (aus `GalleryShareBox` herausgezogen); geändert:
    `GalleryShareBox.tsx`, `GalleryShare.ts` (`GalleryShareForAdmin`), `useGalleryShare.ts` (`getAllGalleryShare`),
    `galleryShareTexts.ts`, `admin/Admin.tsx`, `App.tsx`.
  - Von mir entschieden, er kann es anders wollen: Reiter in der Administration (kein eigenes Modul mit Kachel); nur
    Ansicht (kein Löschen durch den Admin); der Admin sieht den Link jeder Freigabe; die neueste Freigabe oben.
  - Doku: `entities/GalleryShare.md`, `entities/Gallery.md`, `konzept-galerie-freigabe.md` (Entscheidungen 16 und 17,
    Abschnitt 4.4, neuer Abschnitt 9), `konzept-navigation.md` (Abschnitt 4).
- NICHT getestet: gegen die echten Daten (der Tunnel ist zu, geöffnet wird er nur auf Ansage) und in der Oberfläche
  (Anmeldung braucht 2FA). Geprüft ist nur: Backend kompiliert, Frontend baut mit Typprüfung.
- Lokal nicht committet. Als Nächstes: Antwort des Nutzers zur Lücke; nach seinem Push `git pull` und Bau auf dem Pi.

## 2026-11-20 18:06 – Frage: Sind alle Dokumentationen auf dem aktuellen Codestand?

- Ansage: „sind alle dokumentationen auf dem aktuellen codestand?“
- Plan (nur lesen, nichts am Projekt ändern, bis der Befund steht): 1. Das Doku-Werkzeug in einer KOPIE des Projekts
  im Scratchpad laufen lassen (im Projekt selbst überschreibt es von Hand Ergänztes, Vorfall vom 2026-11-19) und sein
  Ergebnis mit `docu/entities/` vergleichen. 2. Eigener Abgleich: jede Entity hat eine Doku, jedes Feld steht drin,
  jeder Endpunkt aus den Controllern steht in einer Doku und umgekehrt. 3. `solr-cores/FILE.md` gegen `solr_field` in
  der Pi-DB. 4. Rückverweise im Code („Doku: …“). 5. Die übrigen Dokus nach überholten Namen und Abläufen durchsuchen.
  Danach den Befund melden; was fehlt, ziehe ich nach.
- BEFUND 18:10: Nein, nicht alle.
  - Entity-Dokus: 41 Entities, 41 Dokus, kein Feld fehlt, kein dokumentierter Endpunkt ist überholt. Aber 58
    Abweichungen in 13 Dokus: Verwendungen und Methodennamen fehlten, die meisten aus dem Markt-Umbau vom 2026-11-11
    (`FileClass.md` allein 16), dazu von heute `resolveGalleryTags` in `Gallery.md`; ein überholter Name
    (`getAccessRolesWithAccessLevel` in `AccessRole.md`, heißt `getAccessRolesWithFileClassGrant`); in `Gallery.md`
    fehlten die fünf Endpunkte der Freigabe, die auch `Gallery` übertragen.
  - Endpunkte: 212 im Code. Nirgends beschrieben waren `GET` und `POST /api/admin/solr-sync` und
    `DELETE /api/share/session` (Logout).
  - `solr-cores/FILE.md`: alle 35 Felder stimmen mit `solr_field` in der Pi-DB überein (Typ, Platz, „Wer liest“,
    Suchgewicht), alle 19 Endpunkte der Datei-Controller stehen drin; es fehlte der neue `POST /api/gallery/tag/resolve`.
  - Rückverweise im Code: drei fehlten (`GalleryShareShareController` → `Gallery.md`, `ShopItemController` →
    `ShopOffer.md` und `UsersShopItem.md`, Typ `NewGalleryShare` in `GalleryShare.ts`).
  - Übrige Dokus: `neuer-rechner.md` (öffentlich) beschrieb den Bau auf dem Server noch per Archiv und `scp`.
    `konzept-galerie.md` Abschnitt 6 beschrieb die Oberfläche von 2026-11-09 ohne Hinweis auf Abschnitt 8. Was die
    Shop-Konzepte an Klassen und Endpunkten nennen, die es nicht gibt (Truhe, Handel, Saison, Admin-Controller), ist
    dort als Planung ausgewiesen, nicht überholt.
- NACHGEZOGEN 18:15 (nur Doku und drei Kommentare, kein Verhalten geändert; Backend kompiliert, Frontend baut):
  12 Entity-Dokus per Skript aus dem Ergebnis des Werkzeugs ergänzt (von Hand Geschriebenes bleibt), `ShopCategory.md`
  (DTO), `Users.md` (Logout), `solr-cores/FILE.md`, `solr-cores/README.md` (Abschnitt „Abgleich des Schemas“),
  `neuer-rechner.md`, `konzept-galerie.md`, die drei Rückverweise. Zweiter Abgleich: keine echte Abweichung mehr (6
  Meldungen sind Namen im Fließtext, die es an anderer Stelle im Code gibt); alle 212 Endpunkte stehen in einer Doku.
- Nicht maschinell prüfbar und nicht Satz für Satz gelesen: der Fließtext der 13 Konzepte.
- Lokal nicht committet: 17 Dokus und 3 Code-Dateien (nur Kommentare).

## 2026-11-20 18:02 – Push des Nutzers auf den Pi bringen (pull, bauen, prüfen)

- Ansage: „habe gepusht, mach du nun deinen job ;)“.
- Geprüft: lokal = `origin/main` = `179c751` („pray beacoup2“, 18:01, 30 Dateien: die Änderungen an der Galerie von
  17:05), Arbeitsverzeichnis sauber, kein Passwort und kein Schlüssel aus `code/.env` in den geänderten Dateien.
- Plan (Regel: Code nur über Git, niemand kommt an den Pi): Zustand ansehen, laufende Images als `:vorher` sichern,
  `git pull --ff-only`, erst `backend`, dann `frontend` bauen, erst danach starten, prüfen (Log, Endpunkte, Bundle).
- Stand 18:04, **fertig und auf dem Pi** (Einzelheiten in `setup.md` 5.16):
  - Pi vorher: Last 0,0, 13 GiB RAM frei, 45 °C. Pull von `c3299e8` auf `179c751`, Klon sauber.
  - Bau `backend` 23 s, `frontend` 8 s; beide Container neu angelegt, Backend gestartet in 17,3 s, kein ERROR, kein
    WARN. Alle 5 Container laufen.
  - Über nginx und von außen: Startseite 200; `POST /api/gallery/tag/resolve`, `…/file/resolve` und
    `/api/gallery-share/resolve` ohne Anmeldung 401 (die Endpunkte gibt es); unbekannter Token 404. Im Bundle
    `index-D1gPyc9K.js` stehen „neue Bilder“, „alle Bilder zeigen“, die Route `galleries/:galleryId/share` und der
    Pfad `/api/gallery/tag/resolve`; die Schalter stehen im CSS und im Theme.
  - Die Tags `:vorher` zeigen jetzt auf die Images von 16:13 (der Stand vor diesem Bau) und bleiben bis zum nächsten Bau.
  - Hilfsdateien auf dem Pi gelöscht. Der Tunnel ist offen. Lokal nicht committet: dieses Protokoll.
- NICHT gesehen: die Seiten mit Anmeldung (2FA). Der Nutzer testet: Galerie → Reiter „Freigabe“ → „neue Freigabe“ →
  Link kopieren → privates Fenster; Knopf „neue Bilder“; Hashtag-Schalter.
- Weiter offen: seine Antwort, ob die Schalter richtig herum sind (keiner an = alle Bilder).

## 2026-11-20 17:05 – Galerie: Upload hinter Knopf, Freigabe als eigener Reiter, Filter nach Hashtags

- Ansage (gekürzt, wörtlich): „in einer galerie will ich nicht immer den hässlichen upload angezeigt haben, das will ich
  mit dem new entity button ansteuern!!! auch will ich die freigabe als eigenen reiter haben und nich unter allen
  bildkacheln […] ich stelle mir auch vor, dass wir nach allen hashtags in einer galerie filtern können, also toggeln
  ob ich alle bilder mit dem jeweiligen hashtag angezeigt haben möchte oder nicht, kapierst du was ich meine? und ich
  will die freigabe haben und testen können“.
- Zur Frage von 16:50 (60-Sekunden-Grenzen anheben) kam keine Antwort: bleibt liegen, nicht noch einmal fragen.
- Plan, in seiner Reihenfolge: 1. Regeln lesen (`guided-creation-flow`, `upload-file-dropzone`, `ui-display-rules`,
  `navigation-origin-url-state`, `frontend-structure`, `css-base-and-theme`) und die Stellen (`GalleryPage`,
  `GalleryUploadBox`, Reiter im Subheader anderer Module, `NewEntityButton`). 2. Upload der Galerie hinter den
  `NewEntityButton` (Popup mit dem globalen `FileUploadForm`). 3. Galerie mit Reitern „Bilder“ und „Freigabe“, der
  Reiter steht in der Adresse. 4. Hashtags der Galerie als Schalter über den Kacheln (alle Hashtags der Galerie aus
  Solr, nicht nur die der Seite; die Auswahl in der Adresse). 5. Bauen, Doku. 6. Auf den Pi geht es erst nach dem Push
  des Nutzers (Regel: Code nur über Git); danach `git pull`, bauen, er testet die Freigabe.
- So verstanden (von mir, dem Nutzer zur Bestätigung genannt): Über den Kacheln steht jeder Hashtag der Galerie als
  Schalter mit der Zahl seiner Bilder. Kein Schalter an: alle Bilder. Schalter an: nur die Bilder mit diesem Hashtag;
  mehrere an: Bilder mit mindestens einem davon. Reiter: im Subheader des Profils, sobald eine Galerie offen ist
  („Bilder“, in der eigenen Galerie dazu „Freigabe“), wie alle Reiter als Route.
- Stand 17:11, Backend für den Filter gebaut (`./mvnw -q -o -DskipTests clean compile` rc=0, noch nicht gegen Solr
  getestet): `FileDocumentResolveService.resolveFileDocumentsOfGallery` mit `tags`, neu `resolveTagFileCountsOfGallery`
  (Facette), `createTagFilterQueryParams`, `createAnyOfReferencedFilterQuery` (jeder Tag in einem eigenen Parameter,
  weil ein Tag Komma und Hochkomma enthalten darf), `doResolveReadableFileDocuments` mit `referencedQueryParams`;
  `GalleryService.resolveGalleryFiles(galleryId, tags, page)`, neu `resolveGalleryTags`, `createFilterTags`;
  `GalleryController`: `POST /api/gallery/file/resolve` nimmt `tags`, neu `POST /api/gallery/tag/resolve`; DTOs
  `GalleryTagCount`, `GalleryTagResolveRequest`, `GalleryFileResolveRequest` mit `tags`; YAML
  `gebiter.gallery.tag-filter-max-tags: 200`.
- Stand 17:20, Filter gegen das echte Solr getestet (Wegwerf-Test `GalleryTagFilterThrowawayTest` über den Tunnel,
  gelöscht): Galerie 5 „test 1“ hat 10 Bilder und 6 Hashtags (`sky` 2, `ancient`, `beach`, `mountain`, `nature`,
  `water` je 1); je Hashtag liefert der Filter genau so viele Bilder, wie die Facette zählt, und jedes trägt ihn; zwei
  Hashtags zusammen 3 Bilder; ein Tag mit Komma, Hochkomma und Solr-Syntax 0 Bilder und kein Fehler; nur leere Tags wie
  ohne Filter. Mit nur dem Recht ADMIN kam die Liste der Hashtags leer: Das Feld `tags` liest das Recht `USER`
  (`solr_field` id 14), echte Sitzungen des Admins tragen es.
- VORFALL 17:16 bis 17:21: Für den Treffer-Fall hat der Test zwei Probe-Hashtags an drei Bilder von „test 1“
  geschrieben; mittendrin riss die Internetverbindung (Tunnel weg), das Aufräumen im `finally` lief ins Leere. Die
  Probe-Hashtags standen etwa 5 Minuten in je 2 Dokumenten. Bereinigt direkt auf dem Pi mit einem Skript gegen Solr
  (atomares `remove`, wie der `FileDocumentWriteService`), nachgeprüft: im Kern stehen wieder genau die 6 echten
  Hashtags. Lehre: keine Probe-Daten an echte Dokumente über den Tunnel vom Laptop (Regel in
  `Vollidiot/ask-before-heavy-tests.md`).
- Stand 17:28, Oberfläche gebaut (`npm run build` ohne Fehler, Backend `clean compile` rc=0):
  - Upload: `GalleryPage` zeigt in der eigenen Galerie rechts im Kopf den `NewEntityButton` „neue Bilder“; er öffnet
    `GalleryUploadPopup` (neu) mit `GalleryUploadBox` (dem globalen `FileUploadForm`). `FileUploadForm` meldet über das
    neue `onUploadingChange`, ob etwas hochlädt; das Popup fragt dann vor dem Schließen nach.
  - Reiter: `Profile.tsx` zeigt bei offener Galerie „Bilder“ und im eigenen Profil „Freigabe“; neue Route
    `galleries/:galleryId/share` (`App.tsx`) mit `GallerySharePage` (neu); `galleryPaths.ts`
    (`getGalleryShareTabPath`, `OPEN_GALLERY_PATH_PATTERN`); `GalleryShareBox` mit dem Titel der Galerie, nicht mehr
    unter den Kacheln und ohne das Ausblenden ohne Recht.
  - Hashtags: `GalleryTagFilter` (neu), `galleryTagUrlParam.ts` (neu, `?tags=sky+beach`), `useGallery`
    (`resolveGalleryFiles` mit `tags`, `resolveGalleryTags`), `Gallery.ts` (`GalleryTagCount`), `galleryTexts.ts`
    (neu); CSS: Lage in `base.css` (`.gallery-tag-*`), Rahmen des gewählten Schalters im Theme.
  - Angesehen: eine statische Vorschau der neuen Elemente mit dem gebauten CSS und dem Theme (firefox-esr ohne
    Fenster): Reiter, Plus-Knopf, Schalter ohne Wahl und mit Wahl. NICHT gesehen: die echte Seite mit Anmeldung.
  - Doku: `konzept-galerie.md` Abschnitt 8, `konzept-galerie-freigabe.md` 4.7, `konzept-navigation.md` Abschnitt 4,
    `entities/Gallery.md` und `entities/GalleryShare.md` von Hand.
- Nicht auf dem Pi: Der Code kommt nur über Git dorthin. WARTET auf den Push des Nutzers, danach `git pull` und Bau.

## 2026-11-20 16:50 – Langsames Internet unterwegs: wo kann etwas in ein Zeitlimit laufen?

- Ansage: „ich habe hier echt mistig langsames internet, prüfe mal bitte, dass da so schnell nichts timeoutet, bzw, sag
  mir wo die kritischen stellen sind“.
- Plan (nur lesen und messen, nichts ändern): 1. Leitung messen (Laufzeit, Durchsatz hoch und runter, kleine Mengen).
  2. Zeitlimits auf dem Weg lesen: nginx auf dem Pi (`default.conf`), Backend (`application.yaml`: Tomcat, Upload,
  Token, Anmeldeschein, Freigabe), Frontend (Anfragen, Upload, Abfragen im Takt). 3. Je Stelle ausrechnen, ab wann sie
  bei dieser Leitung reißt, und dem Nutzer die kritischen nennen.
- Stand 17:00, fertig, nichts geändert:
  - Gemessen (je 1 MB, eine Messung): hoch 121 KB/s, runter 216 KB/s, Verbindungsaufbau 0,21 bis 0,35 s, eine
    https-Anfrage 0,65 bis 1,1 s.
  - Hält auch langsam: Das Frontend setzt nirgends ein Zeitlimit für Anfragen (`ApiClient`: `fetch` und
    `XMLHttpRequest` ohne Timeout). nginx: `proxy_read_timeout` und `proxy_send_timeout` 1 h, ungepuffert in beide
    Richtungen. Kein Limit für die Dauer eines Uploads. 2FA-Anmeldung 10 min. JWT 31 min, geprüft nur am Anfang einer
    Anfrage; Erneuerung nach 15 min, bei Netzfehler neuer Versuch alle 30 s. Die Abfrage der Auswertung (alle 3 s)
    überlappt nicht (`isPollingRef`).
  - KRITISCH 1, Aussetzer: Fließt 60 s lang kein Byte, trennt nginx (`client_body_timeout` und `send_timeout`, beide
    nicht gesetzt, also Standard 60 s; mit `nginx -T` im Container geprüft) bzw. Tomcat (kein `server.tomcat.*`
    gesetzt, Standard 60 s). Ein Upload ist EINE Anfrage je Datei, ohne Fortsetzen und ohne automatischen neuen
    Versuch (Zeile wird FAILED, derselbe Knopf lädt von vorn).
  - KRITISCH 2, Menge: Bilder der Galerie „test 1“ im Schnitt 32 MB = 4,5 min je Bild; 1 GB = 2,4 h; 100 GB = rund
    10 Tage.
  - KRITISCH 3, Sitzung: Geht die Antwort auf eine Erneuerung verloren, schickt das Frontend nach 30 s den alten
    Refresh-Token; `UsersRefreshTokenService` wertet „schon verbraucht“ als Diebstahl und löscht ALLE Sitzungen des
    Users. Danach neu anmelden mit 2FA, laufende Uploads brechen ab (die Upload-Seite wird abgebaut). Selten (das
    Fenster ist etwa eine Sekunde je Viertelstunde), aber mit großer Wirkung.
  - KRITISCH 4, Freigabe mit begrenzten Aufrufen: Jede Anfrage nach einem Bild zählt, auch ein Byte-Bereich; setzt
    der Browser eines Besuchers nach einem Aussetzer neu an, zählt dasselbe Bild mehrfach.
  - Nur langsam: nginx liefert ohne Komprimierung (`gzip` aus): JS und CSS 1,5 MB statt rund 0,4 MB; kein
    `Cache-Control`. Kachelseiten tragen die Vorschaubilder als Base64 im JSON.
  - Nicht geprüft: ein Upload über mehr als eine Stunde (kein großer Test ohne Rückfrage).
- OFFEN, den Nutzer gefragt: die 60-Sekunden-Grenzen für Upload und Download anheben?

## 2026-11-20 16:44 – Auf dem Pi pullen und bauen, Stand melden

- Ansage: „du kommst doch auf den pi bitte pulle und builde und teile mir dann den aktuellen stand mit“.
- Vorgefunden: GitHub steht weiter auf `c3299e8` (16:21), seitdem ist nichts Neues gepusht; der Pi steht schon auf
  diesem Commit und ist damit gebaut (16:34). Tunnel steht.
- Plan: wie um 16:34 nach der Regel (Zustand ansehen, laufende Images als `:vorher` sichern, `git pull --ff-only`,
  erst `backend`, dann `frontend` bauen, dann starten, prüfen), danach den Stand berichten.
- Stand 16:45, fertig:
  - Pi vorher: Last 0,0, 13 GiB RAM frei, 787 GB Platte frei, 44 °C.
  - `git pull --ff-only`: „Already up to date“, der Pi steht auf `c3299e8`, Klon sauber (0 abweichende Dateien).
  - Bau `backend` (10 Schritte aus dem Cache), dann `frontend` (6 aus dem Cache), zusammen 3 s. Start: kein Container
    neu angelegt, beide liefen durch; sie laufen mit dem Inhalt des frisch gebauten Images.
  - Danach: alle 5 Container laufen (Backend und Frontend seit 16:13, die anderen seit 9 Tagen), Backend ohne ERROR
    und ohne WARN. Über nginx: Startseite 200, Freigaben ohne Anmeldung 401, unbekannter Token 404; im Bundle
    `index-c4nAG9SA.js` stehen die Spalte „Link“ und der neue Hinweis, der alte Text nicht mehr. Von außen dasselbe.
  - Pi-DB: 2 User, 2 Galerien (5 „test 1“, 6 „Bla“), 0 Freigaben. Neu vorgefunden: Das Recht `FREIGABE` gibt es jetzt
    in `access_role` (der Nutzer hat es angelegt).
  - Hilfsdateien in `/tmp` gelöscht; die Tags `:vorher` zeigen auf die laufenden Images und bleiben bis zum nächsten Bau.
  - Lokal nicht committet und damit nicht auf dem Pi: nur dieses Protokoll (Einträge ab 16:19, bereinigter Eintrag vom
    2026-11-11).

## 2026-11-20 16:29 – Push des Nutzers prüfen, dann auf dem Pi pullen und bauen

- Ansage: „in git gepusht habe ich gerade. den lokalen codestand, du kannst das nochmal prüfen und dann auf dem pi
  pullen UND builden, bedenke aber, dass falls der pi crasht oder sonst irgendwie hängt wir keine möglichkeit haben
  physisch zu restarten! wir haben nur den ssh zugang und dann ebend das https mapping“.
- Plan: 1. Push prüfen (lokal gegen `origin/main`, Inhalt des Commits). 2. Pi ansehen, nur lesen: Git vorhanden?,
  Ordner und Besitzer, Last, RAM, Platte, Temperatur, Watchdog, Neustart-Regeln der Container. 3. `/gebiter9k` auf dem
  Pi zum Klon machen, ohne eine Datei anzufassen (Index auf `origin/main`, dann vergleichen). 4. Bauen: erst bauen,
  dann starten, nacheinander, mit Sicherung der Images; nichts an SSH, Netz, Docker-Dienst oder Paketen ändern, kein
  Neustart des Pi. 5. Prüfen, Doku und Regeln nachziehen (der Bau lief bisher über tar und scp).
- Stand 16:30, Schritt 1: Der Push ist da, lokal = `origin/main` = `c3299e8` („pray beacoup“, 16:21, 54 Dateien). Der
  Code darin ist der Stand, der seit 16:13 auf dem Pi läuft (lokal seither nur dieses Protokoll geändert). Keine
  `.env`, keine `setup.md`, kein Schlüssel im Stand.
  FUND: Der Commit enthält dieses Protokoll noch mit der Adresse von zu Hause (dreimal) und dem SSH-Port (Eintrag vom
  2026-11-11 23:55); die Bereinigung von 16:20 kam nach dem Commit. Dem Nutzer gemeldet, Frage folgt.
- Stand 16:36, **Schritte 2 bis 5 fertig** (Einzelheiten in `setup.md` 5.16):
  - Der Tunnel war nach der Pause weg (Steuer-Socket fehlte, der Pi lief normal); neu geöffnet, direkt, diesmal ohne
    Bindeadresse (IPv4 und IPv6).
  - Pi vorher: Last 0,0, 12 GiB RAM frei, 787 GB Platte frei, 44 °C; Git ist dort schon installiert.
  - `/gebiter9k` auf dem Pi ist jetzt ein Klon auf `c3299e8` (`git init`, `fetch`, `reset --mixed`: keine Datei
    angefasst). Vergleich: keine geänderte Datei; 64 fehlende (`docu/`, `.gitignore`, `code/.gitignore`,
    `code/.env.example`) mit `git restore .` geholt. `.env` des Pi unverändert.
  - Pull „Already up to date“; Bau `backend`, dann `frontend` in 3 s aus dem Cache; `up -d --wait`: kein Neustart,
    keine Unterbrechung. Frisch gebautes Image und laufender Container haben je dieselben Schichten und dieselbe
    Konfiguration. Von außen: Startseite 200, Freigaben ohne Anmeldung 401, unbekannter Token 404.
  - Bleibt auf dem Pi: die Tags `:vorher` an beiden Images (hängen an den laufenden Containern, nur mit Zwang
    löschbar, kosten keinen Platz; der nächste Bau setzt sie neu). Hilfsdateien in `/tmp` gelöscht.
  - Rückhalt bei einem Hänger: Watchdog von systemd (60 s), Docker startet beim Booten, alle Container
    `unless-stopped`.
  - Doku und Regeln: `setup.md` 5.16 (neuer Weg über Git), `Vollidiot/github-repo.md`, `pi-access-self.md`,
    `rechner-debian-laptop.md`, `MEMORY.md`.
  - Der Tunnel ist OFFEN. Lokal nicht committet: nur dieses Protokoll (bereinigt, mit den Einträgen ab 16:19).
- OFFEN, den Nutzer gefragt: 1. Adresse und Port aus der Historie nehmen (Commit umschreiben, er pusht mit Zwang)?
  2. Gilt ab jetzt: auf den Pi kommt nur, was gepusht ist?
- 16:40 ENTSCHIEDEN zu 1: „so lange keine zugangsdaten davon in git sind ist mir das egal“. Die Historie bleibt, wie
  sie ist. Gemeint waren der DynDNS-Name des Anschlusses und der SSH-Port, nicht seine Postadresse (so hatte er
  „Adresse von zu Hause“ verstanden). Nachgeprüft über alle 5 Commits: kein Passwort aus `code/.env`, kein Kennwort des
  Pi; es stehen nur Namen drin (Datenbank und ihr Benutzer, Benutzer von Solr und SFTP, LAN-IP, Pfad der Mounts) und
  Platzhalter wie `change-me`. Regel dazu in `Vollidiot/github-repo.md`.
- 16:42 ENTSCHIEDEN zu 2, feste Regel: „wir halten aber fest dass sämtlicher code auf dem pi ausschliesslich über git
  geht“. Kein tar und kein scp mehr für Code, auf dem Pi wird kein Code bearbeitet; gebaut wird nach dem Push. Weiter
  per `scp` geht nur, was nicht im Repo liegt: Konfiguration unter `mounts/` (nginx) und `code/.env`. Eingetragen in
  `Vollidiot/pi-access-self.md`, `github-repo.md`, `rechner-debian-laptop.md`, `MEMORY.md` und `setup.md` 5.16 (der
  alte Weg steht dort als abgelöst).
- 16:45 abgegrenzt vom Nutzer: „also direkte datenbank fixes schon noch weiterhin direkt, aber code für die
  fullstackapp in git und dann auf den pi und dann wird gebaut“. Korrekturen an den Daten (SQL gegen die Pi-DB, Felder
  in Solr) also weiter direkt; die Regel gilt für den Code der App. In `Vollidiot/pi-access-self.md` nachgetragen.
- Stand: nichts mehr offen aus diesem Auftrag. Lokal nicht committet ist nur dieses Protokoll.

## 2026-11-20 16:19 – Frage: jetzt nach GitHub pushen, oder fehlt noch etwas?

- Ansage: „dann sollte ich das nun erst mal aus unserem projekt auf git pushen?“, dazu „oder brauchen wir jetzt noch
  was dass alles so funktioniert wie ich mir das vorstelle“. Eine Frage, kein Auftrag: nichts committet, nichts gepusht.
- Geprüft (nur gelesen): Ein Commit nähme 54 Dateien auf (`code/`, `docu/`, `.gitignore`). Kein Kennwort aus
  `code/.env` steht in einer davon (Treffer nur der Projektname als Datenbank-Benutzer und der Pfad der Mounts). Die
  zwei 64-Zeichen-Hexwerte in `solr-cores/FILE.md` sind die Datei-id des Beispieldokuments, kein Token.
- Bereinigt: Der Eintrag vom 2026-11-11 23:55 nannte dreimal die Adresse von zu Hause und einmal den SSH-Port; jetzt
  steht dort nur noch der Verweis auf `setup.md` 5.8. Im Repo auf GitHub standen beide bisher nicht.
- Hindernis für den Push von diesem Laptop: Für GitHub ist hier nichts angemeldet (`gh` fehlt, kein Helfer), der
  Probelauf `git push --dry-run` scheitert an der Anmeldung. Weg wie auf dem Mac: `gh` ohne sudo ins Home-Verzeichnis,
  Anmeldung über den Browser mit Einmal-Code.
- Was zum Wunsch des Nutzers noch fehlt: Kommentare an Bildern (eigenes Stück, in der Kachelansicht asynchron
  nachladen). Und: Der Link nimmt die Adresse, unter der der Besitzer die Seite gerade offen hat
  (`window.location.origin`); öffnet er sie zu Hause über die IP im LAN, taugt der kopierte Link nicht für Freunde.
- WARTET auf die Antwort des Nutzers (committen und pushen ja oder nein).

## 2026-11-20 16:03 – Galerie-Freigabe: Link wird gespeichert und bleibt abrufbar

- Ansage: „warum willst du den link nicht speichern? […] das "token" im link ist einfach ein zugangslink den ich
  anderen schicken werde“. Also ENTSCHIEDEN: Der Link wird gespeichert und ist in der eigenen Galerie jederzeit wieder
  zu sehen und zu kopieren. „Nur einmal sichtbar“ war meine Entscheidung aus der Nacht, nicht seine, und ist falsch.
- Plan: 1. Regeln (`code-style`, `entity-docs-rule`, `naming-rules`, `pi-access-self`) und die Stellen lesen
  (`GalleryShare`, `GalleryShareService`, DTOs, `GalleryShareBox`, `NewGallerySharePopup`). 2. `gallery_share` bekommt
  das Token im Klartext (Spalte `share_token`), `GalleryShareForClient` liefert es mit; Solr behält nur den Hash.
  3. Box in der eigenen Galerie zeigt je Freigabe den Link mit „kopieren“. 4. Kompilieren, `npm run build`. 5. Konzept,
  `entities/GalleryShare.md`, Regel `gallery-share-key-link` nachziehen. 6. Auf den Pi.
- Ansage zwischendurch (ca. 16:06), für das Stück „Kommentare an Bildern“ (noch nicht dran): „kommentare würde ich auch
  schon in der kachelansicht asychron nachladen, die brauch ich noch nicht instantan“. Also: Die Kacheln kommen sofort,
  die Kommentare je Bild lädt die Kachelansicht danach nach. Im Konzept bei den offenen Punkten festgehalten.
- Stand Backend (kompiliert, `./mvnw -q -o -DskipTests clean compile` rc=0): `GalleryShare.shareToken` (Spalte
  `share_token`, Pflicht, eindeutig), Konstruktor mit Token; `GalleryShareForClient` mit `shareToken`;
  `GalleryShareService.createOwnGalleryShare` liefert jetzt `GalleryShareForClient`; DTO `CreatedGalleryShare` gelöscht
  (wäre doppelt); `GalleryShareController` und Javadoc in `Helper.createRandomHexToken` nachgezogen. Solr unverändert
  (dort weiter nur der Hash).
- Stand Frontend (`npm run build` ohne Fehler): `GalleryShare.ts` (Typ mit `shareToken`, `CreatedGalleryShare` weg),
  `useGalleryShare.ts`, `GalleryShareBox.tsx` (neue Spalte „Link“: Link zum Anklicken und Knopf zum Kopieren,
  `GalleryShareLinkCell`), `NewGallerySharePopup.tsx` (Hinweis „Den Link findest du jederzeit wieder“ statt „nur dieses
  eine Mal“), `galleryShareTexts.ts`.
- Ansage zwischendurch (ca. 16:09): „wenn du dann mal zeit hast, versuch mal direkt den ssh tunnel nach hause auf“.
  Gemacht: Der SSH-Port von zu Hause ist aus diesem Netz offen, Tunnel direkt ohne Tor, alle drei Ports, Steuer-Socket
  `$XDG_RUNTIME_DIR/gebieter-tunnel.sock`. Fund: `localhost` zeigt auf dem Laptop zuerst auf `::1`; die Weiterleitungen
  müssen ohne Bindeadresse stehen, sonst findet `start.sh` den Pi nicht (nachträglich mit `-O forward` ergänzt).
- Stand 16:17, **fertig und auf dem Pi** (Bau 16:13, Einzelheiten in `setup.md` 5.16):
  - Vorher: `gallery_share` auf dem Pi war leer (0 Zeilen), also keine Migration nötig. Kontexttest vom Laptop grün
    (Start 26 s), dabei hat Hibernate die Spalte `share_token` angelegt. Stand Laptop gegen Pi per SHA-256 verglichen:
    genau die 10 geänderten Dateien und das gelöschte DTO.
  - Pi: Bau 26 s, Start 17,0 s, kein ERROR, kein WARN; im Bundle steht der neue Text, der alte nicht mehr.
  - Wegwerf-Test `GalleryShareLinkThrowawayTest` (gelöscht), als Besitzer der Galerie 5: Probe-Freigabe angelegt, die
    Liste liefert denselben Token wieder, Postgres hat Token und passenden Hash, der Link antwortet auf dem Pi mit 200,
    nach dem Löschen 404. Endstand Pi: `gallery_share` 0 Zeilen (die Identität steht bei 15), kein Token im Log.
    Sicherungen und Hilfsdateien auf dem Pi gelöscht.
  - Doku: Konzept (Entscheidungen 14 und 15, Abschnitte 3, 4.1, 4.3, 4.7, 7, 8), `entities/GalleryShare.md` von Hand,
    `setup.md` 5.16; Regeln `Vollidiot/gallery-share-key-link.md`, `rechner-debian-laptop.md`, `MEMORY.md`.
  - **Der Tunnel ist OFFEN** (vom Nutzer so gewollt). Schließen: `ssh -S "$XDG_RUNTIME_DIR/gebieter-tunnel.sock" -O exit x`.
  - Nichts committet.
- NICHT gesehen: die Box in der eigenen Galerie mit der Spalte „Link“ (braucht die Anmeldung mit 2FA).
- Offen für den Nutzer: ausprobieren; sonst wie im Eintrag vom 2026-11-19 22:40, Punkte 2, 3, 5, 6, 7.

## 2026-11-20 16:00 – Neue Sitzung: Stand einlesen (Debian-Laptop)

- Ansage: „hast du noch den kontext vom letzten post?“, danach „dann bring dich auf den aktuellen stand“.
- Vorgefunden: Die Sitzung lief im Oberordner `fullstackprojekt` an, ohne die Regeln aus `Vollidiot/` (hier gibt es
  kein `.claude/settings.local.json`, also zeigt nichts auf `Vollidiot`). Der Verlauf der letzten Sitzung ist nicht da.
  Bevor ich die Regel `memory-location` kannte, habe ich den Ordner `~/.claude/projects/…/memory` aufgelistet (leer,
  nichts gelesen, nichts geschrieben); seither nicht mehr angefasst.
- Gelesen: `Vollidiot/MEMORY.md`, `memory-location`, `gallery-share-key-link`, `rechner-debian-laptop`,
  `log-current-work`, dieses Protokoll ab dem 2026-11-19.
- Stand am Rechner geprüft (nur gelesen): seit 2026-11-19 23:46 keine Datei geändert; 27 geänderte und 28 neue Dateien,
  nichts committet, Branch `main` gleich `origin/main`; Tunnel zu; `node_modules` und `dist` im Frontend vorhanden.
- WARTET auf die Ansage des Nutzers. Offen bleibt die Liste am Ende des Eintrags von 22:40.

## 2026-11-19 22:40 – Galerie-Freigabe fertig bauen und auf den Pi bringen (Nutzer schläft, ohne Rückfragen)

- Ansage: „bekommst du das nun ohne weitere rückfragen lauffähig also so wie wir es besprochen haben? ich gehe nun
  nämlich schlafen, wäre aber schön wenn du es fertig bekommst“.
- Plan: 1. Stück 2 Backend (Besucher-Endpunkte), 2. Stück 3 (ZIP gestreamt), 3. Frontend (Box in der eigenen Galerie,
  Besucherseite), 4. nginx (Adressen mit Token in kein Log), 5. auf den Pi bringen und dort prüfen, 6. Doku. Kein
  Commit. Was ich selbst entscheide, kommt in den Bericht.
- Selbst entschieden (alles im Konzept `docu/konzept-galerie-freigabe.md` nachlesbar):
  - Link nur einmal sichtbar (so gebaut, die Frage blieb ohne Antwort).
  - Felder für Besucher ohne Anmeldung: Liste in `gebiter.gallery-share.visitor-field-names`, ohne GPS; ein
    angemeldeter Betrachter bekommt, was er nach seinen Rechten ohnehin liest.
  - Jede Anfrage nach einem Bild zählt als Aufruf, auch Range; ein ZIP zählt je Bild; die Kacheln zählen nicht.
  - Weitere Seiten der Besucheransicht über `POST /api/share/token/{token}/resolve` (Body `{page}`).
  - Die Auswahl kommt als Formular (POST, Feld `fileIds`), damit der Browser das ZIP direkt auf die Platte schreibt.
  - Besucher-Deckel: 4 Abrufe gleichzeitig, davon 2 ZIP; Auswahl höchstens 2000 Bilder.
  - Für Besucher nur aktive Bilder; die Galerie-id aus Postgres ist zusätzliche Bedingung im Filter.
  - Kommentare an Bildern gibt es auf der Plattform noch nicht: nicht gebaut, steht als offen im Konzept.
- Stand 23:15:
  - Backend: `GalleryShareService.getValidGalleryShare`, `countGalleryShareAccesses`;
    `GalleryShareRepository.findByShareTokenHash`, `increaseAccessCountIfValid` (eine SQL-Anweisung prüft und zählt);
    `GalleryService.getGalleryForGalleryShare`; `FileDocumentResolveService.resolveFileDocumentsOfGalleryShare`,
    `resolveFileDocumentBackendFactsOfGalleryShare`, `resolveFileDocumentZipSourcesOfGalleryShare`, die eine Lesegrenze
    `createGalleryShareFilterQueries`; `FileDownloadService.streamFileDocumentWithBackendFacts`,
    `streamFileDocumentsAsZip` (gemeinsamer Kern `doStreamFileDocument`); neu `GalleryShareVisitorService`,
    `GalleryShareShareController` (`/api/share/token`), `GalleryShareBusyException` (429), DTOs
    `SharedGalleryForClient`, `SharedGalleryPageRequest`, `FileDocumentZipSource`; `Helper.isLowerCaseHex`,
    `Helper.createSafeFileName`; YAML `gebiter.gallery-share.*`. Kompiliert.
  - Frontend: `gallery/GalleryShare.ts`, `useGalleryShare.ts`, `galleryShareUrls.ts`, `galleryShareTexts.ts`,
    `GalleryShareBox.tsx` (in `GalleryPage` für die eigene Galerie), `NewGallerySharePopup.tsx`,
    `GalleryShareVisitorPage.tsx` (Route `/share/galerie/:shareToken` in `App.tsx`, vor der Anmelde-Weiche),
    `GalleryShareCheerCounts.tsx`; `GalleryImageTile` und `GalleryImageViewerPopup` mit optionalen Teilen des
    Aufrufers; `file/cheer/fileCheerLooks.ts` (Smileys an einer Stelle); `auth/access/galleryShareAccessRoleKey.ts`,
    `VITE_GALLERY_SHARE_ACCESS_ROLE_KEY` in beiden `.env.*`; zwei Klassen in `base.css`. `npm ci` (Node 26.13.1),
    `npm run build` ohne Fehler.
  - Test über den Tunnel (Wegwerf-Test, räumt selbst auf), grün: Ansicht (9 Bilder, nur erlaubte Felder), 7 falsche
    Tokens abgewiesen, Viewer mit Byte-Bereich (206, JPEG, `nosniff`, `sandbox`), Download als Anhang, fremdes Bild
    und falsche ids abgewiesen und nicht gezählt, Grenze von 2 Aufrufen (dritter Abruf und Ansicht zu), ZIP-Prüfungen
    vor dem ersten Byte. Noch im Lauf (Tor ist sehr langsam): Admin-Ansicht, Ablauf, Galerie löschen.
  - nginx: geänderte `default.conf` liegt im Scratchpad bereit (`nginx/default.conf`, vorher `default.conf.vorher`).
- Stand 23:46, **fertig und auf dem Pi** (Bau 23:24, Einzelheiten in `setup.md` 5.16):
  - Nachgebessert nach dem Gegenprüfen: Auswahl wird aus allen Bildern der Freigabe herausgesucht (keine lange
    id-Liste als Filter an Solr); Seitenzahl gegen Überlauf gesichert; ein ZIP, bei dem bei uns etwas scheitert,
    bricht hart ab (Fehler, den kein Handler abfängt), ein Abbruch des Browsers ist kein Fehler; das Formularfeld der
    Auswahl liest der Controller direkt aus der Anfrage.
  - Auf dem Pi: Start 16,9 s, kein ERROR, kein WARN. nginx mit zwei neuen Blöcken (Token-Adressen in kein Log,
    `Referrer-Policy: no-referrer`), vorher mit `nginx -t` geprüft.
  - Ende-zu-Ende auf dem Pi über nginx mit zwei Probe-Freigaben an Galerie 5 „test 1“ (9 Bilder, 293 MB): Ansicht mit
    genau den erlaubten Feldern; Seite 2 leer; Viewer mit Byte-Bereich 206; ganzer Download bitgenau (SHA-256 = id);
    fremdes Bild, Auswahl mit fremdem Bild 404; leere und kaputte Auswahl 400; Auswahl-ZIP (2 Bilder, 47 MB, 0,9 s) und
    alle als ZIP (9 Bilder, 293 MB, 3,0 s): je Eintrag CRC, Größe, SHA-256 richtig; Speicher des Backends (RSS) 586 MB
    davor, 596 MB danach; Token weder im nginx- noch im Backend-Log. Freigabe mit Ablauf: vorher 200, 16 s nach dem
    Zeitpunkt Ansicht, Bild und ZIP 404. Aufrufe gezählt: 14 (1 Byte-Bereich, 1 Download, 2 + 9 im ZIP, 1 Viewer im
    Browser), abgewiesene nicht.
  - Besucherseite im echten Browser angesehen (firefox-esr ohne Fenster, per Marionette gesteuert, direkt per https):
    9 Kacheln, Titel, Beschreibung, Fuß „9 Bilder“, Ankreuzen („Auswahl herunterladen (2)“), Hinweis zur Anmeldung,
    Viewer mit den Adressen unter dem Token. Fotos im Scratchpad unter `shot/`.
  - Wegwerf-Tests über den Tunnel: Galerie löschen nimmt ihre Freigabe mit (leere Galerie 7, wieder weg); alle
    Probe-Freigaben gelöscht. Endstand Pi: `gallery_share` 0 Zeilen (Identität steht bei 14), Galerien 5 und 6, kein
    Dokument mit einem Wert in `galleryShareTokenHashes`. Wegwerf-Tests, Token-Dateien, Hilfsdateien auf dem Pi und die
    Sicherungen (`:vorher`-Images, Quellen, alte `default.conf`) sind gelöscht.
  - Doku: Konzept (Abschnitte 4.7 bis 8), `entities/GalleryShare.md`, `entities/Gallery.md`, `solr-cores/FILE.md`
    (Feld von Hand nachgetragen), `setup.md` 5.16, Regeln in `Vollidiot/`.
  - Tunnel geschlossen (23:45). Nichts committet.
- NICHT gesehen: die Box in der eigenen Galerie und „neue Freigabe“ (brauchen Anmeldung mit 2FA). Geprüft sind dafür
  Typen, Bau und die Services dahinter (anlegen, auflisten, löschen).
- Offen für den Nutzer: 1. ausprobieren (eigene Galerie → „Freigaben über einen Link“ → neue Freigabe → Link in einem
  privaten Fenster öffnen); 2. Kommentare an Bildern (gibt es auf der Plattform noch nicht); 3. Felder für Besucher;
  4. Link später wieder abrufbar?; 5. Recht `FREIGABE` anlegen, wenn andere freigeben sollen; 6. Fuß `gebiter9k`;
  7. Commit auf Ansage (vorher den Eintrag vom 11.11. 23:55 um Adresse und Port bereinigen).

## 2026-11-19 22:27 – Galerie-Freigabe: Adress-Schema des Nutzers, Tabelle und Solr-Feld anlegen

- Ansage: „nein ich dachte an /api/share/token/{token} dann kommt die default ansicht. und danach gibt es dann ein
  /view/{file.id} oder ein /download/{file.id} oder ein /selection oder ein /download/all und ja ich denke wir müssen
  da eine ausnahme machen, dass wir 2 parameter erlauben“.
- Also die Adressen der Besucherseite (Stück 2 und 3):
  - `GET /api/share/token/{token}`: die Standardansicht (Galerie und ihre Bilder)
  - `GET /api/share/token/{token}/view/{fileId}`: ein Bild für den Viewer
  - `GET /api/share/token/{token}/download/{fileId}`: ein Bild herunterladen
  - `/api/share/token/{token}/selection`: eine Auswahl herunterladen
  - `GET /api/share/token/{token}/download/all`: alle herunterladen
  - Ausnahme von „GET nur ein Wert“: hier zwei Werte (Token und Datei-id) erlaubt.
- Zur Frage „Link später wieder sehen oder nur einmal“ kam keine Antwort: Es bleibt wie gebaut (einmal beim Anlegen,
  gespeichert nur der Hash). Nicht noch einmal fragen; will er es anders, kommt eine Spalte dazu.
- Plan:
  1. Im Code heißt der Schlüssel ab jetzt wie beim Nutzer „Token“ (`shareToken`, `shareTokenHash`, Feld
     `galleryShareTokenHashes`): „key“ ist im Projekt für Keys wie `FOTO_ART` belegt (Key-Regel). Noch ist nichts in
     Postgres oder Solr angelegt, die Umbenennung kostet jetzt nichts.
  2. Konzept und Regel `controller-rules` nachziehen.
  3. Tunnel über Tor öffnen, Kontextstart (legt `gallery_share` an), Feld im Solr-Manager und in Solr anlegen.
- Stand 22:36, Plan 1 bis 3 erledigt:
  - Umbenannt (Code, YAML, Konzept, Entity-Doku): `shareToken`, `shareTokenHash`, `galleryShareTokenHashes`,
    `gebiter.gallery-share.token-bytes`, `gebiter.file.field.gallery-share-token-hashes`,
    `Helper.createRandomHexToken`. Kompiliert (rc=0).
  - Konzept Abschnitt 5 mit der Tabelle der Adressen; Regel `Vollidiot/controller-rules.md` mit der Ausnahme.
  - Tunnel über Tor offen (22:28, Steuer-Socket `$XDG_RUNTIME_DIR/gebieter-tunnel.sock`). Hilfsskript im Scratchpad
    `pi-sql.sh` (SQL-Datei per scp auf den Pi, dort mit sudo im Postgres-Container ausführen).
  - **Pi-DB:** Tabelle `gallery_share` angelegt (Hibernate, 9 Spalten, 0 Zeilen; die Identität steht nach dem Test bei 2).
    **Solr-Manager:** Zeile `solr_field` id 42 `galleryShareTokenHashes` (STRING, mehrwertig, indexiert, gespeichert,
    docValues, Suchgewicht -1, „Wer liest“ ADMIN, „vom Client“ aus, Platz 36). **Solr:** Feld im Schema von `FILE`
    (`string`, `multiValued`), geprüft über die Schema-API; kein Dokument trägt einen Wert.
  - Wegwerf-Test `GalleryShareThrowawayTest` (gelöscht) grün, als Admin-Konto an dessen Galerie 5 „test 1“ (9 Bilder):
    anlegen (Token 64 Zeichen, Bezeichnung ohne Leerzeichen außen, `fileCount` 9 = `sharedFileCount` 9), auflisten (1),
    löschen (danach 0 Dokumente mit Hash, 0 Freigaben); beide Grenzen zugleich, leere Bezeichnung und fremde Galerie 6
    werden abgewiesen. Start des Kontexts über Tor: 31 s.
  - Das laufende Backend auf dem Pi kennt das neue Feld erst nach dem nächsten Neubau (Kopie im Speicher).
  - Das Recht `FREIGABE` gibt es in `access_role` noch nicht; anlegen kann es der Admin im Rechte-Manager.
- Als Nächstes: Stück 2 Backend (Besucher-Endpunkte nach der Tabelle der Adressen), dann `npm ci` und die Oberflächen.

## 2026-11-19 21:27 – Galerie-Freigabe: Antworten des Nutzers einbauen (Bezeichnung, Löschen, Node)

- Ansage (Antworten auf die vier Fragen, wörtlich gekürzt):
  1. „da wir die verwaltung sämtlicher freigaben in postgres haben, sollte die galerie id ja unnötig sein, denn wir
     holen ja alle file docs per token AUFLÖSUNG!“ Also: keine Galerie-id im Link, der Schlüssel löst alles auf.
  2. „ja der link soll den schlüssel einfach drin haben“. Freunde bekommen einen Link und sehen die Bilder „ohne weitere
     passwörter“. Die ältere Freigabe mit Abholtoken ist ein anderer Anwendungsfall: „trenne das sauber in zukunft“.
  3. Bezeichnung je Freigabe: ja.
  4. Löschen: „wir löschen erst die freigabetoken aus den solr dokumenten, denn wenn da was schief geht können wir den
     prozess neu starten so lange wir die freigabedaten noch in postgres haben“.
  5. Nachgeschoben: „du kannst doch die neue node 26 lts auch übers terminal installieren, bestätige“.
- Plan:
  1. `GalleryShare` bekommt `label` (Bezeichnung, Pflicht, Höchstlänge aus `application.yaml`).
  2. Freigabe löschen: Hash aus allen Dokumenten nehmen (alle, die ihn tragen, auch gelöschte), nachzählen, erst dann
     die Zeile löschen. Scheitert Solr, bleibt die Zeile und der Vorgang lässt sich wiederholen.
  3. Galerie löschen: Meldung `GalleryDeletedEvent` vor dem Löschen (Muster `FileExtensionDeletedEvent`), der
     `GalleryShareService` räumt die Freigaben in derselben Reihenfolge weg; danach wie bisher.
  4. Konzept, Entity-Doku, Regeln in `Vollidiot/` nachziehen. Kompilieren.
  5. Node 26 LTS ohne sudo ins Home-Verzeichnis (nodejs.org, Prüfsumme und Signatur prüfen).
- Weiter offen: a) Link später wieder abrufbar oder nur einmal sichtbar (Antwort 2 sagt das nicht eindeutig);
  b) Ausnahme „GET nur ein Wert“ für Schlüssel + Datei-id beim einzelnen Bild.
- Stand 22:17, Plan 1 bis 5 erledigt:
  - Code: `GalleryShare.label` (Pflicht, Spalte 500, Höchstlänge `gebiter.gallery-share.label-max-length: 100`);
    `NewGalleryShare` und `GalleryShareForClient` mit `label`; neu `GalleryShareDeleteRequest`, `GalleryDeletedEvent`
    (beide `gallery/dto`); `FileDocumentResolveService.resolveFileDocumentIdsWithGalleryShareKeyHash` (alle Status);
    `GalleryShareService.deleteOwnGalleryShare`, Listener `deleteGallerySharesOfDeletedGallery`, Kern
    `doDeleteGalleryShare` (Hash heraus, nachlesen, dann Zeile löschen), `doGetOwnGalleryShare`, `requireLabel`;
    `GalleryShareController` `DELETE /api/gallery-share`; `GalleryService.deleteOwnGallery` schickt zuerst die Meldung.
  - `./mvnw -q -o -DskipTests clean compile` rc=0. Kein Kontextstart, kein Test: `gallery_share` gibt es in der Pi-DB
    noch nicht, das Feld `galleryShareKeyHashes` weder in `solr_field` noch in Solr.
  - Doku: `docu/konzept-galerie-freigabe.md` (Link ohne Galerie-id, Entscheidungen 12 und 13, Abschnitt 4.6 Löschen),
    `docu/entities/GalleryShare.md` von Hand nachgezogen (das Werkzeug überschreibt fremde Dokus).
  - Regeln: `Vollidiot/delete-order-dependents-first.md`, `Vollidiot/gallery-share-key-link.md`, Notiz zum Laptop.
  - Node v26.13.1 (LTS „Lithium“) installiert: `~/.local/lib/nodejs/`, Links in `~/.local/bin`, npm 11.20.0. Geprüft:
    Signatur der Prüfsummen-Liste (Schlüssel `5BE8 A3F6 … B168 D356`, Antoine du Hamel, an zwei Stellen gleich) und
    SHA-256 des Pakets. Nebenwirkung: `gpg --show-keys` hat ein leeres `~/.gnupg` angelegt. `npm ci` im Frontend steht
    noch aus (`node_modules` fehlt).
  - Der Tor Browser läuft noch (Port 9150 offen), der Tunnel ist zu.
- Als Nächstes: Antwort auf a) abwarten (entscheidet über eine Spalte), dann Tunnel öffnen, Kontextstart (legt
  `gallery_share` an), Feld in Solr anlegen, `npm ci`, Oberfläche „Freigabe“ in der eigenen Galerie.

## 2026-11-19 15:48 – Bestandsaufnahme vor einer größeren Erweiterung (unterwegs, Debian-Laptop)

- Ansage: „mach mal bestandsaufnahme, ich bin gerade nicht zuhause, sprich wir müssen per ssh auf den pi connecten. ich
  habe ne grössere erweiterung vor“.
- Plan (nur lesen, nichts ändern, keine großen Tests): 1. Laptop: Git-Stand gegen GitHub, Werkzeuge, `node_modules`.
  2. Pi über DynDNS (Adresse und Port: `setup.md` 5.8; Passwort-Login): System, Container, Logs, Tabellen in Postgres,
  Solr-Kern, SFTP-Speicher, Zertifikat, Code-Stand auf dem Pi gegen den Klon. 3. Code: Pakete im Backend, Module im
  Frontend, offene Punkte aus Protokoll und Konzepten. Danach kurzer Bericht, dann sagt der Nutzer die Erweiterung an.
- Vorgefunden: Die Kennwort-Notiz in `code/.env` beginnt hier mit `# pw: ` (nicht mehr `# geben: `).
- Ansagen 15:55: 1. SSH-Tunnel, Ports für Solr und Datenbank auf jeden Fall mit. 2. Im Head `gebiter` → `gebieter`.
  3. Unsicheres Netz (öffentliches WLAN in Tansania): nur auf sicherem Weg nach Hause. Kein Dev-Server hier.
- Ansage 16:37: das Tor-Tunnel-Vorgehen als eigene Todo, Schritt für Schritt und erklärt, zum Selbermachen.
- Stand 16:45, ERLEDIGT:
  - `gebieter9k` in `code/frontend/index.html` (`<title>`) und `code/frontend/src/layout/AppHeader.tsx` (Marke). Nur
    lokal: noch nicht auf dem Pi, nicht committet. OFFEN: Fuß (`AppFooter.tsx`) zeigt noch `gebiter9k`, Frage gestellt.
  - Zugang: Das WLAN sperrt ausgehend den SSH-Port nach Hause (Timeout auch zu einem fremden Testserver; 443, 8080,
    2222 gehen), die FritzBox kann der Nutzer von hier nicht ändern. Lösung: Tor Browser 16.0.1 (Signatur geprüft, in
    `~/tor-browser`), SSH über dessen Eingang `127.0.0.1:9150` mit `socat`, streng gegen den hinterlegten Host-Key.
  - TUNNEL LÄUFT seit 16:35 (von mir geöffnet, Steuer-Socket `$XDG_RUNTIME_DIR/gebieter-tunnel.sock`): 9005, 9009,
    9022 nur an `127.0.0.1`; SFTP-Host-Key, Postgres und Solr darüber geprüft. Schließen: `ssh -S <socket> -O exit x`.
  - Anleitung `docu/todo-tunnel-ueber-tor.md` geschrieben. Privat: steht in der `.gitignore`, weil Adresse und SSH-Port
    von zu Hause drinstehen (beides war bisher nicht im öffentlichen Repo).
  - Bestandsaufnahme Pi (nur gelesen, Hilfsdateien in `/tmp` wieder gelöscht): läuft seit 2026-11-11 16:18, 45,8 °C,
    RAM 2,8 von 15 GiB, NVMe 101 von 938 GB. Alle 5 Container laufen, Backend seit 2026-11-11 21:01 ohne ERROR.
    Postgres 18.6: 40 Tabellen, 12 MB, 2 User. Solr-Kern `FILE`: 26 Dokumente; SFTP: 26 Dateien, 56 GB. SSH in 8 Tagen:
    kein falsches Kennwort, von außen nur die eigenen Anmeldungen (12.11. Laptop, heute Tor).
  - Code: Pi und Klon sind gleich (817 von 825 Dateien identisch; Rest: zwei Kommentare in `UsersPointBooking.java`,
    Zeilenenden `mvnw.cmd`, Kommentar `vite.config.ts`, die zwei Änderungen von heute). Umfang: 371 Java-Klassen,
    69 Controller, 202 Endpunkte, 40 Entities; 418 TS/TSX-Dateien.
- FUNDE, dem Nutzer berichtet, nichts davon angefasst:
  1. Zertifikat läuft am 2027-01-24 ab, auf dem Pi gibt es keine Erneuerung (`/etc/letsencrypt/renewal` leer, kein
     `live`), und Port 80 ist von außen zu.
  2. `code/backend/start.sh` wartet 2 s auf den SFTP-Host-Key, über den Tor-Tunnel dauert er gut 3 s.
  3. Docker-Build-Cache auf dem Pi 36 GB (35 GB frei räumbar). 4. Drei `._`-Dateien in `/gebiter9k/code`.
  5. 65 Pakete mit Update auf dem Pi. 6. Laptop: Node/npm, `gh`, Tesseract, libheif fehlen weiter.
- NÄCHSTES: Der Nutzer sagt die Erweiterung an.
- 16:50 Ansage: „nun zu meinem eigentlichen vorhaben […] jeder user eine eigene galerie aufmacht und da bilder
  hochlädt, soweit korrekt?“ Plan: Galerie am Code prüfen (`de.gebiter.gallery`, Frontend `gallery/`,
  `konzept-galerie.md`, `entities/Gallery.md`), dann kurz bestätigen oder korrigieren. Nur lesen.
  Stand 16:55: bestätigt (Konzept, `GalleryController`, YAML gelesen). WARTET auf das Vorhaben des Nutzers.

## 2026-11-19 16:55 – Vorhaben: Galerie per Freigabeschlüssel teilen (Stück 1 Backend gebaut, Uhrzeiten ca.)

- Ansage (gekürzt): Als Admin unbegrenzt hochladen. Neu: eigener Endpunkt und eigenes Frontend-Modul, um eine Galerie
  optional über einen Token bzw. einfachen Freigabeschlüssel zu teilen. Besucher kommen ohne Anmeldung nur über den
  „Tokenlink“ auf die Galerieseite: Kachelansicht, Download einzelner, aller oder ausgewählter Bilder. Wollen sie
  bewerten: Hinweis „melde dich kostenlos an, dann kannst du bewerten und kommentieren“. Idee: das Dokument im Kern
  `FILE` bekommt ein Feld mit den Freigabe-Tokens, MULTIVALUED, mehrere Freigaben parallel. Das Feld im Solr-Manager
  („Wer liest“) auf ADMIN. Beispiel: Urlaubsbilder hochladen, verschlagworten, beschreiben, dann teilen.
  „kannst du mir soweit folgen?“
- Plan: 1. Regeln und Stellen lesen, die das berührt (`Vollidiot/platform-how-it-works`, `security-concept`,
  `controller-rules`, `file-access-rework`, `konzept-lesezugriff.md`, Share-Pfade in der Security, Lesefilter in
  `FileDocumentResolveService`, Kern `FILE`). 2. In eigenen Worten bestätigen, offene Punkte nummeriert fragen. Nur lesen.
- Stand 17:00, gelesen und dem Nutzer bestätigt:
  - Upload-Grenze gilt schon heute nicht für ADMIN und FILE_MANAGER (`FileUploadService`, Zeile 641).
  - Passt zum Prinzip: Lesegrenze im Solr-Dokument, eine Stelle (`FileDocumentResolveService
    .createReadFilterQueriesForCurrentUsers`); für Besucher ohne Anmeldung gibt es dort noch keinen Weg. Ohne Token sind
    nur `/api/share/**` offen (bisher Session, Registrierung, Login-2FA).
  - „Wer liest“ ist genau ein Recht je Feld (`SolrDocumentFieldService.getReadableSolrFieldNames`); ein Besucher hat
    kein Recht und bekäme heute kein einziges Feld.
  - Bewerten gibt es (`FileCheer`, `/api/file-cheer`), Kommentare an Dateien gibt es noch nicht.
- OFFEN, dem Nutzer nummeriert gestellt: 1. wer freigeben darf (nur ADMIN oder Recht `FREIGABE`), 2. Ablauf einer
  Freigabe, 3. welche Felder ein Besucher sieht und wo das eingestellt wird, 4. Download als Original mit EXIF/GPS,
  5. Kommentare an Bildern jetzt oder später. Noch nichts gebaut.
- 17:05 ENTSCHIEDEN vom Nutzer:
  - Das Modul löst nach dem Schlüssel auf, lädt die Dateien aus Solr und zeigt sie; Viewer und Download müssen mit dem
    Schlüssel ebenfalls gehen.
  - Freigabe eintragen: „admin und ar freigabe soll erforderlich sein“ (und/oder nachgefragt).
  - Laufzeit einstellbar in der eigenen Galerie unter „Freigabe“: dauerhaft, zeitlich begrenzt oder Aufrufe begrenzt.
    Steht in Postgres und wird getrennt geprüft (nicht über den Solr-Filter).
  - Beim Erteilen über alle Dateien der Galerie in Solr gehen und den Schlüssel hineinschreiben; die Dateianzahl in
    Postgres mitführen, als Fehlerkontrolle.
  - Felder: erst dem Admin alle zeigen; was ein Besucher sieht, sagt der Nutzer, wenn das Modul steht.
  - EXIF darf der Besucher sehen und bleibt in der Datei (Download = Original).
  - Kommentare und Bewertungen werden allen angezeigt; eintragen nur ein bekannter (angemeldeter) User.
- OFFEN, nummeriert gefragt: 1. ADMIN oder `FREIGABE` (oder beides nötig), 2. was als Aufruf zählt. Dazu Reihenfolge der
  Stücke vorgeschlagen. Noch nichts gebaut.
- 17:12 ENTSCHIEDEN vom Nutzer: 1. Freigeben darf, wer ADMIN ist ODER das Recht `FREIGABE` hat. 2. Ein Aufruf ist: ein
  Bild wird heruntergeladen oder der Viewer lädt es. Dazu: alle Bilder einer Galerie herunterladen UND eine Auswahl
  (beliebig viele Kacheln anwählen). 3. AUFTRAG: Code zuerst lokal im Projekt; dann testen über die gemappten Ports
  (Solr und Postgres auf dem Pi werden dabei erweitert); wenn alles läuft, auf den Pi schieben und neu bauen.
- Reihenfolge der Stücke (von mir vorgeschlagen, nicht widersprochen): 1. Freigabe anlegen (Tabelle, Feld im Kern
  `FILE`, Schlüssel in alle Bilder schreiben mit Zählkontrolle, „Freigabe“ in der eigenen Galerie). 2. Besucherseite
  (auflösen, Kacheln, Viewer, Download einzeln). 3. Download Auswahl und alle. 4. Bewertungen/Kommentare anzeigen,
  Hinweis zur Anmeldung, Kommentare an Bildern neu.
- LÄUFT, Stück 1, Backend: zuerst Regeln (`Vollidiot/`: Code-Stil, Naming, Schichten, YAML, Entity-Doku) und die
  Vorbilder lesen (`gallery/`, `FileUploadService.uploadFileIntoGallery`, Felder im Solr-Manager, `FileConfig`).
- 17:20 Ansage: „sag mir dann noch wie wir es mit dem downloader machen […] sicherheitstechnisch höllisch aufpassen
  […] prüfe da die logik bitte öfters auch gegen“.
  - Entwurf dem Nutzer vorgelegt (Stück 2/3, noch nicht gebaut): Abholschein je Zugriff. POST mit Schlüssel + id(s) im
    Body → Prüfung Form, Freigabe in Postgres, Dokument trägt die Freigabe in Solr, Aufruf zählen in EINER
    SQL-Anweisung mit Grenze und Ablauf → Abholschein (32 Byte Zufall, ~60 s, nur im Speicher) → GET mit dem Schein als
    einzigem Wert, Solr-Prüfung erneut, Stream mit den heutigen Schutz-Headern. Auswahl/alle: ein Schein für eine Liste,
    ZIP wird durchgestreamt, Dateinamen bereinigt.
  - Im Code geprüft: `SftpConnectionPool.borrowSftpChannel` zählt Aufrufer ohne Anmeldung nur gegen die Gesamtgrenze
    (10) → eigener Deckel für Besucher nötig. `CurrentUsersProvider.currentUsersAccessRoleKeys/Guid` werfen ohne
    Anmeldung → Besucherwege dürfen sie nie rufen (`isAuthenticated` ist sicher). `generate_entity_docs.py` schreibt das
    erste Dokument des Exports nach `docu/solr-cores/FILE.md` (öffentlich) → in Solr nur der SHA-256 des Schlüssels.
    Link mit dem Schlüssel hinter `#`. Galerie löschen muss die Freigaben mit entfernen.
  - Gefragt: 1. Schlüssel auch in Postgres nur als Hash (Link nur einmal sichtbar)? 2. Bezeichnung je Freigabe?
    Bis zur Antwort gebaut wird: Hash in Solr und Postgres, ohne Bezeichnung.
- 17:30 KORREKTUR des Nutzers: KEINE Abholscheine. Der Schlüssel ist ein dauerhaftes Access-Token, Link etwa
  `<host>/share/galerie/<id>/<token>`; mit genau diesem Token holt man auch die Dateien, solange es gültig ist und im
  mehrwertigen Feld des Dokuments steht. Das Feature läuft parallel zur anderen Freigabe.
  - Entwurf angepasst (Stück 2/3): Viewer/Download direkt mit Schlüssel + Datei-id; je Abruf Solr-Prüfung (Dokument
    trägt den Hash, nicht gelöscht), dann Aufruf zählen in EINER SQL-Anweisung (Ablauf, Grenze), dann Stream. „Alle“:
    Abruf nur mit dem Schlüssel, ZIP wird gestreamt. nginx-Log für diese Adressen aus (Schlüssel steht in der Adresse).
  - Gefragt: 1. Ausnahme von der Regel „GET nur ein Wert“ (Schlüssel + Datei-id, beide Hex)? 2. weiter offen: Link
    wieder abrufbar (Klartext in Postgres) oder nur einmal sichtbar (Hash)?
- 17:36 VORGABE des Nutzers für Stück 3: Die Urlaubsgalerie wird 50 bis 100 GB groß; der Download muss auf dem Pi
  speicherschonend laufen, „bilderbuchmäßig“. Also: ZIP nie als Ganzes (kein RAM, kein `/tmp`, das ist tmpfs), Bild für
  Bild vom SFTP mit festem Puffer in die Antwort, ohne Kompression, ZIP64, nginx ungepuffert.
- Stand 17:47, Stück 1 BACKEND GEBAUT (lokal, `./mvnw -o -DskipTests clean compile` ok; nichts getestet, nichts auf
  dem Pi, Postgres und Solr unberührt):
  - Neu: `gallery/model/GalleryShare` (Tabelle `gallery_share`), `gallery/repository/GalleryShareRepository`,
    `gallery/service/GalleryShareService`, `gallery/controller/GalleryShareController` (`/api/gallery-share`: POST
    anlegen, POST `/resolve`), DTOs `NewGalleryShare`, `GalleryShareResolveRequest`, `GalleryShareForClient`,
    `CreatedGalleryShare`.
  - Geändert: `Helper.createRandomHexKey`; `application.yaml` (`gebiter.gallery-share.key-bytes`,
    `gebiter.file.field.gallery-share-key-hashes`); `FileSolrFieldNames.galleryShareKeyHashes`;
    `SolrDocumentService.addFieldValueToSolrDocuments`/`removeFieldValueFromSolrDocuments` (Atomic Update
    `add-distinct`/`remove`); `FileDocumentWriteService.addBackendFieldValueToFileDocuments`/`remove…`;
    `FileDocumentResolveService.countActiveFileDocumentsWithGalleryShareKeyHash`;
    `GalleryService.checkOwnGalleryExists`; `FileUploadService.uploadFileIntoGallery` (Hashes der Freigaben ins neue
    Dokument, danach `fileCount` +1).
  - Doku: `docu/konzept-galerie-freigabe.md` (Entscheidungen, zwei Schlösser, Stück 1, offene Punkte),
    `docu/entities/GalleryShare.md`, Zeile in `docu/entities/README.md`.
  - VORFALL 1: `python3 docu/tools/generate_entity_docs.py` (ohne `--solr-export`) hat 15 von Hand ergänzte
    Entity-Dokus überschrieben und in drei Controllern den Verweis auf `docu/solr-cores/FILE.md` entfernt. Alle 18
    Dateien sofort mit `git checkout` auf den Stand davor zurückgesetzt (sie waren vorher unverändert); behalten nur die
    neue `GalleryShare.md` und die Verweise in den zwei neuen Klassen. Das Werkzeug nicht blind laufen lassen.
  - VORFALL 2 (17:50): Ein eigenes Python-Skript zum Nachziehen dieses Protokolls hat die Datei zerstört (falsche
    Endmarke, leerer Suchtext, der neue Absatz stand zwischen jedem Zeichen, 133 MB). Zurückgerechnet auf den Stand
    davor und per Gegenprobe Zeichen für Zeichen bestätigt (52593 Zeichen, 562 Zeilen). Lehre: dieses Protokoll nur
    mit dem Edit-Werkzeug ändern, nie per Skript mit berechneten Grenzen.
  - Tunnel: Der Steuer-Socket ist weg (17:47), der Tunnel über Tor ist abgerissen. Vor dem Testen neu öffnen.
- OFFEN vor dem Testen, den Nutzer gefragt: 1. Ausnahme „GET nur ein Wert“ für Schlüssel + Datei-id. 2. Link wieder
  abrufbar oder nur einmal sichtbar (bestimmt die Spalte `share_key_hash`; deshalb die Tabelle noch nicht angelegt).
  3. Bezeichnung je Freigabe. 4. Löschvorgänge (Freigabe löschen, Galerie löschen) so bauen wie vorgeschlagen.
- NÄCHSTES nach den Antworten: Löschvorgänge, dann Test über den Tunnel (legt `gallery_share` in Postgres und das Feld
  `galleryShareKeyHashes` im Solr-Manager und in Solr an), dann die Oberfläche „Freigabe“. Für das Frontend fehlt Node
  auf dem Laptop.

## 2026-11-11 23:55 – Zweiter Rechner (Debian-Laptop) einrichten

- Ansage: „ich würde gern hier jetzt mein Repo klonen und einrichten, dass wir es hier auch pushen können, wenn wir
  unterwegs an was dran arbeiten. […] Schau mal das Ding durch, ob du damit was anfangen kannst und ob da noch weitere
  Dinge holen müssen. […] npm-dev und Spring […] Datenbank auf dem Pi […] SSH-Tunnel […] Ports von Solr und Postgres
  […] DynDNS [Adresse]“. Regeln gelten aus `Vollidiot/`.
- Rechner: Debian 13 (`microslop`), Projekt unter `~/Dokumente/coding/fullstackprojekt/gebieter9k` (Ordner mit „ie“).
- Vorgefunden: Klon sauber auf `origin/main`. `.env` und `gebiter9k.env` (gleich) und `setup.md` liegen im
  Projektordner statt in `code/.env` und `docu/setup.md`; `Vollidiot/` ist da, `.claude/` fehlt. Werkzeuge: Git und
  Java 25 da; es fehlen `gh`, nvm/Node, Tesseract, libheif, `~/.ssh`.
- Plan: 1. Abschnitte 4.3, 5.8, 5.15 der `setup.md`, `start.sh`, `vite.config.ts` lesen. 2. Dateien an ihren Platz
  (`code/.env`, `docu/setup.md`, chmod 600). 3. `.claude/settings.local.json` (Memory-Ordner `Vollidiot`). 4. Werkzeuge.
  5. SSH zum Pi über DynDNS (Adresse und Port: `setup.md` 5.8; Tunnel für Postgres, Solr, SFTP). 6. Git-Autor und `gh`-Anmeldung.
- Stand 2026-11-12 00:05:
  - ERLEDIGT: `code/.env` und `docu/setup.md` an ihrem Platz (600, von Git ignoriert), Duplikat `gebiter9k.env` gelöscht
    (war identisch). Git-Autor `codergod1337` + noreply nur für dieses Repo. Pi (LAN und DynDNS, Adresse und Port: `setup.md` 5.8) in
    `~/.ssh/known_hosts`, Fingerprint wie in `setup.md` 5.1; `~/.ssh/config` nicht angelegt (Regel). Dev-Zertifikat in
    `code/frontend/.cert`. `./mvnw clean compile` ok. Kontext-Test gegen den Pi ok (Profil `LAN`, SFTP-Host-Key geprüft).
    Tunnel über DynDNS mit Passwort getestet (Ports 19005/19009/19022, Solr 200, SFTP-Host-Key richtig), wieder zu.
    `docu/neuer-rechner.md`: nvm und `gh` für Debian ergänzt.
  - BLOCKIERT durch die Rechteprüfung von Claude Code, macht der Nutzer: `.claude/settings.local.json` (Memory-Ordner
    `Vollidiot`), nvm-Installation (Skript aus dem Netz). Braucht sudo, macht der Nutzer: `gh`, Tesseract, libheif.
  - OFFEN: danach `npm ci`, `gh auth login` + `gh auth setup-git`. Nichts committet; Nutzer (00:10): die
    Doku-Änderungen nicht pushen. Er testet den Tunnel selbst von zu Hause aus.
  - Vorfall: Beim Auflisten der `.env`-Schlüssel stand die Kommentarzeile mit dem Kennwort von `thomas` in der
    Tool-Ausgabe (der `sed` hat nur Werte nach `=` maskiert). Dem Nutzer gemeldet.

## 2026-11-11 23:35 – Anleitung für einen neuen Rechner ins Repo (fertig, auf GitHub)

- Ansage: „ist jetzt der Stand endlich auf Git? So komplett, dass wir loslegen können auf einem anderen Rechner. Also
  Doku hat ja hoffentlich alle Anleitungen drin, wie man das Ding initialisiert. Ja, nein, vielleicht.“
- Antwort: Nein. Der Code ist vollständig auf GitHub, aber die Anleitung (`docu/setup.md`, privat, mit echten
  Zugangsdaten) und `code/.env` sind bewusst nicht im öffentlichen Repo; ein frischer Klon hat keine Anleitung.
- Plan: `docu/neuer-rechner.md` schreiben, ohne Geheimes: was man installiert, was man von Hand mitnimmt (`code/.env`,
  `docu/setup.md`, `Vollidiot/`), Zertifikat des Dev-Servers, Backend und Frontend starten, Git und Push. Den Verweis
  in `code/frontend/vite.config.ts` darauf umstellen. Commit und Push.
- Stand 23:50: FERTIG. `docu/neuer-rechner.md` geschrieben (aus `setup.md` Abschnitt 4, `start.sh`, `vite.config.ts`,
  `.env.example`; ohne Zugangsdaten), `vite.config.ts` verweist darauf (nur Kommentar und Fehlermeldung des Dev-Servers,
  kein Bau auf dem Pi nötig). Die Schritte selbst habe ich auf keinem zweiten Rechner ausprobiert.
- OFFEN: Der Nutzer muss `code/.env`, `docu/setup.md` und `Vollidiot/` selbst auf den anderen Rechner bringen.

## 2026-11-11 23:00 – GitHub-Anmeldung über den Browser (fertig)

- Ansage: „Wir brauchen kein Access-Token […] Wir können uns ganz normal im Browser anmelden […] Mach das.“
- Plan: GitHub CLI (`gh`) über Homebrew installieren, `gh auth login --web` (Anmeldung im Browser mit Einmal-Code),
  `gh auth setup-git` (git nimmt für github.com den Zugang von `gh`), danach Push mit dem normalen `git` prüfen.
- Stand 23:25: FERTIG. `gh` 2.103.3 installiert (`brew install gh`), angemeldet als `codergod1337` über den Browser
  (Einmal-Code auf github.com/login/device; der erste Versuch scheiterte, weil der Nutzer den Code nicht sah und den Tab
  schloss, beim zweiten stand der Code vorher im Chat). `gh auth setup-git` hat in `~/.gitconfig` für github.com den
  Helfer `gh auth git-credential` eingetragen. Ab jetzt: einfach `git push`, ohne Schlüsselbund-Fenster.

## 2026-11-11 22:16 – Projekt nach GitHub (fertig, auf GitHub)

- Ansage: „ich habe jetzt auf GitHub ein Repo erstellt, da müssten wir jetzt unseren geistigen Erguss noch hinpushen.
  Kannst du die Git-Ignore vernünftig setzen, dass nur das an Code hochkommt, was wir brauchen. Also tendenziell würde
  ich gerne den Ordner Code und den Ordner Doku in Git pushen. Würde das Sinn machen?
  https://github.com/codergod1337/gebieter9k“
- Plan: 1. ansehen, was in `code/` und `docu/` liegt (Größen, fremde Vorlage, Bau-Ergebnisse). 2. Nach Geheimem suchen
  (`.env`, Zugänge in `setup.md`, Schlüssel, Zertifikate, persönliche Daten), nichts davon darf hoch. 3. `.gitignore`
  im Projektordner: nur `code/` und `docu/`, ohne Bau-Ergebnisse und Geheimes. 4. `git init`, Liste der Dateien prüfen,
  Commit, Remote, Push.
- Stand 22:40: Repository im Projektordner angelegt (`git init`, Zweig `main`), `.gitignore` im Projektordner, ein Commit
  mit 883 Dateien (4,9 MB), Remote `origin` = `https://github.com/codergod1337/gebieter9k.git`.
  - Im Repository: `code/` (Backend, Frontend, `compose.yaml`, `.env.example`, Solr-Configset) und `docu/`.
  - Draußen: `code/.env`, `docu/setup.md` (echte Passwörter und Schlüssel), `code/vorlage/` (eigenes Repository,
    3,5 GB), `node_modules`, `target`, `dist`, `.cert`, dazu alles außerhalb von `code/` und `docu/` (`mounts/`,
    `Vollidiot/`, `.claude/`).
  - Geprüft über genau die Dateien im Commit: kein Wert aus `code/.env` (Passwörter, Host-Key, TOTP-Schlüssel) und
    nicht das Kennwort des Servers; keine Schlüssel- oder Zertifikatsdateien; keine echte Mail-Adresse.
  - Autor des Commits: `codergod1337` mit der noreply-Adresse von GitHub, nur für dieses Repository gesetzt.
  - Das GitHub-Repo ist ÖFFENTLICH und war beim Prüfen leer.
  - PUSH NICHT ERFOLGT: `git push` blieb am macOS-Schlüsselbund hängen (wartet auf Freigabe bzw. Anmeldung am
    Bildschirm), ich habe ihn beendet; auf GitHub ist nichts angekommen. Der Nutzer schiebt selbst:
    `cd /Users/rottenapple69/dev/gebiter9k && git push -u origin main`.
- Stand 22:45: GEPUSHT. Ansage des Nutzers: Ich soll selbst pushen. Der Weg: `/usr/bin/git push` (das Git von Apple)
  mit Zeitgrenze. Der GitHub-Zugang liegt im macOS-Schlüsselbund; bei jedem Push fragt der Schlüsselbund am Bildschirm,
  bis der Nutzer „Immer erlauben“ klickt. Beim ersten Push wurde erlaubt: `main` auf GitHub steht auf dem ersten Commit
  (883 Dateien). Der zweite Push (nur dieser Protokoll-Stand) wurde im Dialog abgebrochen (Fehler -128); der Commit
  liegt lokal und geht mit dem nächsten Push mit.
- Stand 22:55: Auch der Protokoll-Commit ist gepusht, lokal und GitHub sind gleich. Geklärt: Der GitHub-Zugang liegt
  seit dem 2026-08-31 im Schlüsselbund (`github.com`, Account `codergod1337`); der Dialog beim Push will das
  Anmeldepasswort des Mac und „Immer erlauben“, nicht das GitHub-Passwort.
- OFFEN: seine Entscheidung, ob das Repo öffentlich bleibt; ob
  `mounts/nginx/conf/default.conf` mit hinein soll.

## 2026-11-11 20:52 – Markt: Kaufen (fertig, auf dem Pi; der Nutzer testet)

- Ansage (2026-11-11, steht seit dem Nachmittag als nächstes Stück): „Ich würde aber auch erst dafür sorgen, dass wir
  erstmal Memes hochladen können. Und auch kaufen können.“ Entschieden: Ein Kauf läuft nie ab; 90 % an den Verkäufer,
  10 % Marktgebühr verschwinden.
- Plan (nur dieses Stück; Nutzen, also Zähler herunter, kommt danach):
  1. Backend: `POST /api/shop-order` mit `{shopOfferId}` → `ShopOrderService.createShopOrder`, alles in einer
     Transaktion: Angebot läuft und zählt in EINER Anweisung hoch (`ShopOfferService`), Beleg `ShopOrder`, Punkte des
     Käufers ab und Anteil an den Verkäufer über `UsersPointBookingService` (neue Gründe `SHOP_PURCHASE`, `SHOP_SALE`),
     Besitz `UsersShopItem` in einer Anweisung (anlegen oder aufstocken). Abgelehnt (409): Angebot läuft nicht mehr,
     Punkte reichen nicht, eigener Artikel, schon dauerhaft im Besitz. Gebühr in der YAML
     (`gebiter.shop.market-fee-percent`).
  2. Die Artikel einer Rubrik kommen mit dem, was der Betrachter davon hat (`ShopItemForClient.ownUsersShopItem`).
  3. Frontend: an der Kachel je Angebot der Knopf „Kaufen“ → Popup zur Bestätigung (was, Preis, Punktestand vorher
     und nachher) → „Für x Punkte kaufen“; danach steht an der Kachel, was man hat. Kontobuch im Profil: Texte für die
     neuen Gründe.
  4. Pi-DB vor dem Start: Prüfregel `users_point_booking_booking_reason_check` mit den neuen Gründen neu anlegen.
  5. Doku: `entities/ShopOrder.md`, `UsersShopItem.md`, `ShopOffer.md`, `ShopItem.md`, `UsersPointBooking.md`,
     `konzept-shop.md`, `setup.md`; Notiz `shop-requirements`.
- Stand 21:05: FERTIG und auf dem Pi (Bau 21:00, Start 17,0 s, kein ERROR).
  - Backend neu: `shop/service/ShopOrderService`, `UsersShopItemService`, `shop/controller/ShopOrderController`,
    `shop/repository/ShopOrderRepository`, `UsersShopItemRepository`, `shop/dto/NewShopOrder`,
    `shop/ShopOrderRejectedException` (409). Geändert: `ShopOfferService` (`getShopOffer`,
    `increaseShopOfferPurchaseCount`), `ShopOfferRepository`, `ShopItemService` (`getShopItem`, Besitz in
    `resolveShopItems`), `ShopItemForClient`, `UsersPointBookingService` (`createShopPurchaseBooking`,
    `createShopSaleBooking`), `UsersPointBookingReason`, `GlobalExceptionHandler`, `application.yaml`.
  - Frontend neu: `shop/ShopOrder.ts`, `shop/useShopOrder.ts`, `shop/UsersShopItem.ts`, `market/BuyShopOfferPopup.tsx`.
    Geändert: `market/MarketCategoryTab.tsx`, `market/marketTexts.ts`, `shop/ShopItem.ts`, `users/UsersPointBooking.ts`.
  - Pi-DB: Prüfregel der Buchungsgründe erneuert.
  - Getestet per Wegwerf-Test gegen die Pi-DB (Rollback, Test gelöscht), siehe `entities/ShopOrder.md`. NICHT geprüft:
    Oberfläche im Browser, zwei wirklich gleichzeitige Käufe.
  - Nach dem Bau nur noch ein Kommentar geändert (`users/model/UsersPointBooking.java`, Javadoc): Mac und Pi
    unterscheiden sich in dieser einen Datei, geht mit dem nächsten Bau mit.
  - Beobachtung aus der Pi-DB: Es gibt genau einen User (332 Punkte), einen echten Artikel und ein echtes Angebot
    (50 Punkte, dauerhaft). Zum Kaufen im Browser braucht es einen zweiten User mit Punkten.
- OFFEN, als Nächstes: Nutzen (Zähler herunter). Davor steht laut Reihenfolge des Nutzers: Regel fürs Bearbeiten je
  FileClass festlegen, sobald Memes hochgeladen und gekauft werden können.

## 2026-11-11 20:38 – Markt: jede Rubrik hat genau eine FileClass, der Upload wählt sie nicht mehr (fertig, auf dem Pi; der Nutzer testet)

- Ansage: „ich würde in einer Rubrik, also eine Rubrik für den Markt, würde ich immer eine File-Class voraussetzen. Und
  dann kannst du dir nämlich auch schenken, dass man beim Upload diese File-Class nochmal extra wählen soll oder kann.
  Weil dann kann man das nämlich hart reincoden. Also wie gesagt, pro Rubrik im Markt erstmal das [eintragen]. Und dann
  kannst du das ans Upload-Skript quasi mitgeben, dass es immer drin ist.“
- Plan:
  1. Backend: `ShopCategory` bekommt das Pflichtfeld `fileClassKey` (anlegen und ändern prüfen, dass es die FileClass
     gibt). Der Upload in eine Rubrik setzt die FileClass im Backend aus der Rubrik, der Client schickt keine mehr.
  2. Die Zuordnungstabelle `ShopCategoryFileClass` (mehrere FileClasses je Rubrik) fällt damit weg: Entity, Repository,
     Service, beide Controller, Frontend-Typ und Hook, die Spalten „Markt: …“ im Tab „FileClass-Ziel“.
  3. Frontend: Rubrik anlegen mit Pflicht-Auswahl der FileClass, in der Tabelle der Rubriken änderbar; im Ablauf „neues
     Angebot“ keine Auswahl der FileClass mehr.
  4. Pi-DB im Bau-Skript: Spalte `shop_category.file_class_key` anlegen, aus `shop_category_file_class` füllen (`MEMES`
     → `MEME`, `PROFILE_BANNER` → `PROFILE_BANNER`), Pflicht setzen, Tabelle `shop_category_file_class` löschen.
  5. Doku: `entities/ShopCategory.md`, `entities/ShopCategoryFileClass.md` löschen, `ShopItem.md`, `README.md`,
     `konzept-shop.md`, `konzept-file-kern.md`, `setup.md`; Notizen `shop-requirements`, `upload-paths-per-purpose`.
- Stand 20:50: FERTIG und auf dem Pi (Bau 20:47, Start 16,3 s, kein ERROR).
  - Backend: `ShopCategory.fileClassKey` (Pflicht), `ShopCategoryService` (`createShopCategory` mit FileClass,
    `changeShopCategory` ändert Name und FileClass, neu `getFileClassKeyOfShopCategory`),
    `FileUploadService.uploadFileIntoShopCategory` setzt die FileClass der Rubrik in die Felder (was der Client schickt,
    zählt nicht). Gelöscht: `ShopCategoryFileClass` samt Repository, Service, zwei Controllern.
  - Frontend: Tab „Rubriken“ mit Spalte „FileClass“ (Klick ändert, `EditShopCategoryFileClassPopup`), „neue Rubrik“ mit
    FileClass als Pflicht (`NewKeyDisplayNamePopup` bekam `extraFields`); `FileUploadForm` kennt `fixedFileClass` (nur
    gezeigt, keine Auswahl); Markt nutzt es; Spalten „Markt: …“ im Tab „FileClass-Ziel“ entfernt. Gelöscht:
    `shop/ShopCategoryFileClass.ts`, `shop/useShopCategoryFileClass.ts`, `admin/fileclass/fileClassShopCategoryTexts.ts`.
  - Pi-DB: Spalte `shop_category.file_class_key` (Pflicht; `MEMES` → `MEME`, `PROFILE_BANNER` → `PROFILE_BANNER`),
    Tabelle `shop_category_file_class` gelöscht.
  - Getestet per Wegwerf-Test gegen die Pi-DB (Rollback, Test gelöscht): 15 Fälle, siehe `entities/ShopCategory.md`.
    NICHT geprüft: Oberfläche im Browser, ganzer Upload mit echter Datei.
  - Doku: `entities/ShopCategory.md`, `ShopItem.md`, `README.md`, `ShopCategoryFileClass.md` gelöscht, `konzept-shop.md`
    (Abschnitt 11), `konzept-file-kern.md` (Upload-Wege), `setup.md`.
- OFFEN, als Nächstes: Kaufen.

## 2026-11-11 18:12 – FileClass „Profile-Banner“ und Rubrik dazu im Markt (fertig, in der Pi-DB)

- Ansage: „Dann kannst du gleich nochmal eine neue File-Class anlegen. Die würde ich Profile-Banner nennen. Passend dazu
  kannst du auch direkt eine Rubrik dazu anlegen im Market.“
- Plan: FileClass `PROFILE_BANNER`, Anzeigename „Profile-Banner“, Badge, Endungen png, jpg, jpeg. Rechte: `USER` lesen;
  `MODERATOR` und `ADMIN` lesen + hochladen (Ansage vom selben Tag: Moderator oder Admin sollen im Markt hochladen
  können; wer sonst darf, hat der Nutzer nicht gesagt, er ändert es in der Matrix „FileClass-AR“). Rubrik
  `PROFILE_BANNER` „Profile-Banner“ und der Haken Rubrik × FileClass, damit „neues Angebot“ dort sofort geht. Alles über
  die Services (Wegwerf-Test mit Commit), kein Code, kein Bau.
- Nur FileClass und Rubrik: Das Banner im Profil selbst (Seitenverhältnis, Anlegen im Profil) ist nicht Teil davon.
- Stand 18:13: ANGELEGT in der Pi-DB (Wegwerf-Test mit Commit, danach gelöscht): FileClass `PROFILE_BANNER` (Platz 8,
  Badge Bordeaux/Neongelb mit Streifen, Symbol `card-image`, png/jpg/jpeg; `USER` L, `MODERATOR` LH, `ADMIN` LH),
  Rubrik `PROFILE_BANNER` „Profile-Banner“ (Platz 2), Haken `PROFILE_BANNER` × `PROFILE_BANNER`. Kein Code geändert,
  kein Bau nötig (keine Kopien im Speicher). Doku: `konzept-file-kern.md` („Erste FileClasses“),
  `entities/ShopCategoryFileClass.md`, `setup.md`.
- OFFEN, als Nächstes: Kaufen.

## 2026-11-11 18:01 – Markt: „neues Angebot“ als geführter Ablauf statt Felder pauschal im Tab (fertig, auf dem Pi; der Nutzer testet)

- Ansage (gekürzt): „Du kannst doch nicht dieses […] Angebot Hochlade-Interface pauschal in den Market Store packen […]
  Du musst doch das auf einen extra Knopf legen mit neues Angebot erstellen oder sowas. Du musst es geführt sein. Ich
  will als allererstes mal die Datei hochladen. Gucken, ob das überhaupt funktioniert. Wenn die Datei oben ist, dann
  sage ich ob es dauerhaft oder befristet ist. Bei befristet kann ich dann sagen, wann, ansonsten blendest du das erst
  gar nicht ein. Und dann, ob ich das so verkaufe, dass der User das dauerhaft nutzen kann, also unbegrenzt. Oder ob
  ich nur eine Anzahl an Nutzungen verkaufe. Da kannst du selber ein Wording überlegen […] entweder setze ich dann
  einen Haken bei unbegrenzt oder wenn nicht, dann kommt die Eingabe mit, wie oft darf es benutzen.“
- Umbau: Die Angebots-Box und die Upload-Maske verschwinden aus dem Tab der Rubrik. Dort steht oben rechts der Knopf
  „neues Angebot“ (wer in die Rubrik hochladen darf). Er öffnet ein Popup mit Schritten: (1) Datei hochladen (der
  globale Upload-Ablauf), (2) Laufzeit: dauerhaft oder befristet, „bis wann“ nur bei befristet, (3) Nutzung: Haken
  „unbegrenzt“, ohne Haken „wie oft“, (4) Preis, dazu nur ohne „unbegrenzt“ wahlweise eine Stückzahl; dann „Angebot
  erstellen“.
- Backend dazu: Der Upload in eine Rubrik legt wieder NUR den Artikel an (ohne Angebot). Neu `POST /api/shop-offer`:
  Angebot zu einem eigenen Artikel (Verkäufer oder ADMIN). Artikel ohne Angebot zeigen an der Kachel „noch kein
  Angebot“, der Verkäufer kann es von dort nachholen.
- Stand 18:09: fertig und auf dem Pi (Start 17,0 s, kein ERROR). Backend: `shop/ShopAccessDeniedException` (403 im
  `GlobalExceptionHandler`), `NewShopOffer` mit `fileDocumentId`, `ShopItemService.createShopOfferOfOwnShopItem`,
  `ShopOfferService.createShopOffer`, `ShopOfferController` (`POST /api/shop-offer`); Upload-Daten und
  `FileUploadFacts` wieder ohne Angebot. Frontend: `market/NewShopOfferPopup.tsx` (neu), `market/shopOfferInput.ts`
  (Prüfung je Schritt), `shop/useShopOffer.ts` (neu), `market/MarketUploadBox.tsx` (nur noch der Upload-Schritt),
  `market/MarketCategoryTab.tsx` (Knopf, Kachel-Fuß); `market/MarketOfferFields.tsx` gelöscht. Wegwerf-Test grün und
  gelöscht. Doku: `entities/ShopOffer.md` neu geschrieben, `ShopItem.md`, `konzept-shop.md` 11, `setup.md`. Notiz
  `guided-creation-flow` angelegt.
- NICHT geprüft: die Oberfläche (Popup, Schritte) und ein ganzer Upload mit echter Datei.
- OFFEN, als Nächstes: Kaufen.

## 2026-11-11 17:48 – Markt: Angebot gleich beim Hochladen, Rubrik nicht mehr „leer“ (fertig, auf dem Pi; der Nutzer testet den echten Upload)

- Ansage: „Aber jetzt fehlt doch noch das neue Entity, oder nicht? Ich muss ja jetzt den Market Angebote machen können.
  Sprich, ein Moderator oder ein Admin soll auf jeden Fall eine Datei hochladen können. Und zusätzlich gleich sagen
  können, was das Offer ist, also ob es temporär ist, ob es nur eine bestimmte Frist gibt, bestimmte Anzahl an
  Downloads, was der Preis ist, ob unbegrenzt oder irgendein anderes Limit. Das sehe ich jetzt noch nicht. […] ich finde
  es relativ leer und finde nichts, wie man was hinzufügen kann.“
- Damit ist meine alte Frage beantwortet: Das Hochladen im Markt legt das Angebot gleich mit an.
- Ursache für „leer“: Der Haken „Markt: Memes“ an `MEME` fehlte, ohne ihn zeigt der Tab der Rubrik keine Upload-Maske.
  Ich setze ihn selbst und zeige im Tab künftig einen klaren Hinweis, wenn in einer Rubrik nichts hochgeladen werden
  kann.
- Plan: (1) Backend: `NewShopOffer` im Teil `data` des Markt-Uploads, vor dem ersten Byte geprüft; nach dem Einchecken
  entstehen Artikel UND Angebot in einer Transaktion; `ShopOfferService`, `ShopOfferRepository`; die laufenden Angebote
  kommen mit den Artikeln einer Rubrik zum Client. (2) Frontend: über der Upload-Maske im Markt die Felder des Angebots
  (Preis, dauerhaft oder Anzahl Nutzungen, Frist, Stückzahl), an jeder Kachel das Angebot. (3) Haken setzen, Test, Pi.
- Kaufen kommt danach.
- Stand 17:51: Backend fertig und kompiliert: `shop/dto/NewShopOffer`, `shop/repository/ShopOfferRepository`,
  `shop/service/ShopOfferService` (`requireValidNewShopOffer`, `createShopOfferOfUploadedShopItem`,
  `getRunningShopOffersByShopItemId`); `FileUploadIntoShopCategoryData` und `FileUploadFacts` tragen das Angebot;
  `ShopItemService.prepareShopCategoryUpload` prüft es vor dem ersten Byte, `createShopItemOfUploadedFile` legt Artikel
  und Angebot in einer Transaktion an; `ShopItemForClient` hat `runningShopOffers`. Regel aus der Ansage vom 2026-11-10:
  mit Stückzahl kein dauerhafter Kauf. Als Nächstes das Frontend (Angebotsfelder über der Upload-Maske, Angebot an der
  Kachel, Hinweis statt leerer Rubrik), dann Haken `MEMES` × `MEME` setzen, Test, Pi.
- Stand 17:55: Frontend fertig (`shop/ShopOffer.ts`, `market/MarketOfferFields.tsx`, `market/shopOfferInput.ts`,
  `market/shopOfferSummary.ts`; `MarketUploadBox`, `MarketCategoryTab`, `useShopItem`, `ShopItem.ts` angepasst;
  `gallery/GalleryImageTile.tsx` hat neu den optionalen Fuß `footer`). Wegwerf-Test grün und gelöscht. Haken `MEMES` ×
  `MEME` in der Pi-DB GESETZT. Auf dem Pi gebaut (Start 17,1 s, kein ERROR). Doku nachgezogen: `entities/ShopOffer.md`,
  `ShopItem.md`, `ShopCategoryFileClass.md`, `konzept-shop.md` 11, `setup.md`.
- NICHT geprüft: ein ganzer Upload mit echter Datei und die Oberfläche (ich kann mich nicht anmelden).
- OFFEN, als Nächstes: Kaufen (Plan steht im Eintrag „Markt Stück 3“ weiter unten).

## 2026-11-11 17:09 – Markt Stück 3: Memes in eine Rubrik hochladen (fertig, auf dem Pi; der Nutzer testet den echten Upload)

- Ansage: „Ich würde aber auch erst dafür sorgen, dass wir erstmal Memes hochladen können. Und auch kaufen können.“
- Plan (wie der Galerie-Upload gebaut ist): neuer Upload-Weg `FileUploadService.uploadFileIntoShopCategory` über dem
  gemeinsamen Kern; `data` nennt die Rubrik und die Felder; geprüft: Rubrik gibt es, FileClass ist in der Rubrik erlaubt
  (`ShopCategoryFileClass`), Schalter „Hochladen“. Nach dem Einchecken entsteht der Artikel (`ShopItem`). Endpunkt
  `POST /api/shop-item/upload`; der Pfad muss in die Upload-Liste der nginx-`default.conf`. Frontend: Hochladen im Tab
  der Rubrik über den globalen Upload-Ablauf, darunter die Artikel der Rubrik als Kacheln mit Vorschau.
- Kaufen (Stück 4) kommt danach als eigener Eintrag.
- Stand 17:12: Backend fertig und kompiliert: `FileUploadService.uploadFileIntoShopCategory` (Kern bekommt
  `shopCategoryKey`, `FileUploadFacts.shopCategoryKey`), `file/dto/FileUploadIntoShopCategoryData`,
  `shop/service/ShopItemService` (`prepareShopCategoryUpload`, `createShopItemOfUploadedFile`, `resolveShopItems`),
  `shop/repository/ShopItemRepository`, `shop/controller/ShopItemController` (`POST /api/shop-item/upload`,
  `POST /api/shop-item/resolve`), `shop/dto/ShopItemForClient`, `ShopItemResolveRequest`; `ShopItem` hat neu
  `sellerUsersGuid` (Spalte `seller_users_guid`, darf NULL sein, Hibernate legt sie an). nginx: `shop-item/upload` steht
  in der Upload-Liste von `mounts/nginx/conf/default.conf` (muss mit auf den Pi, vorher `nginx -t`).
  Dateien im Markt sind für jeden Angemeldeten sichtbar (`visibility` AUTHENTICATED).
- Als Nächstes das Frontend: `shop/ShopItem.ts`, `shop/useShopItem.ts`, `market/MarketUploadBox.tsx`, Artikel als
  Kacheln im Tab der Rubrik. Dann Test, Bau auf dem Pi (mit nginx), Doku.
- Stand 17:18: Frontend fertig (`shop/ShopItem.ts`, `shop/useShopItem.ts`, `shop/shopItemViewCacheScope.ts`,
  `market/MarketUploadBox.tsx`, `market/MarketCategoryTab.tsx` neu geschrieben). Wegwerf-Test grün und gelöscht (ohne
  echte Datei: 404/400/403, Artikel anlegen, auflösen). Auf dem Pi gebaut mit neuer nginx-Datei (`nginx -t` ok), Start
  16,8 s, kein ERROR, 22 MB an den neuen Upload-Pfad kommen durch. Doku nachgezogen: `entities/ShopItem.md`,
  `konzept-shop.md` 11, `konzept-file-kern.md` 9.6, `konzept-navigation.md` 4, `setup.md`.
- NICHT geprüft: ein ganzer Upload mit echter Datei bis zur Kachel (ich kann mich nicht anmelden). Der Nutzer muss
  vorher im Tab „FileClass-Ziel“ den Haken „Markt: Memes“ an `MEME` setzen.
- OFFEN, als Nächstes (noch nicht begonnen): Stück 4 Kaufen. Geplant: Angebot je Artikel anlegen (Verkäufer, im
  kleinen Popup an der Kachel: Preis, dauerhaft oder Anzahl Nutzungen, bis wann, Stückzahl), Kaufen in einer
  Transaktion (Angebot läuft, Stückzahl in einer Anweisung hochzählen, Punkte des Käufers ab, 90 % an den Verkäufer,
  10 % Marktgebühr verschwinden, Beleg `ShopOrder`, Besitz `UsersShopItem`). Achtung: neue Buchungsgründe im
  Kontobuch brauchen vor dem Deploy die neue Prüfregel an `users_point_booking.booking_reason` in der Pi-DB.

## 2026-11-11 16:56 – FileClass-Rechte: Lesen, Bearbeiten, Hochladen; FileClass MEME (fertig, auf dem Pi)

- Ansage (gekürzt): „du solltest die File Class überarbeiten, dass wir da lesen, editieren und hochladen haben als
  Felder […] dann ist es von der File Class abhängig, ob das jeder User darf, also per se hochladen oder nicht. […] Und
  du kannst auch noch die File Class Meme hochladen oder erstellen. Da ein nettes Badge und da dann auch die Rechte,
  also Memes sollte jeder hochladen dürfen. […] bei editieren würde ich beides reinschreiben. Entweder ist es dann ein
  Access Role Key oder aber […] wenn wir halt einen Autor haben, dann ist der der Einzige, der da editieren soll und
  darf. […] das gilt eigentlich bei allen File Classes, die User hochladen dürfen. […] Ich würde aber auch erst dafür
  sorgen, dass wir erstmal Memes hochladen können. Und auch kaufen können. Und dann gucken wir immer noch, wer an
  welcher Stelle dann sinnvollerweise das standardmäßig editieren darf und wer nicht.“
- Reihenfolge daraus: (1) Stufen der FileClass-Rechte trennen: Lesen, Bearbeiten, Hochladen (heute nur Lesen und
  Schreiben), (2) FileClass `MEME` mit Badge, hochladen darf jeder User, (3) Memes im Markt hochladen, (4) kaufen,
  (5) erst danach festlegen, wer wo standardmäßig bearbeiten darf. Meine frühere Frage 1 (Angebot gleich beim
  Hochladen) ist damit nicht beantwortet, ich entscheide beim Bauen und sage es.
- So gebaut: `FileClassAccessRole` hat statt `accessLevel` (READER/WRITER) drei Schalter `readGranted`, `editGranted`,
  `uploadGranted`; das Enum `FileClassAccessLevel` ist gelöscht. Bearbeiten und Hochladen schließen Lesen ein (Service).
  Hochladen prüft `uploadGranted`. `editGranted` wird gespeichert, aber noch NICHT ausgewertet (Ansage: erst hochladen
  und kaufen, dann die Regel fürs Bearbeiten); bis dahin bearbeitet der Autor wie bisher. Im Solr-Dokument bleiben die
  Schreibrollen (`writerAccessRoleKeys`) die Rechte mit „Hochladen“.
- ACHTUNG Pi-DB, noch NICHT gemacht: Tabelle `file_class_access_role` braucht die drei neuen Spalten; die alte Spalte
  `access_level` muss weg. Plan in zwei Schritten, damit das laufende Backend nicht bricht: (A) vor dem Test die drei
  Spalten anlegen und aus `access_level` füllen (READER → lesen; WRITER → lesen + hochladen), `access_level` darf NULL
  sein; (B) direkt vor dem Start des neuen Backends noch einmal füllen, dann `access_level` löschen.
- Stand 16:59: Backend umgestellt und kompiliert (`file/model/FileClassAccessRole.java`,
  `file/service/FileClassAccessRoleService.java`, `file/controller/FileClassAccessRoleAdminController.java`,
  `file/service/FileUploadService.java`). Als Nächstes das Frontend: `file/FileClassAccessRole.ts`,
  `file/useFileClassAccessRole.ts`, `admin/fileclass/FileClassAccessRoleMatrixTab.tsx`, `admin/fileclass/FileClassTab.tsx`,
  `gallery/GalleryUploadBox.tsx`, `filemanager/upload/FileUploadTab.tsx`, `filemanager/files/FileDocumentListTab.tsx`.
- Stand 17:04: Frontend umgestellt, Typprüfung ohne Fehler (Matrix „FileClass-AR“ mit Pinseln ·, L, LH, LB, LBH; Tab
  „FileClass“ mit Spalten Lesen, Bearbeiten, Hochladen; Texte in `admin/fileclass/fileClassAccessTexts.ts`).
- Pi-DB Schritt A ERLEDIGT: `file_class_access_role` hat `read_granted`, `edit_granted`, `upload_granted`; die 24
  vorhandenen Zeilen sind gefüllt (READER → lesen; WRITER → lesen + hochladen; bearbeiten überall aus). `access_level`
  steht noch und darf NULL sein. Schritt B (Spalte löschen, Vorgaben der neuen Spalten entfernen) läuft im Bau-Skript
  zwischen Bauen und Starten.
- FileClass `MEME` ANGELEGT (über die Services, Wegwerf-Test mit Commit, danach gelöscht): Platz 7, Anzeigename „Meme“,
  Badge diagonal Gelb → Orange mit Punkten, Glanz, lachendes Smiley; Endungen png, jpg, jpeg; USER, MODERATOR,
  FILE_MANAGER, ADMIN: lesen + hochladen, bearbeiten aus. Die Rubrik des Nutzers heißt `MEMES` („Memes“); den Haken
  „Markt: Memes“ an `MEME` setzt der Nutzer selbst im Tab „FileClass-Ziel“ (nicht von mir gesetzt).
- Stand 17:07: Auf dem Pi gebaut, Schritt B gelaufen (`access_level` gelöscht; 28 Zeilen: 28 lesen, 0 bearbeiten, 27
  hochladen), Start 16,6 s, kein ERROR, neuer Stand im Bundle. Doku nachgezogen: `entities/FileClassAccessRole.md`,
  `entities/README.md`, `konzept-file-kern.md` (9.4, 9.5, 9.6, „Erste FileClasses“), `konzept-shop.md`,
  `entities/ShopCategoryFileClass.md`, `setup.md`. Nicht angefasst: die Beschreibungen der Solr-Felder
  (`writerAccessRoleKeys` heißt dort weiter „Schreibrollen“), ältere Konzepte mit dem Wort „Schreibrolle“.
- OFFEN, als Nächstes (Ansage: „erstmal Memes hochladen können. Und auch kaufen können“): Stück 3 Hochladen in eine
  Rubrik des Markts, Stück 4 Angebot und Kaufen. Danach erst die Regel fürs Bearbeiten (mein Vorschlag steht im
  Bericht an den Nutzer: Schalter „Bearbeiten“ je Recht = jede Datei der FileClass; dazu an der FileClass ein
  Schalter „Autor bearbeitet seine Datei“).

## 2026-11-11 16:40 – Markt: Kachel, Rubriken als Ziel einer FileClass, Hochladen (Stück 1 und 2 fertig, auf dem Pi; Stück 3 offen)

- Ansage: „Weil es dann auch eine Kachel machen mit Marketplace oder Market Store oder irgendwie sowas. Wo wir dann die
  Rubriken schon mal anzeigen können. Und eventuell auch Dinge dazu hochladen können. Weil pro Rubrik würde ich auch
  noch festlegen, welche File-Classes da hochgeladen werden dürfen. Sprich, wir brauchen eine Verknüpfung zwischen
  File-Class-Destination und Rubrik. Dass ich in der File-Class die Rubriken als Destination hinzufügen kann. Und dann
  würde ich quasi dort mit einem schönen Interface Dinge oder Angebote hochladen wollen oder erstellen wollen, dass die
  andere User dann kaufen können.“
- Damit ist Frage 1 beantwortet: Die Datei eines Artikels kommt über einen eigenen Upload-Weg im Markt herein, je
  Rubrik mit eigenen FileClasses.
- Stücke in dieser Reihenfolge: (1) Kachel und Modul „Gebietermarkt“ mit den Rubriken, (2) Rubrik als Ziel einer
  FileClass (Verknüpfung, Admin-Matrix), (3) Hochladen in eine Rubrik (eigener Endpunkt, Datei + Artikel),
  (4) Angebot zu einem Artikel, (5) Kaufen.
- Entschieden beim Lesen (meine Wahl, dem Nutzer zu sagen): Die Zuordnung steht in einer eigenen Tabelle
  `shop_category_file_class` (`ShopCategoryFileClass`: Rubrik + FileClass), nicht als neue Spalte an
  `file_class_destination_assignment`. Grund: Das Ziel dort ist ein festes Enum mit eindeutigem Paar; eine Rubrik als
  dritte, meist leere Spalte bräuchte zwei Handgriffe an der Pi-DB (Eindeutigkeit, Prüfregel des Enums). In der
  Oberfläche stehen die Rubriken trotzdem als weitere Spalten im Tab „FileClass-Ziel“ neben „Galerie“.
- Stand 16:42: Backend für Stück 2 fertig und kompiliert: `shop/model/ShopCategoryFileClass`, Repository, Service
  (`ShopCategoryFileClassService`), `ShopCategoryFileClassController` (GET Liste) und `…AdminController` (POST, GET je
  id, DELETE), dazu `ShopCategoryService.existsShopCategory`. Als Nächstes das Frontend: Typ und Hook in `src/shop/`,
  Spalten je Rubrik in `admin/fileclass/FileClassDestinationTab.tsx`, neues Modul `src/market/` mit Kachel und Route.
- Stand 16:45: Frontend fertig, Typprüfung ohne Fehler: `shop/ShopCategoryFileClass.ts`, `useShopCategoryFileClass.ts`;
  Rubrik-Spalten in `admin/fileclass/FileClassDestinationTab.tsx` (Texte `fileClassShopCategoryTexts.ts`); Modul
  `market/` (`Market.tsx`, `MarketStartTab.tsx`, `MarketCategoryTab.tsx`, `marketPaths.ts`, `marketTexts.ts`), Kachel
  in `home/Home.tsx`, Routen `/market` und `/market/category/<Key>` in `App.tsx`. Wegwerf-Test gegen die Pi-DB grün und
  gelöscht; Hibernate hat `shop_category_file_class` angelegt (leer). In `shop_category` steht eine Rubrik des Nutzers.
- Als Nächstes: sauber bauen, auf den Pi, prüfen, Doku (`entities/ShopCategoryFileClass.md`, `ShopCategory.md`,
  `konzept-shop.md` 11, `konzept-navigation.md` 4, `setup.md`).
- Stand 16:47: Stück 1 (Kachel und Modul „Gebietermarkt“) und Stück 2 (Rubrik als Ziel einer FileClass) sind auf dem Pi
  gebaut und geprüft (Start 16,9 s, kein ERROR, neue Endpunkte ohne Anmeldung 401, neuer Stand im Bundle). Doku
  nachgezogen: `entities/ShopCategoryFileClass.md` (neu), `entities/ShopCategory.md`, `entities/README.md`,
  `konzept-shop.md` 11, `konzept-navigation.md` 4, `konzept-file-kern.md` 9.6, `setup.md` 5.16.
- NICHT begonnen: Stück 3, Hochladen in eine Rubrik. Plan steht in `konzept-shop.md` 11 unter „Nächste Stücke“. Der
  Nutzer soll erst Kachel und Spalten ansehen (ich sehe die Oberfläche nicht).

## 2026-11-11 16:20 – Administration: User anlegen (fertig, auf dem Pi)

- Ansage: „Wo soll das vielleicht im Admin-Modul auch noch ein User hinzufügen […] da will ich den New Entity-Button
  für einen User und dann legen wir auch gleich ganz akkurat wie beim Registrieren auch mit ID Passwort ist aber
  optional, Standard ist ansonsten das gehashte 123 und noch keine 2FA, das muss dann der User selber machen.“
- So verstanden: im Tab „User“ der Administration oben rechts „neuer User“, kleines Popup mit denselben Angaben wie die
  Registrierung, dazu die GUID („ID“) als Kann-Feld. Passwort leer → Standard `123` (gehasht wie im Frontend, dann
  BCrypt), der Wert steht in der YAML. Keine 2FA: Der User richtet die Authenticator-App bei der ersten Anmeldung ein.
- Der Markt wartet solange: Frage 1 (wie kommt die Datei eines Artikels herein) ist noch offen.
- Stand 16:24: Code fertig, kompiliert, Typprüfung ohne Fehler. Backend: `users/dto/NewUsers.java` (neu),
  `UsersService.createUsersWithPassword` (neu, ADMIN, eine Transaktion), `UsersAdminController.createUsers` nimmt jetzt
  `NewUsers`, YAML `gebiter.users.start-password`. Frontend: `admin/users/NewUsersPopup.tsx`, `newUsersTexts.ts` (neu),
  Knopf in `admin/users/UsersTab.tsx`, Typ `NewUsers` in `users/Users.ts`. Als Nächstes: Wegwerf-Test gegen die Pi-DB,
  Doku (`entities/Users.md`, `UsersCredential.md`), Bau auf dem Pi.
- Stand 16:26: Wegwerf-Test gegen die Pi-DB grün und gelöscht (Rollback, kein Test-User übrig). `entities/Users.md`
  nachgezogen. Lokal sauber gebaut. Jetzt Bau auf dem Pi (Backend und Frontend, wie setup.md 5.16).
- Stand 16:28: Auf dem Pi gebaut und geprüft (Start 16,3 s, kein ERROR, `/api/admin/users` ohne Anmeldung 401, neuer
  Stand im Bundle). `setup.md` nachgezogen (Tabelle der Zugänge, Eintrag in 5.16). Nichts mehr offen an diesem Schritt.
  Im Browser hat es noch niemand gesehen: Der Nutzer schaut selbst (ich kann mich wegen der Authenticator-App nicht
  anmelden).
- Als Nächstes: zurück zum Markt, Frage 1 ist offen (wie kommt die Datei eines Artikels herein).

## 2026-11-11 14:41 – Markt: Rubriken im Shop-Manager (fertig, auf dem Pi)

- Ansage: „Nein, Kauf soll nicht ablaufen. Was man hat, hat man, bis man es benutzt hat. Nur die Shop-Einträge, also die
  Angebote im Shop“ (laufen ab). Zu den Feldern der fünf Klassen kam kein Einwand.
- Plan: `ShopCategory` von vorn bis hinten: Repository, Service, Admin-Controller `/api/admin/shop-category`, Tab
  „Rubriken“ im Modul „Achievements & Markt“, Doku, dann Bau auf dem Pi (dabei legt Hibernate die fünf Tabellen an).
  Kein Löschen einer Rubrik: Das gehen wir vorher gemeinsam durch.
- Stand 14:44: Backend fertig und kompiliert: `shop/repository/ShopCategoryRepository`, `shop/service/ShopCategoryService`,
  `shop/controller/ShopCategoryAdminController` (POST, GET je Key, PUT, PUT `/listing-position`) und
  `ShopCategoryController` (GET Liste). Als Nächstes das Frontend: `src/shop/` (Typ, Hook),
  `src/achievementmanager/shopcategory/` (Tab wie der Tab „AR“: Bearbeiten in der Zeile, Anlegen im Popup), Tab und
  Route eintragen. Danach Test, Doku, Bau auf dem Pi.
- Stand 14:48: Frontend fertig (`src/shop/ShopCategory.ts`, `useShopCategory.ts`,
  `src/achievementmanager/shopcategory/ShopCategoryTab.tsx`, `shopCategoryTexts.ts`, `shopCategoryPaths.ts`; Tab in
  `AchievementManager.tsx`, Route in `App.tsx`), `npx tsc -b` ohne Fehler. Wegwerf-Test gegen die Pi-DB grün und
  gelöscht (mit Rollback). Dabei hat Hibernate die fünf Tabellen in der Pi-DB angelegt (`shop_category`, `shop_item`,
  `shop_offer`, `shop_order`, `users_shop_item`), alle leer. Achtung: Maven gegen den Pi nur ohne Sandbox starten,
  sonst bekommt Java „No route to host“.
- Stand 14:51: Auf dem Pi gebaut und geprüft (Start 17,1 s, kein ERROR, neue Endpunkte ohne Anmeldung 401, neuer Stand
  im Bundle). Doku nachgezogen: `docu/entities/ShopCategory.md` (Endpunkte, Verwendung, Test), Stand in den vier
  anderen Entity-Dokus, `konzept-shop.md` Abschnitt 11, `setup.md` 5.16. Nichts mehr offen an diesem Schritt.
- Als Nächstes (noch nicht begonnen, wartet auf die Ansage des Nutzers): Artikel anlegen, also eine Datei aus dem Kern
  FILE in eine Rubrik stellen. Dafür fehlt die Entscheidung, über welchen Weg die Datei hereinkommt (eigene FileClass
  und eigenes Ziel für Markt-Artikel, `upload-paths-per-purpose`).

## 2026-11-11 14:21 – Markt: Klassen anlegen (fertig)

- Ansage: „Dann würde ich sagen, bauen wir jetzt einfach mal die Dinge, die jetzt zu bauen sind. […] Dass wir erstmal
  den Shop machen. Die File-Class-Rechte updaten. Und uns dann die ganze Geschichte angucken.“
- Davor die Frage: Reichen `ShopCategory`, `ShopItem`, `ShopOffer`? Der Artikel ist immer eine Datei im Kern FILE (id).
  Ein Kauf gilt dauerhaft oder für eine Anzahl Nutzungen. Ein Angebot steht dauerhaft, bis zu einem Datum oder nur in
  einer Stückzahl im Markt. Das Angebot verschwindet irgendwann; was der User hat, bleibt mit seinen Nutzungen
  (losgelöst). Eine Entity verwaltet alles, was ein User zur Verfügung hat.
- Plan: fünf Klassen im Paket `de.gebiter.shop`: `ShopCategory`, `ShopItem`, `ShopOffer`, `UsersShopItem` (je User und
  Datei: dauerhaft ja/nein, restliche Nutzungen; zeigt auf die Datei, nicht aufs Angebot), `ShopOrder` (Beleg des Kaufs).
  Erst nur die Klassen und kompilieren, kein Start gegen die Pi-DB, damit keine Tabellen entstehen, bevor die Felder
  besprochen sind.
- Stand 14:27: Die fünf Klassen liegen in `code/backend/src/main/java/de/gebiter/shop/model/`
  (`ShopCategory`, `ShopItem`, `ShopOffer`, `UsersShopItem`, `ShopOrder`). `./mvnw -q -o -DskipTests clean compile`
  läuft ohne Fehler. Sonst ist im Code nichts geändert.
- Doku dazu: `docu/entities/ShopCategory.md`, `ShopItem.md`, `ShopOffer.md`, `UsersShopItem.md`, `ShopOrder.md`,
  Einträge in `docu/entities/README.md`, Abschnitt 11 in `docu/konzept-shop.md` (Tabellen und Beispiel mit Bob).
- NICHT gemacht: kein Start des Backends, kein Bau auf dem Pi. In der Pi-DB gibt es die fünf Tabellen noch nicht; sie
  entstehen beim ersten Start (Hibernate). Erst die Felder besprechen, sonst bleiben Spalten als Leichen zurück.
- Bewusst weggelassen, kommt später: Verkäufer am Artikel (Verkauf durch User, 10 % Gebühr), Protokoll je Nutzung.
- Rückfrage 1 beantwortet (Nutzer): Ein Kauf läuft nie ab, nur die Angebote im Markt.
- Als Nächstes, nach dem Ja des Nutzers zu den Feldern: Rubriken im Shop-Manager (Repository, Service,
  Admin-Controller, Tab im Modul „Achievements & Markt“), dann Artikel, Angebote, Kaufen.

## 2026-11-11 14:07 – Absturz von VS Code, Stand geprüft (fertig)

- Der Mac lief durch, nur VS Code wurde kurz vor 14:06 beendet. Sitzung davor:
  `36c37ac6-9f8f-4819-b7d2-72cb8d8fdd0d`.
- Letzter Bau auf dem Pi um 03:37 (Admin-Konto nur mit `FORCE_ADMIN`, `FOTO_ART`, Texte der Stimmen). Um 07:00 die
  Liste für die Suche notiert.
- Danach wurde nichts geschrieben. Welcher Umbau lief, ist unbekannt; der Nutzer weiß es auch nicht mehr.
- Geprüft: Frontend (`npx tsc -b`) und Backend (`./mvnw -q -o compile`) ohne Fehler. Mac und Pi gleich (745
  Quelldateien, SHA-256). Der Pi antwortet (Startseite 200, `/api/file-cheer` ohne Anmeldung 401).
