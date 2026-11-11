package de.gebiter.sftp;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Zugang und Grenzen des Dateispeichers, gelesen aus {@code gebiter.sftp.*} in der {@code application.yaml}, wie
 * {@code SftpProperties} der Vorlage. Alles, was den Server betrifft, kommt dort aus der {@code .env}: Für den Wechsel
 * auf ein NAS ändern sich nur Host und Host-Key.
 * <p>
 * Fehlt ein Pflichtwert, startet das Backend nicht: Ohne Host-Key gäbe es kein Pinning, ohne Passwort oder Schlüssel
 * keine Anmeldung.
 */
@Component
public class SftpConfig {

	private final String host;

	private final int port;

	private final String user;

	private final String password;

	private final String hostKey;

	private final String privateKeyPath;

	private final String rootDir;

	private final int maxConnections;

	private final int maxConnectionsPerUsers;

	private final int minIdleConnections;

	private final Duration connectTimeout;

	private final Duration socketTimeout;

	private final Duration borrowTimeout;

	private final Duration idleTimeout;

	private final Duration checkAliveAfter;

	private final Duration keepaliveInterval;

	private final Duration housekeepingInterval;

	private final int maxFilesPerDirectory;

	private final int maxKnownDirectories;

	private final int maxPathLength;

	private final String fileSuffix;

	private final String partSuffix;

	private final String retryAfterSeconds;

	public SftpConfig(@Value("${gebiter.sftp.host}") String host, @Value("${gebiter.sftp.port}") int port,
			@Value("${gebiter.sftp.user}") String user, @Value("${gebiter.sftp.password}") String password,
			@Value("${gebiter.sftp.host-key}") String hostKey,
			@Value("${gebiter.sftp.private-key-path}") String privateKeyPath,
			@Value("${gebiter.sftp.root-dir}") String rootDir,
			@Value("${gebiter.sftp.max-connections}") int maxConnections,
			@Value("${gebiter.sftp.max-connections-per-users}") int maxConnectionsPerUsers,
			@Value("${gebiter.sftp.min-idle-connections}") int minIdleConnections,
			@Value("${gebiter.sftp.connect-timeout}") Duration connectTimeout,
			@Value("${gebiter.sftp.socket-timeout}") Duration socketTimeout,
			@Value("${gebiter.sftp.borrow-timeout}") Duration borrowTimeout,
			@Value("${gebiter.sftp.idle-timeout}") Duration idleTimeout,
			@Value("${gebiter.sftp.check-alive-after}") Duration checkAliveAfter,
			@Value("${gebiter.sftp.keepalive-interval}") Duration keepaliveInterval,
			@Value("${gebiter.sftp.housekeeping-interval}") Duration housekeepingInterval,
			@Value("${gebiter.sftp.max-files-per-directory}") int maxFilesPerDirectory,
			@Value("${gebiter.sftp.max-known-directories}") int maxKnownDirectories,
			@Value("${gebiter.sftp.max-path-length}") int maxPathLength,
			@Value("${gebiter.sftp.file-suffix}") String fileSuffix,
			@Value("${gebiter.sftp.part-suffix}") String partSuffix,
			@Value("${gebiter.sftp.retry-after-seconds}") String retryAfterSeconds) {
		requireText(host, "gebiter.sftp.host");
		requireText(user, "gebiter.sftp.user");
		requireText(hostKey, "gebiter.sftp.host-key");
		requireText(rootDir, "gebiter.sftp.root-dir");
		boolean privateKeyPathSet = privateKeyPath != null && !privateKeyPath.isBlank();
		if (!privateKeyPathSet) {
			requireText(password, "gebiter.sftp.password");
		}
		if (maxConnections < 1 || maxConnectionsPerUsers < 1) {
			throw new IllegalStateException(
					"gebiter.sftp.max-connections und max-connections-per-users müssen mindestens 1 sein.");
		}
		this.host = host;
		this.port = port;
		this.user = user;
		this.password = password;
		this.hostKey = hostKey.trim();
		this.privateKeyPath = privateKeyPath;
		// ohne Schrägstrich am Ende, der kommt beim Zusammensetzen der Pfade
		this.rootDir = rootDir.replaceAll("/+$", "");
		this.maxConnections = maxConnections;
		this.maxConnectionsPerUsers = maxConnectionsPerUsers;
		this.minIdleConnections = minIdleConnections;
		this.connectTimeout = connectTimeout;
		this.socketTimeout = socketTimeout;
		this.borrowTimeout = borrowTimeout;
		this.idleTimeout = idleTimeout;
		this.checkAliveAfter = checkAliveAfter;
		this.keepaliveInterval = keepaliveInterval;
		this.housekeepingInterval = housekeepingInterval;
		this.maxFilesPerDirectory = Math.max(1, maxFilesPerDirectory);
		this.maxKnownDirectories = maxKnownDirectories;
		this.maxPathLength = maxPathLength;
		this.fileSuffix = fileSuffix;
		this.partSuffix = partSuffix;
		this.retryAfterSeconds = retryAfterSeconds;
	}

	private static void requireText(String value, String propertyName) {
		if (value == null || value.isBlank()) {
			throw new IllegalStateException(propertyName + " fehlt, in der .env bzw. application.yaml setzen.");
		}
	}

	/** Anmeldung mit privatem Schlüssel statt Passwort, sobald ein Pfad gesetzt ist. */
	public boolean usesPrivateKey() {
		return privateKeyPath != null && !privateKeyPath.isBlank();
	}

	public String host() {
		return host;
	}

	public int port() {
		return port;
	}

	public String user() {
		return user;
	}

	/** Gilt nur ohne {@link #privateKeyPath()}. */
	public String password() {
		return password;
	}

	/** Öffentlicher Host-Key des Servers, Typ und Schlüssel ({@code ssh-ed25519 AAAA…}). */
	public String hostKey() {
		return hostKey;
	}

	public String privateKeyPath() {
		return privateKeyPath;
	}

	/** Wurzel aller Dateien aus Sicht des SFTP-Users, ohne Schrägstrich am Ende. */
	public String rootDir() {
		return rootDir;
	}

	public int maxConnections() {
		return maxConnections;
	}

	public int maxConnectionsPerUsers() {
		return maxConnectionsPerUsers;
	}

	public int minIdleConnections() {
		return minIdleConnections;
	}

	public Duration connectTimeout() {
		return connectTimeout;
	}

	public Duration socketTimeout() {
		return socketTimeout;
	}

	public Duration borrowTimeout() {
		return borrowTimeout;
	}

	public Duration idleTimeout() {
		return idleTimeout;
	}

	public Duration checkAliveAfter() {
		return checkAliveAfter;
	}

	public Duration keepaliveInterval() {
		return keepaliveInterval;
	}

	public Duration housekeepingInterval() {
		return housekeepingInterval;
	}

	public int maxFilesPerDirectory() {
		return maxFilesPerDirectory;
	}

	public int maxKnownDirectories() {
		return maxKnownDirectories;
	}

	public int maxPathLength() {
		return maxPathLength;
	}

	public String fileSuffix() {
		return fileSuffix;
	}

	public String partSuffix() {
		return partSuffix;
	}

	/** Für den Header {@code Retry-After} bei 503 und 429. */
	public String retryAfterSeconds() {
		return retryAfterSeconds;
	}
}
