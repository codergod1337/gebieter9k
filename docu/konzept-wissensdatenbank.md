# Konzept: Wissensdatenbank

Stand 2026-11-27: Das Modul steht im Frontend mit seiner Kachel auf Startseite und Login-Seite. Die Gliederung
(Rubrik, Kapitel, Unterkapitel) steht in Postgres, die Seiten stehen im Solr-Kern `KNOWLEDGE`, je Seite ein Dokument
([`solr-cores/KNOWLEDGE.md`](solr-cores/KNOWLEDGE.md), dort auch das Format des Inhalts). Auf dem Pi seit dem 2026-11-27 (Commit `a8f5df2`), mit der ersten Seite: Mathe → Grundlagen →
Koordinatentransformation (`/wissen/mathe/grundlagen/koordinatentransformation`), angelegt von Claude unter dem Konto des
Nutzers. Die alte Adresse `/wissen/grundlagen/koordinatentransformation` gibt es nicht mehr.

## 1. Was es werden soll (Nutzer, 2026-11-24 und 2026-11-26)

- Ein **interaktives Lernskript** zu Mathematik, Physik und Chemie, als eigenes großes Paket in gebiter9k, erreichbar
  **ohne Login**.
- **Umfang als Ziel:** Von der Komplexität her soll sich damit ein Bachelor in Physik und Chemie abbilden lassen.
- **Oberfläche:** eigene Reiter, später eine kleine Suche.
- **Kern-Wunsch:** Rechnungen so nachvollziehbar, dass man jede Äquivalenzumformung einzeln sieht und erkennt, wohin
  welche Variable „geschoben“ wird, farblich und animiert. Beispiel: Aus `cos φ = x / r` wird durch „· r“ die Zeile
  `r · cos φ = x`; das `r` trägt in beiden Zeilen dieselbe Farbe und wandert sichtbar vom Nenner nach links.
- **Qualität:** „bilderbuchmäßig“, eigene Klassen in eigenen Dateien, sauber gegliederte Architektur, SOLID, so weit es
  Sinn ergibt; „kein hingerotzter Pfusch“.
- **Später genannt:** das Stern-Gerlach-Experiment „simulieren“ bzw. darstellen, Statistik.

Nicht verwechseln: Jupyter-Notebooks kommen nicht in die App (Entscheidung vom 2026-11-21).

## 2. Entscheidungen

