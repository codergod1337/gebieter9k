import type { AccessRoleCollection } from '../auth/access/AccessRoleCollection.ts'
import { AccessRoleCollectionBadge } from '../auth/access/AccessRoleCollectionBadge.tsx'
import { ContentBox } from '../components/ContentBox.tsx'
import { CopyButton } from '../components/CopyButton.tsx'
import type { Users } from '../users/Users.ts'
import { VISIBILITY_LABELS } from '../users/visibilityLabels.ts'

type ProfileAccountBoxProps = {
  users: Users
  /** Die eigene Collection aus den Stammdaten, `null` solange sie laden. */
  accessRoleCollection: AccessRoleCollection | null
}

/** Box „Konto“, nur für den User selbst, wie in der Vorlage: E-Mail, GUID, Status, Position und Sichtbarkeiten. */
export function ProfileAccountBox({ users, accessRoleCollection }: ProfileAccountBoxProps) {
  const privateChip = (
    <span className="profile-private-chip">
      <i className="bi bi-lock"></i>
      nur für dich
    </span>
  )
  const profileVisibilityText = VISIBILITY_LABELS[users.profileVisibility]
  const friendListVisibilityText = VISIBILITY_LABELS[users.friendListVisibility]

  return (
    <ContentBox
      title="Konto"
      actions={privateChip}
      footer="Mit der E-Mail meldest du dich an. Ändern kann sie nur der Admin.">
      <dl className="profile-fields">
        <dt>E-Mail</dt>
        <dd>{users.email}</dd>
        <dt>GUID</dt>
        <dd>
          <span className="font-monospace small">{users.guid}</span>
          <CopyButton label="GUID kopieren" value={users.guid} />
        </dd>
        <dt>Status</dt>
        <dd>{users.status}</dd>
        <dt>Position</dt>
        <dd>
          {accessRoleCollection !== null && <AccessRoleCollectionBadge accessRoleCollection={accessRoleCollection} />}
          {accessRoleCollection === null && users.accessRoleCollectionKey !== null && <code>{users.accessRoleCollectionKey}</code>}
          {users.accessRoleCollectionKey === null && 'keine'}
        </dd>
        <dt>Profil sichtbar für</dt>
        <dd>{profileVisibilityText}</dd>
        <dt>Freundesliste für</dt>
        <dd>{friendListVisibilityText}</dd>
      </dl>
    </ContentBox>
  )
}
