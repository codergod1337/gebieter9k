import { useCallback, useEffect, useState } from 'react'
import { type ApiRequestHook, useApiRequest } from '../api/useApiRequest.ts'
import type { UsersAvatarForClient } from './UsersAvatarForClient.ts'

/**
 * Die Antworten je GUID, für alle Stellen der Seite gemeinsam: Zeigt eine Liste denselben User zwanzigmal, fragt sie
 * das Backend einmal. Eine gescheiterte Anfrage fliegt wieder heraus und wird beim nächsten Mal neu gestellt.
 */
const usersAvatarRequestsByGuid = new Map<string, Promise<UsersAvatarForClient | null>>()

/**
 * So viele GUIDs löst eine Sammel-Anfrage höchstens auf, wie `gebiter.users.avatar-resolve-max-guids` im Backend; mehr
 * gehen in mehreren Anfragen.
 */
const USERS_AVATAR_RESOLVE_MAX_GUIDS = 100

/** Merkt sich die Anfrage zu einer GUID; scheitert sie, fliegt sie wieder heraus. */
function rememberUsersAvatarRequest(usersGuid: string, usersAvatarRequest: Promise<UsersAvatarForClient | null>) {
  usersAvatarRequestsByGuid.set(usersGuid, usersAvatarRequest)
  void usersAvatarRequest.then((usersAvatar) => {
    if (usersAvatar === null) {
      usersAvatarRequestsByGuid.delete(usersGuid)
    }
  })
}

/** Die Anfrage zu einer GUID (`GET /api/users/avatar/<guid>`): die schon laufende oder fertige, sonst eine neue. */
function requestUsersAvatarForClient(
  usersGuid: string,
  sendForData: ApiRequestHook['sendForData'],
): Promise<UsersAvatarForClient | null> {
  const runningUsersAvatarRequest = usersAvatarRequestsByGuid.get(usersGuid)
  if (runningUsersAvatarRequest !== undefined) {
    return runningUsersAvatarRequest
  }
  const usersAvatarPath = '/api/users/avatar/' + usersGuid
  const usersAvatarRequest = sendForData<UsersAvatarForClient>({ method: 'GET', path: usersAvatarPath })
  rememberUsersAvatarRequest(usersGuid, usersAvatarRequest)
  return usersAvatarRequest
}

/**
 * Die Antworten zu mehreren GUIDs, in ihrer Reihenfolge. Was noch keine Anfrage hat, geht zusammen in EINE Anfrage
 * (`POST /api/users/avatar/resolve`, bei mehr als {@link USERS_AVATAR_RESOLVE_MAX_GUIDS} in mehrere) statt in eine je
 * User; danach kennt die ganze Seite diese User.
 */
function requestUsersAvatarsForClient(
  usersGuids: string[],
  sendForData: ApiRequestHook['sendForData'],
): Promise<(UsersAvatarForClient | null)[]> {
  const missingUsersGuidSet = new Set<string>()
  for (const usersGuid of usersGuids) {
    if (!usersAvatarRequestsByGuid.has(usersGuid)) {
      missingUsersGuidSet.add(usersGuid)
    }
  }
  const missingUsersGuids = [...missingUsersGuidSet]
  for (let chunkStart = 0; chunkStart < missingUsersGuids.length; chunkStart += USERS_AVATAR_RESOLVE_MAX_GUIDS) {
    const chunkUsersGuids = missingUsersGuids.slice(chunkStart, chunkStart + USERS_AVATAR_RESOLVE_MAX_GUIDS)
    const resolveRequest = { usersGuids: chunkUsersGuids }
    const chunkRequest = sendForData<UsersAvatarForClient[]>({
      method: 'POST',
      path: '/api/users/avatar/resolve',
      body: resolveRequest,
    })
    for (const chunkUsersGuid of chunkUsersGuids) {
      const usersAvatarRequest = chunkRequest.then((usersAvatars) => {
        if (usersAvatars === null) {
          return null
        }
        return usersAvatars.find((usersAvatar) => usersAvatar.usersGuid === chunkUsersGuid) ?? null
      })
      rememberUsersAvatarRequest(chunkUsersGuid, usersAvatarRequest)
    }
  }
  const usersAvatarRequests = usersGuids.map((usersGuid) => {
    return usersAvatarRequestsByGuid.get(usersGuid) ?? Promise.resolve(null)
  })
  return Promise.all(usersAvatarRequests)
}

