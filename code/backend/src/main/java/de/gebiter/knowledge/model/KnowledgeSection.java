package de.gebiter.knowledge.model;

import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Ein Punkt der Gliederung der Wissensdatenbank (Nutzer 2026-11-27: „das mapping der ganzen keys zum anzeigetext in
 * postgres“): eine Rubrik, ein Kapitel in einer Rubrik oder ein Unterkapitel in einem Kapitel, mit seinem Anzeigenamen
 * und seinem Platz. Die Seiten selbst liegen im Solr-Kern der Wissensdatenbank und tragen nur die Keys
 * ({@code rubricKey}, {@code chapterKey}, {@code subChapterKey}); umbenennen oder umsortieren fasst deshalb keine
 * Seite an. Auch ein Key lässt sich ändern (Nutzer 2026-11-27): Dann bekommt alles darunter den neuen Key, und die
 * Seiten im Kern werden nachgezogen ({@code KnowledgeSectionService.changeKnowledgeSectionKey}).
 * <p>
 * Welche Ebene ein Punkt ist, sagen seine Keys: nur {@code rubricKey} = Rubrik (z. B. Mathe); dazu
 * {@code chapterKey} = Kapitel (Mathe → Grundlagen); dazu {@code subChapterKey} = Unterkapitel (Mathe → Grundlagen →
 * Koordinaten). Die drei Keys zusammen gibt es genau einmal. Das prüft der Service, nicht die Datenbank: Postgres
 * hält zwei leere Werte in einer Eindeutigkeitsregel für verschieden.
 * <p>
 * Doku: {@code docu/entities/KnowledgeSection.md}.
 */
@Entity
@Table(name = "knowledge_section")
public class KnowledgeSection {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Der Key der Rubrik, Key-Regel, z. B. {@code MATHE}. Bei einer Rubrik ihr eigener, sonst der ihrer Rubrik. */
	@Column(name = "rubric_key", nullable = false, length = 100)
	private String rubricKey;

	/**
	 * Der Key des Kapitels, Key-Regel, z. B. {@code GRUNDLAGEN}; eindeutig in seiner Rubrik. {@code null} bei einer
	 * Rubrik.
	 */
	@Column(name = "chapter_key", length = 100)
	private String chapterKey;

	/**
	 * Der Key des Unterkapitels, Key-Regel, z. B. {@code KOORDINATEN}; eindeutig in seinem Kapitel. {@code null} bei
	 * einer Rubrik und bei einem Kapitel.
	 */
	@Column(name = "sub_chapter_key", length = 100)
	private String subChapterKey;

	/** Mehrsprachiger Anzeigename, z. B. {@code {"de": "Grundlagen"}}. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, columnDefinition = "jsonb")
	private Map<String, String> displayName;

	/** Platz unter den Geschwistern (Rubriken unter sich, Kapitel in ihrer Rubrik, Unterkapitel in ihrem Kapitel), ab 1. */
	@Column(nullable = false)
	private int listingPosition;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	protected KnowledgeSection() {
	}

	public KnowledgeSection(String rubricKey, String chapterKey, String subChapterKey, Map<String, String> displayName,
			int listingPosition) {
		this.rubricKey = rubricKey;
		this.chapterKey = chapterKey;
		this.subChapterKey = subChapterKey;
		this.displayName = displayName;
		this.listingPosition = listingPosition;
	}

	public Long getId() {
		return id;
	}

	public String getRubricKey() {
		return rubricKey;
	}

	public void setRubricKey(String rubricKey) {
		this.rubricKey = rubricKey;
	}

	public String getChapterKey() {
		return chapterKey;
	}

	public void setChapterKey(String chapterKey) {
		this.chapterKey = chapterKey;
	}

	public String getSubChapterKey() {
		return subChapterKey;
	}

	public void setSubChapterKey(String subChapterKey) {
		this.subChapterKey = subChapterKey;
	}

	public Map<String, String> getDisplayName() {
		return displayName;
	}

	public void setDisplayName(Map<String, String> displayName) {
		this.displayName = displayName;
	}

	public int getListingPosition() {
		return listingPosition;
	}

	public void setListingPosition(int listingPosition) {
		this.listingPosition = listingPosition;
	}
}
