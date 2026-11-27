package de.gebiter.knowledge.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.knowledge.model.KnowledgeSection;
import de.gebiter.knowledge.repository.KnowledgeSectionRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Die Gliederung der Wissensdatenbank (Rubriken, Kapitel, Unterkapitel): Pflege durch den Admin im Modul
 * „Wissensmanager“, Lesen für jeden, auch ohne Anmeldung (die Wissensdatenbank ist öffentlich zum Ansehen). Nutzt nur
 * sein eigenes Repository und, wenn sich ein Key ändert, den {@link KnowledgePageSectionKeyService} für die Seiten im
 * Solr-Kern.
 * <p>
 * Ein Löschen gibt es noch nicht: Sobald Seiten im Solr-Kern auf die Keys zeigen, wird vorher mit dem Nutzer geklärt,
 * was dann mit ihnen geschieht.
 * <p>
 * Doku: {@code docu/entities/KnowledgeSection.md}.
 */
@Service
public class KnowledgeSectionService {

	private final KnowledgeSectionRepository knowledgeSectionRepository;

	private final KnowledgePageSectionKeyService knowledgePageSectionKeyService;

	private final String defaultLanguageCode;

	public KnowledgeSectionService(KnowledgeSectionRepository knowledgeSectionRepository,
			KnowledgePageSectionKeyService knowledgePageSectionKeyService,
			@Value("${gebiter.language.default-code}") String defaultLanguageCode) {
		this.knowledgeSectionRepository = knowledgeSectionRepository;
		this.knowledgePageSectionKeyService = knowledgePageSectionKeyService;
		this.defaultLanguageCode = defaultLanguageCode;
	}

	/**
	 * CREATE: Legt einen Punkt der Gliederung am Ende seiner Geschwister an. Nur {@code rubricKey}: eine Rubrik; dazu
	 * {@code chapterKey}: ein Kapitel in dieser Rubrik; dazu {@code subChapterKey}: ein Unterkapitel in diesem Kapitel.
	 * Den Punkt darüber muss es schon geben.
	 *
	 * @throws IllegalArgumentException wenn ein Key oder der Name nicht passt, ein Unterkapitel ohne Kapitel kommt oder
	 *         es die Rubrik bzw. das Kapitel darüber nicht gibt
	 * @throws DuplicateKeyException wenn es den Punkt schon gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public KnowledgeSection createKnowledgeSection(String rubricKey, String chapterKey, String subChapterKey,
			Map<String, String> displayName) {
		Helper.requireValidKey(rubricKey);
		if (chapterKey != null) {
			Helper.requireValidKey(chapterKey);
		}
		if (subChapterKey != null) {
			Helper.requireValidKey(subChapterKey);
		}
		boolean subChapterWithoutChapter = subChapterKey != null && chapterKey == null;
		if (subChapterWithoutChapter) {
			throw new IllegalArgumentException("Ein Unterkapitel braucht sein Kapitel: chapterKey fehlt.");
		}
		Helper.requireMultilingualText(displayName, "displayName", defaultLanguageCode);

		List<KnowledgeSection> allKnowledgeSections = knowledgeSectionRepository.findAllByOrderByListingPositionAscIdAsc();
		Optional<KnowledgeSection> existingKnowledgeSection = findKnowledgeSection(allKnowledgeSections, rubricKey,
				chapterKey, subChapterKey);
		if (existingKnowledgeSection.isPresent()) {
			String existingSectionName = describeKnowledgeSection(rubricKey, chapterKey, subChapterKey);
			throw new DuplicateKeyException(existingSectionName + " gibt es schon.");
		}
		requireExistingParent(allKnowledgeSections, rubricKey, chapterKey, subChapterKey);

		KnowledgeSection newKnowledgeSection = new KnowledgeSection(rubricKey, chapterKey, subChapterKey, displayName, 0);
		List<KnowledgeSection> siblings = findSiblings(allKnowledgeSections, newKnowledgeSection);
		int lastListingPosition = 0;
		for (KnowledgeSection sibling : siblings) {
			int siblingListingPosition = sibling.getListingPosition();
			if (siblingListingPosition > lastListingPosition) {
				lastListingPosition = siblingListingPosition;
			}
		}
		newKnowledgeSection.setListingPosition(lastListingPosition + 1);
		return knowledgeSectionRepository.save(newKnowledgeSection);
	}

	/**
	 * READ: Die ganze Gliederung, für jeden, auch ohne Anmeldung: alle Rubriken, Kapitel und Unterkapitel, nach ihrem
	 * Platz unter den Geschwistern. Den Baum daraus setzt der Aufrufer über die Keys zusammen.
	 */
	@Transactional(readOnly = true)
	public List<KnowledgeSection> getAllKnowledgeSection() {
		return knowledgeSectionRepository.findAllByOrderByListingPositionAscIdAsc();
	}

