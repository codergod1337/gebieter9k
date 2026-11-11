import type { Visibility } from './Users.ts'

/** Die Arten von Kontaktangaben, wie das Enum `UsersContactType` im Backend. */
export type UsersContactType =
  | 'MOBILE_NUMBER'
  | 'STREET'
  | 'HOUSE_NUMBER'
  | 'POSTAL_CODE'
  | 'CITY'
  | 'COUNTRY'
  | 'INSTAGRAM'
  | 'TIKTOK'
  | 'YOUTUBE'
  | 'TWITCH'
  | 'STEAM'
  | 'DISCORD'
  | 'TWITTER'
  | 'FACEBOOK'
  | 'REDDIT'
  | 'SNAPCHAT'

/**
 * Eine eigene Kontaktangabe samt Sichtbarkeit, wie `GET /api/users-contact` sie liefert.
 * Doku: `docu/entities/UsersContact.md`
 */
export type UsersContact = {
  id: number
  usersGuid: string
  contactType: UsersContactType
  contactValue: string
  visibility: Visibility
}

/**
 * Eine Kontaktangabe, wie ein anderer sie sieht (`UsersContactForClient` im Backend): nur Art und Wert.
 * Doku: `docu/entities/UsersContact.md`
 */
export type UsersContactForClient = {
  contactType: UsersContactType
  contactValue: string
}

/** Höchstlänge einer Angabe, wie `gebiter.users-contact.value-max-length` im Backend. */
export const USERS_CONTACT_VALUE_MAX_LENGTH = 150