| Entscheidung | Von wem, wann | Dazu |
|---|---|---|
| Paket in gebiter9k, kein eigenes Projekt | Nutzer, 2026-11-24 | Am selben Tag als Python-Projekt in `~/Dokumente/coding/pythonpower` begonnen und verworfen. |
| Ohne Login | Nutzer, 2026-11-24 | Besucher ohne Konto sollen es benutzen können. |
| Erstes Kapitel „Grundlagen“ | Nutzer, 2026-11-24 | Koordinatensysteme und die Bewegung eines Körpers. |
| Inhalte kommen in einen **eigenen Solr-Kern** | Nutzer, 2026-11-26 | „ein solr wissens kern dokument pro seite“; wie fein eine Seite geschnitten ist (je Unterpunkt, gröber, feiner), ist bewusst offen. Dazu Referenzen (bei uns der Name für die Hooks der Vorlage), Status und Schlagwörter. Löst „Inhalte stehen im Code“ und „kein Backend“ vom 2026-11-24 ab. |
| **Kein Rich-Text** als Format des Inhalts | Nutzer, 2026-11-26 | „maximale freiheit“ für Formeln, „maybe auch mini svg“, damit sich Äquivalenzumformungen eindeutig animieren lassen („wo welcher wert hingeht“). Wie genau abgelegt wird, ist offen. |
| Das Format **nicht aus dem Inhalt einer Seite ableiten** | Nutzer, 2026-11-27 | „du sollst nicht ein modell anhand des inhalts entwerfen“; „wir wollen da später formaln und herleitungen aus der elektrodynamik und quantenmechanik abbilden, da funktioniert das mit deiner […] eingabe so nicht mehr“. Trifft Fassung 1: Der Term-Baum (`blockcontent/math/`) und die getippte Schreibweise (`blockcontent/formulatext/`) kennen nur, was die Koordinatentransformation braucht. Dazu am selben Tag: „normales latex hilf uns nichts, denn wir sollten jedem element eine id mitgeben KÖNNEN, genau dann wenn es in eine animation muss […] ich will das rad auch nciht neu erfinden müssen. ich stelle mir vielleicht einen formeleditor innerhalb vom richtexteditor vor. dann haben wir auch eine übersicht wie viele gleichungen wir auf einer seite haben, latex style“. Gebaut am 2026-11-27 mit dem Formel-Editor MathLive (0.111.4, MIT): abgelegt wird LaTeX, ein Teil bekommt per Markieren seine id (`\htmlData{id=…}{…}`), jede Gleichung hat ihre laufende Nummer; siehe [`blockcontent.md`](blockcontent.md). |
| **Die ganze Seite in EINEM Dokument; Editor nur Elemente und ids; Animationen als eigenes Modul** | Nutzer, 2026-11-27 | „wir definieren immer die ganze seite in einem solr wissens dokument! sprich contentboxen und zwischen abschnitte oder sonstiges muss auch im richtext abbildbar sein“; „wir haben formeln und eine hand voll html elemente die animationen benötigen wir ja in einem separaten modul. sprich wir müssen ja nur die gleichungsnummer angeben und dann welches element mit welcher id sich wie in der nächsten gleichungsnummer verhält, das hat aber nichts im editor zu suchen, dort definiere ich nur die ids der elemente und animationen stelle ich mir in einem popup vor“. Gebaut am 2026-11-27 (Antwort des Nutzers: „ja bau es endlich […] deinen dreck sehe ich erst wenn der editor funktioniert, also ob dein neuer vorschlag brauchbar ist“): Fassung 2, `elements` und getrennt `animations` im selben Dokument, Formeln über MathLive, Ordner `formula/`, `elements/`, `editor/`, `animation/`; siehe [`blockcontent.md`](blockcontent.md). Dazu: „alles was mit animation zu tun hat bitte in eine eigene animation.css, das will ich weder in base noch in default css haben“. Ob der Vorschlag brauchbar ist, sagt der Nutzer nach dem Testen. |
| **Ansehen auch ohne Anmeldung, Schreiben nur über Admin-Endpunkte** | Nutzer, 2026-11-27 | „wissensdatenbank soll auch für anonym verfügbar sein zum ANSEHEN schreiben erst mal nur über admin endpunkte. schreiben machen wir aber erst wenn wir alle feinheiten am dummy test modul dafür geklärt haben!“ Also: Lesen über `/api/share/…`, Schreiben über `/api/admin/…` (nur ADMIN), und das Schreiben wird erst gebaut, wenn am Demo-Modul alles geklärt ist. |
| Erst ein **Demo ohne Solr-Kern** | Nutzer, 2026-11-26 | „ein wissensdatenbank modul […] noch ohne solr kern einfach mit einem demokapitel und zwar grundlagen/ koordinaten transformation“. Gebaut, siehe Abschnitt 3. |

## 3. Was gebaut ist

Adresse, ohne Anmeldung (seit 2026-11-27 aus der Gliederung): `/wissen` → `/wissen/mathe` (Übersicht der Rubrik: je
Kapitel ein Kasten mit seinen Seiten) → `/wissen/mathe/grundlagen` (ein Kapitel) →
`/wissen/mathe/grundlagen/koordinatentransformation` (die Seite). Je Rubrik ein Reiter. Bis zum 2026-11-27 stand die
Demoseite fest im Code unter `/wissen/grundlagen/koordinatentransformation`; diese Fassung ist gelöscht, ihr Inhalt ist
jetzt ein Dokument im Kern.