	/**
	 * READ: Ein Punkt der Gliederung über seine id.
	 *
	 * @throws EntityNotFoundException wenn es ihn nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional(readOnly = true)
	public KnowledgeSection getKnowledgeSection(Long knowledgeSectionId) {
		Helper.requireNotNull(knowledgeSectionId, "knowledgeSectionId");
		return doGetKnowledgeSection(knowledgeSectionId);
	}

	/**
	 * UPDATE: Ändert den Anzeigenamen eines Punkts; die id bestimmt nur, welchen. Den Key ändert
	 * {@link #changeKnowledgeSectionKey}, den Platz {@link #changeKnowledgeSectionListingPositions}.
	 *
	 * @throws IllegalArgumentException wenn die id fehlt oder der Name nicht passt
	 * @throws EntityNotFoundException wenn es den Punkt nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public KnowledgeSection changeKnowledgeSection(KnowledgeSection changedKnowledgeSection) {
		Long knowledgeSectionId = changedKnowledgeSection.getId();
		Helper.requireNotNull(knowledgeSectionId, "id");
		Map<String, String> changedDisplayName = changedKnowledgeSection.getDisplayName();
		Helper.requireMultilingualText(changedDisplayName, "displayName", defaultLanguageCode);
		KnowledgeSection existingKnowledgeSection = doGetKnowledgeSection(knowledgeSectionId);
		existingKnowledgeSection.setDisplayName(changedDisplayName);
		return knowledgeSectionRepository.save(existingKnowledgeSection);
	}

	/**
	 * UPDATE: Ändert den Key eines Punkts (Nutzer 2026-11-27: Keys sind änderbar): bei einer Rubrik ihren
	 * {@code rubricKey}, bei einem Kapitel seinen {@code chapterKey}, bei einem Unterkapitel seinen
	 * {@code subChapterKey}. Alles darunter trägt den Key ebenfalls und bekommt ihn mit: die Kapitel und Unterkapitel
	 * einer Rubrik, die Unterkapitel eines Kapitels. Alle betroffenen Zeilen ändern sich in einer Transaktion.
	 * <p>
	 * Die Seiten im Solr-Kern tragen dieselben Keys. Deshalb zieht diese Methode ZUERST alle Seiten mit dem alten Key
	 * nach (Cursor durch den Kern, {@link KnowledgePageSectionKeyService}) und ändert Postgres zuletzt, so wie die
	 * Plattform es bei abhängigen Daten immer hält: Bricht es mittendrin ab, steht in Postgres noch der alte Key, und
	 * derselbe Aufruf zieht den Rest nach.
	 *
	 * @return die ganze Gliederung nach der Änderung
	 * @throws IllegalArgumentException wenn die id fehlt oder der Key nicht der Key-Regel entspricht
	 * @throws EntityNotFoundException wenn es den Punkt nicht gibt
	 * @throws DuplicateKeyException wenn ein Geschwister den Key schon trägt
	 * @throws de.gebiter.solr.SolrUnavailableException wenn Solr nicht antwortet; dann ist auch in Postgres nichts geändert
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public List<KnowledgeSection> changeKnowledgeSectionKey(Long knowledgeSectionId, String changedKey) {
		Helper.requireNotNull(knowledgeSectionId, "knowledgeSectionId");
		Helper.requireValidKey(changedKey);
		List<KnowledgeSection> allKnowledgeSections = knowledgeSectionRepository.findAllByOrderByListingPositionAscIdAsc();
		KnowledgeSection knowledgeSectionToChange = doGetKnowledgeSection(knowledgeSectionId);
		String rubricKey = knowledgeSectionToChange.getRubricKey();
		String chapterKey = knowledgeSectionToChange.getChapterKey();
		String subChapterKey = knowledgeSectionToChange.getSubChapterKey();
		boolean isRubric = chapterKey == null;
		boolean isChapter = chapterKey != null && subChapterKey == null;

		// die drei Keys des Punkts nach der Änderung: Nur der seiner eigenen Ebene ist neu
		String changedRubricKey = rubricKey;
		String changedChapterKey = chapterKey;
		String changedSubChapterKey = subChapterKey;
		if (isRubric) {
			changedRubricKey = changedKey;
		} else if (isChapter) {
			changedChapterKey = changedKey;
		} else {
			changedSubChapterKey = changedKey;
		}
		boolean keyUnchanged = Objects.equals(changedRubricKey, rubricKey) && Objects.equals(changedChapterKey, chapterKey)
				&& Objects.equals(changedSubChapterKey, subChapterKey);
		if (keyUnchanged) {
			return allKnowledgeSections;
		}
		Optional<KnowledgeSection> knowledgeSectionWithChangedKey = findKnowledgeSection(allKnowledgeSections,
				changedRubricKey, changedChapterKey, changedSubChapterKey);
		if (knowledgeSectionWithChangedKey.isPresent()) {
			String takenSectionName = describeKnowledgeSection(changedRubricKey, changedChapterKey, changedSubChapterKey);
			throw new DuplicateKeyException(takenSectionName + " gibt es schon.");
		}

		// zuerst die Seiten im Solr-Kern, die unter dem Punkt stehen; Postgres zuletzt
		knowledgePageSectionKeyService.changeSectionKeyOfKnowledgePages(rubricKey, chapterKey, subChapterKey, changedKey);

		// der Punkt selbst und alles darunter: jede Zeile, die den alten Key auf dieser Ebene trägt
		List<KnowledgeSection> changedKnowledgeSections = new ArrayList<>();
		for (KnowledgeSection knowledgeSection : allKnowledgeSections) {
			boolean sameRubric = Objects.equals(knowledgeSection.getRubricKey(), rubricKey);
			boolean sameChapter = Objects.equals(knowledgeSection.getChapterKey(), chapterKey);
			boolean sameSubChapter = Objects.equals(knowledgeSection.getSubChapterKey(), subChapterKey);
			if (isRubric && sameRubric) {
				knowledgeSection.setRubricKey(changedKey);
				changedKnowledgeSections.add(knowledgeSection);
			} else if (isChapter && sameRubric && sameChapter) {
				knowledgeSection.setChapterKey(changedKey);
				changedKnowledgeSections.add(knowledgeSection);
			} else if (!isRubric && !isChapter && sameRubric && sameChapter && sameSubChapter) {
				knowledgeSection.setSubChapterKey(changedKey);
				changedKnowledgeSections.add(knowledgeSection);
			}
		}
		knowledgeSectionRepository.saveAll(changedKnowledgeSections);
		return knowledgeSectionRepository.findAllByOrderByListingPositionAscIdAsc();
	}

	/**
	 * UPDATE: Die neue Reihenfolge von Geschwistern, z. B. der Kapitel einer Rubrik. Die Liste nennt ALLE Geschwister
	 * genau einmal und sonst nichts; so geht beim Umsortieren nie ein Punkt verloren.
	 *
	 * @return die ganze Gliederung nach dem Umsortieren
	 * @throws IllegalArgumentException wenn die Liste leer ist, eine id doppelt oder unbekannt ist oder nicht genau die
	 *         Geschwister nennt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public List<KnowledgeSection> changeKnowledgeSectionListingPositions(List<Long> knowledgeSectionIdsInOrder) {
		Helper.requireNotNull(knowledgeSectionIdsInOrder, "knowledgeSectionIdsInOrder");
		if (knowledgeSectionIdsInOrder.isEmpty()) {
			throw new IllegalArgumentException("knowledgeSectionIdsInOrder ist leer.");
		}
		List<KnowledgeSection> allKnowledgeSections = knowledgeSectionRepository.findAllByOrderByListingPositionAscIdAsc();
		Long firstKnowledgeSectionId = knowledgeSectionIdsInOrder.get(0);
		KnowledgeSection firstKnowledgeSection = doGetKnowledgeSection(firstKnowledgeSectionId);
		List<KnowledgeSection> siblings = findSiblings(allKnowledgeSections, firstKnowledgeSection);

		Set<Long> siblingIds = new HashSet<>();
		for (KnowledgeSection sibling : siblings) {
			Long siblingId = sibling.getId();
			siblingIds.add(siblingId);
		}
		Set<Long> givenIds = new HashSet<>(knowledgeSectionIdsInOrder);
		boolean everyIdOnce = givenIds.size() == knowledgeSectionIdsInOrder.size();
		boolean exactlyTheSiblings = givenIds.equals(siblingIds);
		if (!everyIdOnce || !exactlyTheSiblings) {
			throw new IllegalArgumentException("Die Reihenfolge in \"knowledgeSectionIdsInOrder\" passt nicht zum Stand "
					+ "der Datenbank: Sie muss alle Geschwister genau einmal nennen. Bitte neu laden.");
		}
		for (KnowledgeSection sibling : siblings) {
			Long siblingId = sibling.getId();
			int newListingPosition = knowledgeSectionIdsInOrder.indexOf(siblingId) + 1;
			sibling.setListingPosition(newListingPosition);
		}
		knowledgeSectionRepository.saveAll(siblings);
		return knowledgeSectionRepository.findAllByOrderByListingPositionAscIdAsc();
	}

	/**
	 * READ: Prüft, dass es den Punkt der Gliederung gibt, in dem eine Seite stehen soll: das Kapitel in seiner Rubrik
	 * oder, wenn {@code subChapterKey} genannt ist, das Unterkapitel in seinem Kapitel.
	 *
	 * @throws IllegalArgumentException wenn es den Punkt nicht gibt
	 */
	@Transactional(readOnly = true)
	public void requireExistingKnowledgeSection(String rubricKey, String chapterKey, String subChapterKey) {
		List<KnowledgeSection> allKnowledgeSections = knowledgeSectionRepository.findAllByOrderByListingPositionAscIdAsc();
		Optional<KnowledgeSection> foundKnowledgeSection = findKnowledgeSection(allKnowledgeSections, rubricKey, chapterKey,
				subChapterKey);
		if (foundKnowledgeSection.isEmpty()) {
			String missingSectionName = describeKnowledgeSection(rubricKey, chapterKey, subChapterKey);
			throw new IllegalArgumentException(missingSectionName + " gibt es nicht.");
		}
	}

