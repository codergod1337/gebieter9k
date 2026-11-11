package de.gebiter.file.model;

import de.gebiter.util.Helper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Welche {@link FileClass} an welchem Ziel ({@link FileClassDestination}) angeboten wird, z. B. „Urlaub“ beim Hochladen
 * in eine Galerie. Je Paar höchstens ein Eintrag, lose gekoppelt über den Key. Eine Zelle der Matrix „FileClass × Ziel“.
 * <p>
 * Doku: {@code docu/entities/FileClassDestinationAssignment.md}.
 */
@Entity
@Table(name = "file_class_destination_assignment", uniqueConstraints = @UniqueConstraint(
		name = "uq_file_class_destination_assignment", columnNames = { "file_class_key", "destination" }))
public class FileClassDestinationAssignment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Key der FileClass. */
	@Column(nullable = false, updatable = false, length = 100)
	private String fileClassKey;

	/** Das Ziel, an dem die FileClass angeboten wird, z. B. die Galerie. */
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, updatable = false, length = 30)
	private FileClassDestination destination;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected FileClassDestinationAssignment() {
	}

	public FileClassDestinationAssignment(String fileClassKey, FileClassDestination destination) {
		this.fileClassKey = Helper.requireValidKey(fileClassKey);
		this.destination = destination;
	}

	public Long getId() {
		return id;
	}

	public String getFileClassKey() {
		return fileClassKey;
	}

	public FileClassDestination getDestination() {
		return destination;
	}
}
