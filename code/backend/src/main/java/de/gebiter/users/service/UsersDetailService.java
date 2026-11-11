package de.gebiter.users.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.unit.DataSize;

import de.gebiter.image.service.Base64PngService;
import de.gebiter.richtext.service.RichTextService;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.users.model.UsersDetail;
import de.gebiter.users.repository.UsersDetailRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link UsersDetail}. Er nutzt nur sein eigenes {@link UsersDetailRepository}.
 * <p>
 * Zu jedem User gibt es immer genau einen Eintrag. Er entsteht leer bei der Anlage des Users über den
 * {@link UsersService} und wird danach nur gelesen und geändert. Wird der User gelöscht, bleibt der
 * Eintrag stehen.
 * <p>
 * RECHTE: Der Pfad ({@code SecurityConfig}) lässt Lesen über {@code /api/…} (AR USER oder ADMIN) und Schreiben fremder
 * Einträge nur über {@code /api/admin/…} (AR ADMIN) zu. Dazu prüfen die {@code @PreAuthorize} an den Methoden selbst
 * ({@code @EnableMethodSecurity} ist seit 2026-11-09 aktiv).
 */
@Service
public class UsersDetailService {

	private final UsersDetailRepository usersDetailRepository;

	private final Base64PngService base64PngService;

	private final CurrentUsersProvider currentUsersProvider;

	/** Kante des quadratischen Profilbilds in Pixeln ({@code gebiter.profile-image.size-pixels}). */
	private final int profileImageSizePixels;

	/** Höchstgröße des Profilbilds als PNG ({@code gebiter.profile-image.max-size}). */
	private final DataSize profileImageMaxSize;

	/** Kante des kleinen Profilbilds in Pixeln ({@code gebiter.profile-image.small-size-pixels}). */
	private final int profileImageSmallSizePixels;

	/** Höchstgröße des kleinen Profilbilds als PNG ({@code gebiter.profile-image.small-max-size}). */
	private final DataSize profileImageSmallMaxSize;

	/** Höchstlänge des Status-Texts in Zeichen ({@code gebiter.profile-status-text.max-length}). */
	private final int profileStatusTextMaxLength;

	/** Höchstlänge des Texts „Über mich“ in Zeichen sichtbaren Texts ({@code gebiter.profile-about-text.max-length}). */
	private final int profileAboutTextMaxLength;

	private final RichTextService richTextService;

	/** Das schnellste Tempo der Banner-Drift in Prozent ({@code gebiter.profile-banner-drift.max-percent}). */
	private final int profileBannerDriftMaxPercent;

	public UsersDetailService(UsersDetailRepository usersDetailRepository, Base64PngService base64PngService,
			CurrentUsersProvider currentUsersProvider, RichTextService richTextService,
			@Value("${gebiter.profile-image.size-pixels}") int profileImageSizePixels,
			@Value("${gebiter.profile-image.max-size}") DataSize profileImageMaxSize,
			@Value("${gebiter.profile-image.small-size-pixels}") int profileImageSmallSizePixels,
			@Value("${gebiter.profile-image.small-max-size}") DataSize profileImageSmallMaxSize,
			@Value("${gebiter.profile-status-text.max-length}") int profileStatusTextMaxLength,
			@Value("${gebiter.profile-about-text.max-length}") int profileAboutTextMaxLength,
			@Value("${gebiter.profile-banner-drift.max-percent}") int profileBannerDriftMaxPercent) {
		this.usersDetailRepository = usersDetailRepository;
		this.base64PngService = base64PngService;
		this.currentUsersProvider = currentUsersProvider;
		this.profileImageSizePixels = profileImageSizePixels;
		this.profileImageMaxSize = profileImageMaxSize;
		this.profileImageSmallSizePixels = profileImageSmallSizePixels;
		this.profileImageSmallMaxSize = profileImageSmallMaxSize;
		this.profileStatusTextMaxLength = profileStatusTextMaxLength;
		this.profileAboutTextMaxLength = profileAboutTextMaxLength;
		this.richTextService = richTextService;
		this.profileBannerDriftMaxPercent = profileBannerDriftMaxPercent;
	}

