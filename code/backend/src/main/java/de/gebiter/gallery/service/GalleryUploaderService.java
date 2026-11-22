package de.gebiter.gallery.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import de.gebiter.gallery.dto.GalleryDeletedEvent;
import de.gebiter.gallery.model.GalleryUploader;
import de.gebiter.gallery.repository.GalleryUploaderRepository;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.users.service.UsersService;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Uploadberechtigten einer Galerie ({@link GalleryUploader}, Nutzer 2026-11-22, Konzept
 * {@code docu/konzept-galerie.md}, Abschnitt „Gemeinsame Galerie“). Er nutzt nur sein eigenes
 * {@link GalleryUploaderRepository}; wem eine Galerie gehört und wer sie sieht, sagt der {@link GalleryService}.
 * <p>
 * Eintragen und Austragen darf nur der Besitzer der Galerie, die GUID kommt aus dem Token; ein eigenes Recht braucht er
 * dafür nicht. Eingetragen wird jeder vorhandene User außer dem Besitzer selbst.
 * <p>
 * IN WELCHE FREMDEN GALERIEN EIN USER HOCHLADEN DARF, LIEGT IM HAUPTSPEICHER, wie die Freundesliste: Bei jedem Login und
 * jedem Token-Refresh lädt der {@code SessionService} die Liste des Users neu, der {@link CurrentUsersProvider} liest sie
 * von hier, ohne Postgres. Der Lesefilter jeder Suche und die Prüfung vor einem Upload nutzen sie. Eintragen und Austragen
 * ziehen die Liste des betroffenen Users nach dem Commit sofort nach: Wer ausgetragen ist, sieht die Galerie nicht bis zum
 * nächsten Refresh weiter.
 */
@Service
public class GalleryUploaderService {

	private static final Logger LOGGER = LoggerFactory.getLogger(GalleryUploaderService.class);

	private final GalleryUploaderRepository galleryUploaderRepository;

	private final GalleryService galleryService;

	private final UsersService usersService;

	private final CurrentUsersProvider currentUsersProvider;

	/** GUID eines Users → ids der fremden Galerien, in die er hochladen darf, geladen bei Login und Refresh. */
	private final Map<UUID, List<Long>> uploaderGalleryIdsByUsersGuid = new ConcurrentHashMap<>();

	public GalleryUploaderService(GalleryUploaderRepository galleryUploaderRepository, GalleryService galleryService,
			UsersService usersService, CurrentUsersProvider currentUsersProvider) {
		this.galleryUploaderRepository = galleryUploaderRepository;
		this.galleryService = galleryService;
		this.usersService = usersService;
		this.currentUsersProvider = currentUsersProvider;
	}

	/**
	 * CREATE: Der Besitzer trägt einen User als Uploadberechtigten in seine Galerie ein. Danach darf dieser User sofort in
	 * die Galerie hochladen und sieht sie ganz.
	 *
	 * @throws IllegalArgumentException wenn die Galerie oder die GUID fehlt, es den User nicht gibt oder der Besitzer sich
	 *         selbst eintragen will
	 * @throws EntityNotFoundException wenn es die Galerie nicht gibt oder sie nicht ihm gehört
	 * @throws DuplicateKeyException wenn der User schon eingetragen ist
	 */
	@Transactional
	public GalleryUploader createOwnGalleryUploader(Long galleryId, UUID uploaderUsersGuid) {
		Helper.requireNotNull(galleryId, "galleryId");
		usersService.checkUsersExists(uploaderUsersGuid, "uploaderUsersGuid");
		galleryService.checkOwnGalleryExists(galleryId);
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		boolean ownerHimself = currentUsersGuid.equals(uploaderUsersGuid);
		if (ownerHimself) {
			throw new IllegalArgumentException("In deine eigene Galerie lädst du ohnehin hoch.");
		}
		boolean alreadyUploader = galleryUploaderRepository.existsByGalleryIdAndUploaderUsersGuid(galleryId,
				uploaderUsersGuid);
		if (alreadyUploader) {
			throw new DuplicateKeyException("Dieser User darf schon in die Galerie hochladen.");
		}
		GalleryUploader newGalleryUploader = new GalleryUploader(galleryId, uploaderUsersGuid);
		GalleryUploader savedGalleryUploader = galleryUploaderRepository.save(newGalleryUploader);
		Set<UUID> changedUsersGuids = Set.of(uploaderUsersGuid);
		reloadUploaderGalleryIdsAfterCommit(changedUsersGuids);
		Long galleryUploaderId = savedGalleryUploader.getId();
		LOGGER.info("Galerie {}: Uploadberechtigter {} eingetragen (Eintrag {})", galleryId, uploaderUsersGuid,
				galleryUploaderId);
		return savedGalleryUploader;
	}

