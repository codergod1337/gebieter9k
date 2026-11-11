import type { BadgeLook } from '../badge/BadgeLook.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'

/**
 * Ein Rang der Rangleiter (`Rank` im Backend), von Stufe 1 (Leibeigener) bis 50 (General des Schreckens). Kein Recht
 * und keine Position, nur Anzeige: Ein User hat den höchsten Rang, dessen Mindestpunkte er erreicht.
 * Doku: `docu/entities/Rank.md`
 */
export type Rank = {
  key: string
  displayName: MultilingualText
  /** Die Stufe in der Leiter, ab 1. Gesetzt nur per Drag and Drop, neue kommen oben drauf. */
  level: number
  /** So viele Punkte braucht man mindestens für diesen Rang, ab 0. */
  minimumPoints: number
  /** Das Aussehen des Rang-Badges, `null`: Standard aus base.css. */
  badgeLook: BadgeLook | null
}