**Einstieg (2026-11-27):** die Kachel „Wissensdatenbank“. Angemeldet steht sie auf der Startseite (jeder Angemeldete,
kein Recht nötig), für Besucher ohne Konto dieselbe Kachel auf der Login-Seite unter „Ohne Anmeldung ansehen“
(`home/VisitorTiles`). Beide kommen aus einer Liste: `home/homeTiles.ts`, dort trägt die Kachel
`visibleWithoutLogin: true`.

**Die Seite „Koordinatentransformation“ (seit 2026-11-27 in Fassung 2 des Inhalts):** ein Kasten Einleitung mit Skizze,
Zwischenüberschrift „Von polar nach kartesisch“, zwei Kästen (x und y aus r und φ), Zwischenüberschrift „Von kartesisch
nach polar“, zwei Kästen (r und φ aus x und y), ein Kasten Zusammenfassung mit dem Hinweis zu `atan2`. 18 nummerierte
Gleichungen, 4 Aufklapper „Rechenweg“, 10 Animationen. Alles steht in EINEM Dokument.

**Eine Rechnung** ist kein eigener Baustein mehr, sondern Gleichungen untereinander: der Ausgang, ein Aufklapper
„Rechenweg“ mit den Zeilen dazwischen, das Ergebnis. Was der Nutzer dazu festgelegt hat, gilt weiter:

- Immer zu sehen sind Ausgang und Ergebnis, der Rechenweg ist einblendbar; der Zustand steht in der Adresse (`?open=c1`).
- Am Ende einer Zeile steht die Notiz der Umformung („| · r“) mit einem Abspiel-Knopf: Er zeigt, wie aus dieser Gleichung
  die nächste wird, beliebig oft.
- Die Bewegung zeigt die Rechenregel: Was auf beiden Seiten dazukommt, wandert aus der Notiz; Kürzen ist ein EIGENER
  Schritt („erst wurzelziehen über beide seiten, und erst danach kürzen“), der Strich bleibt danach stehen; ein Teil, der
  die Seite der Gleichung wechselt, wandert auf einem Bogen.
- Nicht ausformulieren („ich will kein kürzen und seite tauschen lesen“, „wortbeschreibungen lassen wir optional aber
  nicht für solche PILLEPALLE OPERATIONEN“): Worte nur für schwierige Schritte, als Absatz zwischen den Gleichungen oder
  in der Notiz; Kürzen und Seiten tauschen haben keine Notiz, nur den Abspiel-Knopf.

**Die Skizze:** ein Achsenkreuz mit feinem Raster, dem Nullpunkt „0“ und der „1“ an beiden Achsen; jeder Punkt nennt beim
Zeigen seine Koordinaten im Hoverlay; ein Winkel hebt beim Zeigen seine Schenkel hervor.

**Aufbau im Frontend:**

| Ordner | Inhalt |
|---|---|
| `knowledge/` | Das Modul: `Knowledge.tsx` (Subheader, je Rubrik ein Reiter; lädt Gliederung, Feldnamen und die Liste der Seiten), `KnowledgeBase.ts`, `KnowledgeStartPage`, `KnowledgeRubricPage`, `KnowledgeChapterPage`, `KnowledgeChapterBox`, `KnowledgePageView` (holt die Seite zur Adresse und zeichnet ihren Inhalt), `knowledgePaths.ts`, `knowledgeTexts.ts`. |
| `knowledge/page/` | Die Seiten vom Backend: `KnowledgePageDocument.ts` (die Feld-Map eines Dokuments, die Feldnamen), `useKnowledgePage.ts`. |
| `knowledge/section/` | Die Gliederung: Typ, Hook, `knowledgeSectionTree.ts`. |
| `blockcontent/` (global) | Der Inhalt einer Seite: Elemente, Formeln (MathLive), Animationen, Skizze, Editor. Alles dazu, auch das Format, in [`blockcontent.md`](blockcontent.md). |

