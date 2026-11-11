package de.gebiter.gallery.service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.file.FileSolrFieldNames;
import de.gebiter.file.dto.FileDocumentPage;
import de.gebiter.file.dto.FileDocumentSoftDeletedEvent;
import de.gebiter.file.service.FileDocumentResolveService;
import de.gebiter.file.service.FileDocumentWriteService;
import de.gebiter.gallery.dto.GalleryForClient;
import de.gebiter.gallery.model.Gallery;
import de.gebiter.gallery.repository.GalleryRepository;
import de.gebiter.richtext.service.RichTextService;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.status.model.Visibility;
import de.gebiter.users.service.UsersService;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Galerien (Konzept {@code docu/konzept-galerie.md}), die eine Stelle für alle Rechte rund um Galerien. Er
 * nutzt nur sein eigenes {@link GalleryRepository}; die Bilder liegen im Kern FILE und werden über die File-Services
 * gelesen und geschrieben.
 * <p>
 * Wer eine Galerie sieht: der Besitzer immer. Sonst zuerst die Regel des Profils (privat: nichts), dann die Sichtbarkeit
 * der Galerie (ANY und AUTHENTICATED ja, FRIENDS nur Freunde, NONE niemand). Eine Galerie, die man nicht sehen darf,
 * sieht aus wie „gibt es nicht“. Ändern, Sortieren, Löschen und Hochladen nur der Besitzer, die GUID kommt aus dem
 * Token.
 * <p>
 * Die Sichtbarkeit der Galerie steht auch in jedem ihrer Solr-Dokumente (die Lesegrenze, {@code
 * docu/konzept-lesezugriff.md}); ändert sie sich, schreibt der Service sie in alle Dokumente der Galerie.
 * <p>
 * Die Plätze der Bilder einer Galerie ({@code galleryListingPosition}) sind lückenlos 1 bis n. Der Service bringt sie
 * selbst in Ordnung ({@link #doRepairGalleryFileListingPositions}): wenn der Besitzer die Bilder seiner Galerie auflöst,
 * vor einem Upload und nachdem ein Bild gelöscht wurde; das Sortieren schreibt sie ohnehin neu.
 */
@Service
public class GalleryService {

	private static final Logger LOGGER = LoggerFactory.getLogger(GalleryService.class);

	private final GalleryRepository galleryRepository;

	private final UsersService usersService;

	private final CurrentUsersProvider currentUsersProvider;

	private final FileDocumentResolveService fileDocumentResolveService;

	private final FileDocumentWriteService fileDocumentWriteService;

	private final FileSolrFieldNames fileSolrFieldNames;

	/** Höchstlänge des Titels ({@code gebiter.gallery.title-max-length}). */
	private final int titleMaxLength;

	/** Höchstlänge der Beschreibung ({@code gebiter.gallery.description-max-length}). */
	private final int descriptionMaxLength;

	/** So viele Bilder zeigt eine Seite der Galerie ({@code gebiter.gallery.file-page-size}). */
	private final int filePageSize;

	private final RichTextService richTextService;

	public GalleryService(GalleryRepository galleryRepository, UsersService usersService,
			CurrentUsersProvider currentUsersProvider, FileDocumentResolveService fileDocumentResolveService,
			FileDocumentWriteService fileDocumentWriteService, FileSolrFieldNames fileSolrFieldNames,
			RichTextService richTextService, @Value("${gebiter.gallery.title-max-length}") int titleMaxLength,
			@Value("${gebiter.gallery.description-max-length}") int descriptionMaxLength,
			@Value("${gebiter.gallery.file-page-size}") int filePageSize) {
		this.galleryRepository = galleryRepository;
		this.usersService = usersService;
		this.currentUsersProvider = currentUsersProvider;
		this.fileDocumentResolveService = fileDocumentResolveService;
		this.fileDocumentWriteService = fileDocumentWriteService;
		this.fileSolrFieldNames = fileSolrFieldNames;
		this.titleMaxLength = titleMaxLength;
		this.descriptionMaxLength = descriptionMaxLength;
		this.filePageSize = filePageSize;
		this.richTextService = richTextService;
	}

	/**
	 * CREATE: Der angemeldete User legt eine eigene Galerie an; sie kommt ans Ende seiner Galerien.
	 *
	 * @throws IllegalArgumentException wenn Titel oder Sichtbarkeit fehlen oder ein Text zu lang ist
	 */
	@Transactional
	public Gallery createOwnGallery(String title, Map<String, String> description, Visibility visibility) {
		String checkedTitle = requireTitle(title);
		Map<String, String> checkedDescription = checkDescription(description);
		Helper.requireNotNull(visibility, "visibility");
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		Optional<Gallery> lastGallery = galleryRepository.findFirstByOwnerUsersGuidOrderByListingPositionDesc(
				currentUsersGuid);
		int listingPosition = 0;
		if (lastGallery.isPresent()) {
			int lastListingPosition = lastGallery.get().getListingPosition();
			listingPosition = lastListingPosition + 1;
		}
		Gallery newGallery = new Gallery(currentUsersGuid, checkedTitle, checkedDescription, visibility, listingPosition);
		return galleryRepository.save(newGallery);
	}

	/**
	 * READ: Eine Galerie für die Anzeige, nur wenn der angemeldete User sie sehen darf.
	 *
	 * @throws EntityNotFoundException wenn es sie nicht gibt oder er sie nicht sehen darf
	 */
	@Transactional(readOnly = true)
	public GalleryForClient getGalleryForClient(Long id) {
		Gallery visibleGallery = doGetVisibleGallery(id);
		return createGalleryForClient(visibleGallery);
	}

	/**
	 * READ: Die Galerien eines Profils, die der angemeldete User sehen darf, in ihrer Reihenfolge. Ein Profil, das er
	 * nicht sehen darf, hat für ihn keine Galerien.
	 *
	 * @throws EntityNotFoundException wenn er das Profil nicht sehen darf
	 */
	@Transactional(readOnly = true)
	public List<GalleryForClient> resolveGalleries(UUID ownerUsersGuid) {
		Helper.requireNotNull(ownerUsersGuid, "ownerUsersGuid");
		boolean profileVisible = usersService.isProfileVisibleToCurrentUsers(ownerUsersGuid);
		if (!profileVisible) {
			throw new EntityNotFoundException("Die Galerien gibt es nicht.");
		}
		List<Gallery> ownerGalleries = galleryRepository.findByOwnerUsersGuidOrderByListingPositionAscIdAsc(
				ownerUsersGuid);
		List<GalleryForClient> visibleGalleries = new ArrayList<>();
		for (Gallery ownerGallery : ownerGalleries) {
			boolean galleryVisible = isGalleryVisibleWithinVisibleProfile(ownerGallery);
			if (galleryVisible) {
				GalleryForClient galleryForClient = createGalleryForClient(ownerGallery);
				visibleGalleries.add(galleryForClient);
			}
		}
		return visibleGalleries;
	}

	/**
	 * READ: Eine Seite der Bilder einer Galerie, die der angemeldete User lesen darf, in der Reihenfolge der Galerie.
	 * <p>
	 * Löst der Besitzer seine Galerie auf, prüft das Backend zuerst die Plätze der Bilder und bringt sie, falls nötig, in
	 * Ordnung ({@link #doRepairGalleryFileListingPositions}). Erst danach liest es die Seite: Sie zeigt schon die
	 * reparierten Plätze, das Frontend muss dafür nichts tun. Das geschieht nur hier, beim Auflösen nach der Galerie, nie
	 * beim Suchen. Ein anderer User löst nichts aus (er hat kein Schreibrecht) und sieht trotzdem dieselbe Reihenfolge,
	 * denn sortiert wird nach Platz und bei gleichem Platz nach Upload.
	 *
	 * @throws EntityNotFoundException wenn es die Galerie nicht gibt oder er sie nicht sehen darf
	 */
	@Transactional(readOnly = true)
	public FileDocumentPage resolveGalleryFiles(Long galleryId, int page) {
		Gallery visibleGallery = doGetVisibleGallery(galleryId);
		Long visibleGalleryId = visibleGallery.getId();
		boolean ownGallery = isOwnGallery(visibleGallery);
		if (ownGallery) {
			doRepairGalleryFileListingPositions(visibleGalleryId);
		}
		return fileDocumentResolveService.resolveFileDocumentsOfGallery(visibleGalleryId, page, filePageSize);
	}

	/**
	 * UPDATE: Der Besitzer ändert Titel, Beschreibung und Sichtbarkeit seiner Galerie. Ändert sich die Sichtbarkeit,
	 * bekommen alle Bilder der Galerie sie auch in ihr Solr-Dokument.
	 *
	 * @throws EntityNotFoundException wenn es die Galerie nicht gibt oder sie nicht ihm gehört
	 * @throws IllegalArgumentException wenn Titel oder Sichtbarkeit fehlen oder ein Text zu lang ist
	 */
	@Transactional
	public Gallery changeOwnGallery(Long id, String title, Map<String, String> description, Visibility visibility) {
		String checkedTitle = requireTitle(title);
		Map<String, String> checkedDescription = checkDescription(description);
		Helper.requireNotNull(visibility, "visibility");
		Gallery ownGallery = doGetOwnGallery(id);
		Visibility previousVisibility = ownGallery.getVisibility();
		ownGallery.setTitle(checkedTitle);
		ownGallery.setDescription(checkedDescription);
		ownGallery.setVisibility(visibility);
		Gallery savedGallery = galleryRepository.save(ownGallery);
		boolean visibilityChanged = previousVisibility != visibility;
		if (visibilityChanged) {
			Map<String, Object> visibilityFieldValues = createVisibilityFieldValues(savedGallery);
			doChangeAllGalleryFiles(savedGallery, visibilityFieldValues);
		}
		return savedGallery;
	}

	/**
	 * UPDATE: Der angemeldete User sortiert seine Galerien neu (Drag and Drop). Es müssen genau seine Galerien sein.
	 *
	 * @throws IllegalArgumentException wenn die Liste nicht genau seine Galerien enthält
	 */
	@Transactional
	public List<Gallery> changeOwnGalleryListingPositions(List<Long> galleryIdsInOrder) {
		Helper.requireNotNull(galleryIdsInOrder, "galleryIdsInOrder");
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		List<Gallery> ownGalleries = galleryRepository.findByOwnerUsersGuidOrderByListingPositionAscIdAsc(
				currentUsersGuid);
		Map<Long, Gallery> ownGalleriesById = new HashMap<>();
		for (Gallery ownGallery : ownGalleries) {
			Long ownGalleryId = ownGallery.getId();
			ownGalleriesById.put(ownGalleryId, ownGallery);
		}
		Set<Long> givenGalleryIds = new HashSet<>(galleryIdsInOrder);
		boolean exactlyOwnGalleries = givenGalleryIds.size() == galleryIdsInOrder.size()
				&& givenGalleryIds.equals(ownGalleriesById.keySet());
		if (!exactlyOwnGalleries) {
			throw new IllegalArgumentException("Die Reihenfolge muss genau deine Galerien enthalten, jede einmal.");
		}
		List<Gallery> reorderedGalleries = new ArrayList<>();
		for (int listingPosition = 0; listingPosition < galleryIdsInOrder.size(); listingPosition++) {
			Long galleryId = galleryIdsInOrder.get(listingPosition);
			Gallery reorderedGallery = ownGalleriesById.get(galleryId);
			reorderedGallery.setListingPosition(listingPosition);
			reorderedGalleries.add(reorderedGallery);
		}
		return galleryRepository.saveAll(reorderedGalleries);
	}

	/**
	 * UPDATE: Der Besitzer sortiert die Bilder einer Seite seiner Galerie neu (Drag and Drop). Die ids müssen genau die
	 * Bilder dieser Seite sein; danach hat jedes Bild der Galerie seinen Platz 1, 2, 3 … Verglichen wird mit dem Platz,
	 * der im Dokument steht, nicht mit der alten Reihenfolge: So stimmen die Plätze danach auch dann, wenn sie vorher
	 * doppelt oder lückenhaft waren ({@link #doSetGalleryFileListingPositions}).
	 *
	 * @throws EntityNotFoundException wenn es die Galerie nicht gibt oder sie nicht ihm gehört
	 * @throws IllegalArgumentException wenn die ids nicht genau die Bilder dieser Seite sind (z. B. weil sich die Galerie
	 *         inzwischen geändert hat)
	 */
	@Transactional(readOnly = true)
	public void changeOwnGalleryFileListingPositions(Long galleryId, int page, List<String> fileDocumentIdsInOrder) {
		Helper.requireNotNull(fileDocumentIdsInOrder, "fileDocumentIdsInOrder");
		if (page < 0) {
			throw new IllegalArgumentException("page darf nicht negativ sein.");
		}
		Gallery ownGallery = doGetOwnGallery(galleryId);
		Long ownGalleryId = ownGallery.getId();
		Map<String, Long> storedListingPositionsByFileId = fileDocumentResolveService
				.resolveActiveFileDocumentListingPositionsOfGallery(ownGalleryId);
		Set<String> galleryFileIdSet = storedListingPositionsByFileId.keySet();
		List<String> galleryFileIds = new ArrayList<>(galleryFileIdSet);
		int pageStart = page * filePageSize;
		int pageEnd = Math.min(pageStart + filePageSize, galleryFileIds.size());
		if (pageStart > pageEnd) {
			throw new IllegalArgumentException("Diese Seite hat die Galerie nicht.");
		}
		List<String> pageFileIds = galleryFileIds.subList(pageStart, pageEnd);
		Set<String> pageFileIdSet = new HashSet<>(pageFileIds);
		Set<String> givenFileIdSet = new HashSet<>(fileDocumentIdsInOrder);
		boolean samePageFiles = givenFileIdSet.size() == fileDocumentIdsInOrder.size()
				&& givenFileIdSet.equals(pageFileIdSet);
		if (!samePageFiles) {
			throw new IllegalArgumentException("Die Galerie hat sich inzwischen geändert, bitte neu laden.");
		}
		List<String> reorderedFileIds = new ArrayList<>(galleryFileIds);
		for (int pageIndex = 0; pageIndex < fileDocumentIdsInOrder.size(); pageIndex++) {
			String movedFileId = fileDocumentIdsInOrder.get(pageIndex);
			reorderedFileIds.set(pageStart + pageIndex, movedFileId);
		}
		doSetGalleryFileListingPositions(reorderedFileIds, storedListingPositionsByFileId);
	}

	/**
	 * Für den Upload in eine Galerie (der {@code FileUploadService} ruft es, bevor er die Bytes annimmt): Die Galerie
	 * muss dem angemeldeten User gehören. Liefert die Felder, die das Backend ins neue Solr-Dokument schreibt: die
	 * Galerie, ihre Sichtbarkeit und den Platz am Ende der Galerie. Vorher werden die Plätze der vorhandenen Bilder in
	 * Ordnung gebracht, damit „am Ende“ stimmt: Bei n Bildern auf den Plätzen 1 bis n bekommt das neue Platz n + 1.
	 *
	 * @throws EntityNotFoundException wenn es die Galerie nicht gibt oder sie nicht ihm gehört
	 */
	@Transactional(readOnly = true)
	public Map<String, Object> prepareOwnGalleryUpload(Long galleryId) {
		Gallery ownGallery = doGetOwnGallery(galleryId);
		Long ownGalleryId = ownGallery.getId();
		List<String> galleryFileIds = doRepairGalleryFileListingPositions(ownGalleryId);
		long endListingPosition = galleryFileIds.size() + 1L;
		Map<String, Object> galleryFieldValues = createVisibilityFieldValues(ownGallery);
		String galleryIdsFieldName = fileSolrFieldNames.galleryIds();
		String galleryListingPositionFieldName = fileSolrFieldNames.galleryListingPosition();
		galleryFieldValues.put(galleryIdsFieldName, List.of(ownGalleryId));
		galleryFieldValues.put(galleryListingPositionFieldName, endListingPosition);
		// ein neues Dokument braucht keine leeren Felder: ohne FRIENDS fällt die Freundes-GUID weg
		galleryFieldValues.values().removeIf(fieldValue -> fieldValue == null);
		return galleryFieldValues;
	}

	/**
	 * DELETE: Der Besitzer löscht seine Galerie. Ihre Bilder bleiben erhalten: Sie verlieren die Galerie und ihren Platz
	 * und werden privat (NONE), damit nichts verloren geht und nichts ungewollt sichtbar bleibt.
	 *
	 * @throws EntityNotFoundException wenn es die Galerie nicht gibt oder sie nicht ihm gehört
	 */
	@Transactional
	public void deleteOwnGallery(Long id) {
		Gallery ownGallery = doGetOwnGallery(id);
		String galleryIdsFieldName = fileSolrFieldNames.galleryIds();
		String galleryListingPositionFieldName = fileSolrFieldNames.galleryListingPosition();
		String visibilityFieldName = fileSolrFieldNames.visibility();
		String readableForFriendsFieldName = fileSolrFieldNames.readableForFriendsOfUsersGuid();
		Map<String, Object> releaseFieldValues = new HashMap<>();
		releaseFieldValues.put(galleryIdsFieldName, null);
		releaseFieldValues.put(galleryListingPositionFieldName, null);
		releaseFieldValues.put(visibilityFieldName, Visibility.NONE.name());
		releaseFieldValues.put(readableForFriendsFieldName, null);
		doChangeAllGalleryFiles(ownGallery, releaseFieldValues);
		galleryRepository.delete(ownGallery);
	}

	/**
	 * Eine Datei wurde weich gelöscht ({@link FileDocumentSoftDeletedEvent}): In ihren Galerien rücken die übrigen Bilder
	 * auf, damit die Plätze lückenlos bleiben. Beispiel: fünf Bilder auf den Plätzen 1 bis 5, das Bild auf Platz 3 wird
	 * gelöscht, aus 4 und 5 werden 3 und 4. Die Rechte hat das Löschen schon geprüft (Autor oder Admin).
	 * <p>
	 * Scheitert das Aufrücken, bleibt das Löschen gültig und meldet keinen Fehler: Die Lücke schließt sich, sobald der
	 * Besitzer seine Galerie das nächste Mal auflöst ({@link #resolveGalleryFiles}).
	 */
	@EventListener
	void repairGalleryFileListingPositionsAfterFileDocumentSoftDeleted(FileDocumentSoftDeletedEvent softDeletedEvent) {
		String deletedFileDocumentId = softDeletedEvent.fileDocumentId();
		List<Long> galleryIds = softDeletedEvent.galleryIds();
		for (Long galleryId : galleryIds) {
			try {
				doRepairGalleryFileListingPositions(galleryId);
			} catch (RuntimeException exception) {
				LOGGER.warn("Galerie {}: Plätze nach dem Löschen der Datei {} nicht nachgezogen", galleryId,
						deletedFileDocumentId, exception);
			}
		}
	}

	/**
	 * Bringt die Plätze der Bilder einer Galerie in Ordnung (selbstheilend): Die aktiven Bilder werden in ihrer
	 * Reihenfolge gelesen (nach Platz, bei gleichem Platz nach Upload) und bekommen der Reihe nach Platz 1, 2, 3 …
	 * Beispiel: Vier Bilder auf den Plätzen 2, 2, 3, 3 oder, nach einem Löschen, auf 1, 2, 4, 5 stehen danach auf 1, 2,
	 * 3, 4. Gelesen werden nur ids und Plätze; geschrieben wird nur, wenn ein Platz abweicht. Ohne Rechteprüfung, die
	 * macht der Aufrufer.
	 *
	 * @return die ids der aktiven Bilder in der Reihenfolge der Galerie
	 */
	private List<String> doRepairGalleryFileListingPositions(Long galleryId) {
		Map<String, Long> storedListingPositionsByFileId = fileDocumentResolveService
				.resolveActiveFileDocumentListingPositionsOfGallery(galleryId);
		Set<String> galleryFileIdSet = storedListingPositionsByFileId.keySet();
		List<String> galleryFileIds = new ArrayList<>(galleryFileIdSet);
		int repairedFileCount = doSetGalleryFileListingPositions(galleryFileIds, storedListingPositionsByFileId);
		if (repairedFileCount > 0) {
			LOGGER.info("Galerie {}: Plätze von {} Bildern in Ordnung gebracht", galleryId, repairedFileCount);
		}
		return galleryFileIds;
	}

	/**
	 * Gibt den Bildern einer Galerie ihre Plätze nach der Reihenfolge der Liste: das erste Platz 1, das zweite Platz 2 …
	 * Verglichen wird mit dem Platz, der im Dokument des Bildes steht; geschrieben werden nur die Bilder, bei denen er
	 * abweicht, alle in einem Rutsch (eine Anfrage an Solr, ein Commit). Stimmen alle Plätze, wird nichts geschrieben.
	 *
	 * @param fileIdsInOrder die aktiven Bilder der Galerie in der Reihenfolge, die gelten soll
	 * @param storedListingPositionsByFileId je Bild der Platz, der in seinem Dokument steht ({@code null} ohne Platz)
	 * @return wie viele Bilder einen neuen Platz bekommen haben
	 */
	private int doSetGalleryFileListingPositions(List<String> fileIdsInOrder,
			Map<String, Long> storedListingPositionsByFileId) {
		String galleryListingPositionFieldName = fileSolrFieldNames.galleryListingPosition();
		Map<String, Map<String, Object>> positionFieldValuesByFileId = new LinkedHashMap<>();
		for (int index = 0; index < fileIdsInOrder.size(); index++) {
			String fileId = fileIdsInOrder.get(index);
			// die Plätze zählen ab 1
			Long expectedListingPosition = index + 1L;
			Long storedListingPosition = storedListingPositionsByFileId.get(fileId);
			boolean positionCorrect = expectedListingPosition.equals(storedListingPosition);
			if (!positionCorrect) {
				Map<String, Object> positionFieldValues = Map.of(galleryListingPositionFieldName,
						expectedListingPosition);
				positionFieldValuesByFileId.put(fileId, positionFieldValues);
			}
		}
		fileDocumentWriteService.changeBackendFieldValuesOfFileDocuments(positionFieldValuesByFileId);
		return positionFieldValuesByFileId.size();
	}

	/** Die Felder der Sichtbarkeit für die Bilder einer Galerie, wie für jede Datei ({@link FileDocumentWriteService}). */
	private Map<String, Object> createVisibilityFieldValues(Gallery gallery) {
		Visibility galleryVisibility = gallery.getVisibility();
		UUID ownerUsersGuid = gallery.getOwnerUsersGuid();
		Map<String, Object> visibilityFieldValues = fileDocumentWriteService.createVisibilityFieldValues(galleryVisibility,
				ownerUsersGuid);
		return new HashMap<>(visibilityFieldValues);
	}

	/** Schreibt dieselben Felder in jedes aktive Bild der Galerie. */
	private void doChangeAllGalleryFiles(Gallery gallery, Map<String, Object> fieldValues) {
		Long galleryId = gallery.getId();
		List<String> galleryFileIds = fileDocumentResolveService.resolveActiveFileDocumentIdsOfGallery(galleryId);
		for (String galleryFileId : galleryFileIds) {
			fileDocumentWriteService.changeFileDocumentBackendFieldValues(galleryFileId, fieldValues);
		}
	}

	/** Eine Galerie für die Anzeige: Zahl und Vorschau mit dem Lesefilter des Betrachters aus Solr. */
	private GalleryForClient createGalleryForClient(Gallery gallery) {
		Long galleryId = gallery.getId();
		FileDocumentPage firstFilePage = fileDocumentResolveService.resolveFileDocumentsOfGallery(galleryId, 0, 1);
		long fileCount = firstFilePage.totalCount();
		String coverPreviewBase64Png = null;
		List<Map<String, Object>> firstFiles = firstFilePage.documents();
		if (!firstFiles.isEmpty()) {
			Map<String, Object> firstFile = firstFiles.get(0);
			String previewFieldName = fileSolrFieldNames.previewBase64Png();
			Object rawPreview = firstFile.get(previewFieldName);
			if (rawPreview != null) {
				coverPreviewBase64Png = rawPreview.toString();
			}
		}
		UUID ownerUsersGuid = gallery.getOwnerUsersGuid();
		String title = gallery.getTitle();
		Map<String, String> description = gallery.getDescription();
		Visibility visibility = gallery.getVisibility();
		int listingPosition = gallery.getListingPosition();
		OffsetDateTime createdAt = gallery.getCreatedAt();
		return new GalleryForClient(galleryId, ownerUsersGuid, title, description, visibility, listingPosition, createdAt,
				fileCount, coverPreviewBase64Png);
	}

	/** Die Galerie, nur wenn der angemeldete User sie sehen darf; sonst sieht es aus wie „gibt es nicht“. */
	private Gallery doGetVisibleGallery(Long id) {
		Gallery existingGallery = doGetGallery(id);
		UUID ownerUsersGuid = existingGallery.getOwnerUsersGuid();
		boolean profileVisible = usersService.isProfileVisibleToCurrentUsers(ownerUsersGuid);
		boolean galleryVisible = profileVisible && isGalleryVisibleWithinVisibleProfile(existingGallery);
		if (!galleryVisible) {
			throw new EntityNotFoundException("Die Galerie gibt es nicht.");
		}
		return existingGallery;
	}

	/** Die Galerie, nur wenn sie dem angemeldeten User gehört; sonst sieht es aus wie „gibt es nicht“. */
	private Gallery doGetOwnGallery(Long id) {
		Gallery existingGallery = doGetGallery(id);
		boolean ownGallery = isOwnGallery(existingGallery);
		if (!ownGallery) {
			throw new EntityNotFoundException("Die Galerie gibt es nicht.");
		}
		return existingGallery;
	}

	/** Gehört die Galerie dem angemeldeten User? Nur er hat Schreibrecht an ihr. */
	private boolean isOwnGallery(Gallery gallery) {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		UUID ownerUsersGuid = gallery.getOwnerUsersGuid();
		return currentUsersGuid.equals(ownerUsersGuid);
	}

	private Gallery doGetGallery(Long id) {
		Helper.requireNotNull(id, "id");
		Optional<Gallery> foundGallery = galleryRepository.findById(id);
		if (foundGallery.isEmpty()) {
			throw new EntityNotFoundException("Die Galerie gibt es nicht.");
		}
		return foundGallery.get();
	}

	/**
	 * Die Sichtbarkeit der Galerie selbst, wenn das Profil schon sichtbar ist: der Besitzer immer, sonst ANY und
	 * AUTHENTICATED ja, FRIENDS nur als Freund, NONE nie.
	 */
	private boolean isGalleryVisibleWithinVisibleProfile(Gallery gallery) {
		UUID ownerUsersGuid = gallery.getOwnerUsersGuid();
		Visibility galleryVisibility = gallery.getVisibility();
		return usersService.isVisibleToCurrentUsers(ownerUsersGuid, galleryVisibility);
	}

	/** Der Titel ohne Leerzeichen außen; er muss da sein und darf höchstens die Höchstlänge haben. */
	private String requireTitle(String title) {
		Helper.requireNotBlank(title, "title");
		String strippedTitle = title.strip();
		if (strippedTitle.length() > titleMaxLength) {
			throw new IllegalArgumentException("Der Titel darf höchstens " + titleMaxLength + " Zeichen haben.");
		}
		return strippedTitle;
	}

	/**
	 * Die Beschreibung als bereinigter mehrsprachiger Rich-Text ({@link RichTextService#sanitizeMultilingualRichText}),
	 * ohne Inhalt {@code null}; je Sprache höchstens die Höchstlänge an sichtbarem Text.
	 */
	private Map<String, String> checkDescription(Map<String, String> description) {
		return richTextService.sanitizeMultilingualRichText(description, "Beschreibung", descriptionMaxLength);
	}
}
