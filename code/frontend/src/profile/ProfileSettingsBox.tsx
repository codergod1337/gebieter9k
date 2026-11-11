import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { ContentBox } from '../components/ContentBox.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { LanguageFlag } from '../components/LanguageFlag.tsx'
import { VisibilityPicker } from '../components/VisibilityPicker.tsx'
import { DEFAULT_LANGUAGE } from '../language/activeLanguages.ts'
import { useUsers } from '../users/useUsers.ts'
import type { Users, Visibility } from '../users/Users.ts'
import { ProfileDummyChip } from './ProfileDummyChip.tsx'

type ProfileSettingsBoxProps = {
  users: Users
}

/**
 * Box „Einstellungen“ im eigenen Profil. Echt ist die Sichtbarkeit: Wer das Profil und wer die Freundesliste sieht,
 * wählt man mit derselben Auswahl wie überall ({@link VisibilityPicker}); die Wahl speichert sofort, danach zeigen alle
 * Module den neuen Stand.
 * Darunter, noch als Dummy, was später kommt (Darstellung, Sprache, Benachrichtigungen als `UsersSetting`).
 */
export function ProfileSettingsBox({ users }: ProfileSettingsBoxProps) {
  const usersHook = useUsers()
  const { acceptOwnUsers } = useCurrentSession()
  const isSaving = usersHook.isLoading
  let saveErrorMessage: string | null = null
  if (usersHook.error !== null) {
    saveErrorMessage = usersHook.error.detail
  }

  /** Speichert beide Sichtbarkeiten und übernimmt den eigenen User mit dem neuen Stand. */
  async function saveVisibility(profileVisibility: Visibility, friendListVisibility: Visibility) {
    const changedUsers = await usersHook.changeOwnUsersVisibility(profileVisibility, friendListVisibility)
    if (changedUsers !== null) {
      acceptOwnUsers(changedUsers)
    }
  }

  function handleProfileVisibilityChange(changedProfileVisibility: Visibility) {
    if (changedProfileVisibility === users.profileVisibility) {
      return
    }
    void saveVisibility(changedProfileVisibility, users.friendListVisibility)
  }

  function handleFriendListVisibilityChange(changedFriendListVisibility: Visibility) {
    if (changedFriendListVisibility === users.friendListVisibility) {
      return
    }
    void saveVisibility(users.profileVisibility, changedFriendListVisibility)
  }

  let footer = <span>Deine Wahl speichert sofort.</span>
  if (isSaving) {
    footer = (
      <span>
        <Spinner animation="border" size="sm" className="me-2" />
        Wird gespeichert …
      </span>
    )
  }

  return (
    <ContentBox title="Einstellungen" footer={footer}>
      <ErrorAlert message={saveErrorMessage} />
      <div className="profile-setting">
        <div className="form-label">Profil sichtbar für</div>
        <VisibilityPicker
          value={users.profileVisibility}
          onChange={handleProfileVisibilityChange}
          ariaLabel="Profil sichtbar für"
          disabled={isSaving}
        />
      </div>
      <div className="profile-setting">
        <div className="form-label">Freundesliste sichtbar für</div>
        <VisibilityPicker
          value={users.friendListVisibility}
          onChange={handleFriendListVisibilityChange}
          ariaLabel="Freundesliste sichtbar für"
          disabled={isSaving}
        />
      </div>
      <div className="profile-settings-later">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="fw-semibold">Kommt später</span>
          <ProfileDummyChip />
        </div>
        <fieldset disabled>
          <Form.Group className="mb-3" controlId="profileSettingsTheme">
            <Form.Label>Darstellung</Form.Label>
            <Form.Select defaultValue="SYSTEM">
              <option value="SYSTEM">wie das System</option>
              <option value="LIGHT">hell</option>
              <option value="DARK">dunkel</option>
            </Form.Select>
          </Form.Group>
          <div className="mb-3">
            <div className="form-label">Sprache</div>
            <LanguageFlag language={DEFAULT_LANGUAGE} />
            <span className="ms-2">{DEFAULT_LANGUAGE.name}</span>
          </div>
          <Form.Check type="switch" id="profileSettingsFriendRequests" label="Freundschaftsanfragen erlauben" defaultChecked />
          <Form.Check type="switch" id="profileSettingsNotifications" label="Benachrichtigung bei neuen Kommentaren" />
        </fieldset>
      </div>
    </ContentBox>
  )
}