Global dazugekommen: `components/PlayButton` (der Abspiel-Knopf).

**Ein neues Kapitel oder eine neue Seite:** Rubrik, Kapitel und Unterkapitel legt der Admin im Wissensmanager an (Reiter
„Gliederung“), eine Seite im Reiter „Seiten“ („neue Seite“), ihren Inhalt im Editor der Seite. Reiter, Übersichten und
Adressen entstehen daraus von selbst.

**Von Claude festgelegt, weil der Nutzer bauen statt antworten wollte (alles leicht zu ändern):**

- Ordner `knowledge`, Bezeichner englisch wie im übrigen Code, Adresse deutsch (`/wissen/…`).
- Formeln als eigene Term-Klassen, gezeichnet mit HTML und CSS, **kein npm-Paket**. Haken: Jede neue Schreibweise
  (Integral, Vektor, Matrix) ist eine neue Klasse und eine Methode im Zeichner.
- Jede Größe trägt dauerhaft ihre Farbe; beim Abspielen wandern alle markierten Terme.
- Das Paket ist fest in der App (kein Nachladen): Mit den Inhalten in Solr bleibt es klein.
- Ein- und Ausblenden des Rechenwegs ersetzt den Eintrag im Verlauf (REPLACE), damit „Zurück“ im Browser die Seite
  verlässt und nicht Kasten für Kasten zuklappt.
- P liegt in der Skizze bei (4 | 3): damit ist r genau 5.

Geprüft am 2026-11-27: Typprüfung und Bau ohne Fehler; im Firefox ohne Fenster mit echter Maus durchgeklickt und
fotografiert (ausgeblendet, eingeblendet, jede Art von Umformung beim Abspielen, Hoverlays der Punkte, Winkel).

## 3a. Rückmeldung zum Demo (Nutzer, 2026-11-27) – umgesetzt am selben Tag, siehe Abschnitt 3

„wissensdatenbank naja da müssen wir noch feilen“. Seine Punkte, wörtlich:

1. **Umformungen:** „es geht primär nicht nur darum, dass sich einfach was nutzlos bewegt, aber es soll eben es besser
   einprägbar machen, wenn etwas die gleichungsseite wechselt, gekürzt wird oder vom zähler in den nenner wandert. das
   prägt sich für ein menschenhirn besser durch eine bewegung ein und auch wenn man sieht wo etwas gekürzt wird!“
2. **Rechenweg:** „wir haben immer den formelausgang und den formel endzustand angezeigt, und bei bedarf will ich dann
   den genauen rechenweg mit allen äquivalenzumformungen eiblenden können.“ Grund: Bei einem schwierigeren Thema muss man
   „noch mal 2 schritte zurück um was kurz nachzuschauen und dann wieder vorhüpfen“.
3. **Skizzen:** „eine nummer zu lieblos“, „zu wenige details“; „jede skizze hat einen nullpunkt und eine 1
   reinskaliert. jeder punkt soll als hoverlay mindestens seine koordinaten angezeigt haben. für einen winkel wäre es
   schön wenn man die beiden achsen des winkels als "hoverlay" dann highlighten würde, so dass ich weiss was das
   überhaupt für ein winkel ist.“

Noch nicht gezeigt, weil die Seite keinen Fall dafür hat: ein Term, der vom Zähler in den Nenner wandert.

**Zweite Rückmeldung (Nutzer, 2026-11-27), umgesetzt am selben Tag:** „was mir noch eingefallen ist bei den
animationen, füge da schritte ein! nicht alle in einer animation machen, zum beispiel erst wurzelziehen über beide
seiten, und erst danach kürzen. und nicht ausformulieren. also wenn die äquivalenzumformung ist mit 1/r
durchmultiplizieren ist das als anzeige genug. beim integrieren mit grenzen oder sonstigen komplizierteren dingen
bedarf es dann wohl eher einer extra beschreibung“. Lesart von Claude (in Abschnitt 3 beschrieben): Die Zeile nach
einer Umformung zeigte schon den Strich der nächsten; jetzt ist das Kürzen ein eigener Schritt, und die Erklärsätze der
einfachen Umformungen sind weg.
Der umgesetzte Stand ist seit dem 2026-11-27 auf dem Pi (Commit `7453d7d`); eine Rückmeldung des Nutzers dazu steht aus.