	/** Den Punkt über dem neuen muss es geben: zu einem Kapitel seine Rubrik, zu einem Unterkapitel sein Kapitel. */
	private void requireExistingParent(List<KnowledgeSection> allKnowledgeSections, String rubricKey, String chapterKey,
			String subChapterKey) {
		if (chapterKey == null) {
			return;
		}
		Optional<KnowledgeSection> rubric = findKnowledgeSection(allKnowledgeSections, rubricKey, null, null);
		if (rubric.isEmpty()) {
			throw new IllegalArgumentException("Die Rubrik " + rubricKey + " gibt es nicht.");
		}
		if (subChapterKey == null) {
			return;
		}
		Optional<KnowledgeSection> chapter = findKnowledgeSection(allKnowledgeSections, rubricKey, chapterKey, null);
		if (chapter.isEmpty()) {
			throw new IllegalArgumentException("Das Kapitel " + chapterKey + " gibt es in der Rubrik " + rubricKey
					+ " nicht.");
		}
	}

	/** Der Punkt mit genau diesen drei Keys ({@code null} zählt als „kein Key auf dieser Ebene“). */
	private Optional<KnowledgeSection> findKnowledgeSection(List<KnowledgeSection> allKnowledgeSections, String rubricKey,
			String chapterKey, String subChapterKey) {
		for (KnowledgeSection knowledgeSection : allKnowledgeSections) {
			boolean sameRubric = Objects.equals(knowledgeSection.getRubricKey(), rubricKey);
			boolean sameChapter = Objects.equals(knowledgeSection.getChapterKey(), chapterKey);
			boolean sameSubChapter = Objects.equals(knowledgeSection.getSubChapterKey(), subChapterKey);
			if (sameRubric && sameChapter && sameSubChapter) {
				return Optional.of(knowledgeSection);
			}
		}
		return Optional.empty();
	}

