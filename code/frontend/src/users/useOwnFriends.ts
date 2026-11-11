import { useCallback } from 'react'
import { useLoadedData } from '../api/useLoadedData.ts'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import type { UsersFriendRequest } from './UsersFriendRequest.ts'
import { useUsersFriendRequest } from './useUsersFriendRequest.ts'
import { useUsersFriendship } from './useUsersFriendship.ts'

/** Wie der angemeldete User zu einem anderen steht (nur intern, nie als Text ausgeben). */
export type FriendshipRelation = 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE'

/** Was {@link useOwnFriends} anbietet. */
export type OwnFriends = {
  /** Die GUIDs der eigenen Freunde, `null` solange sie laden. */
  friendUsersGuids: string[] | null
  /** Offene Anträge an mich. */
  receivedRequests: UsersFriendRequest[]
  /** Offene Anträge von mir. */
  sentRequests: UsersFriendRequest[]
  /** Läuft gerade ein Request (Laden oder Speichern)? */
  isBusy: boolean
  /** Der letzte Fehler, `null` wenn keiner. */
  errorMessage: string | null
  getRelation: (usersGuid: string) => FriendshipRelation
  /** Der offene Antrag dieses Users an mich, `null` wenn keiner. */
  findReceivedRequest: (usersGuid: string) => UsersFriendRequest | null
  /** Fragt einen User an; danach laden die Listen neu. */
  requestFriendship: (usersGuid: string) => Promise<boolean>
  /** Beantwortet einen Antrag an mich; danach laden die Listen neu. */
  answerRequest: (id: number, accepted: boolean) => Promise<boolean>
  /** Kündigt eine Freundschaft beidseitig; danach laden die Listen neu. */
  endFriendship: (friendUsersGuid: string) => Promise<boolean>
}

/**
 * Die eigene Freundesliste und die offenen Anträge an EINER Stelle, für die Freunde-Box im eigenen Profil und den Knopf
 * „Freund hinzufügen“ auf dem Profil eines anderen. Die Freundesliste ist die Referenz für „Sichtbar für: Ich und meine
 * Freunde“: Das Backend liest sie aus dem Hauptspeicher in den Lesefilter, nach jeder Änderung neu.
 */
export function useOwnFriends(): OwnFriends {
  const { session } = useCurrentSession()
  const friendshipHook = useUsersFriendship()
  const friendRequestHook = useUsersFriendRequest()
  const loadedFriendUsersGuids = useLoadedData(friendshipHook.getOwnFriendUsersGuids)
  const loadedOpenRequests = useLoadedData(friendRequestHook.getOwnOpenUsersFriendRequest)
  const reloadFriendUsersGuids = loadedFriendUsersGuids.reload
  const reloadOpenRequests = loadedOpenRequests.reload

  let ownUsersGuid = ''
  if (session !== null) {
    ownUsersGuid = session.users.guid
  }
  const friendUsersGuids = loadedFriendUsersGuids.data
  const openRequests = loadedOpenRequests.data ?? []
  const receivedRequests = openRequests.filter((openRequest) => openRequest.acceptorUsersGuid === ownUsersGuid)
  const sentRequests = openRequests.filter((openRequest) => openRequest.requesterUsersGuid === ownUsersGuid)

  const reloadAll = useCallback(async () => {
    await Promise.all([reloadFriendUsersGuids(), reloadOpenRequests()])
  }, [reloadFriendUsersGuids, reloadOpenRequests])

  function getRelation(usersGuid: string): FriendshipRelation {
    if ((friendUsersGuids ?? []).includes(usersGuid)) {
      return 'FRIEND'
    }
    if (sentRequests.some((sentRequest) => sentRequest.acceptorUsersGuid === usersGuid)) {
      return 'REQUEST_SENT'
    }
    if (receivedRequests.some((receivedRequest) => receivedRequest.requesterUsersGuid === usersGuid)) {
      return 'REQUEST_RECEIVED'
    }
    return 'NONE'
  }

  function findReceivedRequest(usersGuid: string): UsersFriendRequest | null {
    return receivedRequests.find((receivedRequest) => receivedRequest.requesterUsersGuid === usersGuid) ?? null
  }

  async function requestFriendship(usersGuid: string): Promise<boolean> {
    const createdRequest = await friendRequestHook.createOwnUsersFriendRequest(usersGuid)
    await reloadAll()
    return createdRequest !== null
  }

  async function answerRequest(id: number, accepted: boolean): Promise<boolean> {
    const answeredRequest = await friendRequestHook.answerOwnUsersFriendRequest(id, accepted)
    await reloadAll()
    return answeredRequest !== null
  }

  async function endFriendship(friendUsersGuid: string): Promise<boolean> {
    const ended = await friendshipHook.deleteOwnUsersFriendship(friendUsersGuid)
    await reloadAll()
    return ended
  }

  let errorMessage: string | null = null
  if (friendRequestHook.error !== null) {
    errorMessage = friendRequestHook.error.detail
  } else if (friendshipHook.error !== null) {
    errorMessage = friendshipHook.error.detail
  }

  return {
    friendUsersGuids,
    receivedRequests,
    sentRequests,
    isBusy: friendshipHook.isLoading || friendRequestHook.isLoading,
    errorMessage,
    getRelation,
    findReceivedRequest,
    requestFriendship,
    answerRequest,
    endFriendship,
  }
}