## 3b. Hierarchie und Solr-Kern (Nutzer, 2026-11-27) – zu klären, BEVOR echter Inhalt entsteht

„und bedenke, ich will später die wissensdatenbank in einem solr kern ablegen. sprich wir müssen uns noch überlegen
wie wir da die hirarchieen abbilden ich will ja später rubrik = mathe, physik, ML, Code etc haben, je rubrik dann
unterrubriken mit grundlagen sowas wir was ist metrik, was ist ein kreuzprodukt, koordinatentrafos, in mathe dann
analysis 1 und 2 lin alg was es halt alles so gibt, ich hatte das alles mal an der uni und will es nicht komplett
vergessen, das ist so mein antrieb, eben alles was man in einem psysik machelor studium so lernt und in einem
softwaretechnikstudium, das würde ich step by step dann mit dir erarbeiten und digital verewigen, und in solr dass wir
danach super suchen können. ich tendiere dazu dann kapitel und unterkapitel als solr doc felder zu nutzen und so eine
verlinkung zu erzeugen. die struktur habe ich dir ja schon genannt, anfangen würde ich mit mathe grundlagen, und
physik grundlagen,aber wir gesagt bevor es richtigen inhalt gibt, sollten wir die architektur des wissens datenbank
kernes klären. denn ich will ja auch die seiten wieder finden können“

Was daraus feststeht:

- **Antrieb:** alles festhalten, was man in einem Physik-Bachelor und in einem Softwaretechnik-Studium lernt, Schritt
  für Schritt gemeinsam erarbeitet, und in Solr gut durchsuchbar („die seiten wieder finden“).
- **Hierarchie:** oben die **Rubrik** (Mathe, Physik, ML, Code, …), darunter **Unterrubriken** (in Mathe z. B.
  Grundlagen, Analysis 1, Analysis 2, Lineare Algebra), darunter die Seiten (z. B. „Was ist eine Metrik“, „Was ist ein
  Kreuzprodukt“, Koordinatentransformationen).
- **Tendenz des Nutzers:** Kapitel und Unterkapitel als Felder des Solr-Dokuments, darüber die Verlinkung.
- **Reihenfolge:** zuerst die Architektur des Kerns klären; die ersten Inhalte danach: Mathe Grundlagen und Physik
  Grundlagen.

Umgesetzt am 2026-11-27: Rubrik „Mathe“ → Kapitel „Grundlagen“ (beide auf dem Pi angelegt) → Seite
„Koordinatentransformation“.

## 3c. Der Kern `KNOWLEDGE`: Vorschlag von Claude, vom Nutzer am 2026-11-27 bestätigt („ja das sieht gut aus“)

