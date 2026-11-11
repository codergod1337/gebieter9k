import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'
import type { UsersDetail } from './UsersDetail.ts'

/**
 * Was {@link useUsersDetail} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von `/api/users-detail`
 * (einen Eintrag lesen, nur wenn man das Profil sehen darf; das eigene Profilbild, Status, Drift, Farben) und
 * `/api/admin/users-detail` (alles lesen, nur ADMIN) eine Funktion, benannt wie die Methode im Backend.
 *
 * Lesen liefert das Objekt bzw. die Liste, Ändern den Eintrag. Bei einem Fehler kommt `null`, der Fehler steht dann
 * in `error`. Kein Anlegen und kein Löschen: Der Eintrag entsteht und bleibt mit dem User.
 */
export type UsersDetailHook = ApiHookState & {
  getUsersDetail: (usersGuid: string) => Promise<UsersDetail | null>
  getAllUsersDetail: () => Promise<UsersDetail[] | null>
  changeOwnUsersDetailProfileImage: (
    profileImageBase64Png: string | null,
    profileImageSmallBase64Png: string | null,
  ) => Promise<UsersDetail | null>
  changeOwnUsersDetailStatusText: (statusText: string | null) => Promise<UsersDetail | null>
  changeOwnUsersDetailAboutText: (aboutText: MultilingualText | null) => Promise<UsersDetail | null>
  changeOwnUsersDetailBannerDriftSpeed: (bannerDriftSpeedPercent: number) => Promise<UsersDetail | null>
  changeOwnUsersDetailAvatarColors: (
    avatarTextColor: string | null,
    avatarBackgroundColor: string | null,
  ) => Promise<UsersDetail | null>
}

/** Alle Endpunkte von `/api/users-detail` und `/api/admin/users-detail`, die Requests gehen über das API-Modul. */
export function useUsersDetail(): UsersDetailHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** READ: Die Details eines Users über seine GUID, nur wenn man sein Profil sehen darf (sonst `null`, 404). */
  const getUsersDetail = useCallback((usersGuid: string) => {
    const usersDetailPath = '/api/users-detail/' + usersGuid
    return sendForData<UsersDetail>({ method: 'GET', path: usersDetailPath })
  }, [sendForData])

  /** READ (Admin): Die Details aller User, ohne Regel der Sichtbarkeit. */
  const getAllUsersDetail = useCallback(() => {
    return sendForData<UsersDetail[]>({ method: 'GET', path: '/api/admin/users-detail' })
  }, [sendForData])

  /** UPDATE: Setzt das eigene Profilbild groß und klein (PNG als Base64 ohne Präfix); beide `null` entfernen es. */
  const changeOwnUsersDetailProfileImage = useCallback((profileImageBase64Png: string | null, profileImageSmallBase64Png: string | null) => {
    const profileImageRequest = { profileImageBase64Png, profileImageSmallBase64Png }
    return sendForData<UsersDetail>({ method: 'PUT', path: '/api/users-detail/profile-image', body: profileImageRequest })
  }, [sendForData])

  /** UPDATE: Setzt den eigenen Status-Text im Profilkopf; leer oder `null` entfernt ihn. */
  const changeOwnUsersDetailStatusText = useCallback((statusText: string | null) => {
    const statusTextRequest = { statusText }
    return sendForData<UsersDetail>({ method: 'PUT', path: '/api/users-detail/status-text', body: statusTextRequest })
  }, [sendForData])

  /** UPDATE: Setzt den eigenen Text „Über mich“; leer oder `null` entfernt ihn. */
  const changeOwnUsersDetailAboutText = useCallback((aboutText: MultilingualText | null) => {
    const aboutTextRequest = { aboutText }
    return sendForData<UsersDetail>({ method: 'PUT', path: '/api/users-detail/about-text', body: aboutTextRequest })
  }, [sendForData])

  /** UPDATE: Stellt ein, wie schnell das Standard-Banner des eigenen Profils driftet, in Prozent (0 steht still). */
  const changeOwnUsersDetailBannerDriftSpeed = useCallback((bannerDriftSpeedPercent: number) => {
    const bannerDriftSpeedRequest = { bannerDriftSpeedPercent }
    return sendForData<UsersDetail>({ method: 'PUT', path: '/api/users-detail/banner-drift-speed', body: bannerDriftSpeedRequest })
  }, [sendForData])

  /** UPDATE: Die Farben des eigenen Avatars ohne Profilbild (`#rrggbb`); `null` setzt die Farbe auf den Standard. */
  const changeOwnUsersDetailAvatarColors = useCallback((avatarTextColor: string | null, avatarBackgroundColor: string | null) => {
    const avatarColorsRequest = { avatarTextColor, avatarBackgroundColor }
    return sendForData<UsersDetail>({ method: 'PUT', path: '/api/users-detail/avatar-colors', body: avatarColorsRequest })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    getUsersDetail,
    getAllUsersDetail,
    changeOwnUsersDetailProfileImage,
    changeOwnUsersDetailStatusText,
    changeOwnUsersDetailAboutText,
    changeOwnUsersDetailBannerDriftSpeed,
    changeOwnUsersDetailAvatarColors,
  }
}
