import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import { ConfirmDeletePopup } from '../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../components/ContentBox.tsx'
import { DateTimeText } from '../components/DateTimeText.tsx'
import { DeleteButton } from '../components/DeleteButton.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { UsersGuidName } from '../components/UsersGuidName.tsx'
import { useOwnFriends } from '../users/useOwnFriends.ts'

/** Für „Zurück zu …“, wenn man von hier ein Profil öffnet. */
const FRIENDS_ORIGIN_LABEL = 'Freunde'

/**
 * Box „Freunde“ im eigenen Profil (Nutzer 2026-11-09): Die Freundesliste ist die Referenz für „Sichtbar für: Ich und
 * meine Freunde“. Oben die offenen Anfragen an mich zum Annehmen oder Ablehnen, darunter die Freunde (Freundschaft
 * beenden mit Sicherheitsabfrage), unten meine Anfragen, die noch warten. Anfragen stellt man auf dem Profil eines
 * anderen Users ({@link ProfileFriendshipButton}). Jede GUID über {@link UsersGuidName}.
 */
export function ProfileFriendsBox() {
  const ownFriends = useOwnFriends()
  const [endingFriendUsersGuid, setEndingFriendUsersGuid] = useState<string | null>(null)
  const friendUsersGuids = ownFriends.friendUsersGuids
  const receivedRequests = ownFriends.receivedRequests
  const sentRequests = ownFriends.sentRequests

  async function handleConfirmEndFriendship() {
    if (endingFriendUsersGuid === null) {
      return
    }
    const ended = await ownFriends.endFriendship(endingFriendUsersGuid)
    if (ended) {
      setEndingFriendUsersGuid(null)
    }
  }

  // Während der Sicherheitsabfrage steht der Fehler dort, nicht doppelt in der Box
  let boxErrorMessage: string | null = null
  if (endingFriendUsersGuid === null) {
    boxErrorMessage = ownFriends.errorMessage
  }
  let friendsTitle = 'Freunde'
  if (friendUsersGuids !== null) {
    friendsTitle = 'Freunde (' + friendUsersGuids.length + ')'
  }

  return (
    <ContentBox title="Freunde" footer="Freunde fragst du auf ihrem Profil mit „Freund hinzufügen“ an.">
      <ErrorAlert message={boxErrorMessage} />
      {friendUsersGuids === null && <Spinner animation="border" size="sm" />}

      {receivedRequests.length > 0 && (
        <section className="profile-friends-section" aria-label="Anfragen an dich">
          <h3 className="profile-friends-title">Anfragen an dich</h3>
          {receivedRequests.map((receivedRequest) => (
            <div key={receivedRequest.id} className="profile-friends-row">
              <UsersGuidName usersGuid={receivedRequest.requesterUsersGuid} originLabel={FRIENDS_ORIGIN_LABEL} />
              <span className="profile-friends-row-actions">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={ownFriends.isBusy}
                  onClick={() => void ownFriends.answerRequest(receivedRequest.id, true)}>
                  <i className="bi bi-person-check me-1" aria-hidden="true"></i>
                  Annehmen
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  disabled={ownFriends.isBusy}
                  onClick={() => void ownFriends.answerRequest(receivedRequest.id, false)}>
                  Ablehnen
                </Button>
              </span>
            </div>
          ))}
        </section>
      )}

      {friendUsersGuids !== null && (
        <section className="profile-friends-section" aria-label="Freunde">
          <h3 className="profile-friends-title">{friendsTitle}</h3>
          {friendUsersGuids.length === 0 && <p className="profile-friends-empty">Noch keine Freunde.</p>}
          {friendUsersGuids.map((friendUsersGuid) => (
            <div key={friendUsersGuid} className="profile-friends-row">
              <UsersGuidName usersGuid={friendUsersGuid} originLabel={FRIENDS_ORIGIN_LABEL} />
              <DeleteButton label="Freundschaft beenden" onClick={() => setEndingFriendUsersGuid(friendUsersGuid)} />
            </div>
          ))}
        </section>
      )}

      {sentRequests.length > 0 && (
        <section className="profile-friends-section" aria-label="Deine Anfragen">
          <h3 className="profile-friends-title">Deine Anfragen</h3>
          {sentRequests.map((sentRequest) => (
            <div key={sentRequest.id} className="profile-friends-row">
              <UsersGuidName usersGuid={sentRequest.acceptorUsersGuid} originLabel={FRIENDS_ORIGIN_LABEL} />
              <span className="profile-friends-pending">
                <i className="bi bi-hourglass-split" aria-hidden="true"></i>
                <DateTimeText isoDateTime={sentRequest.requestedAt} label="Angefragt" />
              </span>
            </div>
          ))}
        </section>
      )}

      {endingFriendUsersGuid !== null && (
        <ConfirmDeletePopup
          title="Freundschaft beenden"
          isDeleting={ownFriends.isBusy}
          errorMessage={ownFriends.errorMessage}
          onConfirm={() => void handleConfirmEndFriendship()}
          onClose={() => setEndingFriendUsersGuid(null)}>
          <p className="mb-2">Soll die Freundschaft mit diesem User enden?</p>
          <UsersGuidName usersGuid={endingFriendUsersGuid} originLabel={FRIENDS_ORIGIN_LABEL} />
          <p className="mt-2 mb-0 small">
            Sie endet für euch beide. Was ihr nur für Freunde sichtbar gemacht habt, seht ihr dann nicht mehr gegenseitig.
          </p>
        </ConfirmDeletePopup>
      )}
    </ContentBox>
  )
}
