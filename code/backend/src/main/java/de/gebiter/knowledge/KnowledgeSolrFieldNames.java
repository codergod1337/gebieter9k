package de.gebiter.knowledge;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import de.gebiter.knowledge.dto.KnowledgeSolrFieldNameSet;

/**
 * Die Namen der Felder im Solr-Kern der Wissensseiten, mit denen das Backend rechnet, aus
 * {@code gebiter.knowledge.field.*} der {@code application.yaml}. Angelegt werden die Felder im SolrManager (Postgres),
 * hier steht nur, wie sie heißen.
 * <p>
 * Doku: {@code docu/solr-cores/KNOWLEDGE.md}.
 */
@Component
public class KnowledgeSolrFieldNames {

	private final String id;

	private final String pageGuid;

	private final String language;

	private final String rubricKey;

	private final String chapterKey;

	private final String subChapterKey;

	private final String pageKey;

	private final String listingPosition;

	private final String title;

	private final String summary;

	private final String content;

	private final String contentFormatVersion;

	private final String tags;

	private final String status;

	private final String relatedPageGuids;

	private final String authorUsersGuid;

	private final String createdAt;

	private final String lastChangedAt;

	/** Mehrwertig: die GUIDs der Gleichungen im Inhalt der Seite; setzt das Backend aus dem Inhalt. */
	private final String equationGuids;

	public KnowledgeSolrFieldNames(@Value("${gebiter.knowledge.field.id}") String id,
			@Value("${gebiter.knowledge.field.page-guid}") String pageGuid,
			@Value("${gebiter.knowledge.field.language}") String language,
			@Value("${gebiter.knowledge.field.rubric-key}") String rubricKey,
			@Value("${gebiter.knowledge.field.chapter-key}") String chapterKey,
			@Value("${gebiter.knowledge.field.sub-chapter-key}") String subChapterKey,
			@Value("${gebiter.knowledge.field.page-key}") String pageKey,
			@Value("${gebiter.knowledge.field.listing-position}") String listingPosition,
			@Value("${gebiter.knowledge.field.title}") String title,
			@Value("${gebiter.knowledge.field.summary}") String summary,
			@Value("${gebiter.knowledge.field.content}") String content,
			@Value("${gebiter.knowledge.field.content-format-version}") String contentFormatVersion,
			@Value("${gebiter.knowledge.field.tags}") String tags,
			@Value("${gebiter.knowledge.field.status}") String status,
			@Value("${gebiter.knowledge.field.related-page-guids}") String relatedPageGuids,
			@Value("${gebiter.knowledge.field.author-users-guid}") String authorUsersGuid,
			@Value("${gebiter.knowledge.field.created-at}") String createdAt,
			@Value("${gebiter.knowledge.field.last-changed-at}") String lastChangedAt,
			@Value("${gebiter.knowledge.field.equation-guids}") String equationGuids) {
		this.id = id;
		this.pageGuid = pageGuid;
		this.language = language;
		this.rubricKey = rubricKey;
		this.chapterKey = chapterKey;
		this.subChapterKey = subChapterKey;
		this.pageKey = pageKey;
		this.listingPosition = listingPosition;
		this.title = title;
		this.summary = summary;
		this.content = content;
		this.contentFormatVersion = contentFormatVersion;
		this.tags = tags;
		this.status = status;
		this.relatedPageGuids = relatedPageGuids;
		this.authorUsersGuid = authorUsersGuid;
		this.createdAt = createdAt;
		this.lastChangedAt = lastChangedAt;
		this.equationGuids = equationGuids;
	}

	/** Die Namen der Felder für das Frontend. */
	public KnowledgeSolrFieldNameSet toKnowledgeSolrFieldNameSet() {
		return new KnowledgeSolrFieldNameSet(id, pageGuid, language, rubricKey, chapterKey, subChapterKey, pageKey,
				listingPosition, title, summary, content, contentFormatVersion, tags, status, relatedPageGuids,
				authorUsersGuid, createdAt, lastChangedAt, equationGuids);
	}

	public String getId() {
		return id;
	}

	public String getPageGuid() {
		return pageGuid;
	}

	public String getLanguage() {
		return language;
	}

	public String getRubricKey() {
		return rubricKey;
	}

	public String getChapterKey() {
		return chapterKey;
	}

	public String getSubChapterKey() {
		return subChapterKey;
	}

	public String getPageKey() {
		return pageKey;
	}

	public String getListingPosition() {
		return listingPosition;
	}

	public String getTitle() {
		return title;
	}

	public String getSummary() {
		return summary;
	}

	public String getContent() {
		return content;
	}

	public String getContentFormatVersion() {
		return contentFormatVersion;
	}

	public String getTags() {
		return tags;
	}

	public String getStatus() {
		return status;
	}

	public String getRelatedPageGuids() {
		return relatedPageGuids;
	}

	public String getAuthorUsersGuid() {
		return authorUsersGuid;
	}

	public String getCreatedAt() {
		return createdAt;
	}

	public String getLastChangedAt() {
		return lastChangedAt;
	}

	public String getEquationGuids() {
		return equationGuids;
	}
}
