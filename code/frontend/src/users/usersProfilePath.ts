/** Das Modul Profil; ohne GUID führt es zum eigenen Profil. */
export const PROFILE_PATH = '/profile'

/** Das Profil eines Users, auch das eigene. Was man dort sieht, regelt die Sichtbarkeit des Profils. */
export function getUsersProfilePath(usersGuid: string): string {
  return PROFILE_PATH + '/' + usersGuid
}
