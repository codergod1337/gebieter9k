package de.gebiter.mail.dto;

/**
 * Die Test-Mail (Admin-Tab „Mail-Test“, Profil „Sicherheit“): Empfänger, Betreff und Text. Ein leerer Empfänger heißt
 * {@code MAIL_TEST_RECIPIENT} aus der {@code .env}. Nur der Admin darf senden, so wird daraus kein offenes Relais.
 */
public record MailTestRequest(String recipient, String subject, String text) {
}
