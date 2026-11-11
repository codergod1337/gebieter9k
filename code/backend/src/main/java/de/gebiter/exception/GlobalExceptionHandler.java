package de.gebiter.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import de.gebiter.file.FileAccessDeniedException;
import de.gebiter.file.FileStagingFullException;
import de.gebiter.file.FileUploadLimitReachedException;
import de.gebiter.guestbook.GuestbookAccessDeniedException;
import de.gebiter.shop.ShopAccessDeniedException;
import de.gebiter.shop.ShopOrderRejectedException;
import de.gebiter.mail.MailSendFailedException;
import de.gebiter.sftp.SftpFileNotFoundException;
import de.gebiter.sftp.SftpPerUsersLimitException;
import de.gebiter.sftp.SftpUnavailableException;
import de.gebiter.solr.SolrUnavailableException;
import jakarta.persistence.EntityNotFoundException;

/**
 * Übersetzt die Exceptions der Services für alle Controller in HTTP-Statuscodes. Die Antwort ist ein
 * {@link ProblemDetail} nach RFC 9457 mit der Fehlermeldung im Feld {@code detail}.
 * <p>
 * Alles, was hier nicht steht, bleibt ein 500: Das ist dann ein Fehler im Code, nicht in der Eingabe.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	/** 400: Die Eingabe ist ungültig, z. B. fehlt ein Pflichtfeld oder ein Key verletzt die Key-Regel. */
	@ExceptionHandler(IllegalArgumentException.class)
	public ProblemDetail handleIllegalArgument(IllegalArgumentException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detailMessage);
	}

	/**
	 * 401: Anmeldung fehlgeschlagen ({@link BadCredentialsException}) oder niemand angemeldet
	 * ({@link AuthenticationCredentialsNotFoundException}). Die Meldung ist bewusst allgemein.
	 */
	@ExceptionHandler({ BadCredentialsException.class, AuthenticationCredentialsNotFoundException.class })
	public ProblemDetail handleAuthenticationFailed(RuntimeException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, detailMessage);
	}

	/** 403: Der User darf das nicht, z. B. ohne Schreibrolle an der FileClass hochladen. */
	@ExceptionHandler(FileAccessDeniedException.class)
	public ProblemDetail handleFileAccessDenied(FileAccessDeniedException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, detailMessage);
	}

	/** 403: Der User darf das im Gästebuch nicht, z. B. einen fremden Eintrag in einem fremden Gästebuch löschen. */
	@ExceptionHandler(GuestbookAccessDeniedException.class)
	public ProblemDetail handleGuestbookAccessDenied(GuestbookAccessDeniedException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, detailMessage);
	}

	/** 403: Der User darf das im Gebietermarkt nicht, z. B. ein Angebot zu einem fremden Artikel anlegen. */
	@ExceptionHandler(ShopAccessDeniedException.class)
	public ProblemDetail handleShopAccessDenied(ShopAccessDeniedException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, detailMessage);
	}

	/** 409: Ein Kauf im Gebietermarkt kommt nicht zustande, z. B. Angebot abgelaufen oder Punkte reichen nicht. */
	@ExceptionHandler(ShopOrderRejectedException.class)
	public ProblemDetail handleShopOrderRejected(ShopOrderRejectedException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, detailMessage);
	}

	/** 409: Der User hat schon so viele Dateien, wie ihm zustehen. */
	@ExceptionHandler(FileUploadLimitReachedException.class)
	public ProblemDetail handleFileUploadLimitReached(FileUploadLimitReachedException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, detailMessage);
	}

	/** 503: Der Upload-Puffer des Backends ist voll, später noch einmal versuchen. */
	@ExceptionHandler(FileStagingFullException.class)
	public ProblemDetail handleFileStagingFull(FileStagingFullException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, detailMessage);
	}

	/** 503: Solr antwortet nicht. Das liegt an uns, die Ursache steht nur im Log. */
	@ExceptionHandler(SolrUnavailableException.class)
	public ProblemDetail handleSolrUnavailable(SolrUnavailableException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, detailMessage);
	}

	/** 502: Der SMTP-Server hat die Mail nicht angenommen; seine Antwort steht in der Meldung (Mail-Test des Admins). */
	@ExceptionHandler(MailSendFailedException.class)
	public ProblemDetail handleMailSendFailed(MailSendFailedException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_GATEWAY, detailMessage);
	}

	/** 503: Eine Einstellung fehlt in der .env (z. B. SMTP, Schlüssel der Authenticator-App); die Meldung nennt sie. */
	@ExceptionHandler(MissingConfigurationException.class)
	public ProblemDetail handleMissingConfiguration(MissingConfigurationException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, detailMessage);
	}

	/** 404: Den angefragten Eintrag gibt es nicht. */
	@ExceptionHandler(EntityNotFoundException.class)
	public ProblemDetail handleEntityNotFound(EntityNotFoundException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, detailMessage);
	}

	/** 409: Den Eintrag gibt es schon, z. B. einen vergebenen Username. */
	@ExceptionHandler(DuplicateKeyException.class)
	public ProblemDetail handleDuplicateKey(DuplicateKeyException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, detailMessage);
	}

	/**
	 * 409: Die Datenbank hat den Eintrag abgelehnt, z. B. wegen einer Pflichtspalte. Die Meldung der
	 * Datenbank geht bewusst nicht hinaus, sie enthält SQL.
	 */
	@ExceptionHandler(DataIntegrityViolationException.class)
	public ProblemDetail handleDataIntegrityViolation(DataIntegrityViolationException exception) {
		String detailMessage = "Die Datenbank hat den Eintrag abgelehnt.";
		return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, detailMessage);
	}

	/** 404: Die Datei liegt nicht auf dem Dateispeicher. Die Meldung enthält keinen Pfad. */
	@ExceptionHandler(SftpFileNotFoundException.class)
	public ProblemDetail handleSftpFileNotFound(SftpFileNotFoundException exception) {
		String detailMessage = exception.getMessage();
		return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, detailMessage);
	}

	/**
	 * 503 mit {@code Retry-After}: Der Dateispeicher ist nicht erreichbar oder ausgelastet. Das liegt an uns, der
	 * Aufrufer darf es gleich noch einmal versuchen. Pfade und Ursache stehen nur im Log.
	 */
	@ExceptionHandler(SftpUnavailableException.class)
	public ResponseEntity<ProblemDetail> handleSftpUnavailable(SftpUnavailableException exception) {
		String detailMessage = exception.getMessage();
		ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, detailMessage);
		String retryAfterSeconds = exception.getRetryAfterSeconds();
		ResponseEntity.BodyBuilder serviceUnavailableResponse = ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE);
		serviceUnavailableResponse.header(HttpHeaders.RETRY_AFTER, retryAfterSeconds);
		return serviceUnavailableResponse.body(problemDetail);
	}

	/** 429 mit {@code Retry-After}: Der User hat schon so viele Übertragungen offen, wie ihm zustehen. */
	@ExceptionHandler(SftpPerUsersLimitException.class)
	public ResponseEntity<ProblemDetail> handleSftpPerUsersLimit(SftpPerUsersLimitException exception) {
		String detailMessage = exception.getMessage();
		ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, detailMessage);
		String retryAfterSeconds = exception.getRetryAfterSeconds();
		ResponseEntity.BodyBuilder tooManyRequestsResponse = ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS);
		tooManyRequestsResponse.header(HttpHeaders.RETRY_AFTER, retryAfterSeconds);
		return tooManyRequestsResponse.body(problemDetail);
	}
}
