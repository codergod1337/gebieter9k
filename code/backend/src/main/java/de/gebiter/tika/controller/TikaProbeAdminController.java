package de.gebiter.tika.controller;

import java.io.IOException;
import java.io.InputStream;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.tika.dto.TikaProbeResult;
import de.gebiter.tika.service.TikaService;

/**
 * Der Tika-Test für das gleichnamige Modul, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er nutzt nur den
 * {@link TikaService}.
 */
@RestController
@RequestMapping("/api/admin/tika-probe")
public class TikaProbeAdminController {

	private final TikaService tikaService;

	public TikaProbeAdminController(TikaService tikaService) {
		this.tikaService = tikaService;
	}

	/**
	 * CREATE: Body ist die Datei selbst, roh ({@code application/octet-stream}), ohne Namen und ohne JSON: Tika soll
	 * allein aus den Bytes erkennen, was es ist. Spring legt nichts zwischen, die Bytes fließen direkt zu Tika. Antwort:
	 * alles, was Tika gefunden hat; die Datei wird verworfen.
	 */
	@PostMapping
	public ResponseEntity<TikaProbeResult> createTikaProbe(InputStream fileDataStream) throws IOException {
		TikaProbeResult tikaProbeResult = tikaService.createTikaProbe(fileDataStream);
		return ResponseEntity.ok(tikaProbeResult);
	}
}