	/**
	 * CREATE: Legt den leeren Eintrag für einen neuen User an: nur die GUID, die Zähler auf 0, alles
	 * andere {@code null}. Aufgerufen wird die Methode nur bei der Anlage des Users im
	 * {@link UsersService}.
	 *
	 * @throws DuplicateKeyException wenn es für die GUID schon einen Eintrag gibt
	 */
	@Transactional
	public UsersDetail createUsersDetail(UUID usersGuid) {
		// Ohne diese Prüfung würde save() einen bestehenden Eintrag still mit null überschreiben.
		boolean usersDetailExists = usersDetailRepository.existsById(usersGuid);
		if (usersDetailExists) {
			throw new DuplicateKeyException("Für die GUID " + usersGuid + " gibt es schon einen UsersDetail-Eintrag.");
		}
		return doCreateUsersDetail(usersGuid);
	}

	/**
	 * READ: Der Eintrag des Users mit {@code usersGuid}.
	 *
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@Transactional(readOnly = true)
	public UsersDetail getUsersDetail(UUID usersGuid) {
		return doGetUsersDetail(usersGuid);
	}

	/** READ: Die Einträge aller User. */
	@Transactional(readOnly = true)
	public List<UsersDetail> getAllUsersDetail() {
		return doGetAllUsersDetail();
	}

	/**
	 * UPDATE: Zählt die Uploads des Users um eins hoch. Aufgerufen nur vom Upload, als letzter Schritt, wenn die Datei auf
	 * dem SFTP und ihr Dokument in Solr gespeichert sind; ein gescheiterter Versuch zählt nicht.
	 *
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@Transactional
	public void increaseUsersDetailUploadCount(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		int changedRowCount = usersDetailRepository.increaseUploadCount(usersGuid);
		if (changedRowCount == 0) {
			throw new EntityNotFoundException("Es gibt keinen UsersDetail-Eintrag mit der GUID " + usersGuid + ".");
		}
	}

	/**
	 * UPDATE: Zählt die geschriebenen Gästebucheinträge des Users um eins hoch, atomar in der Datenbank.
	 *
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@Transactional
	public void increaseUsersDetailWrittenGuestbookEntryCount(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		int changedRowCount = usersDetailRepository.increaseWrittenGuestbookEntryCount(usersGuid);
		if (changedRowCount == 0) {
			throw new EntityNotFoundException("Es gibt keinen UsersDetail-Eintrag mit der GUID " + usersGuid + ".");
		}
	}

	/**
	 * DELETE: Löscht den Eintrag des Users mit {@code usersGuid}.
	 * <p>
	 * Derzeit ruft sie niemand auf: Ein gelöschter User bekommt nur den Status {@code DELETED}, sein
	 * Eintrag bleibt stehen. Ob es ein endgültiges Löschen gibt, ist noch offen.
	 */
	@Transactional
	public void deleteUsersDetail(UUID usersGuid) {
		doDeleteUsersDetail(usersGuid);
	}

