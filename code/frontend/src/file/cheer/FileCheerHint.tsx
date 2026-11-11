import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import { UsersGuidList } from '../../components/UsersGuidList.tsx'
import { DEFAULT_LANGUAGE } from '../../language/activeLanguages.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import { FILE_CHEER_TEXTS } from './fileCheerTexts.ts'
import type { FileCheerAllUsersLoad } from './useFileCheerAllUsers.ts'

type FileCheerHintProps = {
  /** Die Bezeichnung der Richtung in der Sprache der Oberfläche, z. B. „Begeistert“. */
  label: string
  /** So viele Stimmen hat diese Richtung insgesamt. */
  cheerCount: number
  /** Was ein Klick auf den Smiley bewirkt, z. B. „Ein Klick gibt deine Stimme.“ */
  clickHint: string
  /** Die neuesten User dieser Richtung aus dem Stand der Stimmen (Standard: 15). */
  newestUsersGuids: string[]
  /** Wie weit „Alle laden“ ist. */
  allUsersLoad: FileCheerAllUsersLoad
  onLoadAllUsers: () => void
  /** Der Name der Seite, von der aus man ein Profil öffnet, für „Zurück zu …“. */
  originLabel: string
}

/**
 * Der Inhalt der Sprechblase eines Smileys der Stimmen: oben die Bezeichnung und gleich daneben die Zahl, darunter was
 * ein Klick bewirkt, dann die User, die so gestimmt haben, als Liste mit Suchfeld ({@link UsersGuidList}), jeder Name
 * führt auf sein Profil. Standard sind die neuesten 15. Gibt es mehr, lädt „Alle laden“ alle nach; solange steht der
 * Spinner mit dem Fortschritt da, danach die ganze Liste, und das Suchfeld sucht in allen (Nutzer 2026-11-11).
 *
 * Alle Texte kommen mehrsprachig aus {@link FILE_CHEER_TEXTS}. Aufbau in base.css (`.file-cheer-hint`), Farben im
 * Theme: weiß auf Bordeaux, Bezeichnung und Zahl neongelb.
 */
export function FileCheerHint({
  label,
  cheerCount,
  clickHint,
  newestUsersGuids,
  allUsersLoad,
  onLoadAllUsers,
  originLabel,
}: FileCheerHintProps) {
  // Die ganze Liste gilt nur für die Zahl, für die sie geladen wurde: Stimmt inzwischen jemand, zählen wieder die neuesten
  let allUsersGuids: string[] | null = allUsersLoad.usersGuids
  if (allUsersGuids !== null && allUsersLoad.totalCount !== cheerCount) {
    allUsersGuids = null
  }
  const shownUsersGuids = allUsersGuids ?? newestUsersGuids
  const furtherUsersCount = cheerCount - shownUsersGuids.length
  const isLoadingAll = allUsersLoad.isLoading
  const numberLocale = DEFAULT_LANGUAGE.code
  const cheerCountText = cheerCount.toLocaleString(numberLocale)
  const furtherUsersText = getTextInCurrentLanguageWithValues(FILE_CHEER_TEXTS.furtherUsers, {
    count: furtherUsersCount.toLocaleString(numberLocale),
  })
  const loadingAllUsersText = getTextInCurrentLanguageWithValues(FILE_CHEER_TEXTS.loadingAllUsers, {
    loadedCount: allUsersLoad.loadedCount.toLocaleString(numberLocale),
    totalCount: cheerCountText,
  })
  const loadAllUsersText = getTextInCurrentLanguage(FILE_CHEER_TEXTS.loadAllUsers)
  return (
    <div className="file-cheer-hint">
      <div className="file-cheer-hint-title">
        <span>{label}</span>
        <span className="file-cheer-hint-count">{cheerCountText}</span>
      </div>
      <span className="file-cheer-hint-note">{clickHint}</span>
      <UsersGuidList usersGuids={shownUsersGuids} originLabel={originLabel} />
      {isLoadingAll && (
        <div className="file-cheer-hint-more" aria-busy="true">
          <Spinner animation="border" size="sm" />
          <span className="file-cheer-hint-note">{loadingAllUsersText}</span>
        </div>
      )}
      {!isLoadingAll && furtherUsersCount > 0 && (
        <div className="file-cheer-hint-more">
          <span className="file-cheer-hint-note">{furtherUsersText}</span>
          <Button size="sm" variant="outline-light" onClick={onLoadAllUsers}>
            {loadAllUsersText}
          </Button>
        </div>
      )}
    </div>
  )
}
