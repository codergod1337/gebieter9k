import { MathfieldElement } from 'mathlive'
// die Schriften der Formeln; das Eingabefeld selbst bringt sein Aussehen mit
import 'mathlive/fonts.css'

// Die Schriften kommen über das CSS oben und nicht aus einem Ordner neben dem Skript; Tastentöne gibt es nicht.
MathfieldElement.fontsDirectory = null
MathfieldElement.soundsDirectory = null

/** Das Eingabefeld der Bibliothek MathLive, fertig eingestellt. Nur {@link FormulaField} lädt dieses Stück nach. */
export { MathfieldElement }
