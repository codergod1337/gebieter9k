package de.gebiter.symbol.dto;

import java.util.List;

/**
 * Body für das Löschen und Wiedereinblenden vieler markierter Symbole auf einmal.
 *
 * @param symbols die markierten Symbole
 */
public record SymbolReferenceBatch(List<SymbolReference> symbols) {
}