**Gebaut am 2026-11-27: der Kern** (auf dem Pi angelegt, 18 Felder, leer) und im Backend das Schreiben und Lesen
einer Seite, lokal gegen das echte Solr geprüft; alles dazu in [`solr-cores/KNOWLEDGE.md`](solr-cores/KNOWLEDGE.md).
Vorgabe des Nutzers dabei (2026-11-27): „auch dieser solr kern sollte im solr manager die felder des dokuments
verwalten! also benötigen wir da noch eine zusätzliche auswahl always oder any, sprich felder die keinen login
erforderlich machen und dennoch mit werden zurückkommen. ich will keine extralösung wir arbeiten solid uns sauber!“
Also: Seiten gehen als Feld-Maps über die Felddefinitionen wie beim Kern FILE, und „Wer liest“ kennt den Wert `ANY`
(jeder, auch ohne Anmeldung). **Ebenfalls gebaut: die Gliederung in Postgres** (Rückfrage 1,
Nutzer: „dann machen wir das mapping der ganzen keys zum anzeigetext in postgres“): Entity `KnowledgeSection`
([`entities/KnowledgeSection.md`](entities/KnowledgeSection.md)), Endpunkte unter `/api/admin/knowledge-section` (nur
ADMIN) und `/api/share/knowledge-section` (Lesen ohne Anmeldung), im Frontend als Stammdaten (`knowledgeSections`) und
das neue Admin-Modul **„Wissensmanager“** (`/knowledge-manager`, Kachel nur ADMIN) mit dem Reiter „Gliederung“:
Rubriken, Kapitel der gewählten Rubrik, Unterkapitel des gewählten Kapitels; anlegen, umbenennen, Reihenfolge am Griff.
Kein Löschen. Der Wissensmanager bekommt später auch die Seiten und ihren Editor.

**Keys sind änderbar (Nutzer 2026-11-27):** „wir können doch keys ändern, wenn wir direkt nach einer änderung, also in
der selben transaktion durch alle wissensdokumente cursoriterieren und den jeweiligen key ändern“. Gebaut für die
Gliederung (`changeKnowledgeSectionKey`: der Punkt und alles darunter, eine Postgres-Transaktion). **Pflicht für den
Kern:** Dieselbe Methode zieht dann zuerst alle Dokumente mit dem alten Key per Cursor nach und ändert Postgres zuletzt
(Solr und Postgres teilen keine Transaktion; neu startbar wie beim Löschen). Dasselbe gilt für `pageKey`.

Vorgaben des Nutzers dazu (2026-11-27): ein Feld `language` (vorerst nur `de`, weitere Sprachen später ergänzbar); die
ganze Seite in einem langen String, der NICHT durchsucht wird; für die Suche später aufbereitete Schlagwörter daraus;
die Architektur soll solide sein und die Seiten gut zu bearbeiten; meist schreibt Claude die Seiten nach seiner
Beschreibung; dazu ein Editor, in dem er selbst Seiten anlegt und ändert („mini wikipedia aber nur der admin schreibt
und alle dürfen lesen“).

**Grundsätze des Vorschlags:**

- **Ein Dokument = eine Seite in einer Sprache.** Die englische Fassung einer Seite wäre später ein zweites Dokument
  mit derselben `pageGuid` und `language` = `en`. An den Feldern ändert eine neue Sprache nichts. Haken: Der
  Volltext-Typ `TEXT_SUCHE` ist auf Deutsch eingestellt; eine zweite Sprache braucht dann einen eigenen Texttyp im
  Configset.
- **Hierarchie als Keys im Dokument** (Tendenz des Nutzers): `rubricKey` → `chapterKey` → `subChapterKey` → Seite. Die
  Tiefe ist damit fest (Rubrik, Kapitel, Unterkapitel); eine vierte Ebene hieße ein neues Feld.
- **Namen und Reihenfolge der Rubriken und Kapitel als Stammdaten in Postgres** (vom Nutzer bestätigt), so wie die
  FileClass zur Datei und die Rubrik zum Markt: Im Dokument steht nur der Key. Eine Rubrik umbenennen oder umsortieren
  fasst dann kein einziges Dokument an, und die Namen sind wie überall mehrsprachig (`{"de": "Mathe"}`).
- **Der Inhalt als ein String** (`content`), gespeichert, nicht indexiert: die Seite als JSON aus den Bausteinen des
  Demos (Textabsätze, Rechnungen mit ihren Schritten, Skizzen). Dazu `contentFormatVersion`, damit sich das Format
  ändern darf und alte Seiten lesbar bleiben.
- **Suche** vorerst über `title`, `summary` und `tags`; die aus dem Inhalt aufbereiteten Schlagwörter kommen später
  als eigenes Feld, das nur das Backend setzt.
