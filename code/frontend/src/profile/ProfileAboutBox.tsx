import { type ReactNode, useState } from 'react'
import { ContentBox } from '../components/ContentBox.tsx'
import { EditButton } from '../components/EditButton.tsx'
import { RichTextView } from '../components/RichTextView.tsx'
import type { MultilingualText } from '../language/MultilingualText.ts'
import { ProfileAboutEditPopup } from './ProfileAboutEditPopup.tsx'

/** Im eigenen Profil: Schreiben über den Stift; nach dem Speichern lädt der Aufrufer die Details neu. */
export type OwnAboutEditing = {
  onSaved: () => Promise<void>
}

type ProfileAboutBoxProps = {
  /** Der Text aus `UsersDetail.aboutText` (mehrsprachiger Rich-Text), `null` ohne. */
  aboutText: MultilingualText | null
  /** Nur im eigenen Profil, sonst `null`: dann nur Anzeige. */
  ownAboutEditing: OwnAboutEditing | null
}

/**
 * Box „Über mich“ (Nutzer 2026-11-09, scharf geschaltet): der freie Text aus `UsersDetail.aboutText`, ganz, mit
 * Auszeichnungen über {@link RichTextView} (bereinigt). Im eigenen Profil schreibt man ihn über den Stift im kleinen
 * Popup ({@link ProfileAboutEditPopup}) mit dem Rich-Text-Editor, keine eigene Seite. Wer ihn sieht, regelt „Profil
 * sichtbar für“.
 */
export function ProfileAboutBox({ aboutText, ownAboutEditing }: ProfileAboutBoxProps) {
  const [editPopupOpen, setEditPopupOpen] = useState<boolean>(false)
  let actions: ReactNode = null
  if (ownAboutEditing !== null) {
    actions = <EditButton label="Über mich bearbeiten" onClick={() => setEditPopupOpen(true)} />
  }
  let emptyText = 'Hier steht noch nichts.'
  if (ownAboutEditing !== null) {
    emptyText = 'Noch nichts über dich. Über den Stift oben schreibst du etwas.'
  }

  return (
    <ContentBox title="Über mich" actions={actions} footer="Wer das sieht, regelt „Profil sichtbar für“.">
      {aboutText !== null && <RichTextView richText={aboutText} />}
      {aboutText === null && <p className="profile-about-empty">{emptyText}</p>}
      {editPopupOpen && ownAboutEditing !== null && (
        <ProfileAboutEditPopup aboutText={aboutText} onSaved={ownAboutEditing.onSaved} onClose={() => setEditPopupOpen(false)} />
      )}
    </ContentBox>
  )
}
