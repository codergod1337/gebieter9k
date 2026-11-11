import type { BadgeLook } from '../badge/BadgeLook.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'
import type { AchievementTrackingKey } from './achievementTrackingKeys.ts'

/**
 * Ein Achievement (`Achievement` im Backend), ähnlich wie bei Steam: ein Abzeichen, das man sich freischaltet. Es hängt
 * an einer Tracking-Art; erreicht ist es, wenn deren Kontrollcounter die Schwelle überschreitet (Nutzer 2026-11-09).
 * Doku: `docu/entities/Achievement.md`
 */
export type Achievement = {
  key: string
  displayName: MultilingualText
  /** wofür es das Achievement gibt, z. B. `{"de": "1000 Bilder hochgeladen."}`; darf fehlen */
  description: MultilingualText | null
  /** Platz in der Anzeige ab 1, gesetzt per Drag and Drop. Beim Anlegen und Ändern zählt er nicht. */
  listingPosition: number
  /** Das Aussehen des Medaillons, `null`: Standard aus base.css. */
  badgeLook: BadgeLook | null
  /** An welcher Tracking-Art es hängt, `null`: wird nur von Hand vergeben. */
  trackingKey: AchievementTrackingKey | null
  /** Ab diesem Stand des Kontrollcounters erreicht, z. B. 3600 (Sekunden); nur mit Tracking-Art. */
  thresholdValue: number | null
  /** Wiederholbar: jedes weitere Vielfache der Schwelle ist ein weiterer Abschluss. */
  repeatable: boolean
  /** Punkte je Abschluss aufs Punktekonto. */
  rewardPoints: number
}
