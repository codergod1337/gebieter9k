import { useCallback, useState } from 'react'
import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { EditValuePopup } from '../../components/EditValuePopup.tsx'
import { UsersGuidName } from '../../components/UsersGuidName.tsx'
import { useUsersFriendship } from '../../users/useUsersFriendship.ts'
import { useFileDocument } from '../useFileDocument.ts'

type FileEditorsPopupProps = {
  fileDocumentId: string
  /** Wer die Datei jetzt schon bearbeiten darf (GUIDs). */
  editorUsersGuids: string[]
  /** Für die Links auf die Profile („Zurück zu …“). */
  originLabel: string
  onSaved: () => Promise<void>
  onClose: () => void
}

/**
 * Wer außer dem Autor die Metadaten dieser Datei bearbeiten darf (Nutzer 2026-11-09: das „E“), als Popup: die eigenen
 * Freunde und wer schon freigegeben ist, je mit Haken. Andere mit derselben Rolle dürfen die Datei sonst nicht ändern,
 * der Autor hat Exklusivrechte; ein Bearbeiter darf die Datei auch lesen, aber nicht über sie bestimmen (Sichtbarkeit,
 * löschen, freigeben).
 */
export function FileEditorsPopup({ fileDocumentId, editorUsersGuids, originLabel, onSaved, onClose }: FileEditorsPopupProps) {
  const friendshipHook = useUsersFriendship()
  const getOwnFriendUsersGuids = friendshipHook.getOwnFriendUsersGuids
  const changeHook = useFileDocument()
  const loadFriends = useCallback(() => getOwnFriendUsersGuids(), [getOwnFriendUsersGuids])
  const loadedFriends = useLoadedData(loadFriends)
  const [chosenUsersGuids, setChosenUsersGuids] = useState<string[]>(editorUsersGuids)
  let saveErrorMessage: string | null = null
  if (changeHook.error !== null) {
    saveErrorMessage = changeHook.error.detail
  }

  // Wer zur Wahl steht: die Freunde und wer schon freigegeben ist (auch wenn die Freundschaft vorbei ist)
  const offeredUsersGuids: string[] = [...editorUsersGuids]
  for (const friendUsersGuid of loadedFriends.data ?? []) {
    if (!offeredUsersGuids.includes(friendUsersGuid)) {
      offeredUsersGuids.push(friendUsersGuid)
    }
  }

  function toggleUsers(usersGuid: string) {
    setChosenUsersGuids((currentUsersGuids) => {
      if (currentUsersGuids.includes(usersGuid)) {
        return currentUsersGuids.filter((currentUsersGuid) => currentUsersGuid !== usersGuid)
      }
      return [...currentUsersGuids, usersGuid]
    })
  }

  async function handleSave() {
    const changedFileDocument = await changeHook.changeFileDocumentEditors(fileDocumentId, chosenUsersGuids)
    if (changedFileDocument === null) {
      return
    }
    await onSaved()
    onClose()
  }

  return (
    <EditValuePopup
      title="Wer darf bearbeiten?"
      isSaving={changeHook.isLoading}
      errorMessage={saveErrorMessage}
      onSave={() => void handleSave()}
      onClose={onClose}>
      <p className="small text-body-secondary">
        Freigegebene dürfen die Angaben dieser Datei bearbeiten und sie lesen, aber nicht löschen, freigeben oder ihre
        Sichtbarkeit ändern.
      </p>
      {loadedFriends.data === null && <Spinner animation="border" size="sm" />}
      {loadedFriends.data !== null && offeredUsersGuids.length === 0 && (
        <p className="mb-0 text-body-secondary">Du hast noch keine Freunde: Freigeben kannst du nur Freunden.</p>
      )}
      <div className="file-editors-list">
        {offeredUsersGuids.map((usersGuid) => (
          <div key={usersGuid} className="file-editors-option">
            <Form.Check
              type="checkbox"
              id={'fileEditor-' + usersGuid}
              checked={chosenUsersGuids.includes(usersGuid)}
              disabled={changeHook.isLoading}
              onChange={() => toggleUsers(usersGuid)}
              aria-label="freigeben"
            />
            <UsersGuidName usersGuid={usersGuid} originLabel={originLabel} />
          </div>
        ))}
      </div>
    </EditValuePopup>
  )
}
