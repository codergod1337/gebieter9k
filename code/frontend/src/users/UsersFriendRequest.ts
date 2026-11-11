/**
 * Ein Freundschaftsantrag, wie `UsersFriendRequest` im Backend.
 * Doku: `docu/entities/UsersFriendRequest.md`
 */
export type UsersFriendRequest = {
  id: number
  /** wer fragt */
  requesterUsersGuid: string
  /** wen er fragt */
  acceptorUsersGuid: string
  requestedAt: string
  /** `null` offen, `true` angenommen, `false` abgelehnt */
  accepted: boolean | null
}
