import { useCallback, useState } from 'react'
import Button from 'react-bootstrap/Button'
import { useLoadedData } from '../../api/useLoadedData.ts'
import type { UsersTotpStatus } from '../../auth/totp/UsersTotp.ts'
import { useUsersTotpAdmin } from '../../auth/totp/useUsersTotpAdmin.ts'
import { ConfirmDeletePopup } from '../../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../../components/ContentBox.tsx'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { formatDateTimeWithRelativeDays } from '../../components/formatDateTime.ts'
import { showToast } from '../../components/toastStore.ts'

type UsersTotpBoxProps = {
  usersGuid: string
  /** für die Sicherheitsabfrage, z. B. „alice“ */
  username: string
}

/** Was die App des Users gerade ist, in einem Satz. */
function getUsersTotpStatusText(usersTotpStatus: UsersTotpStatus | null): string {
  if (usersTotpStatus === null) {
    return 'Stand wird geladen …'
  }
  if (usersTotpStatus.state === 'PENDING') {
    return 'Einrichten angefangen, der erste Code fehlt noch.'
  }
  if (usersTotpStatus.state === 'ACTIVE' && usersTotpStatus.confirmedAt !== null) {
    const confirmedAtText = formatDateTimeWithRelativeDays(usersTotpStatus.confirmedAt)
    return 'Aktiv seit ' + confirmedAtText + '.'
  }
  return 'Nicht eingerichtet.'
}

/**
 * Box „Authenticator-App (2FA)“ auf „User bearbeiten“ (nur Admin): der Stand der App dieses Users und „Entfernen“, ohne
 * Code und ohne Schlüssel. Für den Fall, dass der User Handy und Schlüssel verloren hat; danach richtet er sie im Profil
 * neu ein.
 */
export function UsersTotpBox({ usersGuid, username }: UsersTotpBoxProps) {
  const usersTotpAdminHook = useUsersTotpAdmin()
  const getUsersTotpStatus = usersTotpAdminHook.getUsersTotpStatus
  const loadUsersTotpStatus = useCallback(() => getUsersTotpStatus(usersGuid), [getUsersTotpStatus, usersGuid])
  const loadedUsersTotpStatus = useLoadedData(loadUsersTotpStatus)
  const usersTotpStatus = loadedUsersTotpStatus.data
  const [confirmPopupOpen, setConfirmPopupOpen] = useState<boolean>(false)

  async function handleDeleteConfirm() {
    const deleted = await usersTotpAdminHook.deleteUsersTotp(usersGuid)
    if (!deleted) {
      return
    }
    setConfirmPopupOpen(false)
    showToast({ kind: 'success', title: 'Authenticator entfernt', text: username + ' kann ihn im Profil neu einrichten.' })
    void loadedUsersTotpStatus.reload()
  }

  let errorMessage: string | null = null
  if (usersTotpAdminHook.error !== null) {
    errorMessage = usersTotpAdminHook.error.detail
  }
  const statusText = getUsersTotpStatusText(usersTotpStatus)
  const nothingToRemove = usersTotpStatus === null || usersTotpStatus.state === 'NONE'
  const confirmQuestion =
    'Soll die Authenticator-App von ' + username + ' wirklich entfernt werden? Danach ist kein Code mehr nötig, bis sie im Profil neu eingerichtet wird.'

  return (
    <ContentBox title="Authenticator-App (2FA)">
      {!confirmPopupOpen && <ErrorAlert message={errorMessage} />}
      <div className="profile-security-row">
        <span className="d-flex flex-column">
          <strong>Stand</strong>
          <span className="small text-body-secondary">{statusText}</span>
        </span>
        <Button
          variant="outline-danger"
          size="sm"
          disabled={nothingToRemove || usersTotpAdminHook.isLoading}
          onClick={() => setConfirmPopupOpen(true)}>
          <i className="bi bi-shield-x me-1"></i>
          Entfernen
        </Button>
      </div>
      {confirmPopupOpen && (
        <ConfirmDeletePopup
          title="Authenticator-App entfernen"
          isDeleting={usersTotpAdminHook.isLoading}
          errorMessage={errorMessage}
          onConfirm={handleDeleteConfirm}
          onClose={() => setConfirmPopupOpen(false)}>
          {confirmQuestion}
        </ConfirmDeletePopup>
      )}
    </ContentBox>
  )
}