	/**
	 * READ: Alle Einträge, in denen der angemeldete User der Uploadberechtigte ist: in welche fremden Galerien er
	 * hochladen darf, der älteste Eintrag zuerst. Für die Liste der Galerien im eigenen Profil, die diese Galerien hinter
	 * den eigenen zeigt. Die GUID kommt aus dem Token; ohne Eintrag eine leere Liste.
	 */
	@Transactional(readOnly = true)
	public List<GalleryUploader> getAllOwnGalleryUploader() {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		return galleryUploaderRepository.findByUploaderUsersGuidOrderByIdAsc(currentUsersGuid);
	}

	/**
	 * READ (Auflösen): Die Uploadberechtigten einer Galerie, der zuerst eingetragene zuerst. Sehen darf sie jeder, der die
	 * Galerie sehen darf: der Besitzer für seine Verwaltung, alle anderen für die Legende über den Bildern (welche Farbe
	 * gehört wem) und für die Frage, ob sie selbst hochladen dürfen.
	 *
	 * @throws EntityNotFoundException wenn es die Galerie nicht gibt oder er sie nicht sehen darf
	 */
	@Transactional(readOnly = true)
	public List<GalleryUploader> resolveGalleryUploaders(Long galleryId) {
		Helper.requireNotNull(galleryId, "galleryId");
		galleryService.checkVisibleGalleryExists(galleryId);
		return galleryUploaderRepository.findByGalleryIdOrderByIdAsc(galleryId);
	}

	/**
	 * READ (Login, Refresh): Lädt aus Postgres in den Hauptspeicher, in welche fremden Galerien ein User hochladen darf,
	 * und ersetzt den alten Stand. Nur der {@code SessionService} ruft das, beim Ausstellen jedes Tokens.
	 */
	@Transactional(readOnly = true)
	public void loadUploaderGalleryIdsIntoMemory(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		doLoadUploaderGalleryIdsIntoMemory(usersGuid);
	}

	/**
	 * READ: Die ids der fremden Galerien, in die ein User hochladen darf, aus dem Hauptspeicher, ohne Postgres. Leer, wenn
	 * er nirgends eingetragen ist. Für den {@link CurrentUsersProvider} und damit für den Lesefilter jeder Suche.
	 */
	public List<Long> getUploaderGalleryIdsFromMemory(UUID usersGuid) {
		List<Long> uploaderGalleryIds = uploaderGalleryIdsByUsersGuid.get(usersGuid);
		if (uploaderGalleryIds == null) {
			return List.of();
		}
		return uploaderGalleryIds;
	}

	/**
	 * DELETE: Der Besitzer trägt einen Uploadberechtigten aus seiner Galerie aus. Gelöscht wird nur dieser eine Eintrag in
	 * Postgres; in Solr hängt nichts an ihm. Die Bilder, die der User hochgeladen hat, bleiben in der Galerie, er bleibt
	 * ihr Autor. Ab dem Commit lädt er nicht mehr hoch und sieht die Galerie nur noch, wenn ihre Sichtbarkeit es erlaubt.
	 *
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt oder seine Galerie nicht ihm gehört
	 */
	@Transactional
	public void deleteOwnGalleryUploader(Long id) {
		Helper.requireNotNull(id, "id");
		GalleryUploader ownGalleryUploader = doGetOwnGalleryUploader(id);
		Long galleryId = ownGalleryUploader.getGalleryId();
		UUID uploaderUsersGuid = ownGalleryUploader.getUploaderUsersGuid();
		galleryUploaderRepository.delete(ownGalleryUploader);
		Set<UUID> changedUsersGuids = Set.of(uploaderUsersGuid);
		reloadUploaderGalleryIdsAfterCommit(changedUsersGuids);
		LOGGER.info("Galerie {}: Uploadberechtigter {} ausgetragen (Eintrag {})", galleryId, uploaderUsersGuid, id);
	}

