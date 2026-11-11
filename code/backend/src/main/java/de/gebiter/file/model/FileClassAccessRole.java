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
 * Welche {@link de.gebiter.access.model.AccessRole} an den Dateien einer {@link FileClass} was darf, als drei eigene
 * Schalter (Nutzer 2026-11-11: lesen, editieren und hochladen als Felder): {@code readGranted}, {@code editGranted} und
 * {@code uploadGranted}. So hängt an der FileClass, ob z. B. jeder User hochladen darf. Bis 2026-11-11 gab es nur die
 * eine Stufe Lesen oder Schreiben. Je FileClass hat jedes Recht höchstens einen Eintrag, und nur, wenn mindestens ein
 * Schalter an ist. Lose gekoppelt über die Keys, ohne JPA-Beziehung. Eine Zelle der Matrix „FileClass × AR“.
 * <p>
 * Doku: {@code docu/entities/FileClassAccessRole.md}.
 */
@Entity
@Table(name = "file_class_access_role", uniqueConstraints = @UniqueConstraint(
		name = "uq_file_class_access_role", columnNames = { "file_class_key", "access_role_key" }))
public class FileClassAccessRole {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Key der FileClass. */
	@Column(nullable = false, updatable = false, length = 100)
	private String fileClassKey;

	/** Key des Rechts (AccessRole), das an der FileClass etwas darf. */
	@Column(nullable = false, updatable = false, length = 100)
	private String accessRoleKey;

	/**
	 * Lesen: suchen, auflösen, ansehen, herunterladen. Bearbeiten und Hochladen schließen Lesen ein (das stellt der
	 * Service sicher): Diese Rechte stehen in den Dokumenten in {@code readerAccessRoleKeys}, so prüft jede Leseabfrage nur
	 * diese eine Liste.
	 */
	@Column(nullable = false)
	private boolean readGranted;

	/**
	 * Bearbeiten: die Metadaten von Dateien dieser FileClass ändern. Wird noch NICHT ausgewertet (Nutzer 2026-11-11: erst
	 * hochladen und kaufen, dann festlegen, wer wo standardmäßig bearbeitet): Bis dahin bearbeitet wie bisher der Autor
	 * seine eigene Datei, wer von ihm freigegeben ist, FILE_MANAGER und ADMIN.
	 */
	@Column(nullable = false)
	private boolean editGranted;

	/** Hochladen: Dateien dieser FileClass hochladen, über einen Upload-Weg, an dem sie angeboten wird. */
	@Column(nullable = false)
	private boolean uploadGranted;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected FileClassAccessRole() {
	}

	public FileClassAccessRole(String fileClassKey, String accessRoleKey, boolean readGranted, boolean editGranted,
			boolean uploadGranted) {
		this.fileClassKey = Helper.requireValidKey(fileClassKey);
		this.accessRoleKey = Helper.requireValidKey(accessRoleKey);
		this.readGranted = readGranted;
		this.editGranted = editGranted;
		this.uploadGranted = uploadGranted;
	}

	public Long getId() {
		return id;
	}

	public String getFileClassKey() {
		return fileClassKey;
	}

	public String getAccessRoleKey() {
		return accessRoleKey;
	}

	public boolean isReadGranted() {
		return readGranted;
	}

	public void setReadGranted(boolean readGranted) {
		this.readGranted = readGranted;
	}

	public boolean isEditGranted() {
		return editGranted;
	}

	public void setEditGranted(boolean editGranted) {
		this.editGranted = editGranted;
	}

	public boolean isUploadGranted() {
		return uploadGranted;
	}

	public void setUploadGranted(boolean uploadGranted) {
		this.uploadGranted = uploadGranted;
	}
}
