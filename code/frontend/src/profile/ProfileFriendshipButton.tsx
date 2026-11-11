import { useEffect } from 'react'
import Button from 'react-bootstrap/Button'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { Hoverlay } from '../components/Hoverlay.tsx'
import { showToast } from '../components/toastStore.ts'
import { useOwnFriends } from '../users/useOwnFriends.ts'

type ProfileFriendshipButtonProps = {
  /** Wessen Profil. */
  profileUsersGuid: string
}

/**
 * Oben im Profil eines anderen Users, wie man zu ihm steht und was man tun kann (Nutzer 2026-11-09: Freunde sind die
 * Referenz für „Sichtbar für: Ich und meine Freunde“):
 * - fremd: „Freund hinzufügen“ stellt einen Antrag,
 * - angefragt: „Anfrage gesendet“, wartet auf die Antwort,
 * - von dort angefragt: „Annehmen“ und „Ablehnen“,
 * - befreundet: „Befreundet“; beenden geht in der Freunde-Box des eigenen Profils.
 */
export function ProfileFriendshipButton({ profileUsersGuid }: ProfileFriendshipButtonProps) {
  const { session } = useCurrentSession()
  const ownFriends = useOwnFriends()
  const errorMessage = ownFriends.errorMessage

  // Ein Fehler kommt als Toast: Oben im Profilkopf ist kein Platz für eine Meldung
  useEffect(() => {
    if (errorMessage !== null) {
      showToast({ kind: 'error', title: 'Freundschaft', text: errorMessage })
    }
  }, [errorMessage])

  if (ownFriends.friendUsersGuids === null || session === null || session.users.guid === profileUsersGuid) {
    return null
  }
  const relation = ownFriends.getRelation(profileUsersGuid)

  async function handleRequest() {
    const requested = await ownFriends.requestFriendship(profileUsersGuid)
    if (requested) {
      showToast({ kind: 'success', title: 'Anfrage gesendet', text: 'Sobald die Anfrage angenommen ist, seid ihr befreundet.' })
    }
  }

  async function handleAnswer(accepted: boolean) {
    const receivedRequest = ownFriends.findReceivedRequest(profileUsersGuid)
    if (receivedRequest === null) {
      return
    }
    await ownFriends.answerRequest(receivedRequest.id, accepted)
  }

  if (relation === 'FRIEND') {
    return (
      <Hoverlay text="Ihr seid befreundet. Beenden kannst du die Freundschaft in deinem Profil unter „Freunde“.">
        <span className="badge profile-friendship-badge" tabIndex={0}>
          <i className="bi bi-people-fill" aria-hidden="true"></i>
          Befreundet
        </span>
      </Hoverlay>
    )
  }
  if (relation === 'REQUEST_SENT') {
    return (
      <Hoverlay text="Deine Anfrage wartet auf eine Antwort.">
        <span className="badge profile-friendship-badge profile-friendship-badge-pending" tabIndex={0}>
          <i className="bi bi-hourglass-split" aria-hidden="true"></i>
          Anfrage gesendet
        </span>
      </Hoverlay>
    )
  }
  if (relation === 'REQUEST_RECEIVED') {
    return (
      <span className="profile-friendship-actions">
        <Button size="sm" variant="primary" disabled={ownFriends.isBusy} onClick={() => void handleAnswer(true)}>
          <i className="bi bi-person-check me-1" aria-hidden="true"></i>
          Annehmen
        </Button>
        <Button size="sm" variant="outline-secondary" disabled={ownFriends.isBusy} onClick={() => void handleAnswer(false)}>
          Ablehnen
        </Button>
      </span>
    )
  }
  return (
    <Button size="sm" variant="primary" disabled={ownFriends.isBusy} onClick={() => void handleRequest()}>
      <i className="bi bi-person-plus me-1" aria-hidden="true"></i>
      Freund hinzufügen
    </Button>
  )
}
