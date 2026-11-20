package de.gebiter.gallery.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.dto.FileCommentThread;
import de.gebiter.gallery.dto.SharedGalleryForClient;
import de.gebiter.gallery.dto.SharedGalleryPageRequest;
import de.gebiter.gallery.service.GalleryShareVisitorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Die Besucherseite einer Galerie-Freigabe, OHNE Anmeldung (Konzept {@code docu/konzept-galerie-freigabe.md}): Wer den
 * Link mit dem Token hat, sieht die Galerie, lädt Bilder in den Viewer und lädt sie herunter. Der Name folgt der Regel
 * {@code XShareController}: die Klasse {@code GalleryShare}, erreichbar ohne Token der Anmeldung.
 * <p>
 * Die Adressen hat der Nutzer festgelegt (2026-11-19), alles hängt unter dem Token:
 * {@code /api/share/token/{token}}, {@code …/view/{fileId}}, {@code …/download/{fileId}}, {@code …/selection},
 * {@code …/download/all}. Dafür gilt eine Ausnahme von der Regel „GET nur mit einem Wert“: zwei Werte, Token und
 * Datei-id. Beide sind reines Hex mit fester Länge; ihre Form prüft der {@link GalleryShareVisitorService}, bevor er
 * irgendetwas anderes mit ihnen tut, und er prüft jede Anfrage neu (gültige Freigabe, das Bild gehört dazu).
 * <p>
 * Der Token steht in der Adresse: nginx schreibt diese Adressen deshalb in kein Log, und die Antworten sagen dem Browser,
 * dass er die Adresse nie als Herkunft weitergibt ({@code Referrer-Policy: no-referrer}).
 * <p>
 * Doku: {@code docu/entities/Gallery.md}, {@code docu/entities/GalleryShare.md}.
 */
@RestController
@RequestMapping("/api/share/token")
public class GalleryShareShareController {

	private final GalleryShareVisitorService galleryShareVisitorService;

	public GalleryShareShareController(GalleryShareVisitorService galleryShareVisitorService) {
		this.galleryShareVisitorService = galleryShareVisitorService;
	}

	/** READ: Die Standardansicht der Freigabe: die Galerie und die erste Seite ihrer Bilder. 404, wenn der Token nichts öffnet. */
	@GetMapping("/{shareToken}")
	public ResponseEntity<SharedGalleryForClient> resolveSharedGallery(@PathVariable String shareToken) {
		int firstPage = 0;
		SharedGalleryForClient sharedGallery = galleryShareVisitorService.resolveSharedGallery(shareToken, firstPage);
		return createUncachedResponse(sharedGallery);
	}

	/** READ (Auflösen): Eine weitere Seite der Bilder der Freigabe. Body: {@code {"page": 2}} (ab 0). */
	@PostMapping("/{shareToken}/resolve")
	public ResponseEntity<SharedGalleryForClient> resolveSharedGalleryPage(@PathVariable String shareToken,
			@RequestBody SharedGalleryPageRequest pageRequest) {
		int page = pageRequest.page();
		SharedGalleryForClient sharedGallery = galleryShareVisitorService.resolveSharedGallery(shareToken, page);
		return createUncachedResponse(sharedGallery);
	}

	/**
	 * READ: Ein Bild der Freigabe für den Viewer (inline nur bei erlaubtem Typ, HEIF als JPEG). Zählt als ein Aufruf. 404,
	 * wenn der Token nichts öffnet oder das Bild nicht zur Freigabe gehört.
	 */
	@GetMapping("/{shareToken}/view/{fileDocumentId}")
	public void viewSharedFile(@PathVariable String shareToken, @PathVariable String fileDocumentId,
			@RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader,
			HttpServletResponse response) {
		setNoReferrer(response);
		galleryShareVisitorService.streamSharedFile(shareToken, fileDocumentId, false, rangeHeader, response);
	}

