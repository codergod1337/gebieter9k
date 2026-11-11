import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { AccessRole } from './AccessRole.ts'

type AccessRoleBadgeProps = {
  accessRole: AccessRole
}

/** Ein Recht als Badge, eckig wie in der Vorlage (die Collection ist eine Pille). Aussehen fest in `base.css`. */
export function AccessRoleBadge({ accessRole }: AccessRoleBadgeProps) {
  const displayNameText = getTextInCurrentLanguage(accessRole.displayName)
  return (
    <span className="access-role-badge">{displayNameText}</span>
  )
}
