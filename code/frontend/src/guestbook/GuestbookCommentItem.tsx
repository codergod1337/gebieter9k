import type { GuestbookAuthor, GuestbookCommentForClient } from './Guestbook.ts'
import { GuestbookDeleteButton } from './GuestbookDeleteButton.tsx'
import { GuestbookHead } from './GuestbookHead.tsx'
import { GuestbookReactionBar } from './GuestbookReactionBar.tsx'
import { useGuestbook } from './useGuestbook.ts'
import { RichTextView } from '../components/RichTextView.tsx'

type GuestbookCommentItemProps = {
  guestbookId: number
  comment: GuestbookCommentForClient
  author: GuestbookAuthor
  /** Nach Löschen oder Smiley: der Aufrufer lädt die Seite neu. */
  onChanged: () => Promise<void>
}

/** Ein Kommentar im Verlauf: kleiner Avatar, Name, Zeit, Text, darunter seine Smileys; mit Recht der Mülleimer. */
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
      <GuestbookDeleteButton
        label="Kommentar löschen"
        question="Soll dieser Kommentar samt seinen Smileys wirklich gelöscht werden?"
        isDeleting={guestbookHook.isLoading}
        errorMessage={deleteErrorMessage}
        onDelete={deleteComment}
      />
    )
  }

  return (
    <div className="guestbook-comment">
      <GuestbookHead author={author} avatarSize="small" actionText={null} writtenAt={comment.writtenAt} actions={deleteButton} />
      <RichTextView richText={comment.commentText} className="guestbook-text" />
      <GuestbookReactionBar
        guestbookId={guestbookId}
        guestbookCommentId={comment.id}
        reactionCounts={comment.reactionCounts}
        onReacted={onChanged}
      />
    </div>
  )
}
