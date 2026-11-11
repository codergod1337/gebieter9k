import { LookBadge } from '../badge/LookBadge.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import type { Achievement } from './Achievement.ts'

type AchievementBadgeProps = {
  achievement: Achievement
}

/** Die ersten Buchstaben der ersten beiden Wörter, z. B. „Knipsgott“ → K, „Großer Spender“ → GS. */
function getInitials(text: string): string {
  const words = text.split(' ').filter((word) => word !== '')
  const firstLetters = words.slice(0, 2).map((word) => word.charAt(0))
  return firstLetters.join('').toUpperCase()
}

/**
 * Ein Achievement als rundes Medaillon: in der Mitte das Symbol, ohne Symbol die Anfangsbuchstaben. Der Name steht im
 * Tooltip. Aussehen aus den Daten (`badgeLook`).
 */
export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const displayNameText = getTextInCurrentLanguage(achievement.displayName)
  const initials = getInitials(displayNameText)
  return (
    <LookBadge look={achievement.badgeLook} shape="medal" title={displayNameText}>
      {initials}
    </LookBadge>
  )
}
