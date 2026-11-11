package de.gebiter.util;

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.HexFormat;

/**
 * Zählt die Bytes, die durchlaufen, und rechnet dabei auf Wunsch den SHA-256 mit, wie in der Vorlage. So kennt z. B.
 * der {@code SftpService} nach dem Schreiben Größe und Hash, ohne die Datei ein zweites Mal zu lesen; der Tika-Test
 * zählt damit die empfangenen Bytes. Der umhüllte Strom gehört dem Aufrufer, {@code close()} schließt ihn deshalb
 * nicht. Liegt hier, weil ihn mehrere Pakete nutzen.
 */
public final class CountingDigestInputStream extends FilterInputStream {

	/** {@code null}: nur zählen. */
	private final MessageDigest sha256Digest;

	private long byteCount;

	public CountingDigestInputStream(InputStream content, MessageDigest sha256Digest) {
		super(content);
		this.sha256Digest = sha256Digest;
	}

	@Override
	public int read() throws IOException {
		int readByte = in.read();
		if (readByte >= 0) {
			byteCount = byteCount + 1;
			if (sha256Digest != null) {
				byte readByteValue = (byte) readByte;
				sha256Digest.update(readByteValue);
			}
		}
		return readByte;
	}

	@Override
	public int read(byte[] buffer, int offset, int length) throws IOException {
		int readCount = in.read(buffer, offset, length);
		if (readCount > 0) {
			byteCount = byteCount + readCount;
			if (sha256Digest != null) {
				sha256Digest.update(buffer, offset, readCount);
			}
		}
		return readCount;
	}

	/** Überspringen liefe am Hash vorbei: stattdessen lesen und verwerfen. */
	@Override
	public long skip(long bytesToSkip) throws IOException {
		byte[] buffer = new byte[8192];
		long skippedCount = 0;
		while (skippedCount < bytesToSkip) {
			long remainingCount = bytesToSkip - skippedCount;
			int chunkLength = (int) Math.min(buffer.length, remainingCount);
			int readCount = read(buffer, 0, chunkLength);
			if (readCount < 0) {
				break;
			}
			skippedCount = skippedCount + readCount;
		}
		return skippedCount;
	}

	@Override
	public boolean markSupported() {
		return false;
	}

	@Override
	public void close() {
		// der Strom gehört dem Aufrufer, der schließt ihn auch
	}

	/** So viele Bytes sind bisher durchgelaufen. */
	public long byteCount() {
		return byteCount;
	}

	/** Der SHA-256 der durchgelaufenen Bytes als Hex, nur mit Digest. Danach beginnt der Digest von vorn. */
	public String sha256Hex() {
		byte[] sha256Bytes = sha256Digest.digest();
		HexFormat lowerCaseHexFormat = HexFormat.of();
		return lowerCaseHexFormat.formatHex(sha256Bytes);
	}
}