- **Lesen** ohne Anmeldung über `/api/share/…`, nur `PUBLISHED`. **Schreiben** nur ADMIN über `/api/admin/…`.

**Die Felder:**

| Feld | Typ | setzt | Beispiel | Wozu |
|---|---|---|---|---|
| `id` | STRING, Pflicht | Backend | `3f2a…-…_de` | Schlüssel des Dokuments: `pageGuid` + `_` + `language`. |
| `pageGuid` | STRING | Backend | `3f2a…-…` | Die Seite über alle Sprachen hinweg; ändert sich nie, auch nicht beim Verschieben. |
| `language` | STRING | Admin | `de` | Sprache dieser Fassung; erlaubt sind die aktiven Sprachen der Plattform. |
| `rubricKey` | STRING | Admin | `MATHE` | Rubrik. |
| `chapterKey` | STRING | Admin | `GRUNDLAGEN` | Kapitel in der Rubrik. |
| `subChapterKey` | STRING, darf fehlen | Admin | `KOORDINATEN` | Unterkapitel im Kapitel. |
| `pageKey` | STRING | Admin | `KOORDINATENTRANSFORMATION` | Die Seite in ihrer Adresse: `/wissen/mathe/grundlagen/koordinatentransformation`. Eindeutig je Kapitel und Sprache. |
| `listingPosition` | LONG | Admin | `3` | Reihenfolge der Seiten in ihrem Kapitel bzw. Unterkapitel. |
| `title` | TEXT_EDGE, Ngram-Zwilling, hohes Suchgewicht | Admin | `Koordinatentransformation` | Überschrift, wird beim Tippen gefunden. |
| `summary` | TEXT_SUCHE, mittleres Suchgewicht | Admin | `Kartesische Koordinaten und Polarkoordinaten ineinander umrechnen.` | Ein Satz für die Übersicht des Kapitels und für Treffer der Suche. |
| `content` | STRING, gespeichert, NICHT indexiert | Admin | `{"blocks":[…]}` | Die ganze Seite als ein langer String. Wird nie durchsucht. |
| `contentFormatVersion` | LONG | Backend | `1` | In welcher Fassung des Formats `content` geschrieben ist. |
| `tags` | STRING, mehrwertig, Suggest-Zwilling, Suchgewicht | Admin | `polarkoordinaten`, `pythagoras` | Schlagwörter von Hand, ohne Raute, wie im Kern FILE. |
| `status` | STRING, Pflicht | Admin | `PUBLISHED` | `DRAFT` (nur der Admin sieht die Seite), `PUBLISHED` (alle), `DELETED` (weich gelöscht). |
| `relatedPageGuids` | STRING, mehrwertig | Admin | `8c11…-…` | „Siehe auch“ und „baut auf“: Verweise auf andere Seiten über ihre `pageGuid`. |
| `authorUsersGuid` | STRING | Backend | `7777…` | Wer die Seite angelegt hat. |
| `createdAt` | DATE | Backend | `2026-11-27T10:00:00Z` | Angelegt am. |
| `lastChangedAt` | DATE | Backend | `2026-11-27T10:30:00Z` | Zuletzt geändert am. |
| `wtf` | Referenz | Admin | `DEMO` | Kommt in jedem Kern von selbst: beliebige Markierungen. |

Später, eigener Gang (Nutzer): die aus `content` aufbereiteten Schlagwörter für die Suche als eigenes Feld.

**Die zwei Rückfragen vom 2026-11-27:**

1. Namen und Reihenfolge der Rubriken und Kapitel als Stammdaten in Postgres? **Beantwortet: ja, in Postgres** (gebaut,
   siehe oben).
