package de.gebiter.users.model;

import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Erweiterte Profildaten eines Users – das, was andere sehen, wenn sie auf sein Profil kommen: Profilbild, Status-Text,
 * Banner-Drift, Avatar-Farben und Zähler. Alles freiwillig. Wer das Profil überhaupt sehen darf, regelt allein
 * {@link Users#getProfileVisibility()}; ohne diese Freigabe wird UsersDetail gar nicht geladen. Kontaktangaben mit eigener
 * Sichtbarkeit je Feld stehen in {@link UsersContact}.
 * <p>
 * 1:1 zu {@link Users}: {@code usersGuid} ist der Primärschlüssel und enthält die GUID des
 * zugehörigen Users. Lose gekoppelt, ohne JPA-Beziehung.
 * <p>
 * Doku: {@code docu/entities/UsersDetail.md}.
 */
@Entity
@Table(name = "users_detail")
public class UsersDetail {

	/** GUID des Users, zugleich Primärschlüssel (1:1 zu Users). */
	@Id
	@Column(nullable = false, updatable = false)
	private UUID usersGuid;

	/*
	 * --- Zähler ---
	 * Ohne Setter: Hochgezählt wird später per atomarem UPDATE im Repository, damit gleichzeitige
	 * Aktionen sich nicht gegenseitig überschreiben.
	 */

	/** Anzahl der Uploads dieses Users. */
	@Column(nullable = false)
	private Long uploadCount = 0L;

	/** Anzahl der Downloads dieses Users. */
	@Column(nullable = false)
	private Long downloadCount = 0L;

	/** Anzahl der Gästebucheinträge, die dieser User bei anderen geschrieben hat. */
	@Column(nullable = false)
	private Long writtenGuestbookEntryCount = 0L;

	/**
	 * Das Profilbild groß fürs Profil: ein PNG von {@code gebiter.profile-image.size-pixels} im Quadrat (600 × 600) als
	 * Base64 ohne Präfix, nach der Regel der Dateivorschau: Bild ganz eingepasst, Seitenverhältnis bleibt, mittig, Rest
	 * transparent. Im Browser zugeschnitten und gerechnet, vom {@code Base64PngService} geprüft. Nur hier, nie als Datei im
	 * Kern FILE. {@code null} heißt: Das Profil zeigt die Initialen. Setzt nur der User selbst, immer zusammen mit
	 * {@link #profileImageSmallBase64Png}.
	 */
	@Column(columnDefinition = "text")
	private String profileImageBase64Png;

	/**
	 * Dasselbe Profilbild klein ({@code gebiter.profile-image.small-size-pixels}, 96 × 96), als Abklatsch für Avatare im
	 * Gästebuch, in Listen und später im Chat: So trägt eine Seite mit vielen Autoren nicht viele große Bilder.
	 */
	@Column(columnDefinition = "text")
	private String profileImageSmallBase64Png;

	/**
	 * Der Status-Text im Profilkopf, z. B. was man gerade macht (Nutzer 2026-11-09). Höchstens
	 * {@code gebiter.profile-status-text.max-length} Zeichen, {@code null} ohne Status. Setzt nur der User selbst.
	 */
	@Column(length = 500)
	private String statusText;

	/**
	 * Der freie Text der Box „Über mich“ im Profil (Nutzer 2026-11-09) als mehrsprachiger Rich-Text: je Sprachkürzel das
	 * HTML aus dem Rich-Text-Editor, beim Speichern bereinigt (nur {@code gebiter.rich-text.allowed-tags}, keine
	 * Attribute), z. B. {@code {"de": "<p>Hallo</p>"}}. Höchstens {@code gebiter.profile-about-text.max-length} Zeichen
	 * sichtbaren Texts je Sprache, {@code null} ohne Text. Sieht, wer das Profil sehen darf; setzt nur der User selbst.
	 */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private Map<String, String> aboutText;

	/**
	 * Wie schnell das Standard-Banner dieses Profils driftet, in Prozent des Tempos aus dem Theme: 0 steht still,
	 * {@code null} gilt als 100, höchstens {@code gebiter.profile-banner-drift.max-percent}. Gehört zum Profil und ist
	 * deshalb für jeden sichtbar, der das Profil sehen darf (Nutzer 2026-11-09). Setzt nur der User selbst.
	 */
	private Integer bannerDriftSpeedPercent;

	/**
	 * Die Farben des Avatars ohne Profilbild, also der Initialen (Nutzer 2026-11-09): Schrift und Hintergrund als
	 * {@code #rrggbb}. {@code null} heißt Standard: weiße Schrift, Hintergrund als Verlauf aus der GUID. Gehören zum
	 * Profil und sind deshalb für jeden sichtbar, der das Profil sehen darf. Setzt nur der User selbst.
	 */
	@Column(length = 7)
	private String avatarTextColor;

	/** Die Hintergrundfarbe des Avatars ohne Profilbild als {@code #rrggbb}; {@code null}: Verlauf aus der GUID. */
	@Column(length = 7)
	private String avatarBackgroundColor;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected UsersDetail() {
	}

	public UsersDetail(UUID usersGuid) {
		this.usersGuid = usersGuid;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public Long getUploadCount() {
		return uploadCount;
	}

	public Long getDownloadCount() {
		return downloadCount;
	}

	public Long getWrittenGuestbookEntryCount() {
		return writtenGuestbookEntryCount;
	}

	public String getProfileImageBase64Png() {
		return profileImageBase64Png;
	}

	public void setProfileImageBase64Png(String profileImageBase64Png) {
		this.profileImageBase64Png = profileImageBase64Png;
	}

	public String getProfileImageSmallBase64Png() {
		return profileImageSmallBase64Png;
	}

	public void setProfileImageSmallBase64Png(String profileImageSmallBase64Png) {
		this.profileImageSmallBase64Png = profileImageSmallBase64Png;
	}

	public String getStatusText() {
		return statusText;
	}

	public void setStatusText(String statusText) {
		this.statusText = statusText;
	}

	public Map<String, String> getAboutText() {
		return aboutText;
	}

	public void setAboutText(Map<String, String> aboutText) {
		this.aboutText = aboutText;
	}

	public Integer getBannerDriftSpeedPercent() {
		return bannerDriftSpeedPercent;
	}

	public void setBannerDriftSpeedPercent(Integer bannerDriftSpeedPercent) {
		this.bannerDriftSpeedPercent = bannerDriftSpeedPercent;
	}

	public String getAvatarTextColor() {
		return avatarTextColor;
	}

	public void setAvatarTextColor(String avatarTextColor) {
		this.avatarTextColor = avatarTextColor;
	}

	public String getAvatarBackgroundColor() {
		return avatarBackgroundColor;
	}

	public void setAvatarBackgroundColor(String avatarBackgroundColor) {
		this.avatarBackgroundColor = avatarBackgroundColor;
	}
}
