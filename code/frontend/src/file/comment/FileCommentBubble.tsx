import { useEffect, useState } from 'react'
import { Hoverlay } from '../../components/Hoverlay.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import type { FileCommentCount } from '../FileComment.ts'
import { useFileComment } from '../useFileComment.ts'
import { FILE_COMMENT_TEXTS } from './fileCommentTexts.ts'

type FileCommentBubbleProps = {
  fileDocumentId: string
  /**
   * Die Zahl der Kommentare, wenn der Aufrufer sie schon kennt (Besucherseite einer Freigabe: sie kommt mit der Seite;
   * Galerie: nachdem jemand im großen Bild kommentiert hat). Ohne: Die Sprechblase lädt sie selbst nach.
   */
  commentCount?: number
  /** Ein Klick öffnet die Kommentare, z. B. das große Bild mit seinem Verlauf. */
  onOpen: () => void
}

/**
 * Die Sprechblase mit der Zahl der Kommentare einer Datei, neben den beiden Smileys der Stimmen (Nutzer 2026-11-20).
 * Wie die Stimmen hat sie mit dem Auflösen der Dateien nichts zu tun: Die Kachel steht schon da, erst danach lädt die
 * Sprechblase ihre Zahl selbst nach (`GET /api/file-comment/count/<id>`), außer der Aufrufer gibt sie mit. Ein Klick
 * öffnet die Kommentare. Aussehen wie die Smiley-Pillen (base.css und Theme, `.file-comment-button`).
 */
export function FileCommentBubble({ fileDocumentId, commentCount, onOpen }: FileCommentBubbleProps) {
  const fileCommentHook = useFileComment()
  const getFileCommentCount = fileCommentHook.getFileCommentCount
  const [loadedFileCommentCount, setLoadedFileCommentCount] = useState<FileCommentCount | null>(null)
  const countGiven = commentCount !== undefined

  useEffect(() => {
    if (countGiven) {
      return
    }
    let stillWanted = true
    void getFileCommentCount(fileDocumentId).then((fileCommentCount) => {
      if (stillWanted) {
        setLoadedFileCommentCount(fileCommentCount)
      }
    })
    return () => {
      stillWanted = false
    }
  }, [countGiven, fileDocumentId, getFileCommentCount])

  // Die Zahl: die des Aufrufers, sonst die selbst geladene (nur wenn sie zu dieser Datei gehört), sonst noch keine
  let shownCommentCount: number | null = null
  if (commentCount !== undefined) {
    shownCommentCount = commentCount
  } else if (loadedFileCommentCount !== null && loadedFileCommentCount.fileDocumentId === fileDocumentId) {
    shownCommentCount = loadedFileCommentCount.commentCount
  }

  let ariaLabel = getTextInCurrentLanguage(FILE_COMMENT_TEXTS.bubbleLabelLoading)
  let countText = ''
  if (shownCommentCount !== null) {
    countText = shownCommentCount.toLocaleString('de-DE')
    ariaLabel = getTextInCurrentLanguageWithValues(FILE_COMMENT_TEXTS.bubbleLabelMany, { count: countText })
    if (shownCommentCount === 1) {
      ariaLabel = getTextInCurrentLanguage(FILE_COMMENT_TEXTS.bubbleLabelOne)
    }
  }
  return (
    <Hoverlay text={getTextInCurrentLanguage(FILE_COMMENT_TEXTS.bubbleHint)} placement="top">
      <button type="button" className="file-comment-button" onClick={onOpen} aria-label={ariaLabel}>
        <i className="bi bi-chat" aria-hidden="true"></i>
        {shownCommentCount !== null && <span className="file-comment-count">{countText}</span>}
      </button>
    </Hoverlay>
  )
}
