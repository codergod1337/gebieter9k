package de.gebiter.mail.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.mail.dto.MailTestRequest;
import de.gebiter.mail.dto.MailTestResult;
import de.gebiter.mail.dto.MailTestSettings;
import de.gebiter.mail.service.MailService;

/**
 * Admin-Endpunkte des Mail-Tests, nur mit der AR ADMIN (Pfad {@code /api/admin/**}). Er nutzt nur den
 * {@link MailService}. Zum Durchprobieren der SMTP-Anbieter: Zugang in der {@code .env}, Test-Mail an die eigene Adresse.
 */
@RestController
@RequestMapping("/api/admin/mail-test")
public class MailTestAdminController {

	private final MailService mailService;

	public MailTestAdminController(MailService mailService) {
		this.mailService = mailService;
	}

	/**
	 * CREATE: Schickt die Test-Mail. Body: {@code {"recipient": "…", "subject": "…", "text": "…"}}, ohne Empfänger an
	 * {@code MAIL_TEST_RECIPIENT} aus der .env.
	 */
	@PostMapping
	public ResponseEntity<MailTestResult> sendTestMail(@RequestBody MailTestRequest mailTestRequest) {
		String recipient = mailTestRequest.recipient();
		String subject = mailTestRequest.subject();
		String text = mailTestRequest.text();
		MailTestResult mailTestResult = mailService.sendTestMail(recipient, subject, text);
		return ResponseEntity.ok(mailTestResult);
	}

	/** READ: Der SMTP-Zugang, der gerade gilt, ohne Passwort. */
	@GetMapping
	public ResponseEntity<MailTestSettings> getMailTestSettings() {
		MailTestSettings mailTestSettings = mailService.getMailTestSettings();
		return ResponseEntity.ok(mailTestSettings);
	}
}
