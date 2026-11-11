import { useCallback, useEffect, useRef } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../api/useLoadedData.ts'
import { ContentBox } from '../components/ContentBox.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { PageNavigation } from '../components/PageNavigation.tsx'
import { GUESTBOOK_BOX_ELEMENT_ID } from './guestbookBoxElementId.ts'
import { formatUrlPage, parseUrlPage, type UrlParamChange, useUrlParam } from '../navigation/useUrlParam.ts'
import { GuestbookEntryCard } from './GuestbookEntryCard.tsx'
import { GuestbookTextForm } from './GuestbookTextForm.tsx'
import { useGuestbook } from './useGuestbook.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'

type GuestbookBoxProps = {
  /** Wessen Gästebuch, auch das eigene. */
  profileUsersGuid: string
}

/** Der Parameter der Adresse mit der Seite des Gästebuchs, ab 1, z. B. `?guestbookPage=2`. */
const GUESTBOOK_PAGE_URL_PARAM = 'guestbookPage'

/** Die letzte Seite (ab 0) bei so vielen Einträgen; ohne Einträge die Seite 0. */
function getLastPage(totalCount: number, pageSize: number): number {
  if (totalCount === 0) {
    return 0
  }
  const pageCount = Math.ceil(totalCount / pageSize)
  return pageCount - 1
}

/**
 * Box „Gästebuch“ im Profil: oben das Feld für einen neuen Eintrag, darunter die Einträge seitenweise (die neuesten
 * zuerst) als {@link GuestbookEntryCard}. Wer das Profil sehen darf, liest und schreibt; das prüft das Backend. Nach
 * jeder Änderung lädt die Box die aktuelle Seite neu, nach einem neuen Eintrag die erste. Die Seite steht in der Adresse
 * (`?guestbookPage=2`), Blättern ist ein Eintrag im Verlauf.
 *
 * Je Seite so viele Einträge, wie `gebiter.guestbook.page-size` sagt (10, Nutzer 2026-11-09). Darunter die Seitenzahlen
 * ({@link PageNavigation}). Beim Blättern rollt die Seite an den Anfang des Gästebuchs, nicht an den Anfang des Profils.
 */
export function GuestbookBox({ profileUsersGuid }: GuestbookBoxProps) {
  const pageHook = useGuestbook()
  const writeHook = useGuestbook()
  const guestbookBoxRef = useRef<HTMLDivElement>(null)
  const resolveGuestbookPage = pageHook.resolveGuestbookPage
  const guestbookPageUrlParam = useUrlParam(GUESTBOOK_PAGE_URL_PARAM)
  const changeGuestbookPageUrlParam = guestbookPageUrlParam.changeValue
  const page = parseUrlPage(guestbookPageUrlParam.value)

  /** Blättert auf eine Seite (ab 0); die erste steht ohne Parameter in der Adresse. */
  const changePage = useCallback(
    (changedPage: number, change: UrlParamChange) => {
      const urlPageText = formatUrlPage(changedPage)
      changeGuestbookPageUrlParam(urlPageText, change)
    },
    [changeGuestbookPageUrlParam],
  )

  const loadGuestbookPage = useCallback(() => resolveGuestbookPage(profileUsersGuid, page), [resolveGuestbookPage, profileUsersGuid, page])
  const loadedGuestbookPage = useLoadedData(loadGuestbookPage)
  const reloadGuestbookPage = loadedGuestbookPage.reload
  const guestbookPage = loadedGuestbookPage.data

  // Ist die Seite nach dem Löschen leer geworden (oder stand eine zu große in der Adresse), auf die letzte, die es noch
  // gibt; das ersetzt den Eintrag im Verlauf, statt einen neuen anzulegen
  let lastPage = 0
  if (guestbookPage !== null) {
    lastPage = getLastPage(guestbookPage.totalCount, guestbookPage.pageSize)
  }
  useEffect(() => {
    if (guestbookPage !== null && page > lastPage) {
      changePage(lastPage, 'REPLACE')
    }
  }, [guestbookPage, page, lastPage, changePage])

  /** Schreibt den Eintrag und zeigt die erste Seite, wo er jetzt oben steht; liefert, ob es geklappt hat. */
  async function writeEntry(entryText: MultilingualText): Promise<boolean> {
    const createdGuestbook = await writeHook.createOwnGuestbook(profileUsersGuid, entryText)
    if (createdGuestbook === null) {
      return false
    }
    if (page === 0) {
      await reloadGuestbookPage()
    } else {
      // Der Wechsel der Seite lädt von selbst
      changePage(0, 'PUSH')
    }
    return true
  }

  let writeErrorMessage: string | null = null
  if (writeHook.error !== null) {
    writeErrorMessage = writeHook.error.detail
  }
  let pageErrorMessage: string | null = null
  if (pageHook.error !== null) {
    pageErrorMessage = pageHook.error.detail
  }

  /** Blättern über die Seitenzahlen: neuer Eintrag im Verlauf, die Seite rollt an den Anfang des Gästebuchs. */
  function handlePageNavigation(changedPage: number) {
    changePage(changedPage, 'PUSH')
    const guestbookBox = guestbookBoxRef.current
    if (guestbookBox !== null) {
      guestbookBox.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const pageCount = lastPage + 1
  let footer = null
  if (guestbookPage === null && pageHook.isLoading) {
    footer = <Spinner animation="border" size="sm" />
  } else if (guestbookPage !== null) {
    let countText = guestbookPage.totalCount + ' Einträge'
    if (guestbookPage.totalCount === 1) {
      countText = '1 Eintrag'
    }
    if (pageCount > 1) {
      countText = countText + ' · Seite ' + (page + 1) + ' von ' + pageCount
    }
    footer = countText
  }

  return (
    <div ref={guestbookBoxRef} id={GUESTBOOK_BOX_ELEMENT_ID} className="guestbook-box">
      <ContentBox title="Gästebuch" footer={footer}>
        <GuestbookTextForm
          placeholder="Etwas ins Gästebuch schreiben …"
          ariaLabel="Neuer Gästebucheintrag"
          submitLabel="Eintragen"
          isSubmitting={writeHook.isLoading}
          errorMessage={writeErrorMessage}
          onSubmit={writeEntry}
        />
        <ErrorAlert message={pageErrorMessage} />
        {guestbookPage !== null && guestbookPage.entries.length === 0 && (
          <p className="text-body-secondary mt-3 mb-0">Noch keine Einträge.</p>
        )}
        {guestbookPage !== null && guestbookPage.entries.length > 0 && (
          <div className="guestbook-entries">
            {guestbookPage.entries.map((entry) => (
              <GuestbookEntryCard key={entry.id} entry={entry} guestbookPage={guestbookPage} onChanged={reloadGuestbookPage} />
            ))}
          </div>
        )}
        {guestbookPage !== null && pageCount > 1 && (
          <div className="guestbook-pager">
            <PageNavigation
              page={page}
              pageCount={pageCount}
              disabled={pageHook.isLoading}
              onPageChange={handlePageNavigation}
              ariaLabel="Seiten des Gästebuchs"
            />
          </div>
        )}
      </ContentBox>
    </div>
  )
}
