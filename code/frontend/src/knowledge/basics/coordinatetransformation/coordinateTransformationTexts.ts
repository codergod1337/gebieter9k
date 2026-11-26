import type { MultilingualText } from '../../../language/MultilingualText.ts'

/** Alle Texte der Seite „Koordinatentransformation“, mehrsprachig angelegt. */
export const COORDINATE_TRANSFORMATION_TEXTS = {
  /** Titel und der eine Satz in der Übersicht des Kapitels. */
  pageTitle: { de: 'Koordinatentransformation' },
  pageSummary: { de: 'Kartesische Koordinaten und Polarkoordinaten ineinander umrechnen, jede Umformung einzeln.' },

  /** Die erste Box: worum es geht, daneben die Skizze. */
  introTitle: { de: 'Koordinatentransformation: kartesisch und polar' },
  introTwoWays: {
    de: 'Ein Punkt P in der Ebene lässt sich auf zwei Arten angeben. Kartesisch: wie weit er entlang der x-Achse und entlang der y-Achse vom Ursprung entfernt ist, also durch x und y. Polar: wie weit er vom Ursprung entfernt ist und in welcher Richtung er liegt, also durch den Abstand r und den Winkel φ zur x-Achse.',
  },
  introTriangle: {
    de: 'Beide Angaben beschreiben denselben Punkt. Die Skizze zeigt, wie sie zusammenhängen: x, y und r bilden ein rechtwinkliges Dreieck, φ ist der Winkel am Ursprung. Aus diesem Dreieck folgen alle vier Umrechnungen.',
  },
  introHowToRead: {
    de: 'In jeder Rechnung zeigt „Nächster Schritt“ genau eine Umformung. Jede Größe behält auf der ganzen Seite ihre Farbe, in der Skizze wie in den Formeln. So sieht man, wohin sie bei einer Umformung wandert.',
  },
  /** Für Screenreader: was die Skizze zeigt. */
  sketchDescription: {
    de: 'Achsenkreuz mit dem Punkt P. Vom Ursprung führt die Strecke r zu P, sie schließt mit der x-Achse den Winkel φ ein. Die Strecke x liegt auf der x-Achse, die Strecke y steht senkrecht darauf und endet in P.',
  },

  /** Die Titel der vier Herleitungen. */
  xCoordinateTitle: { de: 'Von polar nach kartesisch: x aus r und φ' },
  yCoordinateTitle: { de: 'Von polar nach kartesisch: y aus r und φ' },
  radiusTitle: { de: 'Von kartesisch nach polar: r aus x und y' },
  angleTitle: { de: 'Von kartesisch nach polar: φ aus x und y' },

  /** Umformungen, wie sie hinter dem Strich am Zeilenende stehen. */
  timesNotation: { de: '·' },
  swapSidesNotation: { de: 'Seiten tauschen' },
  rootNotation: { de: '√' },
  arctangentNotation: { de: 'arctan' },

  /** x aus r und φ. */
  cosineDefinitionExplanation: {
    de: 'Im rechtwinkligen Dreieck ist der Kosinus eines Winkels die Ankathete geteilt durch die Hypotenuse. Die Ankathete von φ ist x, die Hypotenuse ist r.',
  },
  xCoordinateTimesRadiusExplanation: {
    de: 'Beide Seiten mal r. Rechts kürzt sich r gegen den Nenner weg, links steht es jetzt als Faktor.',
  },
  xCoordinateSwapExplanation: {
    de: 'Dieselbe Gleichung, von rechts nach links gelesen: Die gesuchte Größe x steht jetzt allein auf der linken Seite.',
  },

  /** y aus r und φ. */
  sineDefinitionExplanation: {
    de: 'Der Sinus eines Winkels ist die Gegenkathete geteilt durch die Hypotenuse. Die Gegenkathete von φ ist y, die Hypotenuse ist wieder r.',
  },
  yCoordinateTimesRadiusExplanation: {
    de: 'Beide Seiten mal r. Rechts kürzt sich r gegen den Nenner weg, links steht es jetzt als Faktor.',
  },
  yCoordinateSwapExplanation: {
    de: 'Dieselbe Gleichung, von rechts nach links gelesen: Die gesuchte Größe y steht jetzt allein auf der linken Seite.',
  },

  /** r aus x und y. */
  pythagoreanExplanation: {
    de: 'Satz des Pythagoras: Im rechtwinkligen Dreieck ist das Quadrat der Hypotenuse so groß wie die Quadrate der beiden Katheten zusammen.',
  },
  radiusRootExplanation: {
    de: 'Auf beiden Seiten die Wurzel ziehen. Links hebt sie das Quadrat auf, rechts bleibt sie stehen. r ist ein Abstand und nie negativ, deshalb zählt nur die positive Wurzel.',
  },

  /** φ aus x und y. */
  tangentDefinitionExplanation: {
    de: 'Der Tangens eines Winkels ist die Gegenkathete geteilt durch die Ankathete, hier y durch x.',
  },
  angleArctangentExplanation: {
    de: 'Auf beiden Seiten den Arkustangens anwenden, die Umkehrung des Tangens. Links hebt er den Tangens auf und φ bleibt allein, rechts bleibt er stehen.',
  },

  /** Die letzte Box: alle vier Ergebnisse und der Hinweis zum Arkustangens. */
  summaryTitle: { de: 'Zusammenfassung' },
  summaryPolarToCartesian: { de: 'Von polar nach kartesisch' },
  summaryCartesianToPolar: { de: 'Von kartesisch nach polar' },
  summaryArctangentHint: {
    de: 'Vorsicht beim Winkel: Der Arkustangens liefert nur Winkel zwischen −90° und 90°. Liegt der Punkt links von der y-Achse (x < 0), kommen 180° dazu; für x = 0 ist der Bruch y / x nicht definiert. Viele Programmiersprachen haben dafür die Funktion atan2(y, x): Sie liefert den Winkel in allen vier Quadranten richtig.',
  },
} satisfies Record<string, MultilingualText>
