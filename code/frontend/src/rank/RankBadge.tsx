import { LookBadge } from '../badge/LookBadge.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import type { Rank } from './Rank.ts'

type RankBadgeProps = {
  rank: Rank
}

/** Ein Rang als Schild: links die Stufe in einer Plakette, daneben der Name. Aussehen aus den Daten (`badgeLook`). */
export function RankBadge({ rank }: RankBadgeProps) {
  const displayNameText = getTextInCurrentLanguage(rank.displayName)
  return (
    <LookBadge look={rank.badgeLook} shape="tag" level={rank.level}>
      {displayNameText}
    </LookBadge>
  )
}