	/**
	 * READ: Die Kommentare eines Bildes der Freigabe, die ältesten zuerst, mit ihren Autoren. Zählt nicht als Aufruf. 404,
	 * wenn der Token nichts öffnet oder das Bild nicht zur Freigabe gehört.
	 */
	@GetMapping("/{shareToken}/comment/{fileDocumentId}")
	public ResponseEntity<FileCommentThread> getSharedFileCommentThread(@PathVariable String shareToken,
			@PathVariable String fileDocumentId) {
		FileCommentThread fileCommentThread = galleryShareVisitorService.getSharedFileCommentThread(shareToken,
				fileDocumentId);
		CacheControl noStore = CacheControl.noStore();
		ResponseEntity.BodyBuilder okResponse = ResponseEntity.ok();
		okResponse.cacheControl(noStore);
		okResponse.header("Referrer-Policy", "no-referrer");
		return okResponse.body(fileCommentThread);
	}

	/** READ: Ein Bild der Freigabe als Download, das Original. Zählt als ein Aufruf. 404 wie beim Viewer. */
	@GetMapping("/{shareToken}/download/{fileDocumentId}")
	public void downloadSharedFile(@PathVariable String shareToken, @PathVariable String fileDocumentId,
			@RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader,
			HttpServletResponse response) {
		setNoReferrer(response);
		galleryShareVisitorService.streamSharedFile(shareToken, fileDocumentId, true, rangeHeader, response);
	}

	/**
	 * READ: Alle Bilder der Freigabe als eine ZIP-Datei, gestreamt (auch 100 GB brauchen auf dem Server keinen Speicher).
	 * Jedes Bild zählt als ein Aufruf.
	 */
	@GetMapping("/{shareToken}/download/all")
	public void downloadAllSharedFiles(@PathVariable String shareToken, HttpServletResponse response) {
		setNoReferrer(response);
		galleryShareVisitorService.streamSharedFilesAsZip(shareToken, null, response);
	}

	/**
	 * READ: Eine Auswahl der Bilder der Freigabe als eine ZIP-Datei, gestreamt. Kommt als Formular des Browsers (kein
	 * JSON): Nur so speichert der Browser die Antwort direkt als Datei, statt ein ZIP von vielen GB erst im Speicher zu
	 * halten. Body: das Formularfeld {@code fileIds} mit den ids der Bilder, durch Komma getrennt. Jedes Bild zählt als ein
	 * Aufruf. Das Feld liest der Controller direkt aus der Anfrage: So hängt es an keinem Umwandler für Formulare.
	 */
	@PostMapping(path = "/{shareToken}/selection", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
	public void downloadSelectedSharedFiles(@PathVariable String shareToken, HttpServletRequest request,
			HttpServletResponse response) {
		String joinedFileIds = request.getParameter("fileIds");
		List<String> selectedFileDocumentIds = new ArrayList<>();
		if (joinedFileIds != null) {
			String[] fileIdParts = joinedFileIds.split(",");
			for (String fileIdPart : fileIdParts) {
				String selectedFileDocumentId = fileIdPart.strip();
				if (!selectedFileDocumentId.isEmpty()) {
					selectedFileDocumentIds.add(selectedFileDocumentId);
				}
			}
		}
		setNoReferrer(response);
		galleryShareVisitorService.streamSharedFilesAsZip(shareToken, selectedFileDocumentIds, response);
	}

	/**
	 * Die Antwort mit den Daten der Freigabe: nie aus einem Zwischenspeicher (sie kann jederzeit ablaufen oder gelöscht
	 * werden), und die Adresse mit dem Token geht nie als Herkunft an andere Seiten.
	 */
	private static ResponseEntity<SharedGalleryForClient> createUncachedResponse(SharedGalleryForClient sharedGallery) {
		CacheControl noStore = CacheControl.noStore();
		ResponseEntity.BodyBuilder okResponse = ResponseEntity.ok();
		okResponse.cacheControl(noStore);
		okResponse.header("Referrer-Policy", "no-referrer");
		return okResponse.body(sharedGallery);
	}

	/** Die Adresse mit dem Token geht nie als Herkunft (Referer) an andere Seiten. */
	private static void setNoReferrer(HttpServletResponse response) {
		response.setHeader("Referrer-Policy", "no-referrer");
	}
}
