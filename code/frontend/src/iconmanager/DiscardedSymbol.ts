/**
 * Ein gelöschtes (ausgeblendetes) Symbol, so wie das Backend es liefert (`DiscardedSymbol`).
 * Doku: `docu/entities/DiscardedSymbol.md`
 */
export type DiscardedSymbol = {
  id: number
  symbolPack: string
  symbolName: string
}

/** Ein Symbol als Paket plus Name, für Löschen und Wiederherstellen (`SymbolReference` im Backend). */
export type SymbolReference = {
  symbolPack: string
  symbolName: string
}
