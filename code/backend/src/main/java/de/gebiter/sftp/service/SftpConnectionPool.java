package de.gebiter.sftp.service;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Iterator;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;

import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.sftp.SftpConfig;
import de.gebiter.sftp.SftpPerUsersLimitException;
import de.gebiter.sftp.SftpUnavailableException;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

/**
 * Der Verbindungsbroker, wie {@code SftpConnectionPool} der Vorlage: Er hält SFTP-Verbindungen offen und verleiht sie.
 * Eine Verbindung aufzubauen kostet Schlüsseltausch und Anmeldung, leicht ein paar hundert Millisekunden: Das soll nicht
 * bei jeder Datei fällig sein.
 * <p>
 * Zwei Grenzen, beide als faire Semaphore (wer zuerst wartet, kommt zuerst dran): eine für alle Verbindungen zusammen
 * ({@code gebiter.sftp.max-connections}, 10) und eine je angemeldetem User ({@code max-connections-per-users}). Ob die
 * Grenze je User gilt, entscheidet nicht der Aufrufer, sondern der {@link CurrentUsersProvider}: Ist ein Mensch
 * angemeldet, zählt sein Platz, läuft das Backend aus sich heraus, gilt nur die globale Grenze. Ein Controller kann die
 * Grenze je User damit nicht umgehen.
 * <p>
 * SICHERHEIT: Nur der Server mit dem konfigurierten Host-Key wird akzeptiert ({@code StrictHostKeyChecking}),
 * Host-Key-Pinning gegen Man-in-the-Middle. Steht unter der Adresse ein anderer Server, kommt keine Verbindung zustande:
 * Niemand kann dem Backend falsche Dateien unterschieben, Passwort und Übertragungen mitlesen. Anmeldung mit Passwort
 * oder Schlüssel.
 * <p>
 * Verbindungen werden beim Ausleihen nur dann beim Server geprüft, wenn sie länger unbenutzt waren. Ein Keepalive hält
 * sie offen, ein Aufräumer schließt, was lange unbenutzt liegt, und hält {@code min-idle-connections} vor. Der Start
 * wartet nicht auf den Server: Ist er nicht da, versucht es der Aufräumer wieder.
 */
@Component
public class SftpConnectionPool {

	private static final Logger LOGGER = LoggerFactory.getLogger(SftpConnectionPool.class);

	private final SftpConfig sftpConfig;

	private final CurrentUsersProvider currentUsersProvider;

	private final JSch jsch;

	private final Semaphore globalPermits;

	private final ConcurrentMap<UUID, Semaphore> permitsByUsersGuid = new ConcurrentHashMap<>();

	/** Zuletzt zurückgegebene zuerst: so bleiben die untätigen untätig und fallen dem Aufräumer anheim. */
	private final LinkedBlockingDeque<PooledSftpChannel> idleChannels = new LinkedBlockingDeque<>();

	private final ScheduledExecutorService housekeeping;

	private volatile boolean shuttingDown;

	/** Damit ein fehlender Server nicht bei jedem Aufräumen eine Warnung erzeugt. */
	private volatile boolean unreachableLogged;

	/** Die erste gelungene Verbindung steht einmal im Log, danach nur noch nach einem Ausfall. */
	private volatile boolean everConnected;

	public SftpConnectionPool(SftpConfig sftpConfig, CurrentUsersProvider currentUsersProvider) {
		this.sftpConfig = sftpConfig;
		this.currentUsersProvider = currentUsersProvider;
		this.jsch = createJsch();
		int maxConnections = sftpConfig.maxConnections();
		this.globalPermits = new Semaphore(maxConnections, true);
		this.housekeeping = Executors.newSingleThreadScheduledExecutor(task -> {
			Thread housekeepingThread = new Thread(task, "sftp-housekeeping");
			// darf das Beenden der Anwendung nicht aufhalten, wenn er gerade auf einen langsamen Server wartet
			housekeepingThread.setDaemon(true);
			return housekeepingThread;
		});
	}

