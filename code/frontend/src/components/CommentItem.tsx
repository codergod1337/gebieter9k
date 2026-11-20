import type { ReactNode } from 'react'
import type { MultilingualText } from '../language/MultilingualText.ts'
import type { UsersAvatarForClient } from '../users/UsersAvatarForClient.ts'
import { AuthorHead } from './AuthorHead.tsx'
import { RichTextView } from './RichTextView.tsx'

type CommentItemProps = {
  /** Wer den Kommentar geschrieben hat, schon aufgelöst. */
  author: UsersAvatarForClient
  /** Der Name der Seite, von der aus man das Profil des Autors öffnet, für „Zurück zu …“. */
  originLabel: string
  /** Der Kommentar als mehrsprachiger Rich-Text. */
  commentText: MultilingualText
  writtenAt: string
  /** Rechts im Kopf, z. B. der Mülleimer (`ConfirmDeleteButton`); ohne: nichts. */
  actions?: ReactNode
  /** Unter dem Text, z. B. die Smileys eines Kommentars im Gästebuch. */
  children?: ReactNode
}

/**
 * Ein Kommentar in einem Verlauf, überall gleich (Gästebuch, Kommentare an einem Bild): kleiner Avatar, Name, Zeit
 * ({@link AuthorHead}), darunter der Text und, wenn der Aufrufer etwas mitgibt, eine Zeile dazu. Mehrere stehen in
 * einem Verlauf mit der Klasse `comment-thread`. Lage in base.css (`.comment-item*`, `.comment-thread`).
 */
export function CommentItem({ author, originLabel, commentText, writtenAt, actions, children }: CommentItemProps) {
  return (
    <div className="comment-item">
      <AuthorHead
        author={author}
        originLabel={originLabel}
        avatarSize="small"
        actionText={null}
        writtenAt={writtenAt}
        actions={actions}
      />
      <RichTextView richText={commentText} className="comment-item-text" />
      {children !== undefined && <div className="comment-item-extra">{children}</div>}
    </div>
  )
}
