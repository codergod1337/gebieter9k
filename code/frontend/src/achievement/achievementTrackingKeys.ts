/** Die Tracking-Arten, wie `AchievementTrackingKey` im Backend. */
export type AchievementTrackingKey = 'ONLINE_PRESENCE'

/** Wie eine Tracking-Art im Admin heißt und in welcher Einheit ihre Schwelle zählt (nie den Enum-Wert zeigen). */
export type AchievementTrackingKeyLook = {
  label: string
  unit: string
  /** Hinweis unter der Schwelle, z. B. ein Rechenbeispiel. */
  thresholdHint: string
}

export const ACHIEVEMENT_TRACKING_KEY_LOOKS: Record<AchievementTrackingKey, AchievementTrackingKeyLook> = {
  ONLINE_PRESENCE: {
    label: 'Online am Stück',
    unit: 'Sekunden',
    thresholdHint: '3600 = eine Stunde; gebucht wird jede Viertelstunde bei der Token-Verlängerung.',
  },
}

/** Die Tracking-Arten in der Reihenfolge der Auswahl. */
export const ACHIEVEMENT_TRACKING_KEYS: AchievementTrackingKey[] = ['ONLINE_PRESENCE']
