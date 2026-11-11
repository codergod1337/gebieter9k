import { useEffect, useMemo, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../api/useLoadedData.ts'
import { ConfirmDeletePopup } from '../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../components/ContentBox.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { Subheader } from '../components/Subheader.tsx'
import { showToast } from '../components/toastStore.ts'
import type { SymbolReference } from './DiscardedSymbol.ts'
import { SymbolDetailBox } from './SymbolDetailBox.tsx'
import { parseSymbolView, SymbolFilterBar, type SymbolView } from './SymbolFilterBar.tsx'
import { SymbolGrid } from '../symbol/SymbolGrid.tsx'
import { SymbolMarkBar } from './SymbolMarkBar.tsx'
import { getSymbolKey, loadSymbolCatalog, type SymbolEntry } from '../symbol/symbolCatalog.ts'
import { useDiscardedSymbol } from './useDiscardedSymbol.ts'
import { formatUrlPage, parseUrlPage, useUrlParam, useUrlParamsChanger } from '../navigation/useUrlParam.ts'
import { useUrlTextParam } from '../navigation/useUrlTextParam.ts'

/** So viele Icons stehen auf einer Seite. */
const SYMBOLS_PER_PAGE = 240

/** Die Parameter der Adresse: Filtertext, Ansicht, Seite (ab 1) und das groß gezeigte Icon (`paket:name`). */
const SEARCH_TEXT_URL_PARAM = 'q'
const VIEW_URL_PARAM = 'view'
const PAGE_URL_PARAM = 'page'
const SYMBOL_URL_PARAM = 'symbol'

/** Passt das Symbol zum Suchtext? Jedes Wort muss in Name oder Stichwörtern vorkommen. */
function matchesSearchWords(symbolEntry: SymbolEntry, searchWords: string[]): boolean {
  for (const searchWord of searchWords) {
    if (!symbolEntry.searchText.includes(searchWord)) {
      return false
    }
  }
  return true
}

/** Ein Schlüssel `paket:name` als Paket plus Name für das Backend. */
function toSymbolReference(symbolKey: string): SymbolReference {
  const separatorIndex = symbolKey.indexOf(':')
  const symbolPack = symbolKey.substring(0, separatorIndex)
  const symbolName = symbolKey.substring(separatorIndex + 1)
  return { symbolPack, symbolName }
}

/**
 * Der Icon-Manager unter `/icon-manager` (nur ADMIN): alle installierten Icons (Bootstrap Icons, Tabler, Lucide,
 * Game-icons, Pixelarticons) filtern, seitenweise ansehen, eins groß zeigen und durchklicken. Was nicht gefällt, wird
 * markiert und gelöscht: Es taucht danach nirgends mehr zur Auswahl auf. Die Ansicht „Gelöschte“ holt es zurück.
 *
 * Nach dem Muster aller Module steht die Ansicht in der Adresse (`?q=…&view=…&page=…&symbol=…`):
 * - Der Filtertext folgt nach der Tipp-Pause und ersetzt den Eintrag im Verlauf.
 * - Ansicht, Seite und das Öffnen eines Icons sind je ein neuer Eintrag: Zurück im Browser schließt das Icon wieder.
 * - Vor und Zurück im großen Icon ersetzen den Eintrag.
 * Markieren bleibt nur auf der Seite, es ist ein Arbeitsschritt, kein Zustand der Ansicht.
 */
export function IconManager() {
  const loadDiscardedSymbolHook = useDiscardedSymbol()
  const changeDiscardedSymbolHook = useDiscardedSymbol()
  const loadedDiscardedSymbols = useLoadedData(loadDiscardedSymbolHook.getAllDiscardedSymbol)
  const [symbolCatalog, setSymbolCatalog] = useState<SymbolEntry[] | null>(null)
  const [catalogErrorMessage, setCatalogErrorMessage] = useState<string | null>(null)
  const searchTextUrlParam = useUrlTextParam(SEARCH_TEXT_URL_PARAM)
  const viewUrlParam = useUrlParam(VIEW_URL_PARAM)
  const pageUrlParam = useUrlParam(PAGE_URL_PARAM)
  const symbolUrlParam = useUrlParam(SYMBOL_URL_PARAM)
  const changeUrlParams = useUrlParamsChanger()
  const searchText = searchTextUrlParam.text
  const view = parseSymbolView(viewUrlParam.value)
  const pageIndex = parseUrlPage(pageUrlParam.value)
  const selectedSymbolKey = symbolUrlParam.value
  const [markMode, setMarkMode] = useState<boolean>(false)
  const [markedSymbolKeys, setMarkedSymbolKeys] = useState<Set<string>>(new Set())
  /** Die Icons, die das Popup gerade zum Löschen anbietet; `null`: Popup zu. */
  const [pendingDeleteSymbolKeys, setPendingDeleteSymbolKeys] = useState<string[] | null>(null)

  useEffect(() => {
    async function loadCatalog() {
      try {
        const loadedSymbolCatalog = await loadSymbolCatalog()
        setSymbolCatalog(loadedSymbolCatalog)
      } catch (loadError) {
        setCatalogErrorMessage('Der Icon-Katalog ließ sich nicht laden: ' + String(loadError))
      }
    }
    void loadCatalog()
  }, [])

  const discardedSymbols = loadedDiscardedSymbols.data
  const discardedSymbolKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const discardedSymbol of discardedSymbols ?? []) {
      const discardedSymbolKey = discardedSymbol.symbolPack + ':' + discardedSymbol.symbolName
      keys.add(discardedSymbolKey)
    }
    return keys
  }, [discardedSymbols])

  const discardedView = view === 'DISCARDED'
  const filteredSymbolEntries = useMemo(() => {
    if (symbolCatalog === null) {
      return []
    }
    const normalizedSearchText = searchText.trim().toLowerCase()
    const searchWords = normalizedSearchText.split(/\s+/).filter((searchWord) => searchWord !== '')
    return symbolCatalog.filter((symbolEntry) => {
      const symbolKey = getSymbolKey(symbolEntry)
      const discarded = discardedSymbolKeys.has(symbolKey)
      if (discardedView !== discarded) {
        return false
      }
      if (!discardedView && view !== 'ALL' && symbolEntry.pack !== view) {
        return false
      }
      return matchesSearchWords(symbolEntry, searchWords)
    })
  }, [symbolCatalog, searchText, view, discardedView, discardedSymbolKeys])

  /** Neuer Filtertext: das Feld sofort, die Adresse nach der Tipp-Pause; die Seite gleich wieder auf die erste. */
  function handleSearchTextChange(changedSearchText: string) {
    searchTextUrlParam.changeText(changedSearchText)
    if (pageUrlParam.value !== null) {
      changeUrlParams({ [PAGE_URL_PARAM]: null }, 'REPLACE')
    }
  }

  /** Andere Ansicht: neuer Eintrag im Verlauf, erste Seite, kein Icon groß, Markierungen weg. */
  function handleViewChange(changedView: SymbolView) {
    let viewUrlText: string | null = changedView
    if (changedView === 'ALL') {
      viewUrlText = null
    }
    changeUrlParams({ [VIEW_URL_PARAM]: viewUrlText, [PAGE_URL_PARAM]: null, [SYMBOL_URL_PARAM]: null }, 'PUSH')
    setMarkedSymbolKeys(new Set())
  }

  /** Blättern: neuer Eintrag im Verlauf. */
  function changePage(changedPageIndex: number) {
    const urlPageText = formatUrlPage(changedPageIndex)
    changeUrlParams({ [PAGE_URL_PARAM]: urlPageText }, 'PUSH')
  }

  function toggleMark(symbolKey: string) {
    setMarkedSymbolKeys((currentMarkedKeys) => {
      const changedMarkedKeys = new Set(currentMarkedKeys)
      if (changedMarkedKeys.has(symbolKey)) {
        changedMarkedKeys.delete(symbolKey)
      } else {
        changedMarkedKeys.add(symbolKey)
      }
      return changedMarkedKeys
    })
  }

  function handleTileClick(symbolEntry: SymbolEntry) {
    const symbolKey = getSymbolKey(symbolEntry)
    if (markMode) {
      toggleMark(symbolKey)
      return
    }
    // Ein Icon groß öffnen ist ein neuer Eintrag im Verlauf: Zurück schließt es wieder
    symbolUrlParam.changeValue(symbolKey, 'PUSH')
  }

  /** Wählt das Symbol an dieser Stelle des Filters und blättert zu seiner Seite; ersetzt den Eintrag im Verlauf. */
  function selectSymbolAt(position: number) {
    const symbolEntry = filteredSymbolEntries[position]
    const symbolKey = getSymbolKey(symbolEntry)
    const pageOfPosition = Math.floor(position / SYMBOLS_PER_PAGE)
    const urlPageText = formatUrlPage(pageOfPosition)
    changeUrlParams({ [SYMBOL_URL_PARAM]: symbolKey, [PAGE_URL_PARAM]: urlPageText }, 'REPLACE')
  }

  /** Löscht die Symbole (blendet sie aus) bzw. holt sie in der Ansicht „Gelöschte“ zurück. */
  async function applyToSymbols(symbolKeys: string[]) {
    const symbolReferences = symbolKeys.map(toSymbolReference)
    const countText = symbolKeys.length.toLocaleString('de-DE')
    if (discardedView) {
      const restored = await changeDiscardedSymbolHook.deleteDiscardedSymbols(symbolReferences)
      if (!restored) {
        return
      }
      showToast({ kind: 'success', title: countText + ' Icons wiederhergestellt', text: 'Sie stehen wieder zur Auswahl.' })
    } else {
      const discarded = await changeDiscardedSymbolHook.createDiscardedSymbols(symbolReferences)
      if (discarded === null) {
        return
      }
      showToast({ kind: 'success', title: countText + ' Icons gelöscht', text: 'Unter „Gelöschte“ lassen sie sich zurückholen.' })
    }
    // Nur die erledigten Icons verlieren ihre Markierung, die übrigen bleiben markiert.
    setMarkedSymbolKeys((currentMarkedKeys) => {
      const remainingMarkedKeys = new Set(currentMarkedKeys)
      for (const symbolKey of symbolKeys) {
        remainingMarkedKeys.delete(symbolKey)
      }
      return remainingMarkedKeys
    })
    setPendingDeleteSymbolKeys(null)
    await loadedDiscardedSymbols.reload()
  }

  /** Löschen fragt immer erst im Popup nach, Wiederherstellen geht sofort. */
  function requestApplyToSymbols(symbolKeys: string[]) {
    if (discardedView) {
      void applyToSymbols(symbolKeys)
      return
    }
    setPendingDeleteSymbolKeys(symbolKeys)
  }

  function handleApplyToMarked() {
    const markedKeys = Array.from(markedSymbolKeys)
    requestApplyToSymbols(markedKeys)
  }

  function handleConfirmDelete() {
    if (pendingDeleteSymbolKeys === null) {
      return
    }
    void applyToSymbols(pendingDeleteSymbolKeys)
  }

  const subheaderStatus = (
    <>
      <i className="bi bi-emoji-smile me-2"></i>
      Icon-Manager
    </>
  )
  let loadErrorMessage = catalogErrorMessage
  if (loadErrorMessage === null && loadDiscardedSymbolHook.error !== null) {
    loadErrorMessage = loadDiscardedSymbolHook.error.detail
  }
  if (loadErrorMessage !== null || symbolCatalog === null || discardedSymbols === null) {
    return (
      <>
        <Subheader status={subheaderStatus} />
        <div className="main-content">
          {loadErrorMessage !== null ? <ErrorAlert message={loadErrorMessage} /> : <Spinner animation="border" />}
        </div>
      </>
    )
  }

  const totalCount = filteredSymbolEntries.length
  const activeCount = symbolCatalog.length - discardedSymbolKeys.size
  const pageCount = Math.max(1, Math.ceil(totalCount / SYMBOLS_PER_PAGE))
  const currentPageIndex = Math.min(pageIndex, pageCount - 1)
  const pageStart = currentPageIndex * SYMBOLS_PER_PAGE
  const pageEnd = pageStart + SYMBOLS_PER_PAGE
  const pageSymbolEntries = filteredSymbolEntries.slice(pageStart, pageEnd)

  function handleMarkPage() {
    setMarkedSymbolKeys((currentMarkedKeys) => {
      const changedMarkedKeys = new Set(currentMarkedKeys)
      for (const pageSymbolEntry of pageSymbolEntries) {
        const pageSymbolKey = getSymbolKey(pageSymbolEntry)
        changedMarkedKeys.add(pageSymbolKey)
      }
      return changedMarkedKeys
    })
  }

  let selectedPosition = -1
  if (selectedSymbolKey !== null) {
    selectedPosition = filteredSymbolEntries.findIndex((symbolEntry) => getSymbolKey(symbolEntry) === selectedSymbolKey)
  }
  let changeErrorMessage: string | null = null
  if (changeDiscardedSymbolHook.error !== null) {
    changeErrorMessage = changeDiscardedSymbolHook.error.detail
  }
  const isSaving = changeDiscardedSymbolHook.isLoading
  let countText = totalCount.toLocaleString('de-DE') + ' von ' + activeCount.toLocaleString('de-DE') + ' Icons'
  if (discardedView) {
    countText = totalCount.toLocaleString('de-DE') + ' gelöschte Icons'
  }
  const pageText = 'Seite ' + (currentPageIndex + 1) + ' von ' + pageCount
  const footer = (
    <div className="d-flex align-items-center justify-content-between gap-2">
      <Button variant="outline-secondary" size="sm" onClick={() => changePage(currentPageIndex - 1)} disabled={currentPageIndex <= 0}>
        <i className="bi bi-chevron-left me-1" aria-hidden="true"></i>
        Vorige Seite
      </Button>
      <span>
        {countText} · {pageText}
      </span>
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={() => changePage(currentPageIndex + 1)}
        disabled={currentPageIndex >= pageCount - 1}>
        Nächste Seite
        <i className="bi bi-chevron-right ms-1" aria-hidden="true"></i>
      </Button>
    </div>
  )

  return (
    <>
      <Subheader status={subheaderStatus} />
      <div className="main-content">
        {selectedPosition >= 0 && (
          <SymbolDetailBox
            symbolEntry={filteredSymbolEntries[selectedPosition]}
            position={selectedPosition}
            totalCount={totalCount}
            discarded={discardedView}
            isSaving={isSaving}
            onPrevious={() => selectSymbolAt(selectedPosition - 1)}
            onNext={() => selectSymbolAt(selectedPosition + 1)}
            onToggleDiscarded={() => requestApplyToSymbols([selectedSymbolKey as string])}
          />
        )}
        <ContentBox title="Alle Icons" footer={footer}>
          <ErrorAlert message={changeErrorMessage} />
          <SymbolFilterBar
            searchText={searchText}
            view={view}
            onSearchTextChange={handleSearchTextChange}
            onViewChange={handleViewChange}
          />
          <SymbolMarkBar
            markMode={markMode}
            markedCount={markedSymbolKeys.size}
            discardedView={discardedView}
            isSaving={isSaving}
            onMarkModeChange={setMarkMode}
            onMarkPage={handleMarkPage}
            onClearMarks={() => setMarkedSymbolKeys(new Set())}
            onApplyToMarked={handleApplyToMarked}
          />
          {totalCount === 0 && <p className="text-body-secondary mb-0">Kein Icon passt zum Filter.</p>}
          <SymbolGrid
            symbolEntries={pageSymbolEntries}
            selectedSymbolKey={selectedSymbolKey}
            markedSymbolKeys={markedSymbolKeys}
            onTileClick={handleTileClick}
          />
        </ContentBox>
      </div>
      {pendingDeleteSymbolKeys !== null && (
        <ConfirmDeletePopup
          title="Icons löschen"
          isDeleting={isSaving}
          errorMessage={changeErrorMessage}
          onConfirm={handleConfirmDelete}
          onClose={() => setPendingDeleteSymbolKeys(null)}>
          Sollen <strong>{pendingDeleteSymbolKeys.length.toLocaleString('de-DE')} Icons</strong> gelöscht werden? Sie
          tauchen danach nirgends mehr zur Auswahl auf. Unter „Gelöschte“ lassen sie sich zurückholen.
        </ConfirmDeletePopup>
      )}
    </>
  )
}
