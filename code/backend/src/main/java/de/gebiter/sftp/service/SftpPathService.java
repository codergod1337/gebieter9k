package de.gebiter.sftp.service;

import java.time.LocalDate;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import de.gebiter.sftp.SftpConfig;

/**
 * Wohin eine Datei auf dem Dateispeicher gehört, wie in der Vorlage: {@code JJJJ/MM/TT[_n]/<sha256>.bin}, relativ zum
 * root-dir.
 * <p>
 * Nach Tagen aufgeteilt, weil Ordner mit sehr vielen Dateien langsam werden und der Pfad so für Menschen lesbar bleibt.
 * Ab {@code gebiter.sftp.max-files-per-directory} Dateien am Tag kommt ein weiterer Ordner {@code TT_1}, {@code TT_2}
 * und so weiter. Der Zähler lebt nur im Arbeitsspeicher und beginnt nach einem Neustart bei 0: Dann hat der erste
 * Tagesordner mal mehr Dateien, das ist harmlos. Der Dateiname ist der Hash des Inhalts, zwei verschiedene Dateien
 * bekommen also nie denselben Pfad.
 */
@Service
public class SftpPathService {

	/** SHA-256 als Hex: genau 64 Zeichen 0–9 und a–f. */
	private static final Pattern SHA256_HEX_PATTERN = Pattern.compile("[0-9a-f]{64}");

	/** Ein Dateiname, wie der {@link SftpService} ihn als Pfadsegment annimmt. */
	private static final Pattern FILE_NAME_PATTERN = Pattern.compile("[A-Za-z0-9._-]+");

	private final SftpConfig sftpConfig;

	private LocalDate counterDate = LocalDate.now();

	private int storedOnCounterDate;

	public SftpPathService(SftpConfig sftpConfig) {
		this.sftpConfig = sftpConfig;
	}

	/** Der Tagesordner für die nächste Datei, z. B. {@code 2026/11/05} oder {@code 2026/11/05_1}. Zählt die Datei mit. */
	public synchronized String nextRelativeDirectory() {
		LocalDate today = LocalDate.now();
		if (!today.equals(counterDate)) {
			counterDate = today;
			storedOnCounterDate = 0;
		}
		int directoryNumber = storedOnCounterDate / sftpConfig.maxFilesPerDirectory();
		storedOnCounterDate = storedOnCounterDate + 1;
		String dayDirectory = String.format("%02d", today.getDayOfMonth());
		if (directoryNumber > 0) {
			dayDirectory = dayDirectory + "_" + directoryNumber;
		}
		return String.format("%d/%02d/%s", today.getYear(), today.getMonthValue(), dayDirectory);
	}

	/**
	 * Der volle relative Pfad für eine Datei, deren Hash schon bekannt ist: Tagesordner plus {@code <sha256>.bin}.
	 *
	 * @throws IllegalArgumentException wenn {@code sha256Hex} kein SHA-256 als Hex ist
	 */
	public String createRelativePath(String sha256Hex) {
		String normalizedSha256Hex = "";
		if (sha256Hex != null) {
			normalizedSha256Hex = sha256Hex.trim().toLowerCase(Locale.ROOT);
		}
		boolean validSha256Hex = SHA256_HEX_PATTERN.matcher(normalizedSha256Hex).matches();
		if (!validSha256Hex) {
			throw new IllegalArgumentException("sha256Hex ist kein SHA-256 als Hex.");
		}
		String relativeDirectory = nextRelativeDirectory();
		return relativeDirectory + "/" + normalizedSha256Hex + sftpConfig.fileSuffix();
	}

	/**
	 * Derselbe Tagesordner für eine Datei mit beliebigem Namen, z. B. später Sicherungen. Tageslogik und Zähler sind
	 * dieselben wie bei den Dateien, nur der Name kommt vom Aufrufer. Für eindeutige Namen sorgt der Aufrufer, zwei
	 * gleiche Namen am selben Tag überschrieben sich.
	 *
	 * @throws IllegalArgumentException wenn der Name andere Zeichen als A–Z, a–z, 0–9, Punkt, Unterstrich, Minus enthält
	 */
	public String createRelativePathForFileName(String fileName) {
		boolean validFileName = fileName != null && FILE_NAME_PATTERN.matcher(fileName).matches();
		if (!validFileName) {
			throw new IllegalArgumentException(
					"fileName darf nur A–Z, a–z, 0–9, Punkt, Unterstrich und Minus enthalten.");
		}
		String relativeDirectory = nextRelativeDirectory();
		return relativeDirectory + "/" + fileName;
	}
}
