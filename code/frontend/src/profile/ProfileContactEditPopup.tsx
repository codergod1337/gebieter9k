import { type ChangeEvent, type FormEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { VisibilityPicker } from '../components/VisibilityPicker.tsx'
import { SubmitButton } from '../components/SubmitButton.tsx'
import { USERS_CONTACT_VALUE_MAX_LENGTH, type UsersContact, type UsersContactType } from '../users/UsersContact.ts'
import {
  USERS_CONTACT_GROUP_LABELS,
  USERS_CONTACT_TYPES,
  type UsersContactGroup,
  type UsersContactTypeEntry,
} from '../users/usersContactTypes.ts'
import { useUsersContact } from '../users/useUsersContact.ts'
import type { Visibility } from '../users/Users.ts'

type ProfileContactEditPopupProps = {
  /** Die gespeicherten eigenen Angaben samt Sichtbarkeit. */
  ownContacts: UsersContact[]
  /** Nach dem Speichern: Der Aufrufer lädt die Angaben neu. */
  onSaved: () => Promise<void>
  onClose: () => void
}

/** Was im Popup je Art eingetragen ist. */
type ContactDraft = {
  contactValue: string
  visibility: Visibility
}

/** Die Teile in der Reihenfolge des Popups. */
const CONTACT_GROUPS: UsersContactGroup[] = ['ADDRESS', 'SOCIAL']

/** Der Stand im Popup zu Beginn: die gespeicherten Angaben, sonst leer mit der Vorauswahl der Art. */
function createInitialDrafts(ownContacts: UsersContact[]): Record<UsersContactType, ContactDraft> {
  const drafts = {} as Record<UsersContactType, ContactDraft>
  for (const entry of USERS_CONTACT_TYPES) {
    const savedContact = ownContacts.find((ownContact) => ownContact.contactType === entry.contactType)
    if (savedContact !== undefined) {
      drafts[entry.contactType] = { contactValue: savedContact.contactValue, visibility: savedContact.visibility }
    } else {
      drafts[entry.contactType] = { contactValue: '', visibility: entry.newVisibility }
    }
  }
  return drafts
}

/**
 * Die eigenen Kontaktangaben bearbeiten, als Popup: je Art eine Zeile mit Bezeichnung, Feld und Sichtbarkeit
 * ({@link VisibilityPicker}, dieselbe Auswahl wie überall: Nur ich, Ich und meine Freunde, Alle User, Alle), frei
 * einstellbar (Nutzer 2026-11-09). Der Inhalt scrollt, Kopf und „Speichern“ bleiben stehen. Ein leeres Feld löscht die Angabe.
 * „Speichern“ schickt nur, was sich geändert hat. Über allem steht die Sichtbarkeit des Profils: Wer das Profil nicht
 * sehen darf, sieht auch keinen Kontakt.
 */
export function ProfileContactEditPopup({ ownContacts, onSaved, onClose }: ProfileContactEditPopupProps) {
  const usersContactHook = useUsersContact()
  const [drafts, setDrafts] = useState<Record<UsersContactType, ContactDraft>>(() => createInitialDrafts(ownContacts))
  const [isSaving, setIsSaving] = useState<boolean>(false)
  let saveErrorMessage: string | null = null
  if (usersContactHook.error !== null) {
    saveErrorMessage = usersContactHook.error.detail
  }

  function changeDraft(contactType: UsersContactType, changedFields: Partial<ContactDraft>) {
    setDrafts((currentDrafts) => ({ ...currentDrafts, [contactType]: { ...currentDrafts[contactType], ...changedFields } }))
  }

  /** Speichert jede geänderte Angabe nacheinander; beim ersten Fehler bleibt das Popup mit dem Grund offen. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    let allSaved = true
    for (const entry of USERS_CONTACT_TYPES) {
      const contactType = entry.contactType
      const draft = drafts[contactType]
      const enteredValue = draft.contactValue.trim()
      const savedContact = ownContacts.find((ownContact) => ownContact.contactType === contactType)
      if (enteredValue === '') {
        if (savedContact === undefined) {
          continue
        }
        const deleted = await usersContactHook.deleteOwnUsersContact(contactType)
        if (!deleted) {
          allSaved = false
          break
        }
        continue
      }
      const unchanged =
        savedContact !== undefined && savedContact.contactValue === enteredValue && savedContact.visibility === draft.visibility
      if (unchanged) {
        continue
      }
      const savedUsersContact = await usersContactHook.saveOwnUsersContact(contactType, enteredValue, draft.visibility)
      if (savedUsersContact === null) {
        allSaved = false
        break
      }
    }
    await onSaved()
    setIsSaving(false)
    if (allSaved) {
      onClose()
    }
  }

  function renderContactRow(entry: UsersContactTypeEntry) {
    const contactType = entry.contactType
    const draft = drafts[contactType]
    const controlId = 'profileContact-' + contactType
    const toggleLabel = entry.label + ' sichtbar für'
    function handleValueChange(event: ChangeEvent<HTMLInputElement>) {
      const changedValue = event.target.value
      changeDraft(contactType, { contactValue: changedValue })
    }
    function handleVisibilityChange(changedVisibility: Visibility) {
      changeDraft(contactType, { visibility: changedVisibility })
    }
    return (
      <div key={contactType} className="profile-contact-edit-row">
        <Form.Label htmlFor={controlId} className="profile-contact-edit-label">
          <i className={entry.iconClassName + ' me-2'} aria-hidden="true"></i>
          {entry.label}
        </Form.Label>
        <Form.Control
          id={controlId}
          type="text"
          maxLength={USERS_CONTACT_VALUE_MAX_LENGTH}
          placeholder={entry.placeholder}
          value={draft.contactValue}
          disabled={isSaving}
          onChange={handleValueChange}
        />
        <VisibilityPicker value={draft.visibility} onChange={handleVisibilityChange} ariaLabel={toggleLabel} disabled={isSaving} />
      </div>
    )
  }

  return (
    <Modal show onHide={onClose} centered size="lg" scrollable>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Kontakt bearbeiten</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ErrorAlert message={saveErrorMessage} />
          <p className="text-body-secondary small">
            Je Angabe wählst du, wer sie sieht. Ein leeres Feld löscht die Angabe. Ist dein Profil auf „Nur ich“, sieht
            niemand außer dir etwas davon.
          </p>
          {CONTACT_GROUPS.map((contactGroup) => {
            const groupEntries = USERS_CONTACT_TYPES.filter((entry) => entry.group === contactGroup)
            return (
              <section key={contactGroup} className="profile-contact-edit-group">
                <h3 className="profile-contact-edit-group-title">{USERS_CONTACT_GROUP_LABELS[contactGroup]}</h3>
                {groupEntries.map(renderContactRow)}
              </section>
            )
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Abbrechen
          </Button>
          <SubmitButton isSubmitting={isSaving} fullWidth={false}>
            Speichern
          </SubmitButton>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
