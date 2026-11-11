import { LookBadge } from '../../badge/LookBadge.tsx'
import { Hoverlay } from '../../components/Hoverlay.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import type { AccessRole } from './AccessRole.ts'
import type { AccessRoleCollection } from './AccessRoleCollection.ts'
import { AccessRoleBadge } from './AccessRoleBadge.tsx'

type AccessRoleCollectionBadgeProps = {
  accessRoleCollection: AccessRoleCollection
  /** `false`: ohne Hoverlay, z. B. wenn die Pille selbst in einem Hoverlay steht (Hoverlay im Hoverlay geht nicht) */
  withHoverlay?: boolean
}

/**
 * Eine Position als Pille, wie in der Vorlage (ein Recht ist eckig). Ihr Aussehen kommt aus den Daten
 * (`badgeLook`), gezeichnet wird in base.css: unten schlicht, oben edel. Beim Zeigen nennt das Hoverlay alle Rechte, die
 * sie verleiht, als Badges in der Reihenfolge der Stammdaten.
 */
export function AccessRoleCollectionBadge({ accessRoleCollection, withHoverlay = true }: AccessRoleCollectionBadgeProps) {
  const { accessRoles, accessRoleCollectionRoles } = useMasterData()
  const displayNameText = getTextInCurrentLanguage(accessRoleCollection.displayName)
  const badge = (
    <LookBadge look={accessRoleCollection.badgeLook} shape="pill">
      {displayNameText}
    </LookBadge>
  )
  if (!withHoverlay || accessRoles === null || accessRoleCollectionRoles === null) {
    return badge
  }

  const grantedAccessRoleKeys = new Set<string>()
  for (const accessRoleCollectionRole of accessRoleCollectionRoles) {
    if (accessRoleCollectionRole.accessRoleCollectionKey === accessRoleCollection.key) {
      grantedAccessRoleKeys.add(accessRoleCollectionRole.accessRoleKey)
    }
  }
  const grantedAccessRoles: AccessRole[] = accessRoles.filter((accessRole) => grantedAccessRoleKeys.has(accessRole.key))
  let hoverlayText
  if (grantedAccessRoles.length === 0) {
    hoverlayText = <span>Die Position {displayNameText} verleiht noch keine Rechte.</span>
  } else {
    hoverlayText = (
      <span className="hoverlay-access-roles">
        <span>Die Position {displayNameText} verleiht:</span>
        <span className="hoverlay-access-roles-badges">
          {grantedAccessRoles.map((grantedAccessRole) => (
            <AccessRoleBadge key={grantedAccessRole.key} accessRole={grantedAccessRole} />
          ))}
        </span>
      </span>
    )
  }
  return (
    <Hoverlay text={hoverlayText}>
      <span className="hoverlay-anchor">{badge}</span>
    </Hoverlay>
  )
}
