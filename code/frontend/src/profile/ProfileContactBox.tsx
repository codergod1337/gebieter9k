import { type CSSProperties, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { ContentBox } from '../components/ContentBox.tsx'
import { CopyButton } from '../components/CopyButton.tsx'
import { EditButton } from '../components/EditButton.tsx'
import type { UsersContact, UsersContactForClient, UsersContactType } from '../users/UsersContact.ts'
import { getUsersContactProfileUrl, USERS_CONTACT_TYPES } from '../users/usersContactTypes.ts'
import { ProfileContactEditPopup } from './ProfileContactEditPopup.tsx'

/** Eine Zeile unter „Kontakt“. */
type ContactRow = {
  rowKey: string
  label: string
  iconClassName: string
  value: string
  /** Link zum Profil auf der Plattform, `null` wenn es keinen gibt */
  href: string | null
  tint: string
  ink: string
}

/** Nur im eigenen Profil: die eigenen Angaben samt Sichtbarkeit zum Bearbeiten und das Neuladen danach. */
export type OwnContactEditing = {
  ownContacts: UsersContact[]
  onSaved: () => Promise<void>
}

type ProfileContactBoxProps = {
  /** Die Angaben, die der Betrachter sieht; `null`, solange sie laden. */
  contacts: UsersContactForClient[] | null
  errorMessage: string | null
  /** `null` im Profil anderer. */
  ownContactEditing: OwnContactEditing | null
}

/** Die Teile der Anschrift, aus denen eine Zeile „Anschrift“ wird. */
const ADDRESS_PART_TYPES: UsersContactType[] = ['STREET', 'HOUSE_NUMBER', 'POSTAL_CODE', 'CITY', 'COUNTRY']

/**
 * Baut die Zeilen: Mobilnummer, die sichtbaren Teile der Anschrift in einer Zeile („Straße Nr, PLZ Stadt, Land“), dann
 * jede Plattform mit Kennung.
 */
function createContactRows(contacts: UsersContactForClient[]): ContactRow[] {
  const contactValueByType = new Map<UsersContactType, string>()
  for (const contact of contacts) {
    contactValueByType.set(contact.contactType, contact.contactValue)
  }
  const contactRows: ContactRow[] = []
  let addressRowAdded = false
  for (const entry of USERS_CONTACT_TYPES) {
    const isAddressPart = ADDRESS_PART_TYPES.includes(entry.contactType)
    if (isAddressPart) {
      if (addressRowAdded) {
        continue
      }
      addressRowAdded = true
      const streetLine = [contactValueByType.get('STREET'), contactValueByType.get('HOUSE_NUMBER')].filter(Boolean).join(' ')
      const cityLine = [contactValueByType.get('POSTAL_CODE'), contactValueByType.get('CITY')].filter(Boolean).join(' ')
      const addressText = [streetLine, cityLine, contactValueByType.get('COUNTRY')].filter(Boolean).join(', ')
      if (addressText !== '') {
        contactRows.push({ rowKey: 'ADDRESS', label: 'Anschrift', iconClassName: 'bi bi-geo-alt', value: addressText, href: null, tint: entry.tint, ink: entry.ink })
      }
      continue
    }
    const contactValue = contactValueByType.get(entry.contactType)
    if (contactValue === undefined) {
      continue
    }
    const profileUrl = getUsersContactProfileUrl(entry, contactValue)
    contactRows.push({
      rowKey: entry.contactType,
      label: entry.label,
      iconClassName: entry.iconClassName,
      value: contactValue,
      href: profileUrl,
      tint: entry.tint,
      ink: entry.ink,
    })
  }
  return contactRows
}

/**
 * Box „Kontakt“, wie in der Vorlage: Mobilnummer, Anschrift und Social-Media-Kennungen, je Zeile ein Symbol in
 * Markenfarben, mit Link, wo die Plattform einen Profil-Link hat, sonst zum Kopieren. Andere sehen nur, was sie je
 * Angabe sehen dürfen. Im eigenen Profil öffnet der Stift das Popup, in dem jede Angabe ihre eigene Sichtbarkeit bekommt.
 */
export function ProfileContactBox({ contacts, errorMessage, ownContactEditing }: ProfileContactBoxProps) {
  const [editPopupOpen, setEditPopupOpen] = useState<boolean>(false)

  let footer: string | null = null
  if (ownContactEditing !== null) {
    footer = 'Wer was sieht, stellst du je Angabe mit dem Stift ein.'
  }
  if (errorMessage !== null) {
    footer = errorMessage
  }
  let actions = null
  if (ownContactEditing !== null) {
    actions = <EditButton label="Kontakt bearbeiten" onClick={() => setEditPopupOpen(true)} />
  }

  let content
  if (contacts === null) {
    content = errorMessage === null && <Spinner animation="border" size="sm" />
  } else {
    const contactRows = createContactRows(contacts)
    if (contactRows.length === 0) {
      content = <p className="mb-0 text-body-secondary">Noch keine Kontaktdaten.</p>
    } else {
      content = (
        <ul className="profile-contact-list">
          {contactRows.map((contactRow) => {
            const iconStyle = { '--profile-contact-tint': contactRow.tint, '--profile-contact-ink': contactRow.ink } as CSSProperties
            const copyLabel = contactRow.label + ' kopieren'
            return (
              <li key={contactRow.rowKey}>
                <span className="profile-contact-icon" style={iconStyle}>
                  <i className={contactRow.iconClassName}></i>
                </span>
                <span className="profile-contact-text">
                  <span className="profile-field-label">{contactRow.label}</span>
                  {contactRow.href !== null && (
                    <a className="profile-contact-value" href={contactRow.href} target="_blank" rel="noopener noreferrer">
                      {contactRow.value}
                    </a>
                  )}
                  {contactRow.href === null && <span className="profile-contact-value">{contactRow.value}</span>}
                </span>
                {contactRow.href === null && <CopyButton label={copyLabel} value={contactRow.value} />}
              </li>
            )
          })}
        </ul>
      )
    }
  }

  return (
    <>
      <ContentBox title="Kontakt" actions={actions} footer={footer}>
        {content}
      </ContentBox>
      {editPopupOpen && ownContactEditing !== null && (
        <ProfileContactEditPopup
          ownContacts={ownContactEditing.ownContacts}
          onSaved={ownContactEditing.onSaved}
          onClose={() => setEditPopupOpen(false)}
        />
      )}
    </>
  )
}
