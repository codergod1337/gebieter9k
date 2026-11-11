package de.gebiter.symbol.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.symbol.dto.SymbolReference;
import de.gebiter.symbol.model.DiscardedSymbol;
import de.gebiter.symbol.repository.DiscardedSymbolRepository;
import de.gebiter.util.Helper;

/**
 * Service der Klasse {@link DiscardedSymbol}: welche Symbole im Icon-Manager gelöscht, also ausgeblendet sind. Er nutzt
 * nur sein eigenes {@link DiscardedSymbolRepository}. Löschen und Wiedereinblenden darf nur der Admin.
 */
@Service
public class DiscardedSymbolService {

	private final DiscardedSymbolRepository discardedSymbolRepository;

	public DiscardedSymbolService(DiscardedSymbolRepository discardedSymbolRepository) {
		this.discardedSymbolRepository = discardedSymbolRepository;
	}

	/**
	 * CREATE: Löscht die markierten Symbole, also blendet sie aus. Schon gelöschte werden übersprungen. Erst werden alle
	 * geprüft, dann geschrieben: Ist eins ungültig, wird keins gelöscht.
	 *
	 * @return die neu gelöschten
	 * @throws IllegalArgumentException wenn die Liste fehlt oder ein Paket oder Name die Symbol-Regel verletzt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public List<DiscardedSymbol> createDiscardedSymbols(List<SymbolReference> symbolReferences) {
		Helper.requireNotNull(symbolReferences, "symbols");
		requireValidSymbolReferences(symbolReferences);
		List<DiscardedSymbol> createdDiscardedSymbols = new ArrayList<>();
		for (SymbolReference symbolReference : symbolReferences) {
			String symbolPack = symbolReference.symbolPack();
			String symbolName = symbolReference.symbolName();
			boolean alreadyDiscarded = discardedSymbolRepository.existsBySymbolPackAndSymbolName(symbolPack, symbolName);
			if (alreadyDiscarded) {
				continue;
			}
			DiscardedSymbol newDiscardedSymbol = new DiscardedSymbol(symbolPack, symbolName);
			DiscardedSymbol savedDiscardedSymbol = discardedSymbolRepository.save(newDiscardedSymbol);
			createdDiscardedSymbols.add(savedDiscardedSymbol);
		}
		return createdDiscardedSymbols;
	}

	/** READ: Alle gelöschten Symbole, nach Paket und Name. */
	@Transactional(readOnly = true)
	public List<DiscardedSymbol> getAllDiscardedSymbol() {
		Sort sortByPackAndName = Sort.by("symbolPack", "symbolName");
		return discardedSymbolRepository.findAll(sortByPackAndName);
	}

	/**
	 * DELETE: Blendet die markierten Symbole wieder ein. Nicht gelöschte werden übersprungen.
	 *
	 * @throws IllegalArgumentException wenn die Liste fehlt oder ein Paket oder Name die Symbol-Regel verletzt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteDiscardedSymbols(List<SymbolReference> symbolReferences) {
		Helper.requireNotNull(symbolReferences, "symbols");
		requireValidSymbolReferences(symbolReferences);
		for (SymbolReference symbolReference : symbolReferences) {
			String symbolPack = symbolReference.symbolPack();
			String symbolName = symbolReference.symbolName();
			discardedSymbolRepository.deleteBySymbolPackAndSymbolName(symbolPack, symbolName);
		}
	}

	private void requireValidSymbolReferences(List<SymbolReference> symbolReferences) {
		for (SymbolReference symbolReference : symbolReferences) {
			Helper.requireNotNull(symbolReference, "symbols[]");
			String symbolPack = symbolReference.symbolPack();
			Helper.requireValidSymbolPart(symbolPack, "symbolPack");
			String symbolName = symbolReference.symbolName();
			Helper.requireValidSymbolPart(symbolName, "symbolName");
		}
	}
}
