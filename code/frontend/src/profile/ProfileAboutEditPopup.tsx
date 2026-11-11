import { useState } from 'react'
import { EditValuePopup } from '../components/EditValuePopup.tsx'
import { MultilingualRichTextEditor } from '../components/MultilingualRichTextEditor.tsx'
import { isAnyRichTextLanguageTooLong, sanitizeMultilingualRichText } from '../components/richTextHtml.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'
import { PROFILE_ABOUT_TEXT_MAX_LENGTH } from '../users/UsersDetail.ts'
import { useUsersDetail } from '../users/useUsersDetail.ts'

type ProfileAboutEditPopupProps = {
  /** Der gespeicherte Text (mehrsprachiger Rich-Text), `null` ohne. */
  aboutText: MultilingualText | null
  /** Nach dem Speichern: Der Aufrufer lädt die Details neu. */
  onSaved: () => Promise<void>
  onClose: () => void
}

/**
 * Den eigenen Text „Über mich“ schreiben, im kleinen Popup ({@link EditValuePopup}, Nutzer 2026-11-09: keine eigene
 * Seite), mit dem {@link MultilingualRichTextEditor}: je Sprache fett, kursiv, Überschriften, Trennlinie. Der Zähler
 * zählt den sichtbaren Text; gespeichert wird bereinigt, ohne Inhalt heißt: kein Text.
 */
export function ProfileAboutEditPopup({ aboutText, onSaved, onClose }: ProfileAboutEditPopupProps) {
  const usersDetailHook = useUsersDetail()
  const [enteredAboutText, setEnteredAboutText] = useState<MultilingualText>(aboutText ?? {})
  const aboutTextTooLong = isAnyRichTextLanguageTooLong(enteredAboutText, PROFILE_ABOUT_TEXT_MAX_LENGTH)
  let saveErrorMessage: string | null = null
  if (usersDetailHook.error !== null) {
    saveErrorMessage = usersDetailHook.error.detail
  }

  async function handleSave() {
    const changedAboutText = sanitizeMultilingualRichText(enteredAboutText)
    const savedUsersDetail = await usersDetailHook.changeOwnUsersDetailAboutText(changedAboutText)
    if (savedUsersDetail === null) {
      return
    }
    await onSaved()
    onClose()
  }

  return (
    <EditValuePopup
      title="Über mich"
      isSaving={usersDetailHook.isLoading}
      errorMessage={saveErrorMessage}
      saveDisabled={aboutTextTooLong}
      onSave={() => void handleSave()}
      onClose={onClose}>
      <MultilingualRichTextEditor
        value={enteredAboutText}
        onChange={setEnteredAboutText}
        ariaLabel="Über mich"
        disabled={usersDetailHook.isLoading}
        placeholder="Erzähl etwas über dich: Hobbys, Lieblingsspiele, was du hier hochlädst …"
        maxPlainTextLength={PROFILE_ABOUT_TEXT_MAX_LENGTH}
      />
    </EditValuePopup>
  )
}
