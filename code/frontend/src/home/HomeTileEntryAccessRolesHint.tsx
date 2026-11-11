import type { AccessRole } from '../auth/access/AccessRole.ts'
import { AccessRoleBadge } from '../auth/access/AccessRoleBadge.tsx'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { Hoverlay } from '../components/Hoverlay.tsx'
import { useMasterData } from '../masterdata/useMasterData.ts'

type HomeTileEntryAccessRolesHintProps = {
  /** die Rechte, von denen eines das Modul öffnet; leer: jeder Angemeldete */
  entryAccessRoleKeys: string[]
}

/**
 * Das „i“ oben rechts in einer Kachel, wie in der Vorlage: Im Hoverlay die Rechte, von denen eines das Modul öffnet, als
 * Badges. Die der User hat, voll, die anderen gedimmt, dazu der Hinweis, dass weitere Rechte im Modul bestimmen, was er
 * darin darf.
 */
export function HomeTileEntryAccessRolesHint({ entryAccessRoleKeys }: HomeTileEntryAccessRolesHintProps) {
  const { hasAccessRole } = useCurrentSession()
  const { accessRoles } = useMasterData()

  let hoverlayText
  if (entryAccessRoleKeys.length === 0) {
    hoverlayText = <span>Für jeden Angemeldeten, ohne besonderes Recht.</span>
  } else {
    let introText = 'Diese AR öffnet das Modul:'
    if (entryAccessRoleKeys.length > 1) {
      introText = 'Eine dieser AR öffnet das Modul:'
    }
    const anyAccessRoleMissing = entryAccessRoleKeys.some((entryAccessRoleKey) => !hasAccessRole(entryAccessRoleKey))
    hoverlayText = (
      <span className="hoverlay-access-roles">
        <span>{introText}</span>
        <span className="hoverlay-access-roles-badges">
          {entryAccessRoleKeys.map((entryAccessRoleKey) => {
            let entryAccessRole: AccessRole | undefined = undefined
            if (accessRoles !== null) {
              entryAccessRole = accessRoles.find((accessRole) => accessRole.key === entryAccessRoleKey)
            }
            let badgeClassName: string | undefined = undefined
            if (!hasAccessRole(entryAccessRoleKey)) {
              badgeClassName = 'hoverlay-access-role-missing'
            }
            return (
              <span key={entryAccessRoleKey} className={badgeClassName}>
                {entryAccessRole !== undefined && <AccessRoleBadge accessRole={entryAccessRole} />}
                {entryAccessRole === undefined && <code>{entryAccessRoleKey}</code>}
              </span>
            )
          })}
        </span>
        {anyAccessRoleMissing && <span className="small">Gedimmt: Die hast du nicht.</span>}
        <span className="small">Was du darin darfst, bestimmen weitere AR im Modul.</span>
      </span>
    )
  }

  return (
    <Hoverlay text={hoverlayText}>
      <span className="tile-corner-hint" tabIndex={0} aria-label="Welche AR dieses Modul öffnen">
        <i className="bi bi-info-circle"></i>
      </span>
    </Hoverlay>
  )
}
