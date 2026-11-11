import type { ChangeEvent } from 'react'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import { SYMBOL_PACK_OPTIONS, type SymbolPack } from '../symbol/symbolCatalog.ts'

/** Was der Icon-Manager zeigt: alle aktiven, ein Paket oder nur die gelöschten. */
export type SymbolView = SymbolPack | 'ALL' | 'DISCARDED'

/** Die Ansicht aus der Adresse; fehlt sie oder ist sie unbekannt, gelten alle Pakete. */
export function parseSymbolView(symbolViewText: string | null): SymbolView {
  if (symbolViewText === 'DISCARDED') {
    return 'DISCARDED'
  }
  for (const packOption of SYMBOL_PACK_OPTIONS) {
    if (packOption.pack === symbolViewText) {
      return packOption.pack
    }
  }
  return 'ALL'
}

type SymbolFilterBarProps = {
  searchText: string
  view: SymbolView
  onSearchTextChange: (changedSearchText: string) => void
  onViewChange: (changedView: SymbolView) => void
}

/** Filter nach Name und Stichwörtern, dazu die Ansicht (Paket oder Gelöschte). */
export function SymbolFilterBar({ searchText, view, onSearchTextChange, onViewChange }: SymbolFilterBarProps) {
  function handleSearchTextChange(event: ChangeEvent<HTMLInputElement>) {
    onSearchTextChange(event.target.value)
  }

  function handleViewChange(event: ChangeEvent<HTMLSelectElement>) {
    const selectedView = event.target.value as SymbolView
    onViewChange(selectedView)
  }

  return (
    <Row className="g-3 mb-3">
      <Col md={8}>
        <Form.Group controlId="symbolSearchText">
          <Form.Label>Filter</Form.Label>
          <Form.Control value={searchText} onChange={handleSearchTextChange} placeholder="z. B. skull, dragon, heart …" />
          <Form.Text>Name und Stichwörter (englisch); mehrere Wörter müssen alle passen.</Form.Text>
        </Form.Group>
      </Col>
      <Col md={4}>
        <Form.Group controlId="symbolView">
          <Form.Label>Ansicht</Form.Label>
          <Form.Select value={view} onChange={handleViewChange}>
            <option value="ALL">Alle Pakete</option>
            {SYMBOL_PACK_OPTIONS.map((packOption) => (
              <option key={packOption.pack} value={packOption.pack}>
                {packOption.label}
              </option>
            ))}
            <option value="DISCARDED">Gelöschte (zum Wiederherstellen)</option>
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>
  )
}