	/**
	 * Eine Galerie wird gelöscht ({@link GalleryDeletedEvent}): Ihre Uploadberechtigten gehen mit, bevor die Galerie selbst
	 * gelöscht wird. Läuft in der Transaktion des Löschens, die Rechte hat {@link GalleryService#deleteOwnGallery(Long)}
	 * schon geprüft. Ein Fehler wird weitergereicht: Die Galerie bleibt dann bestehen, und ihr Löschen lässt sich
	 * wiederholen. Nach dem Commit stehen die Listen der betroffenen User neu im Speicher.
	 */
	@EventListener
	@Transactional
	void deleteGalleryUploadersOfDeletedGallery(GalleryDeletedEvent galleryDeletedEvent) {
		Long deletedGalleryId = galleryDeletedEvent.galleryId();
		List<GalleryUploader> galleryUploadersOfGallery = galleryUploaderRepository.findByGalleryIdOrderByIdAsc(
				deletedGalleryId);
		if (galleryUploadersOfGallery.isEmpty()) {
			return;
		}
		Set<UUID> uploaderUsersGuids = new LinkedHashSet<>();
		for (GalleryUploader galleryUploaderOfGallery : galleryUploadersOfGallery) {
			UUID uploaderUsersGuid = galleryUploaderOfGallery.getUploaderUsersGuid();
			uploaderUsersGuids.add(uploaderUsersGuid);
		}
		galleryUploaderRepository.deleteAll(galleryUploadersOfGallery);
		reloadUploaderGalleryIdsAfterCommit(uploaderUsersGuids);
		int deletedGalleryUploaderCount = galleryUploadersOfGallery.size();
		LOGGER.info("Galerie {}: {} Uploadberechtigte mit der Galerie gelöscht", deletedGalleryId,
				deletedGalleryUploaderCount);
	}

	/** Der Eintrag, nur wenn seine Galerie dem angemeldeten User gehört; sonst sieht es aus wie „gibt es nicht“. */
	private GalleryUploader doGetOwnGalleryUploader(Long id) {
		Optional<GalleryUploader> foundGalleryUploader = galleryUploaderRepository.findById(id);
		if (foundGalleryUploader.isEmpty()) {
			throw new EntityNotFoundException("Den Uploadberechtigten gibt es nicht.");
		}
		GalleryUploader existingGalleryUploader = foundGalleryUploader.get();
		Long galleryId = existingGalleryUploader.getGalleryId();
		try {
			galleryService.checkOwnGalleryExists(galleryId);
		} catch (EntityNotFoundException foreignGalleryException) {
			// dieselbe Meldung wie ohne Eintrag: Niemand erfährt, ob es einen fremden Eintrag mit dieser id gibt
			throw new EntityNotFoundException("Den Uploadberechtigten gibt es nicht.");
		}
		return existingGalleryUploader;
	}

	private void doLoadUploaderGalleryIdsIntoMemory(UUID usersGuid) {
		List<GalleryUploader> galleryUploadersOfUsers = galleryUploaderRepository.findByUploaderUsersGuidOrderByIdAsc(
				usersGuid);
		List<Long> uploaderGalleryIds = new ArrayList<>();
		for (GalleryUploader galleryUploaderOfUsers : galleryUploadersOfUsers) {
			Long uploaderGalleryId = galleryUploaderOfUsers.getGalleryId();
			uploaderGalleryIds.add(uploaderGalleryId);
		}
		List<Long> unchangeableUploaderGalleryIds = List.copyOf(uploaderGalleryIds);
		uploaderGalleryIdsByUsersGuid.put(usersGuid, unchangeableUploaderGalleryIds);
	}

	/** Lädt die Listen dieser User neu, sobald die Änderung in Postgres steht. */
	private void reloadUploaderGalleryIdsAfterCommit(Set<UUID> usersGuids) {
		boolean insideTransaction = TransactionSynchronizationManager.isSynchronizationActive();
		if (!insideTransaction) {
			doLoadUploaderGalleryIdsOfAllIntoMemory(usersGuids);
			return;
		}
		TransactionSynchronization reloadAfterCommit = new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				doLoadUploaderGalleryIdsOfAllIntoMemory(usersGuids);
			}
		};
		TransactionSynchronizationManager.registerSynchronization(reloadAfterCommit);
	}

	private void doLoadUploaderGalleryIdsOfAllIntoMemory(Set<UUID> usersGuids) {
		for (UUID usersGuid : usersGuids) {
			doLoadUploaderGalleryIdsIntoMemory(usersGuid);
		}
	}
}
