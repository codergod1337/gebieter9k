import type { MultilingualText } from '../language/MultilingualText.ts'

/**
 * Alle Texte des Moduls „Gebietermarkt“, mehrsprachig angelegt (Nutzer 2026-11-11): je Sprachkürzel der Text, vorerst
 * nur Deutsch. Eine weitere Sprache kommt hier dazu, je Text ein Eintrag; die Oberfläche nimmt den der eingestellten
 * Sprache (`getTextInCurrentLanguage`). Platzhalter stehen in geschweiften Klammern.
 */
export const MARKET_TEXTS = {
  /** Name des Moduls: auf der Kachel der Startseite und im Subheader. */
  moduleTitle: { de: 'Gebietermarkt' },
  /** Einstieg, solange es keine Rubrik gibt. */
  noShopCategories: { de: 'Im Gebietermarkt gibt es noch keine Rubriken.' },
  /** Tab einer Rubrik, deren Key es nicht gibt (z. B. alte Adresse). */
  unknownShopCategory: { de: 'Diese Rubrik gibt es nicht.' },
  /** Inhalt einer Rubrik, solange in ihr nichts angeboten wird. */
  noShopItems: { de: 'In dieser Rubrik gibt es noch nichts zu kaufen.' },
  /** Fuß einer Rubrik: vor der FileClass der Rubrik. */
  fileClassLabel: { de: 'Dateiart dieser Rubrik:' },
  /** Titel der Upload-Box im ersten Schritt von „neues Angebot“. */
  uploadTitle: { de: 'Datei für das Angebot' },

  /** Der Knopf oben rechts im Tab einer Rubrik und der Titel des Popups. */
  newShopOffer: { de: 'neues Angebot' },
  newShopOfferPopupTitle: { de: 'Neues Angebot' },
  /** Der Fortschritt im Kopf des Popups, z. B. „Schritt 2 von 4“. */
  stepProgress: { de: 'Schritt {step} von {stepCount}' },
  /** Schritt: Datei hochladen. */
  stepUploadTitle: { de: 'Datei hochladen' },
  stepUploadHint: { de: 'Lade zuerst die Datei hoch. Sobald sie oben ist, geht es weiter mit dem Angebot.' },
  /** Unter dem Upload: wie viele Dateien schon oben sind. */
  stepUploadDone: { de: 'Oben: {count}. Weiter mit dem Angebot.' },
  /** Schritt: Laufzeit des Angebots. */
  stepDurationTitle: { de: 'Wie lange steht das Angebot im Markt?' },
  durationPermanent: { de: 'Dauerhaft' },
  durationPermanentHint: { de: 'Das Angebot steht ohne Ende im Markt.' },
  durationLimited: { de: 'Befristet' },
  durationLimitedHint: { de: 'Das Angebot verschwindet zu einem Zeitpunkt aus dem Markt. Was bis dahin gekauft wurde, bleibt.' },
  durationEndsAtLabel: { de: 'Bis wann?' },
  /** Schritt: Nutzung. */
  stepUsageTitle: { de: 'Wie oft darf der Käufer es benutzen?' },
  usageUnlimited: { de: 'Unbegrenzt' },
  usageUnlimitedHint: { de: 'Der Käufer darf es beliebig oft benutzen.' },
  usageCountLabel: { de: 'So oft darf der Käufer es benutzen (je Kauf)' },
  /** Schritt: Preis. */
  stepPriceTitle: { de: 'Was kostet es?' },
  priceLabel: { de: 'Preis in Punkten' },
  stockLimited: { de: 'Nur eine bestimmte Stückzahl verkaufen' },
  stockCountLabel: { de: 'Wie viele Stück gibt es?' },
  /** Vor der Zusammenfassung im letzten Schritt. */
  offerSummaryLabel: { de: 'So wird es angeboten:' },
  /** Knöpfe des Popups. */
  stepBack: { de: 'Zurück' },
  stepNext: { de: 'Weiter' },
  createShopOffer: { de: 'Angebot erstellen' },
  cancel: { de: 'Abbrechen' },
  /** Meldung nach dem Anlegen. */
  shopOfferCreatedTitle: { de: 'Angebot erstellt' },
  shopOfferCreatedText: { de: 'Es steht jetzt im Markt: {summary}' },
  /** Meldungen, solange eine Angabe nicht passt. */
  offerPriceMissing: { de: 'Bitte einen Preis in ganzen Punkten angeben (ab 0).' },
  offerUsageCountMissing: { de: 'Bitte angeben, wie oft der Käufer es benutzen darf (mindestens 1).' },
  offerEndsAtInvalid: { de: 'Bitte einen Zeitpunkt in der Zukunft angeben.' },
  offerMaxPurchaseCountInvalid: { de: 'Die Stückzahl ist eine ganze Zahl ab 1.' },

  /** Bausteine der Zusammenfassung eines Angebots, z. B. „80 Punkte · 10 Nutzungen · bis 01.12.2026, 00:00 · noch 7 von 10“. */
  offerSummaryPrice: { de: '{pricePoints} Punkte' },
  offerSummaryPermanent: { de: 'unbegrenzt nutzbar' },
  offerSummaryUsages: { de: '{count} Nutzungen' },
  offerSummaryEndsAt: { de: 'bis {dateTime}' },
  offerSummaryStock: { de: 'noch {remaining} von {max}' },
  /** An der Kachel: was der Betrachter von dem Artikel schon hat. */
  ownedPermanently: { de: 'Du hast es dauerhaft.' },
  ownedUsages: { de: 'Du hast noch {count} Nutzungen.' },
  /** An der Kachel: der Knopf an einem Angebot. */
  buy: { de: 'Kaufen' },
  /** Für Screenreader: der Knopf „Kaufen“ eines Angebots. */
  buyLabel: { de: '{heading} kaufen: {summary}' },

  /** Das Popup zur Bestätigung eines Kaufs. */
  buyPopupTitle: { de: 'Kaufen' },
  buyPopupWhatLabel: { de: 'Du bekommst' },
  buyPopupGetsPermanent: { de: 'Du darfst es unbegrenzt nutzen. Das läuft nie ab.' },
  buyPopupGetsUsages: { de: '{count} Nutzungen. Sie laufen nie ab.' },
  buyPopupOwnedUsagesAfter: { de: 'Du hast schon {owned} Nutzungen, danach sind es {after}.' },
  buyPopupOwnedUsagesReplaced: { de: 'Deine {owned} restlichen Nutzungen brauchst du danach nicht mehr.' },
  buyPopupPriceLabel: { de: 'Preis' },
  buyPopupBalanceLabel: { de: 'Dein Punktestand' },
  buyPopupBalanceAfterLabel: { de: 'Danach' },
  buyPopupPoints: { de: '{points} Punkte' },
  buyPopupNotEnoughPoints: { de: 'Deine Punkte reichen dafür nicht.' },
  /** Der Knopf, der kauft. */
  buyPopupConfirm: { de: 'Für {points} Punkte kaufen' },
  buyPopupConfirmFree: { de: 'Kostenlos nehmen' },
  /** Meldung nach dem Kauf. */
  boughtTitle: { de: 'Gekauft' },
  boughtText: { de: '{heading} gehört jetzt dir.' },

  /** An der Kachel eines Artikels, für den gerade kein Angebot läuft. */
  noRunningShopOffer: { de: 'zurzeit kein Angebot' },
  /** An der Kachel eines eigenen Artikels ohne Angebot: der Knopf, der den Ablauf bei der Laufzeit beginnt. */
  createShopOfferForItem: { de: 'Angebot erstellen' },
} satisfies Record<string, MultilingualText>