2. Wie schreibt Claude Seiten? **Beantwortet (Nutzer 2026-11-27): unter dem Konto des Nutzers** („ich lege sonst einen
   neuen 2fa key für meinen user in der .env an. dann postest du unter meinem user, das ist mir sowieso am liebsten“).
   Claude meldet sich also wie der Admin an (Passwort und 2FA-Schlüssel aus `code/.env`) und nutzt die normalen
   Admin-Endpunkte. Das Einspielen aus Dateien im Repo entfällt. Je User gibt es genau einen 2FA-Schlüssel: Ein neuer
   ersetzt den in seiner Authenticator-App. Alter Stand der Frage, überholt: Anmelden kann er sich wegen der Authenticator-App nicht. Vorschlag: Seiten als Dateien im
   Repo, die das Backend in den Kern einspielt; so kommen sie wie Code über Git auf den Pi und haben einen Verlauf.

## 4. Wie es weitergeht (nur Richtung)

1. Erledigt am 2026-11-27: der Kern, die Seiten aus dem Kern statt aus dem Code.
2. Der Nutzer sieht sich die Seite aus dem Kern an; daran wird besprochen, was noch anders soll.
3. Gebaut am 2026-11-27: der allgemeine Editor für Inhalte (Elemente, Formelfeld, Popup „Animationen“, JSON als
   zweite Ansicht; Wunsch des Nutzers: „als allgemeinen richtext editor nutzen“), siehe [`blockcontent.md`](blockcontent.md).
   Davor am selben Tag: Wissensmanager, Reiter „Seiten“ mit der Liste und dem
   Editor einer Seite (Felder per Klick, der Inhalt als JSON-Text mit Vorschau daneben). Anlass (Nutzer): „ausserdem
   hast du noch keinen editor für die einzelne wissensdatenbank seite, ich muss ja sehen was du da … gebaut hast“.
   Am selben Tag dazu: Text mit fett, kursiv, Links, Listen und Formeln im Satz, Minus in Formeln, die Skizze als
   Elementliste, „neue Seite“ geführt im Reiter „Seiten“. Noch offen: eine Seite verschieben, Reihenfolge der Seiten.
4. Die Suche über die Seiten (Titel, Zusammenfassung, Schlagwörter; später aufbereitete Schlagwörter aus dem Inhalt).
5. Danach: die Bewegung (ein Punkt im Achsenkreuz, Slider, Umschalter kartesisch/polar), weitere Kapitel,
   Stern-Gerlach, Statistik.

## 5. Offene Fragen

1. **Wie liegt der Inhalt im Solr-Dokument?** Gebaut am 2026-11-27 (Fassung 1): ein JSON-Objekt aus den Bausteinen
   des Demos, Terme als Baum (`solr-cores/KNOWLEDGE.md`, „Format des Inhalts“). Der Nutzer hat es noch nicht gesehen;
   nicht als Auswahl vorlegen, an der Seite besprechen.
2. **Namen im Kern:** erledigt (`KNOWLEDGE`, Feldnamen englisch, vom Nutzer bestätigt).
3. **Referenzen:** Welche? Eine Referenz ist bei uns automatisch ein Feld in JEDEM Kern (wie `wtf`); was nur im
   Wissenskern gilt (z. B. „gehört zu Kapitel“), wäre ein normales Feld dieses Kerns.
4. **Status:** erledigt (`DRAFT`, `PUBLISHED`, `DELETED`).
5. **Wie geschrieben wird:** über Admin-Endpunkte; Claude unter dem Konto des Nutzers. Offen: wie der Editor im Browser
   aussieht (noch nicht gebaut).
6. **Sicherung:** offen. Der Inhalt einer Seite liegt NUR in Solr. Den Export eines Kerns gibt es per Knopf
   (Solr-Manager), das Einspielen ist nicht gebaut. Bis dahin ist der Export das einzige Backup der Seiten.
7. **Einstieg:** erledigt am 2026-11-27 (Kachel auf Startseite und Login-Seite, Abschnitt 3).
8. **Was steuert der Slider** in der späteren Bewegungsansicht: die Zeit entlang einer Bahn oder direkt die Koordinaten?
