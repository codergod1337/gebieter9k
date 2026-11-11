package de.gebiter.symbol.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Ein Symbol, das im Icon-Manager gelöscht wurde: Es gefällt nicht und taucht nirgends mehr zur Auswahl auf. Die
 * Icon-Pakete selbst lassen sich nicht ausdünnen, deshalb merkt sich diese Tabelle, was ausgeblendet ist. Wieder
 * einblenden heißt, die Zeile zu löschen. Ein Symbol ist Paket plus Name, z. B. {@code gameicons} und
 * {@code 3d-glasses}.
 * <p>
 * Doku: {@code docu/entities/DiscardedSymbol.md}.
 */
@Entity
@Table(name = "discarded_symbol", uniqueConstraints = @UniqueConstraint(name = "uq_discarded_symbol",
		columnNames = { "symbol_pack", "symbol_name" }))
public class DiscardedSymbol {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Das Icon-Paket, z. B. {@code bootstrap}, {@code tabler}, {@code lucide}, {@code gameicons}, {@code pixelart}. */
	@Column(nullable = false, updatable = false, length = 120)
	private String symbolPack;

	/** Der Name im Paket, z. B. {@code 3d-glasses}. */
	@Column(nullable = false, updatable = false, length = 120)
	private String symbolName;

	/** Für JPA und für Jackson. */
	protected DiscardedSymbol() {
	}

	public DiscardedSymbol(String symbolPack, String symbolName) {
		this.symbolPack = symbolPack;
		this.symbolName = symbolName;
	}

	public Long getId() {
		return id;
	}

	public String getSymbolPack() {
		return symbolPack;
	}

	public String getSymbolName() {
		return symbolName;
	}
}
