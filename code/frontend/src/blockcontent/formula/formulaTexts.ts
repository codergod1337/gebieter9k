import type { MultilingualText } from '../../language/MultilingualText.ts'

/** Die Texte am Formelfeld, mehrsprachig angelegt. Platzhalter stehen in geschweiften Klammern. */
export const FORMULA_TEXTS = {
  fieldLoading: { de: 'Das Formelfeld lädt …' },
  fieldLoadFailed: { de: 'Das Formelfeld ließ sich nicht laden: {reason}' },
  /** Einem markierten Teil eine id geben. */
  assignId: { de: 'id vergeben' },
  assignIdHint: {
    de: 'Erst im Formelfeld den Teil markieren, dann hier seine id vergeben. Eine id braucht nur, was in einer Animation vorkommt.',
  },
  idInputLabel: { de: 'id für den markierten Teil' },
  idInputPlaceholder: { de: 'z. B. r1' },
  idConfirm: { de: 'vergeben' },
  idCancel: { de: 'abbrechen' },
  idInvalid: { de: 'Buchstaben und Ziffern, vorn ein Buchstabe.' },
  idTaken: { de: 'Diese id gibt es in der Formel schon.' },
  idsLabel: { de: 'ids:' },
  removeId: { de: 'id {formulaId} entfernen' },
  /** Das LaTeX der Formel als Text. */
  showLatex: { de: 'LaTeX' },
  latexInputLabel: { de: 'Die Formel als LaTeX' },
  /** Popup für eine Formel mitten im Satz. */
  popupTitle: { de: 'Formel einfügen' },
  popupConfirm: { de: 'Einfügen' },
  popupCancel: { de: 'Abbrechen' },
} satisfies Record<string, MultilingualText>
