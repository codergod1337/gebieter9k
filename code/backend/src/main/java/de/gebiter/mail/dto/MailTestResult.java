package de.gebiter.mail.dto;

/**
 * Die Antwort nach einer gesendeten Test-Mail: an wen, über welchen Server und wie lange der Server gebraucht hat.
 * „Gesendet“ heißt: Der SMTP-Server hat die Mail angenommen. Ob sie ankommt, zeigt das Postfach.
 */
public record MailTestResult(String recipient, String smtpHost, int smtpPort, long durationMillis) {
}
