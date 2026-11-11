package de.gebiter.file.model;

import de.gebiter.util.Helper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Welche {@link FileExtension} eine {@link FileClass} annimmt: Eine Datei lässt sich nur hochladen, wenn ihre Endung für die
 * gewählte FileClass freigeschaltet ist. Je Paar höchstens ein Eintrag, lose gekoppelt über die Keys. Eine Zelle der Matrix
 * „FileClass × Endung“.
 * <p>
 * Doku: {@code docu/entities/FileClassFileExtension.md}.
 */
@Entity
@Table(name = "file_class_file_extension", uniqueConstraints = @UniqueConstraint(
		name = "uq_file_class_file_extension", columnNames = { "file_class_key", "file_extension" }))
public class FileClassFileExtension {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Key der FileClass. */
	@Column(nullable = false, updatable = false, length = 100)
	private String fileClassKey;

	/** Die Endung, die die FileClass annimmt (Key der FileExtension). */
	@Column(nullable = false, updatable = false, length = 20)
	private String fileExtension;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected FileClassFileExtension() {
	}

	public FileClassFileExtension(String fileClassKey, String fileExtension) {
		this.fileClassKey = Helper.requireValidKey(fileClassKey);
		this.fileExtension = Helper.requireValidFileExtension(fileExtension);
	}

	public Long getId() {
		return id;
	}

	public String getFileClassKey() {
		return fileClassKey;
	}

	public String getFileExtension() {
		return fileExtension;
	}
}
