import { findGuestbookAuthor, type GuestbookEntryForClient, type GuestbookPage } from './Guestbook.ts'
import { GuestbookCommentItem } from './GuestbookCommentItem.tsx'
import { GuestbookTextForm } from './GuestbookTextForm.tsx'
import { useGuestbook } from './useGuestbook.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'

type GuestbookCommentThreadProps = {
  entry: GuestbookEntryForClient
  /** Die Seite, aus ihr kommen die Autoren. */
  guestbookPage: GuestbookPage
  /** Nach Antwort, Löschen oder Smiley: der Aufrufer lädt die Seite neu. */
  onChanged: () => Promise<void>
}

/**
 * Der Verlauf unter einem Eintrag, wie Rückfrage und Rückantwort: die Kommentare der Reihe nach (älteste zuerst), je
 * Kommentar ein kleiner Avatar, darunter das Feld zum Antworten.
 */
export function GuestbookCommentThread({ entry, guestbookPage, onChanged }: GuestbookCommentThreadProps) {
  const guestbookHook = useGuestbook()
  let replyErrorMessage: string | null = null
  if (guestbookHook.error !== null) {
    replyErrorMessage = guestbookHook.error.detail
  }

  /** Schreibt die Antwort und lädt neu; liefert, ob es geklappt hat. */
  async function writeReply(commentText: MultilingualText): Promise<boolean> {
    const createdComment = await guestbookHook.createOwnGuestbookComment(entry.id, commentText)
    if (createdComment === null) {
      return false
    }
    await onChanged()
    return true
  }

  return (
    <div className="guestbook-comments">
      {entry.comments.map((comment) => {
        const commentAuthor = findGuestbookAuthor(guestbookPage, comment.authorUsersGuid)
        return (
          <GuestbookCommentItem
            key={comment.id}
            guestbookId={entry.id}
            comment={comment}
            author={commentAuthor}
            onChanged={onChanged}
          />
        )
      })}
      <GuestbookTextForm
        placeholder="Antworten …"
        ariaLabel="Antwort auf den Eintrag"
        submitLabel="Antworten"
        compact
        isSubmitting={guestbookHook.isLoading}
        errorMessage={replyErrorMessage}
        onSubmit={writeReply}
      />
    </div>
  )
}
