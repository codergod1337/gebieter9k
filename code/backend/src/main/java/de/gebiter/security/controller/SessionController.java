package de.gebiter.security.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.security.dto.SessionInfo;
import de.gebiter.security.service.SessionService;

/**
 * Die eigene Sitzung für jeden angemeldeten User (AR USER oder ADMIN). Er nutzt nur den {@link SessionService}, nie
 * ein Repository. Login, Abholen der Sitzung und Logout gehen ohne Token und stehen deshalb im
 * {@link SessionShareController}.
 * <p>
 * Doku: {@code docu/entities/Users.md}.
 */
@RestController
@RequestMapping("/api/session")
public class SessionController {

	private final SessionService sessionService;

	public SessionController(SessionService sessionService) {
		this.sessionService = sessionService;
	}

	/** READ: Die eigene Sitzung. Ohne gültiges Token 401. */
	@GetMapping
	public ResponseEntity<SessionInfo> getSession() {
		SessionInfo sessionInfo = sessionService.getSession();
		return ResponseEntity.ok(sessionInfo);
	}
}