	/**
	 * UPDATE: Der angemeldete User setzt sein Profilbild, wie in der Vorlage, immer groß und klein zusammen: zwei PNG in
	 * den Profilbildmaßen als Base64, beide geprüft. Beide {@code null} oder leer entfernen es, dann zeigt das Profil
	 * wieder die Initialen. Gibt es noch keinen Details-Eintrag, entsteht er. Alles andere bleibt. Fremde Profilbilder
	 * erreicht er so nie, die GUID kommt aus dem Token.
	 *
	 * @throws IllegalArgumentException wenn nur eins der beiden Bilder kommt, wenn ein Bild kein PNG in seinen Maßen ist
	 *         oder zu groß ist
	 */
	@Transactional
	public UsersDetail changeOwnUsersDetailProfileImage(String profileImageBase64Png, String profileImageSmallBase64Png) {
		boolean profileImageGiven = profileImageBase64Png != null && !profileImageBase64Png.isBlank();
		boolean profileImageSmallGiven = profileImageSmallBase64Png != null && !profileImageSmallBase64Png.isBlank();
		if (profileImageGiven != profileImageSmallGiven) {
			throw new IllegalArgumentException("Das Profilbild kommt immer groß und klein zusammen, oder beide fehlen.");
		}
		String checkedProfileImageBase64Png = null;
		String checkedProfileImageSmallBase64Png = null;
		if (profileImageGiven) {
			long profileImageMaxBytes = profileImageMaxSize.toBytes();
			checkedProfileImageBase64Png = base64PngService.requireValidBase64Png(profileImageBase64Png,
					profileImageSizePixels, profileImageSizePixels, profileImageMaxBytes);
			long profileImageSmallMaxBytes = profileImageSmallMaxSize.toBytes();
			checkedProfileImageSmallBase64Png = base64PngService.requireValidBase64Png(profileImageSmallBase64Png,
					profileImageSmallSizePixels, profileImageSmallSizePixels, profileImageSmallMaxBytes);
		}
		UsersDetail ownUsersDetail = doGetOrCreateOwnUsersDetail();
		ownUsersDetail.setProfileImageBase64Png(checkedProfileImageBase64Png);
		ownUsersDetail.setProfileImageSmallBase64Png(checkedProfileImageSmallBase64Png);
		return usersDetailRepository.save(ownUsersDetail);
	}

	/**
	 * UPDATE: Der angemeldete User setzt seinen Status-Text im Profilkopf, ohne Leerzeichen außen. Leer oder {@code null}
	 * entfernt ihn. Gibt es noch keinen Details-Eintrag, entsteht er. Die GUID kommt aus dem Token.
	 *
	 * @throws IllegalArgumentException wenn der Text länger als {@code gebiter.profile-status-text.max-length} ist
	 */
	@Transactional
	public UsersDetail changeOwnUsersDetailStatusText(String statusText) {
		String checkedStatusText = null;
		boolean statusTextGiven = statusText != null && !statusText.isBlank();
		if (statusTextGiven) {
			String strippedStatusText = statusText.strip();
			if (strippedStatusText.length() > profileStatusTextMaxLength) {
				throw new IllegalArgumentException("Der Status-Text darf höchstens " + profileStatusTextMaxLength
						+ " Zeichen haben.");
			}
			checkedStatusText = strippedStatusText;
		}
		UsersDetail ownUsersDetail = doGetOrCreateOwnUsersDetail();
		ownUsersDetail.setStatusText(checkedStatusText);
		return usersDetailRepository.save(ownUsersDetail);
	}

	/**
	 * UPDATE: Der angemeldete User setzt den Text seiner Box „Über mich“, mehrsprachiger Rich-Text (je Sprache HTML aus
	 * dem Rich-Text-Editor). Er wird bereinigt und gemessen ({@link RichTextService#sanitizeMultilingualRichText}). Ohne
	 * Inhalt oder {@code null} entfernt es den Text. Gibt es noch keinen Details-Eintrag, entsteht er. Die GUID kommt aus
	 * dem Token.
	 *
	 * @throws IllegalArgumentException wenn eine Sprache länger als {@code gebiter.profile-about-text.max-length} Zeichen
	 *         ist oder sonst nicht passt
	 */
	@Transactional
	public UsersDetail changeOwnUsersDetailAboutText(Map<String, String> aboutText) {
		Map<String, String> checkedAboutText = richTextService.sanitizeMultilingualRichText(aboutText, "Über mich",
				profileAboutTextMaxLength);
		UsersDetail ownUsersDetail = doGetOrCreateOwnUsersDetail();
		ownUsersDetail.setAboutText(checkedAboutText);
		return usersDetailRepository.save(ownUsersDetail);
	}

