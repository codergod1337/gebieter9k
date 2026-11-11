/**
 * Was man braucht, um einen User aus seiner GUID überall gleich darzustellen (`UsersAvatarForClient` im Backend): sichtbar
 * mit Name, kleinem Profilbild und Avatar-Farben; privat nur `anonymous`; gelöscht oder unbekannt ohne Name.
 * Doku: `docu/entities/Users.md`
 */
export type UsersAvatarForClient = {
  usersGuid: string
  anonymous: boolean
  username: string | null
  profileImageSmallBase64Png: string | null
  avatarTextColor: string | null
  avatarBackgroundColor: string | null
}
