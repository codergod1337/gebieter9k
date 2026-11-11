package de.gebiter.users.model;

import java.util.UUID;

import de.gebiter.status.model.Visibility;
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
 * Eine Kontaktangabe eines Users, z. B. seine Stadt oder sein Instagram-Konto, mit eigener Sichtbarkeit (Nutzer
 * 2026-11-09): Je Feld wählt der User frei „Nur ich“, „Ich und meine Freunde“, „Alle User“ oder „Alle“. Je User und Art
 * höchstens ein Eintrag; eine leere Angabe gibt es nicht, sie wird gelöscht. Lose gekoppelt über die GUID.
 * <p>
 * Über allem steht die Sichtbarkeit des Profils: Wer das Profil nicht sehen darf, sieht auch keinen Kontakt.
 * <p>
 * Doku: {@code docu/entities/UsersContact.md}.
 */
@Entity
@Table(name = "users_contact", uniqueConstraints = @UniqueConstraint(name = "uq_users_contact",
		columnNames = { "users_guid", "contact_type" }))
public class UsersContact {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** GUID des Users, dem die Angabe gehört. */
	@Column(nullable = false, updatable = false)
	private UUID usersGuid;

	/** Welche Angabe, z. B. Mobil, Anschrift oder ein Social-Media-Konto. */
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, updatable = false, length = 30)
	private UsersContactType contactType;

	/** Die Angabe ohne Leerzeichen außen, höchstens {@code gebiter.users-contact.value-max-length} Zeichen. */
	@Column(nullable = false, length = 500)
	private String contactValue;

	/** Wer die Angabe sieht: Nur ich, Ich und meine Freunde, Alle User oder Alle. */
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private Visibility visibility;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected UsersContact() {
	}

	public UsersContact(UUID usersGuid, UsersContactType contactType) {
		this.usersGuid = usersGuid;
		this.contactType = contactType;
	}

	public Long getId() {
		return id;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public UsersContactType getContactType() {
		return contactType;
	}

	public String getContactValue() {
		return contactValue;
	}

	public void setContactValue(String contactValue) {
		this.contactValue = contactValue;
	}

	public Visibility getVisibility() {
		return visibility;
	}

	public void setVisibility(Visibility visibility) {
		this.visibility = visibility;
	}
}
