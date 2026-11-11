package de.gebiter.symbol.dto;

/**
 * Ein Symbol als Paket plus Name, z. B. {@code {"symbolPack": "gameicons", "symbolName": "3d-glasses"}}.
 *
 * @param symbolPack das Icon-Paket
 * @param symbolName der Name im Paket
 */
public record SymbolReference(String symbolPack, String symbolName) {
}
