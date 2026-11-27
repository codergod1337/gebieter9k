import type { MultilingualText } from '../../language/MultilingualText.ts'

/** Die Texte des Animations-Moduls, mehrsprachig angelegt. Platzhalter stehen in geschweiften Klammern. */
export const ANIMATION_TEXTS = {
  /** Der Abspiel-Knopf an einer Gleichung (Hoverlay und Screenreader). */
  playAnimation: { de: 'Diesen Schritt ansehen' },
  /** Der Knopf am Editor und das Popup. */
  openPopup: { de: 'Animationen' },
  openPopupWithCount: { de: 'Animationen ({animationCount} von {transitionCount})' },
  popupTitle: { de: 'Animationen' },
  popupIntro: {
    de: 'Eine Animation gehört zum Übergang von einer Gleichung zur nächsten. Links die Gleichung wählen, rechts festlegen, was mit ihren Teilen geschieht.',
  },
  popupClose: { de: 'Schließen' },
  noEquations: { de: 'Der Inhalt hat noch keine Gleichung.' },
  equationsLabel: { de: 'Gleichungen' },
  hasAnimation: { de: 'hat eine Animation' },
  /** Der Übergang einer Gleichung. */
  transitionTitle: { de: 'Übergang von ({fromNumber}) nach ({toNumber})' },
  lastEquation: { de: 'Das ist die letzte Gleichung. Eine Animation führt immer zur nächsten Gleichung.' },
  fromLabel: { de: 'von ({number})' },
  toLabel: { de: 'nach ({number})' },
  noteLabel: { de: 'Notiz der Umformung (freiwillig), z. B. \\cdot r' },
  sourcePartsTitle: { de: 'Teile von ({number})' },
  targetPartsTitle: { de: 'Teile von ({number})' },
  noSourceIds: { de: 'Diese Gleichung hat keine ids. Im Editor einen Teil der Formel markieren und „id vergeben“.' },
  noTargetIds: { de: 'Die nächste Gleichung hat keine ids.' },
  behaviourLabel: { de: 'Was geschieht mit {formulaId}' },
  staysBehaviour: { de: 'bleibt stehen' },
  cancelledBehaviour: { de: 'wird gestrichen' },
  movesToBehaviour: { de: 'wandert zu {targetFormulaId}' },
  targetPlainBehaviour: { de: 'steht einfach da' },
  targetAppearsBehaviour: { de: 'kommt aus der Notiz' },
  targetOfMove: { de: 'Ziel von {formulaId}' },
  removeAnimation: { de: 'Animation dieses Übergangs entfernen' },
} satisfies Record<string, MultilingualText>
