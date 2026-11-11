package de.gebiter.symbol.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import de.gebiter.symbol.model.DiscardedSymbol;

/**
 * Datenzugriff auf {@link DiscardedSymbol}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.symbol.service.DiscardedSymbolService}.
 */
public interface DiscardedSymbolRepository extends JpaRepository<DiscardedSymbol, Long> {

	boolean existsBySymbolPackAndSymbolName(String symbolPack, String symbolName);

	/** Blendet ein Symbol wieder ein. Liefert, wie viele Zeilen weg sind (0 oder 1). */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from DiscardedSymbol discardedSymbol where discardedSymbol.symbolPack = :symbolPack"
			+ " and discardedSymbol.symbolName = :symbolName")
	int deleteBySymbolPackAndSymbolName(@Param("symbolPack") String symbolPack,
			@Param("symbolName") String symbolName);
}
