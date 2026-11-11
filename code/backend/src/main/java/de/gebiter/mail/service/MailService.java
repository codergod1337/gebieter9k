package de.gebiter.mail.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import de.gebiter.exception.MissingConfigurationException;
import de.gebiter.mail.MailSendFailedException;
import de.gebiter.mail.dto.MailTestResult;
import de.gebiter.mail.dto.MailTestSettings;
import de.gebiter.util.Helper;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;

/**
 * E-Mail über SMTP mit dem Zugang aus der {@code .env} ({@code spring.mail.*} und {@code gebiter.mail.*}). Vorerst nur
 * der Mail-Test des Admins, zum Durchprobieren der Anbieter; später kommt hier der Versand der 2FA dazu.
 * <p>
 * Die Test-Mail darf nur der Admin schicken (kein offenes Relais); ohne Empfänger geht sie an
 * {@code gebiter.mail.test-recipient}. Nur Text, kein HTML.
 */
@Service
public class MailService {

	private static final Logger LOGGER = LoggerFactory.getLogger(MailService.class);

	/** Den Sender legt Spring an, sobald {@code spring.mail.host} gesetzt ist. */
	private final ObjectProvider<JavaMailSender> javaMailSenderProvider;

	private final String smtpHost;

	private final int smtpPort;

	private final boolean startTls;

	private final boolean ssl;

	private final String smtpUsername;

	/** Absender, leer heißt: das Konto selbst. */
	private final String configuredFrom;

	private final String testRecipient;

	public MailService(ObjectProvider<JavaMailSender> javaMailSenderProvider,
			@Value("${spring.mail.host}") String smtpHost, @Value("${spring.mail.port}") int smtpPort,
			@Value("${spring.mail.properties[mail.smtp.starttls.enable]}") boolean startTls,
			@Value("${spring.mail.properties[mail.smtp.ssl.enable]}") boolean ssl,
			@Value("${spring.mail.username}") String smtpUsername, @Value("${gebiter.mail.from}") String configuredFrom,
			@Value("${gebiter.mail.test-recipient}") String testRecipient) {
		this.javaMailSenderProvider = javaMailSenderProvider;
		this.smtpHost = smtpHost;
		this.smtpPort = smtpPort;
		this.startTls = startTls;
		this.ssl = ssl;
		this.smtpUsername = smtpUsername;
		this.configuredFrom = configuredFrom;
		this.testRecipient = testRecipient;
	}

	/** READ: Der SMTP-Zugang, der gerade gilt, ohne Passwort. */
	@PreAuthorize("hasRole('ADMIN')")
	public MailTestSettings getMailTestSettings() {
		String from = getFrom();
		boolean configured = !smtpHost.isBlank();
		return new MailTestSettings(smtpHost, smtpPort, startTls, ssl, smtpUsername, from, testRecipient, configured);
	}

	/**
	 * CREATE: Schickt eine Test-Mail. Kommt die Antwort ohne Fehler, hat der SMTP-Server die Mail angenommen.
	 *
	 * @param recipient der Empfänger; leer: {@code gebiter.mail.test-recipient}
	 * @throws IllegalArgumentException (400) wenn Betreff oder Text fehlen oder der Empfänger keine Adresse ist
	 * @throws MissingConfigurationException (503) wenn SMTP oder ein Empfänger in der .env fehlen
	 * @throws MailSendFailedException (502) wenn der Server die Mail nicht annimmt, mit seiner Antwort
	 */
	@PreAuthorize("hasRole('ADMIN')")
	public MailTestResult sendTestMail(String recipient, String subject, String text) {
		Helper.requireNotBlank(subject, "subject");
		Helper.requireNotBlank(text, "text");
		if (smtpHost.isBlank()) {
			throw new MissingConfigurationException(
					"SMTP ist nicht eingerichtet: SMTP_HOST in der .env setzen, Backend neu starten.");
		}
		String usedRecipient = testRecipient;
		if (recipient != null && !recipient.isBlank()) {
			usedRecipient = recipient.strip();
		}
		if (usedRecipient.isBlank()) {
			throw new MissingConfigurationException(
					"Kein Empfänger: Adresse eingeben oder MAIL_TEST_RECIPIENT in der .env setzen.");
		}
		requireValidMailAddress(usedRecipient);
		long startNanos = System.nanoTime();
		doSendMail(usedRecipient, subject, text);
		long durationMillis = (System.nanoTime() - startNanos) / 1_000_000;
		LOGGER.info("Test-Mail an {} über {}:{} in {} ms angenommen", usedRecipient, smtpHost, smtpPort, durationMillis);
		return new MailTestResult(usedRecipient, smtpHost, smtpPort, durationMillis);
	}

	/** Eine einzelne, streng geprüfte Adresse wie {@code name@example.org}; sonst 400. */
	private static void requireValidMailAddress(String mailAddress) {
		try {
			InternetAddress internetAddress = new InternetAddress(mailAddress, true);
			internetAddress.validate();
		} catch (AddressException exception) {
			throw new IllegalArgumentException("„" + mailAddress + "“ ist keine gültige E-Mail-Adresse.");
		}
	}

	/** Schickt eine Text-Mail; die Antwort des Servers bei einem Fehler steht in der Exception. */
	private void doSendMail(String recipient, String subject, String text) {
		JavaMailSender javaMailSender = javaMailSenderProvider.getIfAvailable();
		if (javaMailSender == null) {
			throw new MissingConfigurationException("Kein Mail-Sender: SMTP_HOST in der .env setzen, Backend neu starten.");
		}
		String from = getFrom();
		SimpleMailMessage mailMessage = new SimpleMailMessage();
		mailMessage.setFrom(from);
		mailMessage.setTo(recipient);
		mailMessage.setSubject(subject);
		mailMessage.setText(text);
		try {
			javaMailSender.send(mailMessage);
		} catch (MailException exception) {
			String serverAnswer = getDeepestMessage(exception);
			LOGGER.warn("Mail über {}:{} gescheitert: {}", smtpHost, smtpPort, serverAnswer);
			throw new MailSendFailedException("Der SMTP-Server " + smtpHost + ":" + smtpPort
					+ " hat die Mail nicht angenommen: " + serverAnswer, exception);
		}
	}

	/** Der Absender: {@code gebiter.mail.from}, leer das Konto selbst. */
	private String getFrom() {
		if (configuredFrom.isBlank()) {
			return smtpUsername;
		}
		return configuredFrom;
	}

	/** Die Meldung der innersten Ursache, dort steht meist die Antwort des Servers (z. B. „535 Authentication failed“). */
	private static String getDeepestMessage(Throwable throwable) {
		Throwable deepestCause = throwable;
		while (deepestCause.getCause() != null && deepestCause.getCause() != deepestCause) {
			deepestCause = deepestCause.getCause();
		}
		String deepestMessage = deepestCause.getMessage();
		if (deepestMessage == null || deepestMessage.isBlank()) {
			return deepestCause.getClass().getSimpleName();
		}
		return deepestMessage.strip();
	}
}
