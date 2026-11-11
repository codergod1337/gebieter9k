import type { UsersContactType } from './UsersContact.ts'
import type { Visibility } from './Users.ts'

/** Zu welchem Teil eine Art gehört: im Popup je eine Überschrift. */
export type UsersContactGroup = 'ADDRESS' | 'SOCIAL'

/** Eine Art von Kontaktangabe: Name, Symbol, Markenfarben, Link und die Vorauswahl der Sichtbarkeit. */
export type UsersContactTypeEntry = {
  contactType: UsersContactType
  group: UsersContactGroup
  label: string
  /** Bootstrap-Icon-Klassen */
  iconClassName: string
  /** helle Fläche und Schrift in Markenfarben, in jedem Theme gleich */
  tint: string
  ink: string
  /** Der Link vor der Kennung, `null` ohne Link (Anschrift, Discord). */
  profileUrlPrefix: string | null
  placeholder: string
  /** So steht der Reiter bei einer neuen Angabe: Social-Media für alle, Telefon und Anschrift nur für einen selbst. */
  newVisibility: Visibility
}

/** Die Farben aller Teile der Anschrift. */
const ADDRESS_TINT = '#fef3c7'
const ADDRESS_INK = '#b45309'

/**
 * Alle Arten in der Reihenfolge der Anzeige, wie das Enum im Backend. Bei Social-Media wird nur die Kennung gespeichert,
 * der Link entsteht aus einer festen Vorlage je Plattform. Eine neue Art kommt hier und im Enum `UsersContactType` dazu.
 */
export const USERS_CONTACT_TYPES: UsersContactTypeEntry[] = [
  { contactType: 'MOBILE_NUMBER', group: 'ADDRESS', label: 'Mobil', iconClassName: 'bi bi-phone', tint: '#dcfce7', ink: '#15803d', profileUrlPrefix: null, placeholder: '+49 …', newVisibility: 'NONE' },
  { contactType: 'STREET', group: 'ADDRESS', label: 'Straße', iconClassName: 'bi bi-signpost', tint: ADDRESS_TINT, ink: ADDRESS_INK, profileUrlPrefix: null, placeholder: 'Straße', newVisibility: 'NONE' },
  { contactType: 'HOUSE_NUMBER', group: 'ADDRESS', label: 'Hausnummer', iconClassName: 'bi bi-house', tint: ADDRESS_TINT, ink: ADDRESS_INK, profileUrlPrefix: null, placeholder: 'Hausnummer', newVisibility: 'NONE' },
  { contactType: 'POSTAL_CODE', group: 'ADDRESS', label: 'PLZ', iconClassName: 'bi bi-mailbox', tint: ADDRESS_TINT, ink: ADDRESS_INK, profileUrlPrefix: null, placeholder: 'PLZ', newVisibility: 'NONE' },
  { contactType: 'CITY', group: 'ADDRESS', label: 'Stadt', iconClassName: 'bi bi-buildings', tint: ADDRESS_TINT, ink: ADDRESS_INK, profileUrlPrefix: null, placeholder: 'Stadt', newVisibility: 'NONE' },
  { contactType: 'COUNTRY', group: 'ADDRESS', label: 'Land', iconClassName: 'bi bi-globe2', tint: ADDRESS_TINT, ink: ADDRESS_INK, profileUrlPrefix: null, placeholder: 'Land', newVisibility: 'NONE' },
  { contactType: 'INSTAGRAM', group: 'SOCIAL', label: 'Instagram', iconClassName: 'bi bi-instagram', tint: '#fce7f3', ink: '#c13584', profileUrlPrefix: 'https://www.instagram.com/', placeholder: 'Benutzername', newVisibility: 'ANY' },
  { contactType: 'TIKTOK', group: 'SOCIAL', label: 'TikTok', iconClassName: 'bi bi-tiktok', tint: '#e5e7eb', ink: '#111827', profileUrlPrefix: 'https://www.tiktok.com/@', placeholder: 'Benutzername ohne @', newVisibility: 'ANY' },
  { contactType: 'YOUTUBE', group: 'SOCIAL', label: 'YouTube', iconClassName: 'bi bi-youtube', tint: '#fee2e2', ink: '#dc2626', profileUrlPrefix: 'https://www.youtube.com/@', placeholder: 'Handle ohne @', newVisibility: 'ANY' },
  { contactType: 'TWITCH', group: 'SOCIAL', label: 'Twitch', iconClassName: 'bi bi-twitch', tint: '#ede9fe', ink: '#9146ff', profileUrlPrefix: 'https://www.twitch.tv/', placeholder: 'Benutzername', newVisibility: 'ANY' },
  { contactType: 'STEAM', group: 'SOCIAL', label: 'Steam', iconClassName: 'bi bi-steam', tint: '#e2e8f0', ink: '#171a21', profileUrlPrefix: 'https://steamcommunity.com/id/', placeholder: 'Profilname', newVisibility: 'ANY' },
  { contactType: 'DISCORD', group: 'SOCIAL', label: 'Discord', iconClassName: 'bi bi-discord', tint: '#e0e7ff', ink: '#5865f2', profileUrlPrefix: null, placeholder: 'Benutzername', newVisibility: 'ANY' },
  { contactType: 'TWITTER', group: 'SOCIAL', label: 'X', iconClassName: 'bi bi-twitter-x', tint: '#e5e7eb', ink: '#000000', profileUrlPrefix: 'https://x.com/', placeholder: 'Benutzername ohne @', newVisibility: 'ANY' },
  { contactType: 'FACEBOOK', group: 'SOCIAL', label: 'Facebook', iconClassName: 'bi bi-facebook', tint: '#dbeafe', ink: '#1877f2', profileUrlPrefix: 'https://www.facebook.com/', placeholder: 'Benutzername', newVisibility: 'ANY' },
  { contactType: 'REDDIT', group: 'SOCIAL', label: 'Reddit', iconClassName: 'bi bi-reddit', tint: '#ffedd5', ink: '#ff4500', profileUrlPrefix: 'https://www.reddit.com/user/', placeholder: 'Benutzername', newVisibility: 'ANY' },
  { contactType: 'SNAPCHAT', group: 'SOCIAL', label: 'Snapchat', iconClassName: 'bi bi-snapchat', tint: '#fef9c3', ink: '#a16207', profileUrlPrefix: 'https://www.snapchat.com/add/', placeholder: 'Benutzername', newVisibility: 'ANY' },
]

/** Die Überschriften der Teile im Popup. */
export const USERS_CONTACT_GROUP_LABELS: Record<UsersContactGroup, string> = {
  ADDRESS: 'Telefon und Anschrift',
  SOCIAL: 'Social Media',
}

/** Der Link zum Profil auf der Plattform, `null` wenn die Art keinen hat. */
export function getUsersContactProfileUrl(entry: UsersContactTypeEntry, contactValue: string): string | null {
  if (entry.profileUrlPrefix === null) {
    return null
  }
  const accountWithoutAt = contactValue.replace(/^@/, '')
  const encodedAccount = encodeURIComponent(accountWithoutAt)
  return entry.profileUrlPrefix + encodedAccount
}
