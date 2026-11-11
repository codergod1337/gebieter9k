package de.gebiter.rank.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.badge.model.BadgeLook;
import de.gebiter.badge.service.BadgeLookService;
import de.gebiter.rank.model.Rank;
import de.gebiter.rank.repository.RankRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link Rank}: die Rangleiter. Er nutzt nur sein eigenes {@link RankRepository}, das Aussehen prüft
 * der {@link BadgeLookService}. Anlegen, Ändern, Verschieben und Löschen darf nur der Admin. Noch hängt nichts an einem
 * Rang, deshalb lässt er sich ohne Zirkel löschen.
 * <p>
 * Die Stufe ergibt sich aus der Reihenfolge: Ein neuer Rang kommt oben drauf, umgestellt wird per Drag and Drop
 * ({@link #changeRankLevels(List)}). Das Formular ändert sie nicht.
 */
@Service
public class RankService {

	private final RankRepository rankRepository;

	private final BadgeLookService badgeLookService;

	/** In dieser Sprache muss jeder Anzeigename Text haben ({@code gebiter.language.default-code}). */
	private final String defaultLanguageCode;

	public RankService(RankRepository rankRepository, BadgeLookService badgeLookService,
			@Value("${gebiter.language.default-code}") String defaultLanguageCode) {
		this.rankRepository = rankRepository;
		this.badgeLookService = badgeLookService;
		this.defaultLanguageCode = defaultLanguageCode;
	}

	/**
	 * CREATE: Legt einen Rang oben auf der Leiter an. Das Aussehen darf fehlen.
	 *
	 * @throws IllegalArgumentException wenn der Key die Key-Regel verletzt, der Name in der Pflichtsprache fehlt, die
	 *         Mindestpunkte negativ sind oder das Aussehen ungültig ist
	 * @throws DuplicateKeyException wenn es den Key schon gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public Rank createRank(String rankKey, Map<String, String> displayName, long minimumPoints, BadgeLook badgeLook) {
		Helper.requireValidKey(rankKey);
		Helper.requireMultilingualText(displayName, "displayName", defaultLanguageCode);
		requireValidMinimumPoints(minimumPoints);
		BadgeLook validBadgeLook = badgeLookService.requireValidBadgeLook(badgeLook);
		// Ohne diese Prüfung würde save() einen bestehenden Rang still überschreiben.
		boolean rankKeyTaken = rankRepository.existsById(rankKey);
		if (rankKeyTaken) {
			throw new DuplicateKeyException("Den Rang " + rankKey + " gibt es schon.");
		}
		int newLevel = 1;
		Optional<Rank> topRank = rankRepository.findTopByOrderByLevelDesc();
		if (topRank.isPresent()) {
			int topLevel = topRank.get().getLevel();
			newLevel = topLevel + 1;
		}
		Rank newRank = new Rank(rankKey, displayName, newLevel, minimumPoints, validBadgeLook);
		return rankRepository.save(newRank);
	}

	/**
	 * READ: Ein Rang über seinen Key.
	 *
	 * @throws EntityNotFoundException wenn es den Rang nicht gibt
	 */
	@Transactional(readOnly = true)
	public Rank getRank(String rankKey) {
		Helper.requireNotNull(rankKey, "rankKey");
		return doGetRank(rankKey);
	}

	/** READ: Alle Ränge, von Stufe 1 aufwärts. */
	@Transactional(readOnly = true)
	public List<Rank> getAllRank() {
		return rankRepository.findAllByOrderByLevelAsc();
	}

	/**
	 * UPDATE: Ändert einen Rang. Der Key bestimmt nur, welcher; übernommen werden Anzeigename, Mindestpunkte und
	 * Aussehen. Die Stufe ändert nur {@link #changeRankLevels(List)}.
	 *
	 * @throws IllegalArgumentException wenn der Key oder der Name in der Pflichtsprache fehlt, die Mindestpunkte negativ
	 *         sind oder das Aussehen ungültig ist
	 * @throws EntityNotFoundException wenn es den Rang nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public Rank changeRank(Rank changedRank) {
		String rankKey = changedRank.getKey();
		Helper.requireNotNull(rankKey, "key");
		Map<String, String> changedDisplayName = changedRank.getDisplayName();
		Helper.requireMultilingualText(changedDisplayName, "displayName", defaultLanguageCode);
		long changedMinimumPoints = changedRank.getMinimumPoints();
		requireValidMinimumPoints(changedMinimumPoints);
		BadgeLook enteredBadgeLook = changedRank.getBadgeLook();
		BadgeLook changedBadgeLook = badgeLookService.requireValidBadgeLook(enteredBadgeLook);

		Rank existingRank = doGetRank(rankKey);
		existingRank.setDisplayName(changedDisplayName);
		existingRank.setMinimumPoints(changedMinimumPoints);
		existingRank.setBadgeLook(changedBadgeLook);
		return rankRepository.save(existingRank);
	}

	/**
	 * UPDATE: Die neue Reihenfolge nach Drag and Drop im Tab „Ränge“. Der erste Key bekommt Stufe 1, der nächste 2 usw.
	 * Die Mindestpunkte wandern mit ihrem Rang, sie passt der Admin danach selbst an.
	 *
	 * @param rankKeysInOrder jeder Key genau einmal, von Stufe 1 aufwärts
	 * @return alle Ränge in der neuen Reihenfolge
	 * @throws IllegalArgumentException wenn ein Key fehlt, doppelt oder unbekannt ist
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public List<Rank> changeRankLevels(List<String> rankKeysInOrder) {
		List<Rank> allRanks = rankRepository.findAllByOrderByLevelAsc();
		List<String> existingRankKeys = new ArrayList<>();
		for (Rank rank : allRanks) {
			String existingRankKey = rank.getKey();
			existingRankKeys.add(existingRankKey);
		}
		Helper.requireCompleteKeyOrder(rankKeysInOrder, existingRankKeys, "keysInOrder");
		// Die Stufe ist eindeutig, Postgres prüft das je UPDATE. Beim Tauschen hätten kurz zwei Ränge dieselbe Stufe.
		// Deshalb erst alle auf eine freie negative Stufe schreiben, dann auf die neue.
		for (Rank rank : allRanks) {
			String rankKey = rank.getKey();
			int temporaryLevel = -(rankKeysInOrder.indexOf(rankKey) + 1);
			rank.setLevel(temporaryLevel);
		}
		rankRepository.saveAllAndFlush(allRanks);
		for (Rank rank : allRanks) {
			String rankKey = rank.getKey();
			int newLevel = rankKeysInOrder.indexOf(rankKey) + 1;
			rank.setLevel(newLevel);
		}
		rankRepository.saveAllAndFlush(allRanks);
		return rankRepository.findAllByOrderByLevelAsc();
	}

	/**
	 * DELETE: Löscht einen Rang. Die Ränge darüber rücken eine Stufe nach unten, so bleibt die Leiter lückenlos.
	 *
	 * @throws EntityNotFoundException wenn es den Rang nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteRank(String rankKey) {
		Helper.requireNotNull(rankKey, "key");
		Rank existingRank = doGetRank(rankKey);
		rankRepository.delete(existingRank);
		rankRepository.flush();
		List<Rank> remainingRanks = rankRepository.findAllByOrderByLevelAsc();
		int nextLevel = 1;
		for (Rank remainingRank : remainingRanks) {
			// von unten nach oben: Die Stufe darunter ist immer schon frei
			remainingRank.setLevel(nextLevel);
			rankRepository.saveAndFlush(remainingRank);
			nextLevel = nextLevel + 1;
		}
	}

	private void requireValidMinimumPoints(long minimumPoints) {
		if (minimumPoints < 0) {
			throw new IllegalArgumentException("Die Mindestpunkte beginnen bei 0.");
		}
	}

	private Rank doGetRank(String rankKey) {
		Optional<Rank> foundRank = rankRepository.findById(rankKey);
		if (foundRank.isEmpty()) {
			throw new EntityNotFoundException("Den Rang " + rankKey + " gibt es nicht.");
		}
		return foundRank.get();
	}
}
