package de.gebiter.symbol.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.symbol.dto.SymbolReference;
import de.gebiter.symbol.dto.SymbolReferenceBatch;
import de.gebiter.symbol.model.DiscardedSymbol;
import de.gebiter.symbol.service.DiscardedSymbolService;

/**
 * Admin-Endpunkte der Klasse {@link DiscardedSymbol} für den Icon-Manager, nur mit der AR ADMIN (Pfad
 * {@code /api/admin/**}). Er nutzt nur den {@link DiscardedSymbolService}, nie ein Repository.
 * <p>
 * Doku: {@code docu/entities/DiscardedSymbol.md}.
 */
@RestController
@RequestMapping("/api/admin/discarded-symbol")
public class DiscardedSymbolAdminController {

	private final DiscardedSymbolService discardedSymbolService;

	public DiscardedSymbolAdminController(DiscardedSymbolService discardedSymbolService) {
		this.discardedSymbolService = discardedSymbolService;
	}

	/**
	 * CREATE: Löscht die markierten Symbole. Body:
	 * {@code {"symbols": [{"symbolPack": "gameicons", "symbolName": "3d-glasses"}]}}. Antwort: die neu gelöschten.
	 */
	@PostMapping
	public ResponseEntity<List<DiscardedSymbol>> createDiscardedSymbols(@RequestBody SymbolReferenceBatch symbolBatch) {
		List<SymbolReference> symbolReferences = symbolBatch.symbols();
		List<DiscardedSymbol> createdDiscardedSymbols = discardedSymbolService.createDiscardedSymbols(symbolReferences);
		return ResponseEntity.status(HttpStatus.CREATED).body(createdDiscardedSymbols);
	}

	/** READ: Alle gelöschten Symbole. */
	@GetMapping
	public ResponseEntity<List<DiscardedSymbol>> getAllDiscardedSymbol() {
		List<DiscardedSymbol> allDiscardedSymbol = discardedSymbolService.getAllDiscardedSymbol();
		return ResponseEntity.ok(allDiscardedSymbol);
	}

	/** DELETE: Blendet die markierten Symbole wieder ein. Body wie beim Löschen. */
	@DeleteMapping
	public ResponseEntity<Void> deleteDiscardedSymbols(@RequestBody SymbolReferenceBatch symbolBatch) {
		List<SymbolReference> symbolReferences = symbolBatch.symbols();
		discardedSymbolService.deleteDiscardedSymbols(symbolReferences);
		return ResponseEntity.noContent().build();
	}
}
