import Pagination from 'react-bootstrap/Pagination'

type PageNavigationProps = {
  /** Die aktuelle Seite ab 0. */
  page: number
  /** Wie viele Seiten es gibt, mindestens 1. */
  pageCount: number
  /** Gesperrt, z. B. solange eine Seite lädt. */
  disabled: boolean
  onPageChange: (changedPage: number) => void
  /** Für Screenreader, z. B. „Seiten des Gästebuchs“. */
  ariaLabel: string
}

/** Eine Lücke in der Reihe der Seitenzahlen, z. B. zwischen 1 und 7. */
type PageGap = 'GAP'

/** So viele Seiten stehen links und rechts neben der aktuellen, dazu immer die erste und die letzte. */
const NEIGHBOR_PAGE_COUNT = 2

/**
 * Die Seiten, die als Zahl dastehen (ab 0): die erste, die letzte und die Nachbarn der aktuellen; dazwischen Lücken.
 * Fehlt nur genau eine Seite, steht sie statt der Lücke da.
 */
function getShownPages(page: number, pageCount: number): (number | PageGap)[] {
  const shownPages: (number | PageGap)[] = []
  let previousShownPage = -1
  for (let candidatePage = 0; candidatePage < pageCount; candidatePage++) {
    const firstOrLast = candidatePage === 0 || candidatePage === pageCount - 1
    const distanceToPage = Math.abs(candidatePage - page)
    const neighbor = distanceToPage <= NEIGHBOR_PAGE_COUNT
    if (!firstOrLast && !neighbor) {
      continue
    }
    const skippedPageCount = candidatePage - previousShownPage - 1
    if (skippedPageCount === 1) {
      shownPages.push(candidatePage - 1)
    } else if (skippedPageCount > 1) {
      shownPages.push('GAP')
    }
    shownPages.push(candidatePage)
    previousShownPage = candidatePage
  }
  return shownPages
}

/**
 * Blättern mit Seitenzahlen, global für jede Liste: ‹ 1 … 4 5 [6] 7 8 … 20 ›. Die Seiten stehen ab 1 da, im Code ab 0.
 * Bootstrap-Pagination, die Farben setzt das Theme (`.page-navigation`). Bei nur einer Seite zeigt sie nichts.
 */
export function PageNavigation({ page, pageCount, disabled, onPageChange, ariaLabel }: PageNavigationProps) {
  if (pageCount <= 1) {
    return null
  }
  const shownPages = getShownPages(page, pageCount)
  const isFirstPage = page <= 0
  const isLastPage = page >= pageCount - 1

  /** Ein Klick auf die aktuelle Seite tut nichts, sonst stünde sie doppelt im Verlauf. */
  function selectPage(selectedPage: number) {
    if (selectedPage === page) {
      return
    }
    onPageChange(selectedPage)
  }

  return (
    <nav aria-label={ariaLabel}>
      <Pagination className="page-navigation">
        <Pagination.Prev disabled={disabled || isFirstPage} onClick={() => onPageChange(page - 1)} aria-label="Vorige Seite" />
        {shownPages.map((shownPage, shownIndex) => {
          if (shownPage === 'GAP') {
            const gapKey = 'GAP-' + shownIndex
            return <Pagination.Ellipsis key={gapKey} disabled />
          }
          const pageNumber = shownPage + 1
          const current = shownPage === page
          return (
            <Pagination.Item
              key={shownPage}
              active={current}
              disabled={disabled && !current}
              onClick={() => selectPage(shownPage)}
              aria-label={'Seite ' + pageNumber}>
              {pageNumber}
            </Pagination.Item>
          )
        })}
        <Pagination.Next disabled={disabled || isLastPage} onClick={() => onPageChange(page + 1)} aria-label="Nächste Seite" />
      </Pagination>
    </nav>
  )
}
