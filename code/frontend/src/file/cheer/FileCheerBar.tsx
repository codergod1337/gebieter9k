import { useEffect, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { Hoverlay } from '../../components/Hoverlay.tsx'
import { DEFAULT_LANGUAGE } from '../../language/activeLanguages.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import type { MultilingualText } from '../../language/MultilingualText.ts'
import type { FileCheerDirection, FileCheerState } from '../FileCheer.ts'
import { useFileCheer } from '../useFileCheer.ts'
import { FileCheerHint } from './FileCheerHint.tsx'
import { FILE_CHEER_TEXTS } from './fileCheerTexts.ts'
import { useFileCheerAllUsers } from './useFileCheerAllUsers.ts'

type FileCheerBarProps = {
  fileDocumentId: string
  /** Der Name der Seite, auf der die Smileys stehen: für „Zurück zu …“, wenn man aus der Liste ein Profil öffnet. */
  originLabel: string
}

/**
 * Was je Richtung feststeht: Bezeichnung (mehrsprachig, aus {@link FILE_CHEER_TEXTS}) und Smiley (Nutzer 2026-11-11:
 * Smileys statt der Daumen von Facebook).
 */
const CHEER_LOOKS: Record<FileCheerDirection, { label: MultilingualText; emoji: string }> = {
  UP: { label: FILE_CHEER_TEXTS.upLabel, emoji: '🤩' },
  DOWN: { label: FILE_CHEER_TEXTS.downLabel, emoji: '🤮' },
}

/**
 * Die Stimmen einer Datei: zwei Smileys, begeistert und angewidert, mit ihrer Zahl. Überall dieselbe Komponente: auf der
 * Seite einer Datei, an jeder Bildkachel einer Galerie und am großen Bild.
 *
 * Sie hat mit dem Suchen und Auflösen der Dateien nichts zu tun (Nutzer 2026-11-11): Die Dateien kommen sofort aus Solr
 * und stehen schon da, erst danach lädt jede Komponente ihre Stimmen selbst nach (`GET /api/file-cheer/<id>`). Bis sie da
 * sind, steht nur ein kleiner Spinner. Die Antwort ist immer klein: beide Zahlen, die eigene Stimme und je Richtung nur
 * die neuesten User, nie alle.
 *
 * - Die eigene Stimme ist hervorgehoben. Ein Klick auf den anderen Smiley wechselt, ein Klick auf den eigenen nimmt die
 *   Stimme zurück. Beim Zeigen sieht ein Smiley schon so aus wie nach dem Klick (Theme): der fremde wie gewählt, der
 *   eigene wie abgewählt. Abstimmen darf jeder, der die Datei sieht, auch ihr Autor.
 * - Die Stimmen sind nicht anonym: Wer über einen Smiley fährt, bekommt eine Sprechblase ({@link Hoverlay} zum
 *   Hineinklicken, {@link FileCheerHint}) mit den Usern, die zuletzt so gestimmt haben, jeder Name führt auf sein
 *   Profil; „Alle laden“ holt alle nach ({@link useFileCheerAllUsers}). Die Sprechblase geht nach oben auf: So verdeckt
 *   sie nichts, was unter den Smileys zum Anklicken steht.
 *
 * Aussehen wie die Smiley-Pillen des Gästebuchs (base.css und Theme, `.file-cheer-button`). Alle Texte sind
 * mehrsprachig angelegt ({@link FILE_CHEER_TEXTS}).
 */
export function FileCheerBar({ fileDocumentId, originLabel }: FileCheerBarProps) {
  const fileCheerHook = useFileCheer()
  const getFileCheerState = fileCheerHook.getFileCheerState
  const allUsersHook = useFileCheerAllUsers(fileDocumentId)
  const [loadedFileCheerState, setLoadedFileCheerState] = useState<FileCheerState | null>(null)
  /**
   * Der Smiley, der eben geklickt wurde: Er zeigt den neuen Stand, nicht die Vorschau des nächsten Klicks, bis der Zeiger
   * die Leiste verlässt oder auf den anderen Smiley geht.
   */
  const [settledDirection, setSettledDirection] = useState<FileCheerDirection | null>(null)

  useEffect(() => {
    let stillWanted = true
    void getFileCheerState(fileDocumentId).then((fileCheerState) => {
      if (stillWanted) {
        setLoadedFileCheerState(fileCheerState)
      }
    })
    return () => {
      stillWanted = false
    }
  }, [fileDocumentId, getFileCheerState])

  let errorMessage: string | null = allUsersHook.errorMessage
  if (fileCheerHook.error !== null) {
    errorMessage = fileCheerHook.error.detail
  }

  // Der Stand einer anderen Datei (das Bild hat gewechselt) zählt nicht: erst laden
  let fileCheerState: FileCheerState | null = loadedFileCheerState
  if (fileCheerState !== null && fileCheerState.fileDocumentId !== fileDocumentId) {
    fileCheerState = null
  }
  if (fileCheerState === null) {
    if (errorMessage !== null) {
      return <ErrorAlert message={errorMessage} />
    }
    return (
      <div className="file-cheer" aria-busy="true">
        <Spinner animation="border" size="sm" />
      </div>
    )
  }
  const shownFileCheerState: FileCheerState = fileCheerState

  /** Ein Klick auf einen Smiley: der eigene nimmt die Stimme zurück, der andere gibt sie oder wechselt. */
  async function cheer(direction: FileCheerDirection) {
    setSettledDirection(direction)
    const ownDirection = shownFileCheerState.directionOfCurrentUsers === direction
    let changedFileCheerState: FileCheerState | null
    if (ownDirection) {
      changedFileCheerState = await fileCheerHook.deleteOwnFileCheer(fileDocumentId)
    } else {
      changedFileCheerState = await fileCheerHook.createOwnFileCheer(fileDocumentId, direction)
    }
    if (changedFileCheerState !== null) {
      setLoadedFileCheerState(changedFileCheerState)
    }
  }

  /** Der Zeiger geht auf einen Smiley: War eben der andere geklickt, gilt für den wieder die Vorschau. */
  function leaveSettledDirection(enteredDirection: FileCheerDirection) {
    if (settledDirection !== null && settledDirection !== enteredDirection) {
      setSettledDirection(null)
    }
  }

  function renderCheerButton(direction: FileCheerDirection, cheerCount: number, newestUsersGuids: string[]) {
    const cheerLook = CHEER_LOOKS[direction]
    const cheerLabel = getTextInCurrentLanguage(cheerLook.label)
    const cheerCountText = cheerCount.toLocaleString(DEFAULT_LANGUAGE.code)
    const ownDirection = shownFileCheerState.directionOfCurrentUsers === direction
    let buttonClassName = 'file-cheer-button'
    let clickHint = getTextInCurrentLanguage(FILE_CHEER_TEXTS.clickGivesCheer)
    let ariaLabelText: MultilingualText = FILE_CHEER_TEXTS.buttonLabel
    if (ownDirection) {
      buttonClassName = 'file-cheer-button file-cheer-button-own'
      clickHint = getTextInCurrentLanguage(FILE_CHEER_TEXTS.clickTakesCheerBack)
      ariaLabelText = FILE_CHEER_TEXTS.ownButtonLabel
    }
    if (settledDirection === direction) {
      buttonClassName = buttonClassName + ' file-cheer-button-settled'
    }
    // Die Namen stehen nur in der Sprechblase: Erst wenn sie aufgeht, fragt die Liste sie ab
    const usersHint = (
      <FileCheerHint
        label={cheerLabel}
        cheerCount={cheerCount}
        clickHint={clickHint}
        newestUsersGuids={newestUsersGuids}
        allUsersLoad={allUsersHook.allUsersLoads[direction]}
        onLoadAllUsers={() => allUsersHook.loadAllUsers(direction)}
        originLabel={originLabel}
      />
    )
    const ariaLabel = getTextInCurrentLanguageWithValues(ariaLabelText, { label: cheerLabel, count: cheerCountText })
    return (
      <Hoverlay text={usersHint} placement="top" interactive>
        <button
          type="button"
          className={buttonClassName}
          disabled={fileCheerHook.isLoading}
          aria-pressed={ownDirection}
          aria-label={ariaLabel}
          onMouseEnter={() => leaveSettledDirection(direction)}
          onClick={() => void cheer(direction)}>
          <span className="emoji-text" aria-hidden="true">
            {cheerLook.emoji}
          </span>
          <span className="file-cheer-count">{cheerCountText}</span>
        </button>
      </Hoverlay>
    )
  }

  const barLabel = getTextInCurrentLanguage(FILE_CHEER_TEXTS.barLabel)
  return (
    <>
      <div className="file-cheer" role="group" aria-label={barLabel} onMouseLeave={() => setSettledDirection(null)}>
        {renderCheerButton('UP', shownFileCheerState.cheerUpCount, shownFileCheerState.cheerUpUsersGuids)}
        {renderCheerButton('DOWN', shownFileCheerState.cheerDownCount, shownFileCheerState.cheerDownUsersGuids)}
      </div>
      <ErrorAlert message={errorMessage} />
    </>
  )
}
