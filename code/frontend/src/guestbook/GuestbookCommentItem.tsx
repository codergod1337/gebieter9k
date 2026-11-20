import type { GuestbookCommentForClient } from './Guestbook.ts'
import { GUESTBOOK_ORIGIN_LABEL } from './guestbookOriginLabel.ts'
import { GuestbookReactionBar } from './GuestbookReactionBar.tsx'
import { useGuestbook } from './useGuestbook.ts'
import { CommentItem } from '../components/CommentItem.tsx'
import { ConfirmDeleteButton } from '../components/ConfirmDeleteButton.tsx'
import type { UsersAvatarForClient } from '../users/UsersAvatarForClient.ts'

type GuestbookCommentItemProps = {
  guestbookId: number
  comment: GuestbookCommentForClient
  author: UsersAvatarForClient
  /** Nach Löschen oder Smiley: der Aufrufer lädt die Seite neu. */
  onChanged: () => Promise<void>
}

/**
 * Ein Kommentar im Verlauf eines Gästebucheintrags: der globale {@link CommentItem} (kleiner Avatar, Name, Zeit, Text),
 * darunter seine Smileys; mit Recht der Mülleimer.
 */
export function GuestbookCommentItem({ guestbookId, comment, author, onChanged }: GuestbookCommentItemProps) {
  const guestbookHook = useGuestbook()
  let deleteErrorMessage: string | null = null
  if (guestbookHook.error !== null) {
    deleteErrorMessage = guestbookHook.error.detail
  }

  /** Löscht den Kommentar samt seinen Smileys und lädt neu; liefert, ob es geklappt hat. */
  async function deleteComment(): Promise<boolean> {
    const deleted = await guestbookHook.deleteOwnGuestbookComment(comment.id)
    if (!deleted) {
      return false
    }
    await onChanged()
    return true
  }

  let deleteButton = null
  if (comment.deletableByCurrentUsers) {
    deleteButton = (
      <ConfirmDeleteButton
        label="Kommentar löschen"
        question="Soll dieser Kommentar samt seinen Smileys wirklich gelöscht werden?"
        isDeleting={guestbookHook.isLoading}
        errorMessage={deleteErrorMessage}
        onDelete={deleteComment}
      />
    )
  }

  return (
    <CommentItem
      author={author}
      originLabel={GUESTBOOK_ORIGIN_LABEL}
      commentText={comment.commentText}
      writtenAt={comment.writtenAt}
      actions={deleteButton}>
      <GuestbookReactionBar
        guestbookId={guestbookId}
        guestbookCommentId={comment.id}
        reactionCounts={comment.reactionCounts}
        onReacted={onChanged}
      />
    </CommentItem>
  )
}
