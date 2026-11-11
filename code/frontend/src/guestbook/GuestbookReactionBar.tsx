import { useState } from 'react'
import { EmojiPickerPopup } from '../components/EmojiPickerPopup.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { Hoverlay } from '../components/Hoverlay.tsx'
import type { GuestbookReactionCount } from './Guestbook.ts'
import { useGuestbook } from './useGuestbook.ts'

type GuestbookReactionBarProps = {
  guestbookId: number
  /** Der Kommentar, an dem die Smileys hängen; `null`: am Eintrag selbst. */
  guestbookCommentId: number | null
  reactionCounts: GuestbookReactionCount[]
  /** Nach einem neuen Smiley: der Aufrufer lädt die Seite neu. */
  onReacted: () => Promise<void>
}

/**
 * Die Smileys an einem Eintrag oder Kommentar: je Emoji eine Pille mit Zahl, die eigenen hervorgehoben. Ein Klick auf
 * eine fremde Pille vergibt dasselbe Emoji, der Knopf daneben öffnet die Auswahl aller Standard-Emojis
 * ({@link EmojiPickerPopup}). Smileys gehen nur in eine Richtung: Die eigenen lassen sich nicht zurücknehmen.
 */
export function GuestbookReactionBar({ guestbookId, guestbookCommentId, reactionCounts, onReacted }: GuestbookReactionBarProps) {
  const guestbookHook = useGuestbook()
  const [pickerOpen, setPickerOpen] = useState<boolean>(false)
  let reactionErrorMessage: string | null = null
  if (guestbookHook.error !== null) {
    reactionErrorMessage = guestbookHook.error.detail
  }

  /** Vergibt ein Emoji und lädt neu; liefert, ob es geklappt hat. */
  async function react(reactionEmoji: string): Promise<boolean> {
    const reacted = await guestbookHook.createOwnGuestbookReaction(guestbookId, guestbookCommentId, reactionEmoji)
    if (!reacted) {
      return false
    }
    await onReacted()
    return true
  }

  async function handlePick(reactionEmoji: string) {
    const reacted = await react(reactionEmoji)
    if (reacted) {
      setPickerOpen(false)
    }
  }

  return (
    <>
      <div className="guestbook-reactions">
        {reactionCounts.map((reactionCount) => {
          let reactionClassName = 'guestbook-reaction'
          let hintText = 'Auch ' + reactionCount.reactionEmoji + ' vergeben'
          if (reactionCount.reactedByCurrentUsers) {
            reactionClassName = 'guestbook-reaction guestbook-reaction-own'
            hintText = 'Von dir vergeben, bleibt stehen'
          }
          const reactionDisabled = reactionCount.reactedByCurrentUsers || guestbookHook.isLoading
          return (
            // Ein gesperrter Knopf meldet kein Zeigen: das Hoverlay sitzt deshalb an der Hülle
            <Hoverlay key={reactionCount.reactionEmoji} text={hintText}>
              <span>
                <button
                  type="button"
                  className={reactionClassName}
                  disabled={reactionDisabled}
                  aria-label={hintText + ', ' + reactionCount.reactionCount + ' mal'}
                  onClick={() => void react(reactionCount.reactionEmoji)}>
                  <span className="emoji-text">{reactionCount.reactionEmoji}</span>
                  <span className="guestbook-reaction-count">{reactionCount.reactionCount}</span>
                </button>
              </span>
            </Hoverlay>
          )
        })}
        <Hoverlay text="Smiley vergeben">
          <button
            type="button"
            className="guestbook-reaction"
            aria-label="Smiley vergeben"
            disabled={guestbookHook.isLoading}
            onClick={() => setPickerOpen(true)}>
            <i className="bi bi-emoji-smile" aria-hidden="true"></i>
            <i className="bi bi-plus" aria-hidden="true"></i>
          </button>
        </Hoverlay>
      </div>
      {!pickerOpen && <ErrorAlert message={reactionErrorMessage} />}
      {pickerOpen && (
        <EmojiPickerPopup
          title="Smiley vergeben"
          isSaving={guestbookHook.isLoading}
          errorMessage={reactionErrorMessage}
          onPick={(reactionEmoji) => void handlePick(reactionEmoji)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  )
}