/**
 * Löst eine GUID in Avatar und Name auf (`GET /api/users/avatar/<guid>`), nach der Sichtbarkeit des Users. `null`,
 * solange es lädt oder wenn es scheitert.
 */
export function useUsersAvatarForClient(usersGuid: string): UsersAvatarForClient | null {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const [loadedUsersAvatar, setLoadedUsersAvatar] = useState<UsersAvatarForClient | null>(null)

  useEffect(() => {
    let stillWanted = true
    const usersAvatarRequest = requestUsersAvatarForClient(usersGuid, sendForData)
    void usersAvatarRequest.then((usersAvatar) => {
      if (stillWanted) {
        setLoadedUsersAvatar(usersAvatar)
      }
    })
    return () => {
      stillWanted = false
    }
  }, [usersGuid, sendForData])

  if (loadedUsersAvatar !== null && loadedUsersAvatar.usersGuid !== usersGuid) {
    return null
  }
  return loadedUsersAvatar
}

/**
 * Löst mehrere GUIDs auf, z. B. für eine Liste von Usern mit Suchfeld (`UsersGuidList`): je GUID die Antwort, sobald
 * alle da sind; was scheitert, fehlt. Eine Sammel-Anfrage für alle, die die Seite noch nicht kennt; dieselben Antworten
 * wie {@link useUsersAvatarForClient}, die Namen in der Liste (`UsersGuidName`) stehen danach sofort da.
 */
export function useUsersAvatarsForClient(usersGuids: string[]): Map<string, UsersAvatarForClient> {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const [loadedUsersAvatarsByGuid, setLoadedUsersAvatarsByGuid] = useState<Map<string, UsersAvatarForClient>>(new Map())
  // als Text: Der Effekt läuft nur neu, wenn sich die GUIDs ändern, nicht bei jeder neuen Liste mit demselben Inhalt
  const usersGuidsText = usersGuids.join(',')

  useEffect(() => {
    let stillWanted = true
    let wantedUsersGuids: string[] = []
    if (usersGuidsText !== '') {
      wantedUsersGuids = usersGuidsText.split(',')
    }
    const usersAvatarsRequest = requestUsersAvatarsForClient(wantedUsersGuids, sendForData)
    void usersAvatarsRequest.then((usersAvatars) => {
      if (!stillWanted) {
        return
      }
      const usersAvatarsByGuid = new Map<string, UsersAvatarForClient>()
      for (const usersAvatar of usersAvatars) {
        if (usersAvatar !== null) {
          usersAvatarsByGuid.set(usersAvatar.usersGuid, usersAvatar)
        }
      }
      setLoadedUsersAvatarsByGuid(usersAvatarsByGuid)
    })
    return () => {
      stillWanted = false
    }
  }, [usersGuidsText, sendForData])

  return loadedUsersAvatarsByGuid
}

/**
 * Lädt Name und Avatar mehrerer User vorab, ohne sie anzuzeigen: Die Funktion wartet, bis ihre Antworten da sind. Wer
 * viele User nach und nach holt (z. B. „Alle laden“ bei den Stimmen einer Datei), ruft sie je Seite; die Liste zeigt die
 * Namen danach sofort, ohne eine Anfrage je User.
 */
export function useUsersAvatarsPreload(): (usersGuids: string[]) => Promise<void> {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  return useCallback(
    async (usersGuids: string[]) => {
      await requestUsersAvatarsForClient(usersGuids, sendForData)
    },
    [sendForData],
  )
}
