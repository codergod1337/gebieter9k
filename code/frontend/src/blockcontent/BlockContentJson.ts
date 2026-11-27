import type { EquationAnimationJson } from './animation/EquationAnimationJson.ts'
import type { ElementJson } from './elements/ElementJson.ts'

/**
 * Ein Inhalt als JSON (Fassung 2), so wie er gespeichert wird und wie der Editor ihn bearbeitet: ALLES, was zu ihm
 * gehört, in einem Stück (Nutzer 2026-11-27: „wir definieren immer die ganze seite in einem solr wissens dokument“).
 * Zwei getrennte Teile:
 *
 * - `elements`: was zu sehen ist, von oben nach unten ({@link ElementJson}).
 * - `animations`: je Gleichung, was beim Übergang zur nächsten mit ihren Teilen geschieht
 *   ({@link EquationAnimationJson}). Die Elemente wissen davon nichts.
 *
 * Der {@link BlockContentReader} prüft beim Lesen jedes Stück selbst; diese Typen beschreiben, was der Editor schreibt.
 * Das Format steht in `docu/blockcontent.md`.
 */
export type BlockContentJson = {
  elements: ElementJson[]
  animations?: EquationAnimationJson[]
}
