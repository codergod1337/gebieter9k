import { type ChangeEvent, useEffect, useState } from 'react'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Spinner from 'react-bootstrap/Spinner'
import { SymbolGrid } from '../symbol/SymbolGrid.tsx'
import {
  FONT_SYMBOL_PACKS,
  loadFontSymbolCatalog,
  SYMBOL_PACK_OPTIONS,
  type SymbolEntry,
} from '../symbol/symbolCatalog.ts'

/** So viele Treffer zeigt das Raster höchstens; wer mehr will, filtert genauer. */
const SHOWN_SYMBOLS_LIMIT = 300

/** Kein Symbol ist markiert, das Raster hier wählt nur. */
const NO_MARKED_SYMBOL_KEYS = new Set<string>()

type SymbolPickerPopupProps = {
  onPick: (symbolEntry: SymbolEntry) => void
  onClose: () => void
}

/**
 * Die Symbolwahl eines Badges: Suchfeld, Paket, darunter das Raster wie im Icon-Manager. Ein Klick wählt und schließt.
 * Angeboten werden nur die Schrift-Pakete, deren Schriften lädt base.css ohnehin.
 */
export function SymbolPickerPopup({ onPick, onClose }: SymbolPickerPopupProps) {
  const [symbolEntries, setSymbolEntries] = useState<SymbolEntry[] | null>(null)
  const [filterText, setFilterText] = useState<string>('')
  const [packFilter, setPackFilter] = useState<string>('')

  useEffect(() => {
    let isActive = true
    async function loadCatalog() {
      const loadedSymbolEntries = await loadFontSymbolCatalog()
      if (isActive) {
        setSymbolEntries(loadedSymbolEntries)
      }
    }
    void loadCatalog()
    return () => {
      isActive = false
    }
  }, [])

  function handleFilterTextChange(event: ChangeEvent<HTMLInputElement>) {
    const typedFilterText = event.target.value
    setFilterText(typedFilterText)
  }

  function handlePackFilterChange(event: ChangeEvent<HTMLSelectElement>) {
    const chosenPack = event.target.value
    setPackFilter(chosenPack)
  }

  const fontPackOptions = SYMBOL_PACK_OPTIONS.filter((packOption) => FONT_SYMBOL_PACKS.includes(packOption.pack))
  const searchWords = filterText.toLowerCase().split(' ').filter((searchWord) => searchWord !== '')
  const matchingSymbolEntries = (symbolEntries ?? []).filter((symbolEntry) => {
    if (packFilter !== '' && symbolEntry.pack !== packFilter) {
      return false
    }
    return searchWords.every((searchWord) => symbolEntry.searchText.includes(searchWord))
  })
  const shownSymbolEntries = matchingSymbolEntries.slice(0, SHOWN_SYMBOLS_LIMIT)
  const matchCountText = matchingSymbolEntries.length + ' Treffer'
  let limitText = ''
  if (matchingSymbolEntries.length > SHOWN_SYMBOLS_LIMIT) {
    limitText = ', die ersten ' + SHOWN_SYMBOLS_LIMIT + ' stehen hier'
  }

  return (
    <Modal show onHide={onClose} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Symbol wählen</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-wrap gap-2 mb-3">
          <Form.Control
            type="search"
            placeholder="suchen, z. B. crown, skull, camera"
            value={filterText}
            onChange={handleFilterTextChange}
            autoFocus
            className="flex-grow-1 w-auto"
          />
          <Form.Select value={packFilter} onChange={handlePackFilterChange} className="w-auto">
            <option value="">alle Schrift-Pakete</option>
            {fontPackOptions.map((packOption) => (
              <option key={packOption.pack} value={packOption.pack}>
                {packOption.label}
              </option>
            ))}
          </Form.Select>
        </div>
        {symbolEntries === null && <Spinner animation="border" />}
        {symbolEntries !== null && (
          <>
            <div className="small mb-2">
              {matchCountText}
              {limitText}
            </div>
            <SymbolGrid
              symbolEntries={shownSymbolEntries}
              selectedSymbolKey={null}
              markedSymbolKeys={NO_MARKED_SYMBOL_KEYS}
              onTileClick={onPick}
            />
          </>
        )}
      </Modal.Body>
    </Modal>
  )
}
