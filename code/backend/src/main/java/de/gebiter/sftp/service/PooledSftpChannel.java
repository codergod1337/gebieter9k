package de.gebiter.sftp.service;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpException;

/**
 * Eine ausgeliehene SFTP-Verbindung mit Rückgabepflicht, wie in der Vorlage. Sie wird nur so benutzt:
 *
 * <pre>
 * try (PooledSftpChannel lentChannel = sftpConnectionPool.borrowSftpChannel()) {
 *     lentChannel.channel().put(…);
 * } // hier geht sie an den Broker zurück, auch bei einer Ausnahme
 * </pre>
 *
 * Eine zweite Rückgabe wird ignoriert, sonst gäbe der Broker mehr Plätze frei, als er hat. Nach einem Fehler meldet der
 * Aufrufer {@link #markBroken()}: Dann wird die Verbindung nicht wieder verliehen, sondern geschlossen.
 * <p>
 * Zwei Prüfungen mit sehr unterschiedlichen Kosten: {@link #isLocallyConnected()} sieht nur, was der Client selbst
 * weiß, und kostet nichts. {@link #isAlive()} fragt beim Server nach und erkennt auch Verbindungen, die der Server
 * längst aufgegeben hat.
 */
public final class PooledSftpChannel implements AutoCloseable {

	private static final Logger LOGGER = LoggerFactory.getLogger(PooledSftpChannel.class);

	private final Session session;

	private final ChannelSftp channel;

	private final SftpConnectionPool sftpConnectionPool;

	/** Wem sie gerade gehört. {@code null}: dem System, dann gibt es keinen Platz je User freizugeben. */
	private volatile UUID usersGuid;

	private final AtomicBoolean lent = new AtomicBoolean(false);

	private volatile boolean broken;

	private volatile long lastUsedNanos = System.nanoTime();

	PooledSftpChannel(Session session, ChannelSftp channel, SftpConnectionPool sftpConnectionPool) {
		this.session = session;
		this.channel = channel;
		this.sftpConnectionPool = sftpConnectionPool;
	}

	/** Die rohe Verbindung. Was man damit tun kann, weiß die Bibliothek besser als jede Hülle. */
	public ChannelSftp channel() {
		return channel;
	}

	/** Nach einem Fehler: nicht wieder verleihen, beim Zurückgeben schließen. */
	public void markBroken() {
		broken = true;
	}

	boolean isBroken() {
		return broken;
	}

	UUID usersGuid() {
		return usersGuid;
	}

	/** Beim Ausleihen: wem sie ab jetzt gehört. */
	PooledSftpChannel lendTo(UUID newUsersGuid) {
		usersGuid = newUsersGuid;
		broken = false;
		lent.set(true);
		return this;
	}

	void touch() {
		lastUsedNanos = System.nanoTime();
	}

	/** So lange liegt sie unbenutzt im Broker. */
	Duration idleTime() {
		long idleNanos = System.nanoTime() - lastUsedNanos;
		return Duration.ofNanos(idleNanos);
	}

	/** Sieht von hier aus offen aus, ohne Kontakt zum Server. */
	boolean isLocallyConnected() {
		return channel.isConnected() && session.isConnected();
	}

	/** Lebt wirklich noch: ein stat auf das Arbeitsverzeichnis, die kleinstmögliche Anfrage an den Server. */
	boolean isAlive() {
		if (!isLocallyConnected()) {
			return false;
		}
		try {
			channel.stat(".");
			return true;
		} catch (SftpException exception) {
			LOGGER.debug("SFTP-Verbindung ist tot: {}", exception.getMessage());
			return false;
		}
	}

	/** Schließt Kanal und Sitzung und wirft nie: Aufräumen darf den eigentlichen Fehler nicht verdecken. */
	void closeQuietly() {
		try {
			channel.disconnect();
		} catch (RuntimeException exception) {
			LOGGER.debug("SFTP-Kanal schließen fehlgeschlagen: {}", exception.getMessage());
		}
		try {
			session.disconnect();
		} catch (RuntimeException exception) {
			LOGGER.debug("SFTP-Sitzung schließen fehlgeschlagen: {}", exception.getMessage());
		}
	}

	/** Das Ende des try-Blocks: die Rückgabe an den Broker. Nur die erste zählt. */
	@Override
	public void close() {
		boolean wasLent = lent.compareAndSet(true, false);
		if (wasLent) {
			sftpConnectionPool.returnSftpChannel(this);
		}
	}
}