	@PostConstruct
	void start() {
		String authenticationText = "Passwort";
		if (sftpConfig.usesPrivateKey()) {
			authenticationText = "Schlüssel";
		}
		LOGGER.info("SFTP-Broker: {}:{} als {} ({}), Wurzel {}, höchstens {} Verbindungen, {} je User", sftpConfig.host(),
				sftpConfig.port(), sftpConfig.user(), authenticationText, sftpConfig.rootDir(),
				sftpConfig.maxConnections(), sftpConfig.maxConnectionsPerUsers());
		long housekeepingSeconds = sftpConfig.housekeepingInterval().toSeconds();
		housekeeping.scheduleWithFixedDelay(this::housekeep, 0, housekeepingSeconds, TimeUnit.SECONDS);
	}

	/**
	 * Schließt die freien Verbindungen. Die ausgeliehenen schließen sich bei ihrer Rückgabe selbst: Sie mitten in einer
	 * Übertragung wegzureißen, zerstörte die Datei.
	 */
	@PreDestroy
	void shutdown() {
		shuttingDown = true;
		housekeeping.shutdownNow();
		PooledSftpChannel idleChannel = idleChannels.poll();
		while (idleChannel != null) {
			idleChannel.closeQuietly();
			idleChannel = idleChannels.poll();
		}
	}

	/**
	 * Holt eine Verbindung. Ist ein User angemeldet, braucht er erst seinen eigenen Platz, dann einen globalen. In dieser
	 * Reihenfolge, sonst belegte jemand, der seine eigene Grenze erreicht hat, einen globalen Platz und blockierte
	 * andere. Läuft die Wartezeit ab: 429 am eigenen Platz, 503 am globalen.
	 *
	 * @throws SftpPerUsersLimitException wenn der User keinen eigenen Platz mehr bekommt
	 * @throws SftpUnavailableException wenn der Broker voll oder der Server nicht erreichbar ist
	 */
	public PooledSftpChannel borrowSftpChannel() {
		String retryAfterSeconds = sftpConfig.retryAfterSeconds();
		if (shuttingDown) {
			throw new SftpUnavailableException("Der Dateispeicher wird gerade heruntergefahren.", retryAfterSeconds);
		}
		UUID usersGuid = null;
		boolean usersLoggedIn = currentUsersProvider.isAuthenticated();
		if (usersLoggedIn) {
			usersGuid = currentUsersProvider.currentUsersGuid();
		}
		Semaphore usersPermits = null;
		if (usersGuid != null) {
			int maxConnectionsPerUsers = sftpConfig.maxConnectionsPerUsers();
			usersPermits = permitsByUsersGuid.computeIfAbsent(usersGuid, guid -> new Semaphore(maxConnectionsPerUsers, true));
			boolean usersPermitAcquired = tryAcquire(usersPermits);
			if (!usersPermitAcquired) {
				throw new SftpPerUsersLimitException(maxConnectionsPerUsers, retryAfterSeconds);
			}
		}
		boolean globalPermitAcquired = tryAcquire(globalPermits);
		if (!globalPermitAcquired) {
			release(usersPermits);
			LOGGER.warn("SFTP-Broker: alle {} Verbindungen belegt, Wartezeit abgelaufen", sftpConfig.maxConnections());
			throw new SftpUnavailableException("Der Dateispeicher ist gerade ausgelastet.", retryAfterSeconds);
		}
		try {
			PooledSftpChannel channelToLend = takeIdleOrOpenChannel();
			return channelToLend.lendTo(usersGuid);
		} catch (RuntimeException exception) {
			// die eben reservierten Plätze wieder frei, sonst wären sie belegt, ohne dass jemand eine Verbindung hat
			globalPermits.release();
			release(usersPermits);
			throw exception;
		}
	}

