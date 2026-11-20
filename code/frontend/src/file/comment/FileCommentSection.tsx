import { type ReactNode, useEffect, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { CommentItem } from '../../components/CommentItem.tsx'
import { ConfirmDeleteButton } from '../../components/ConfirmDeleteButton.tsx'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { RichTextForm } from '../../components/RichTextForm.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import type { MultilingualText } from '../../language/MultilingualText.ts'
import type { UsersAvatarForClient } from '../../users/UsersAvatarForClient.ts'
import type { FileCommentThread } from '../FileComment.ts'
import { useFileComment } from '../useFileComment.ts'
import { FILE_COMMENT_TEXTS } from './fileCommentTexts.ts'

type FileCommentSectionProps = {
  fileDocumentId: string
  /** Der Name der Seite, auf der die Kommentare stehen: für „Zurück zu …“, wenn man das Profil eines Autors öffnet. */
  originLabel: string
  /**
   * Nur für einen Besucher ohne Anmeldung (Besucherseite einer Galerie-Freigabe): So lädt er den Verlauf, über die
   * Adresse unter seinem Token. Dann gibt es weder das Feld zum Schreiben noch das Löschen; statt des Felds steht
   * `readOnlyHint`. Ohne: der Verlauf des angemeldeten Users (`/api/file-comment`), mit Schreiben und Löschen.
   */
  loadReadOnlyThread?: (fileDocumentId: string) => Promise<FileCommentThread | null>
  /** Was ein Besucher statt des Felds zum Schreiben sieht, z. B. „melde dich kostenlos an“ mit Knopf. */
  readOnlyHint?: ReactNode
  /** Meldet die Zahl der Kommentare, sobald der Verlauf da ist und nach jedem Schreiben oder Löschen. */
  onCommentCountChange?: (fileDocumentId: string, commentCount: number) => void
}

/** Der Autor eines Kommentars aus dem Verlauf; fehlt er (sollte nicht vorkommen), ein Autor ohne Namen und Bild. */
function findAuthor(fileCommentThread: FileCommentThread, authorUsersGuid: string): UsersAvatarForClient {
  for (const author of fileCommentThread.authors) {
    if (author.usersGuid === authorUsersGuid) {
      return author
    }
  }
  return {
    usersGuid: authorUsersGuid,
    anonymous: false,
    username: null,
    profileImageSmallBase64Png: null,
    avatarTextColor: null,
    avatarBackgroundColor: null,
  }
}

/**
 * Die Kommentare einer Datei (Nutzer 2026-11-20): der Verlauf, die ältesten zuerst, darunter das Feld zum Schreiben.
 * Überall dieselbe Komponente: am großen Bild einer Galerie, auf der Seite einer Datei, auf der Besucherseite einer
 * Freigabe (dort nur zum Lesen). Gezeichnet wird mit den globalen Bausteinen, die auch das Gästebuch nutzt
 * (`CommentItem`, `RichTextForm`, `ConfirmDeleteButton`, der Verlauf mit der Klasse `comment-thread`).
 *
 * Wie die Stimmen lädt sie getrennt vom Dokument: Die Datei steht schon da, der Verlauf kommt danach. Schreiben und
 * Löschen antworten mit dem Verlauf danach, eine zweite Anfrage braucht es nicht.
 */
export function FileCommentSection({
  fileDocumentId,
  originLabel,
  loadReadOnlyThread,
  readOnlyHint,
  onCommentCountChange,
}: FileCommentSectionProps) {
  const loadHook = useFileComment()
  const writeHook = useFileComment()
  const deleteHook = useFileComment()
  const getFileCommentThread = loadHook.getFileCommentThread
  const [loadedFileCommentThread, setLoadedFileCommentThread] = useState<FileCommentThread | null>(null)
  const [loadFailed, setLoadFailed] = useState<boolean>(false)
  const readOnly = loadReadOnlyThread !== undefined

  useEffect(() => {
    let stillWanted = true
    let threadRequest: Promise<FileCommentThread | null>
    if (loadReadOnlyThread !== undefined) {
      threadRequest = loadReadOnlyThread(fileDocumentId)
    } else {
      threadRequest = getFileCommentThread(fileDocumentId)
    }
    void threadRequest.then((fileCommentThread) => {
      if (!stillWanted) {
        return
      }
      setLoadedFileCommentThread(fileCommentThread)
      setLoadFailed(fileCommentThread === null)
      if (fileCommentThread !== null && onCommentCountChange !== undefined) {
        onCommentCountChange(fileDocumentId, fileCommentThread.comments.length)
      }
    })
    return () => {
      stillWanted = false
    }
    // onCommentCountChange meldet nur; ändert der Aufrufer die Funktion, lädt der Verlauf deshalb nicht neu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileDocumentId, getFileCommentThread, loadReadOnlyThread])

  /** Übernimmt den Verlauf, den das Backend nach Schreiben oder Löschen geliefert hat, und meldet die neue Zahl. */
  function applyChangedThread(changedFileCommentThread: FileCommentThread) {
    setLoadedFileCommentThread(changedFileCommentThread)
    if (onCommentCountChange !== undefined) {
      onCommentCountChange(fileDocumentId, changedFileCommentThread.comments.length)
    }
  }

  /** Schreibt den Kommentar; liefert, ob es geklappt hat. */
  async function writeComment(commentText: MultilingualText): Promise<boolean> {
    const changedFileCommentThread = await writeHook.createOwnFileComment(fileDocumentId, commentText)
    if (changedFileCommentThread === null) {
      return false
    }
    applyChangedThread(changedFileCommentThread)
    return true
  }

  /** Löscht einen Kommentar; liefert, ob es geklappt hat. */
  async function deleteComment(fileCommentId: number): Promise<boolean> {
    const changedFileCommentThread = await deleteHook.deleteOwnFileComment(fileCommentId)
    if (changedFileCommentThread === null) {
      return false
    }
    applyChangedThread(changedFileCommentThread)
    return true
  }

  // Der Verlauf einer anderen Datei (das Bild hat gewechselt) zählt nicht: erst laden
  let fileCommentThread: FileCommentThread | null = loadedFileCommentThread
  if (fileCommentThread !== null && fileCommentThread.fileDocumentId !== fileDocumentId) {
    fileCommentThread = null
  }

  let loadErrorMessage: string | null = null
  if (loadHook.error !== null) {
    loadErrorMessage = loadHook.error.detail
  }
  let writeErrorMessage: string | null = null
  if (writeHook.error !== null) {
    writeErrorMessage = writeHook.error.detail
  }
  let deleteErrorMessage: string | null = null
  if (deleteHook.error !== null) {
    deleteErrorMessage = deleteHook.error.detail
  }

  let sectionTitle = getTextInCurrentLanguage(FILE_COMMENT_TEXTS.sectionTitleLoading)
  if (fileCommentThread !== null) {
    const count = fileCommentThread.comments.length.toLocaleString('de-DE')
    sectionTitle = getTextInCurrentLanguageWithValues(FILE_COMMENT_TEXTS.sectionTitle, { count })
  }

  let threadContent: ReactNode = <Spinner animation="border" size="sm" />
  if (fileCommentThread !== null) {
    const shownFileCommentThread: FileCommentThread = fileCommentThread
    threadContent = shownFileCommentThread.comments.map((comment) => {
      const commentAuthor = findAuthor(shownFileCommentThread, comment.authorUsersGuid)
      let deleteButton = null
      if (comment.deletableByCurrentUsers && !readOnly) {
        deleteButton = (
          <ConfirmDeleteButton
            label={getTextInCurrentLanguage(FILE_COMMENT_TEXTS.deleteLabel)}
            question={getTextInCurrentLanguage(FILE_COMMENT_TEXTS.deleteQuestion)}
            isDeleting={deleteHook.isLoading}
            errorMessage={deleteErrorMessage}
            onDelete={() => deleteComment(comment.id)}
          />
        )
      }
      return (
        <CommentItem
          key={comment.id}
          author={commentAuthor}
          originLabel={originLabel}
          commentText={comment.commentText}
          writtenAt={comment.writtenAt}
          actions={deleteButton}
        />
      )
    })
    if (shownFileCommentThread.comments.length === 0) {
      threadContent = (
        <p className="text-body-secondary mb-0">{getTextInCurrentLanguage(FILE_COMMENT_TEXTS.noComments)}</p>
      )
    }
  } else if (loadFailed) {
    threadContent = <ErrorAlert message={loadErrorMessage} />
  }

  return (
    <section className="file-comments">
      <h3 className="file-comments-title">{sectionTitle}</h3>
      <div className="comment-thread">
        {threadContent}
        {!readOnly && (
          <RichTextForm
            placeholder={getTextInCurrentLanguage(FILE_COMMENT_TEXTS.formPlaceholder)}
            ariaLabel={getTextInCurrentLanguage(FILE_COMMENT_TEXTS.formAriaLabel)}
            submitLabel={getTextInCurrentLanguage(FILE_COMMENT_TEXTS.formSubmit)}
            compact
            isSubmitting={writeHook.isLoading}
            errorMessage={writeErrorMessage}
            onSubmit={writeComment}
          />
        )}
        {readOnly && readOnlyHint}
      </div>
    </section>
  )
}
