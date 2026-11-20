import type { MultilingualText } from '../../language/MultilingualText.ts'
import type { FileCheerDirection } from '../FileCheer.ts'
import { FILE_CHEER_TEXTS } from './fileCheerTexts.ts'

/**
 * Was je Richtung feststeht: Bezeichnung (mehrsprachig, aus {@link FILE_CHEER_TEXTS}) und Smiley (Nutzer 2026-11-11:
 * Smileys statt der Daumen von Facebook). An einer Stelle, damit die Stimmen überall gleich aussehen: in der
 * `FileCheerBar` des angemeldeten Users und in den Zahlen auf der Besucherseite einer Galerie-Freigabe.
 */
export const CHEER_LOOKS: Record<FileCheerDirection, { label: MultilingualText; emoji: string }> = {
  UP: { label: FILE_CHEER_TEXTS.upLabel, emoji: '🤩' },
  DOWN: { label: FILE_CHEER_TEXTS.downLabel, emoji: '🤮' },
}
