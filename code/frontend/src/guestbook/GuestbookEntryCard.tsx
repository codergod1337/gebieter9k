import { findGuestbookAuthor, type GuestbookEntryForClient, type GuestbookPage } from './Guestbook.ts'
import { GuestbookCommentThread } from './GuestbookCommentThread.tsx'
import { GuestbookDeleteButton } from './GuestbookDeleteButton.tsx'
import { GuestbookHead } from './GuestbookHead.tsx'
import { GuestbookReactionBar } from './GuestbookReactionBar.tsx'
import { useGuestbook } from './useGuestbook.ts'
import { RichTextView } from '../components/RichTextView.tsx'

type GuestbookEntryCardProps = {
  entry: GuestbookEntryForClient
  /** Die Seite, aus ihr kommen die Autoren. */
  guestbookPage: GuestbookPage
  /** Nach jeder Änderung (Löschen, Antwort, Smiley): der Aufrufer lädt die Seite neu. */
  onChanged: () => Promise<void>
}

/**
 * Ein Gästebucheintrag als Karte: oben Avatar und „<User> hat geschrieben“ mit Zeit, mit Recht der Mülleimer; darunter
 * der Text, die Smileys ({@link GuestbookReactionBar}) und der Verlauf der Kommentare ({@link GuestbookCommentThread}).
 * Später das Banner des Autors leicht durchsichtig als Hintergrund.
 */
export function GuestbookEntryCard({ entry, guestbookPage, onChanged }: GuestbookEntryCardProps) {
  const guestbookHook = useGuestbook()
  const entryAuthor = findGuestbookAuthor(guestbookPage, entry.authorUsersGuid)
  let deleteErrorMessage: string | null = null
  if (guestbookHook.error !== null) {
    deleteErrorMessage = guestbookHook.error.detail
  }

  /** Löscht den Eintrag samt Kommentaren und Smileys und lädt neu; liefert, ob es geklappt hat. */
  async function deleteEntry(): Promise<boolean> {
    const deleted = await guestbookHook.deleteOwnGuestbook(entry.id)
    if (!deleted) {
      return false
    }
    await onChanged()
    return true
  }

  let deleteButton = null
  if (entry.deletableByCurrentUsers) {
    deleteButton = (
      <GuestbookDeleteButton
        label="Eintrag löschen"
        question="Soll dieser Eintrag samt allen Kommentaren und Smileys wirklich gelöscht werden?"
        isDeleting={guestbookHook.isLoading}
        errorMessage={deleteErrorMessage}
        onDelete={deleteEntry}
      />
    )
  }

  return (
    <article className="guestbook-entry">
      <GuestbookHead author={entryAuthor} avatarSize="medium" actionText="hat geschrieben" writtenAt={entry.writtenAt} actions={deleteButton} />
      <RichTextView richText={entry.entryText} className="guestbook-text" />
      <GuestbookReactionBar guestbookId={entry.id} guestbookCommentId={null} reactionCounts={entry.reactionCounts} onReacted={onChanged} />
      <GuestbookCommentThread entry={entry} guestbookPage={guestbookPage} onChanged={onChanged} />
    </article>
  )
}