	/**
	 * Die Rückgabe, gerufen von {@link PooledSftpChannel#close()}. Brauchbare Verbindungen kommen zurück in den Bestand,
	 * kaputte werden geschlossen. Die Plätze werden im finally frei: Ginge beim Schließen etwas schief, blieben sie sonst
	 * für immer belegt.
	 */
	void returnSftpChannel(PooledSftpChannel returnedChannel) {
		try {
			boolean reusable = !returnedChannel.isBroken() && !shuttingDown && returnedChannel.isLocallyConnected();
			if (reusable) {
				returnedChannel.touch();
				idleChannels.offerFirst(returnedChannel);
			} else {
				returnedChannel.closeQuietly();
			}
		} finally {
			globalPermits.release();
			UUID usersGuid = returnedChannel.usersGuid();
			if (usersGuid != null) {
				Semaphore usersPermits = permitsByUsersGuid.get(usersGuid);
				release(usersPermits);
			}
		}
	}

	/** Erst der Bestand, geprüft nur nach längerer Pause, sonst eine neue Verbindung. */
	private PooledSftpChannel takeIdleOrOpenChannel() {
		PooledSftpChannel idleChannel = idleChannels.pollFirst();
		while (idleChannel != null) {
			Duration idleTime = idleChannel.idleTime();
			boolean recentlyUsed = idleTime.compareTo(sftpConfig.checkAliveAfter()) < 0;
			boolean usable;
			if (recentlyUsed) {
				usable = idleChannel.isLocallyConnected();
			} else {
				usable = idleChannel.isAlive();
			}
			if (usable) {
				return idleChannel;
			}
			idleChannel.closeQuietly();
			idleChannel = idleChannels.pollFirst();
		}
		return openChannel();
	}

	/**
	 * Hält den Bestand in Ordnung: schließt, was länger als {@code idle-timeout} unbenutzt liegt
	 * ({@code min-idle-connections} bleiben), und füllt auf {@code min-idle-connections} auf, solange die globale Grenze
	 * es zulässt.
	 */
	private void housekeep() {
		if (shuttingDown) {
			return;
		}
		int minIdleConnections = Math.min(sftpConfig.minIdleConnections(), sftpConfig.maxConnections());
		Iterator<PooledSftpChannel> oldestFirst = idleChannels.descendingIterator();
		while (oldestFirst.hasNext()) {
			PooledSftpChannel idleChannel = oldestFirst.next();
			boolean moreThanMinimum = idleChannels.size() > minIdleConnections;
			Duration idleTime = idleChannel.idleTime();
			boolean idleTooLong = idleTime.compareTo(sftpConfig.idleTimeout()) > 0;
			if (moreThanMinimum && idleTooLong) {
				oldestFirst.remove();
				idleChannel.closeQuietly();
			}
		}
		while (idleChannels.size() < minIdleConnections && lentCount() + idleChannels.size() < sftpConfig.maxConnections()) {
			try {
				PooledSftpChannel warmedUpChannel = openChannel();
				idleChannels.offerFirst(warmedUpChannel);
			} catch (SftpUnavailableException exception) {
				if (!unreachableLogged) {
					Throwable cause = exception.getCause();
					String reason = exception.getMessage();
					if (cause != null) {
						reason = cause.getMessage();
					}
					LOGGER.warn("SFTP-Vorwärmen fehlgeschlagen, nächster Versuch in {} s: {}",
							sftpConfig.housekeepingInterval().toSeconds(), reason);
					unreachableLogged = true;
				}
				return;
			}
		}
	}

	/** Wie viele gerade ausgeliehen sind, abgeleitet aus den vergebenen Plätzen: kein zweiter Zähler daneben. */
	private int lentCount() {
		int availablePermits = globalPermits.availablePermits();
		return sftpConfig.maxConnections() - availablePermits;
	}