	/**
	 * UPDATE: Der angemeldete User stellt ein, wie schnell das Standard-Banner seines Profils driftet, in Prozent des
	 * Tempos aus dem Theme (0 steht still). Gibt es noch keinen Details-Eintrag, entsteht er. Die GUID kommt aus dem
	 * Token.
	 *
	 * @throws IllegalArgumentException wenn der Wert fehlt oder nicht zwischen 0 und
	 *         {@code gebiter.profile-banner-drift.max-percent} liegt
	 */
	@Transactional
	public UsersDetail changeOwnUsersDetailBannerDriftSpeed(Integer bannerDriftSpeedPercent) {
		Helper.requireNotNull(bannerDriftSpeedPercent, "bannerDriftSpeedPercent");
		boolean outOfRange = bannerDriftSpeedPercent < 0 || bannerDriftSpeedPercent > profileBannerDriftMaxPercent;
		if (outOfRange) {
			throw new IllegalArgumentException("Die Drift des Banners muss zwischen 0 und " + profileBannerDriftMaxPercent
					+ " Prozent liegen.");
		}
		UsersDetail ownUsersDetail = doGetOrCreateOwnUsersDetail();
		ownUsersDetail.setBannerDriftSpeedPercent(bannerDriftSpeedPercent);
		return usersDetailRepository.save(ownUsersDetail);
	}

	/**
	 * UPDATE: Der angemeldete User stellt die Farben seines Avatars ohne Profilbild ein, Schrift und Hintergrund als
	 * {@code #rrggbb}. Leer oder {@code null} setzt die jeweilige Farbe auf den Standard zurück. Gibt es noch keinen
	 * Details-Eintrag, entsteht er. Die GUID kommt aus dem Token.
	 *
	 * @throws IllegalArgumentException wenn eine Farbe nicht die Form {@code #rrggbb} hat
	 */
	@Transactional
	public UsersDetail changeOwnUsersDetailAvatarColors(String avatarTextColor, String avatarBackgroundColor) {
		String checkedTextColor = doCheckOptionalHexColor(avatarTextColor, "avatarTextColor");
		String checkedBackgroundColor = doCheckOptionalHexColor(avatarBackgroundColor, "avatarBackgroundColor");
		UsersDetail ownUsersDetail = doGetOrCreateOwnUsersDetail();
		ownUsersDetail.setAvatarTextColor(checkedTextColor);
		ownUsersDetail.setAvatarBackgroundColor(checkedBackgroundColor);
		return usersDetailRepository.save(ownUsersDetail);
	}

	/** Eine Farbe {@code #rrggbb} in Kleinbuchstaben, leer oder {@code null} ergibt {@code null} (Standard). */
	private String doCheckOptionalHexColor(String color, String fieldName) {
		if (color == null || color.isBlank()) {
			return null;
		}
		String strippedColor = color.strip();
		return Helper.requireValidHexColor(strippedColor, fieldName);
	}

	/** Der Details-Eintrag des angemeldeten Users (GUID aus dem Token); gibt es noch keinen, ein neuer, noch nicht gespeichert. */
	private UsersDetail doGetOrCreateOwnUsersDetail() {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		Optional<UsersDetail> foundUsersDetail = usersDetailRepository.findById(currentUsersGuid);
		if (foundUsersDetail.isPresent()) {
			return foundUsersDetail.get();
		}
		return new UsersDetail(currentUsersGuid);
	}

	private UsersDetail doCreateUsersDetail(UUID usersGuid) {
		UsersDetail newUsersDetail = new UsersDetail(usersGuid);
		return usersDetailRepository.save(newUsersDetail);
	}

	private UsersDetail doGetUsersDetail(UUID usersGuid) {
		Optional<UsersDetail> foundUsersDetail = usersDetailRepository.findById(usersGuid);
		if (foundUsersDetail.isEmpty()) {
			throw new EntityNotFoundException("Es gibt keinen UsersDetail-Eintrag mit der GUID " + usersGuid + ".");
		}
		return foundUsersDetail.get();
	}

	private List<UsersDetail> doGetAllUsersDetail() {
		return usersDetailRepository.findAll();
	}

	private void doDeleteUsersDetail(UUID usersGuid) {
		usersDetailRepository.deleteById(usersGuid);
	}
}
