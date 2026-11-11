package de.gebiter.mail.dto;

/**
 * Welcher SMTP-Zugang gerade gilt, für den Admin-Tab „Mail-Test“: so sieht man nach einem Wechsel des Anbieters in der
 * {@code .env}, ob das Backend ihn übernommen hat. Das Passwort steht nie darin.
 *
 * @param configured ob Server und Empfänger der Test-Mail gesetzt sind, sonst kann nichts rausgehen
 */
public record MailTestSettings(String smtpHost, int smtpPort, boolean startTls, boolean ssl, String smtpUsername,
		String from, String testRecipient, boolean configured) {
}
