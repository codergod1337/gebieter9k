package de.gebiter.users.model;

import java.util.UUID;

import org.hibernate.annotations.ColumnDefault;

import de.gebiter.access.model.AccessRoleCollection;
import de.gebiter.status.model.UsersStatus;
import de.gebiter.status.model.Visibility;
import de.gebiter.util.Helper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Ein Benutzer.
 * <p>
 * Der Name steht im Plural, weil {@code user} in PostgreSQL ein reserviertes Wort ist.
 * <p>
 * Doku: {@code docu/entities/Users.md}.
 */
@Entity
@Table(name = "users")
public class Users {

	/** Wird im Konstruktor gesetzt: zufällig (normaler User) oder vorgegeben (Admin). */
	@Id
	@Column(nullable = false, updatable = false)
	private UUID guid;

	/** Der Name des Users, eindeutig; so steht er im Profil und an seinen Beiträgen. */
	@Column(nullable = false, unique = true, length = 50)
	private String username;

	/** Die E-Mail-Adresse, eindeutig; mit ihr meldet er sich an. */
	@Column(nullable = false, unique = true, length = 255)
	private String email;

	/** Wer mich überhaupt sehen darf. Alle anderen sehen mich nur als „anonym“. */
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private Visibility profileVisibility = Visibility.NONE;

	/** Wer meine Freundesliste sehen darf – eine Einstellung für alle Freunde gemeinsam. */
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private Visibility friendListVisibility = Visibility.NONE;

	/**
	 * Die Position: die eine zugewiesene {@link AccessRoleCollection}, höchstens eine, {@code null} heißt keine. Sie
	 * verleiht Rechte; dazu kann ein User Rechte direkt zugewiesen haben, die bei einem Wechsel der Position bleiben. Mit
	 * welcher er startet, setzt der {@code UsersService} beim Anlegen aus {@code gebiter.accessrolecollection.default-key}.
	 * Kein Rang: Der Rang ist nur Anzeige und steht für sich.
	 */
	@Column(length = 100)
	private String accessRoleCollectionKey;

	/**
	 * Jeder neue User startet als {@link UsersStatus#ACTIVE}. Auf {@link UsersStatus#DELETED} setzt ihn
	 * nur {@code UsersService.deleteUsers}, ein {@code PUT} ändert den Status nie.
	 */
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private UsersStatus status = UsersStatus.ACTIVE;

	/**
	 * Der Punktestand: Punkte gibt es für Aktionen, die wir für wertvoll halten, z. B. hochladen, Daumen bekommen oder
	 * geben, Gästebucheinträge schreiben oder bekommen. Damit schaltet man sich später mehr frei. Setzt nur das Backend,
	 * nie ein Request Body; ein {@code PUT} ändert ihn nie. Neue User starten bei 0, der Default in der Datenbank füllt
	 * auch die Zeilen, die es schon gibt.
	 */
	@Column(nullable = false)
	@ColumnDefault("0")
	private long points;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected Users() {
	}

	/** Normaler User: bekommt eine neue GUID Version 7. */
	public Users(String username, String email) {
		UUID generatedGuid = Helper.createUuidVersion7();
		this(generatedGuid, username, email);
	}

	/**
	 * ADMIN-ONLY: User mit vorgegebener GUID, z. B. für eine „sprechende“ GUID.
	 * <p>
	 * Aufgerufen wird er nur von {@code UsersService.createUsers(usersGuid, username, email)}. Diese
	 * Methode trägt {@code @PreAuthorize("hasRole('ADMIN')")}. Hier am Konstruktor wirkt die
	 * Annotation nicht, sie greift nur bei Methoden von Spring-Beans.
	 * <p>
	 * ACHTUNG beim Speichern: Gibt es die GUID schon, würde {@code save()} den bestehenden User
	 * still überschreiben. Deshalb prüft die Service-Methode vorher, ob die GUID bereits vergeben ist.
	 */
	public Users(UUID guid, String username, String email) {
		this.guid = guid;
		this.username = username;
		this.email = email;
	}

	public UUID getGuid() {
		return guid;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public Visibility getProfileVisibility() {
		return profileVisibility;
	}

	public void setProfileVisibility(Visibility profileVisibility) {
		this.profileVisibility = profileVisibility;
	}

	public Visibility getFriendListVisibility() {
		return friendListVisibility;
	}

	public void setFriendListVisibility(Visibility friendListVisibility) {
		this.friendListVisibility = friendListVisibility;
	}

	public String getAccessRoleCollectionKey() {
		return accessRoleCollectionKey;
	}

	/** {@code null} nimmt die Position weg; sonst muss der Key der Key-Regel entsprechen. */
	public void setAccessRoleCollectionKey(String accessRoleCollectionKey) {
		if (accessRoleCollectionKey == null) {
			this.accessRoleCollectionKey = null;
			return;
		}
		this.accessRoleCollectionKey = Helper.requireValidKey(accessRoleCollectionKey);
	}

	public UsersStatus getStatus() {
		return status;
	}

	public long getPoints() {
		return points;
	}

	public void setStatus(UsersStatus status) {
		this.status = status;
	}
}