	private PooledSftpChannel openChannel() {
		int connectTimeoutMillis = (int) sftpConfig.connectTimeout().toMillis();
		try {
			Session session = jsch.getSession(sftpConfig.user(), sftpConfig.host(), sftpConfig.port());
			if (!sftpConfig.usesPrivateKey()) {
				byte[] passwordBytes = sftpConfig.password().getBytes(StandardCharsets.UTF_8);
				session.setPassword(passwordBytes);
			}
			// Nur der Server aus der known_hosts-Zeile (Host-Key aus der .env) wird akzeptiert, ein anderer bricht ab.
			session.setConfig("StrictHostKeyChecking", "yes");
			int keepaliveIntervalMillis = (int) sftpConfig.keepaliveInterval().toMillis();
			session.setServerAliveInterval(keepaliveIntervalMillis);
			session.setServerAliveCountMax(3);
			int socketTimeoutMillis = (int) sftpConfig.socketTimeout().toMillis();
			session.setTimeout(socketTimeoutMillis);
			session.connect(connectTimeoutMillis);
			ChannelSftp channel = (ChannelSftp) session.openChannel("sftp");
			channel.connect(connectTimeoutMillis);
			if (unreachableLogged || !everConnected) {
				LOGGER.info("SFTP-Server {}:{} erreichbar, Host-Key geprüft, Anmeldung als {} ok", sftpConfig.host(),
						sftpConfig.port(), sftpConfig.user());
				unreachableLogged = false;
				everConnected = true;
			}
			return new PooledSftpChannel(session, channel, this);
		} catch (JSchException exception) {
			LOGGER.debug("SFTP-Verbindung zu {}:{} fehlgeschlagen: {}", sftpConfig.host(), sftpConfig.port(),
					exception.getMessage());
			String retryAfterSeconds = sftpConfig.retryAfterSeconds();
			throw new SftpUnavailableException("Der Dateispeicher ist gerade nicht erreichbar.", retryAfterSeconds,
					exception);
		}
	}

	/** Einmal für alle Verbindungen: der erlaubte Host-Key und, falls gesetzt, der eigene Schlüssel. */
	private JSch createJsch() {
		try {
			JSch newJsch = new JSch();
			String knownHostsLine = createKnownHostsLine();
			byte[] knownHostsBytes = knownHostsLine.getBytes(StandardCharsets.UTF_8);
			ByteArrayInputStream knownHostsStream = new ByteArrayInputStream(knownHostsBytes);
			newJsch.setKnownHosts(knownHostsStream);
			if (sftpConfig.usesPrivateKey()) {
				newJsch.addIdentity(sftpConfig.privateKeyPath());
			}
			return newJsch;
		} catch (JSchException exception) {
			throw new IllegalStateException(
					"gebiter.sftp: Host-Key oder privater Schlüssel sind unbrauchbar: " + exception.getMessage(), exception);
		}
	}

	/** Eine known_hosts-Zeile: der Host so, wie JSch ihn beim Verbinden nennt, bei anderem Port als 22 mit Klammern. */
	private String createKnownHostsLine() {
		String knownHostName = sftpConfig.host();
		// 22 ist der feste SSH-Standardport, nur für ihn steht der Host in known_hosts ohne Klammern
		if (sftpConfig.port() != 22) {
			knownHostName = "[" + sftpConfig.host() + "]:" + sftpConfig.port();
		}
		return knownHostName + " " + sftpConfig.hostKey() + "\n";
	}

	/** Wartet auf einen Platz. {@code false}, wenn die Zeit ablief. Eine Unterbrechung wird weitergereicht. */
	private boolean tryAcquire(Semaphore permits) {
		long borrowTimeoutMillis = sftpConfig.borrowTimeout().toMillis();
		try {
			return permits.tryAcquire(borrowTimeoutMillis, TimeUnit.MILLISECONDS);
		} catch (InterruptedException exception) {
			Thread.currentThread().interrupt();
			String retryAfterSeconds = sftpConfig.retryAfterSeconds();
			throw new SftpUnavailableException("Das Warten auf den Dateispeicher wurde unterbrochen.", retryAfterSeconds,
					exception);
		}
	}

	private static void release(Semaphore permits) {
		if (permits != null) {
			permits.release();
		}
	}
}