	/**
	 * Die Geschwister eines Punkts samt ihm selbst, soweit er schon gespeichert ist: alle Rubriken; alle Kapitel
	 * derselben Rubrik; alle Unterkapitel desselben Kapitels.
	 */
	private List<KnowledgeSection> findSiblings(List<KnowledgeSection> allKnowledgeSections,
			KnowledgeSection knowledgeSection) {
		boolean isRubric = knowledgeSection.getChapterKey() == null;
		boolean isChapter = knowledgeSection.getChapterKey() != null && knowledgeSection.getSubChapterKey() == null;
		List<KnowledgeSection> siblings = new ArrayList<>();
		for (KnowledgeSection candidate : allKnowledgeSections) {
			boolean candidateIsRubric = candidate.getChapterKey() == null;
			boolean candidateIsChapter = candidate.getChapterKey() != null && candidate.getSubChapterKey() == null;
			boolean sameRubric = Objects.equals(candidate.getRubricKey(), knowledgeSection.getRubricKey());
			boolean sameChapter = Objects.equals(candidate.getChapterKey(), knowledgeSection.getChapterKey());
			boolean sibling;
			if (isRubric) {
				sibling = candidateIsRubric;
			} else if (isChapter) {
				sibling = candidateIsChapter && sameRubric;
			} else {
				boolean candidateIsSubChapter = !candidateIsRubric && !candidateIsChapter;
				sibling = candidateIsSubChapter && sameRubric && sameChapter;
			}
			if (sibling) {
				siblings.add(candidate);
			}
		}
		return siblings;
	}

	/** Ein Punkt in Worten für eine Meldung, z. B. „Das Kapitel GRUNDLAGEN in der Rubrik MATHE“. */
	private String describeKnowledgeSection(String rubricKey, String chapterKey, String subChapterKey) {
		if (chapterKey == null) {
			return "Die Rubrik " + rubricKey;
		}
		if (subChapterKey == null) {
			return "Das Kapitel " + chapterKey + " in der Rubrik " + rubricKey;
		}
		return "Das Unterkapitel " + subChapterKey + " im Kapitel " + chapterKey + " der Rubrik " + rubricKey;
	}

	private KnowledgeSection doGetKnowledgeSection(Long knowledgeSectionId) {
		Optional<KnowledgeSection> foundKnowledgeSection = knowledgeSectionRepository.findById(knowledgeSectionId);
		if (foundKnowledgeSection.isEmpty()) {
			throw new EntityNotFoundException("Den Punkt " + knowledgeSectionId + " der Gliederung gibt es nicht.");
		}
		return foundKnowledgeSection.get();
	}
}
