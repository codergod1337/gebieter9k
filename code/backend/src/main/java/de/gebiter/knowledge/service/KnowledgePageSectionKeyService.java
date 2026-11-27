package de.gebiter.knowledge.service;

import java.util.LinkedHashMap;
import java.util.Map;

import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.apache.solr.common.params.CommonParams;
import org.apache.solr.common.params.CursorMarkParams;
import org.apache.solr.common.params.ModifiableSolrParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import de.gebiter.knowledge.KnowledgeSolrFieldNames;
import de.gebiter.solr.dto.SolrCursorPage;
import de.gebiter.solr.service.SolrDocumentService;

/**
 * Zieht die Wissensseiten nach, wenn sich ein Key der Gliederung ändert (Nutzer 2026-11-27: Keys sind änderbar, die
 * Änderung läuft per Cursor durch alle Dokumente). Die Seiten tragen die Keys ihrer Rubrik, ihres Kapitels und ihres
 * Unterkapitels als Felder; ändert sich einer, bekommen ihn alle Seiten darunter.
 * <p>
 * Eigener Service ohne Blick auf die Gliederung: Der {@link KnowledgeSectionService} ruft ihn, BEVOR er Postgres ändert
 * (erst Solr, Postgres zuletzt). Bricht es mittendrin ab, steht in Postgres noch der alte Key, und derselbe Aufruf
 * zieht die übrigen Seiten nach. Wer das darf, prüft der Aufrufer.
 * <p>
 * Doku: {@code docu/solr-cores/KNOWLEDGE.md}.
 */
@Service
public class KnowledgePageSectionKeyService {

	private static final Logger LOGGER = LoggerFactory.getLogger(KnowledgePageSectionKeyService.class);

	private final SolrDocumentService solrDocumentService;

	private final KnowledgeSolrFieldNames knowledgeSolrFieldNames;

	private final String solrCoreKey;

	private final int keyChangeBatchSize;

	public KnowledgePageSectionKeyService(SolrDocumentService solrDocumentService,
			KnowledgeSolrFieldNames knowledgeSolrFieldNames,
			@Value("${gebiter.knowledge.solr-core-key}") String solrCoreKey,
			@Value("${gebiter.knowledge.key-change-batch-size}") int keyChangeBatchSize) {
		this.solrDocumentService = solrDocumentService;
		this.knowledgeSolrFieldNames = knowledgeSolrFieldNames;
		this.solrCoreKey = solrCoreKey;
		this.keyChangeBatchSize = keyChangeBatchSize;
	}

	/**
	 * UPDATE: Gibt allen Seiten eines Punkts der Gliederung dessen neuen Key. Der Punkt wird mit seinen ALTEN Keys
	 * genannt: nur {@code rubricKey} für eine Rubrik (dann ändert sich bei ihren Seiten {@code rubricKey}), dazu
	 * {@code chapterKey} für ein Kapitel (dann {@code chapterKey}), dazu {@code subChapterKey} für ein Unterkapitel (dann
	 * {@code subChapterKey}). Alle Sprachen und jeder Status, auch weich gelöschte Seiten.
	 *
	 * @param rubricKey der alte Key der Rubrik
	 * @param chapterKey der alte Key des Kapitels; {@code null}, wenn sich der Key einer Rubrik ändert
	 * @param subChapterKey der alte Key des Unterkapitels; {@code null}, wenn sich der einer Rubrik oder eines Kapitels ändert
	 * @param changedKey der neue Key der untersten genannten Ebene
	 * @return wie viele Seiten den neuen Key bekommen haben
	 */
	public long changeSectionKeyOfKnowledgePages(String rubricKey, String chapterKey, String subChapterKey,
			String changedKey) {
		String idFieldName = knowledgeSolrFieldNames.getId();
		String rubricKeyFieldName = knowledgeSolrFieldNames.getRubricKey();
		String chapterKeyFieldName = knowledgeSolrFieldNames.getChapterKey();
		String subChapterKeyFieldName = knowledgeSolrFieldNames.getSubChapterKey();

		// das Feld der untersten genannten Ebene bekommt den neuen Key
		String changedFieldName = rubricKeyFieldName;
		if (chapterKey != null) {
			changedFieldName = chapterKeyFieldName;
		}
		if (subChapterKey != null) {
			changedFieldName = subChapterKeyFieldName;
		}
		String rubricFilterQuery = createTermFilterQuery(rubricKeyFieldName, rubricKey);
		String idSort = idFieldName + " asc";

		long changedPageCount = 0;
		String cursorMark = CursorMarkParams.CURSOR_MARK_START;
		boolean morePages = true;
		while (morePages) {
			ModifiableSolrParams queryParams = solrDocumentService.createFilterOnlyQueryParams();
			queryParams.add(CommonParams.FQ, rubricFilterQuery);
			if (chapterKey != null) {
				String chapterFilterQuery = createTermFilterQuery(chapterKeyFieldName, chapterKey);
				queryParams.add(CommonParams.FQ, chapterFilterQuery);
			}
			if (subChapterKey != null) {
				String subChapterFilterQuery = createTermFilterQuery(subChapterKeyFieldName, subChapterKey);
				queryParams.add(CommonParams.FQ, subChapterFilterQuery);
			}
			queryParams.set(CommonParams.FL, idFieldName);
			queryParams.set(CommonParams.SORT, idSort);
			queryParams.set(CommonParams.ROWS, keyChangeBatchSize);
			queryParams.set(CursorMarkParams.CURSOR_MARK_PARAM, cursorMark);
			SolrCursorPage cursorPage = solrDocumentService.querySolrDocumentsWithCursor(solrCoreKey, queryParams);

			SolrDocumentList pagesWithOldKey = cursorPage.documents();
			Map<String, Map<String, Object>> newValuesByFieldNameById = new LinkedHashMap<>();
			for (SolrDocument pageWithOldKey : pagesWithOldKey) {
				Object rawId = pageWithOldKey.getFirstValue(idFieldName);
				String id = rawId.toString();
				Map<String, Object> newValuesByFieldName = Map.of(changedFieldName, changedKey);
				newValuesByFieldNameById.put(id, newValuesByFieldName);
			}
			solrDocumentService.setFieldValuesOfSolrDocuments(solrCoreKey, idFieldName, newValuesByFieldNameById);
			changedPageCount = changedPageCount + newValuesByFieldNameById.size();

			// Der Cursor merkt sich die letzte id: Dass die geänderten Seiten nicht mehr auf den Filter passen, stört ihn nicht
			String nextCursorMark = cursorPage.nextCursorMark();
			morePages = !cursorMark.equals(nextCursorMark);
			cursorMark = nextCursorMark;
		}
		if (changedPageCount > 0) {
			LOGGER.info("Wissensseiten: {} Seiten haben im Feld {} den neuen Key {} bekommen.", changedPageCount,
					changedFieldName, changedKey);
		}
		return changedPageCount;
	}

	/** Filter „Feld hat genau diesen Wert“ über den term-Parser: Der Wert geht wörtlich hinein. */
	private static String createTermFilterQuery(String fieldName, String value) {
		return "{!term f=" + fieldName + "}" + value;
	}
}
