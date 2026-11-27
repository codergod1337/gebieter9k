package de.gebiter.knowledge;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Liest aus dem Inhalt einer Wissensseite (Feld {@code content}, ein JSON-Text, Format in {@code docu/blockcontent.md})
 * das Wenige, das das Backend selbst wissen muss: die GUIDs ihrer Gleichungen. Mit ihnen im eigenen Feld des
 * Solr-Dokuments lässt sich zu einer Gleichung serverweit ihre Seite auflösen (Nutzer 2026-11-27: „wenn ich eine
 * gleichung habe, kann ich die seite mit der gleichungsguid auflösen und dann direkt zu der jeweiligen gleichung
 * springen“).
 * <p>
 * Wie die Stücke im JSON heißen, steht in der {@code application.yaml} ({@code gebiter.knowledge.content.*}); alles
 * andere am Inhalt liest und prüft weiter nur das Frontend.
 */
@Component
public class KnowledgeContentReader {

	private final ObjectMapper objectMapper;

	/** Unter diesem Namen steht in einem Inhalt und in einem Element die Liste seiner Elemente. */
	private final String elementsKey;

	/** Unter diesem Namen steht an einem Element seine Art. */
	private final String typeKey;

	/** Unter diesem Namen steht an einem Element seine feste Kennung. */
	private final String guidKey;

	/** So heißt die Art einer Gleichung. */
	private final String equationType;

	public KnowledgeContentReader(ObjectMapper objectMapper,
			@Value("${gebiter.knowledge.content.elements-key}") String elementsKey,
			@Value("${gebiter.knowledge.content.type-key}") String typeKey,
			@Value("${gebiter.knowledge.content.guid-key}") String guidKey,
			@Value("${gebiter.knowledge.content.equation-type}") String equationType) {
		this.objectMapper = objectMapper;
		this.elementsKey = elementsKey;
		this.typeKey = typeKey;
		this.guidKey = guidKey;
		this.equationType = equationType;
	}

	/**
	 * Die GUIDs aller Gleichungen eines Inhalts in seiner Reihenfolge, jede einmal, auch die in ContentBoxen und
	 * Aufklappern. Eine Kennung, die keine GUID ist, zählt nicht. Lässt sich der Inhalt nicht als JSON lesen, kommt eine
	 * leere Liste: Ob der Inhalt gültig ist, prüft der Aufrufer vorher.
	 */
	public List<String> readEquationGuids(String content) {
		List<String> equationGuids = new ArrayList<>();
		if (content == null) {
			return equationGuids;
		}
		JsonNode contentJson;
		try {
			contentJson = objectMapper.readTree(content);
		} catch (JacksonException jacksonException) {
			return equationGuids;
		}
		if (contentJson == null) {
			return equationGuids;
		}
		JsonNode elementsJson = contentJson.get(elementsKey);
		collectEquationGuids(elementsJson, equationGuids);
		return equationGuids;
	}

	/** Sammelt die GUIDs der Gleichungen einer Liste von Elementen und, wo ein Element selbst Elemente enthält, auch dort. */
	private void collectEquationGuids(JsonNode elementsJson, List<String> equationGuids) {
		boolean isList = elementsJson != null && elementsJson.isArray();
		if (!isList) {
			return;
		}
		for (JsonNode elementJson : elementsJson) {
			boolean isObject = elementJson != null && elementJson.isObject();
			if (!isObject) {
				continue;
			}
			String elementType = readText(elementJson, typeKey);
			boolean isEquation = equationType.equals(elementType);
			if (isEquation) {
				String equationGuid = readText(elementJson, guidKey);
				boolean validGuid = isGuid(equationGuid);
				boolean alreadyCollected = equationGuids.contains(equationGuid);
				if (validGuid && !alreadyCollected) {
					equationGuids.add(equationGuid);
				}
			}
			JsonNode nestedElementsJson = elementJson.get(elementsKey);
			collectEquationGuids(nestedElementsJson, equationGuids);
		}
	}

	/** Der Text unter diesem Namen an einem Element; {@code null}, wenn dort keiner steht. */
	private String readText(JsonNode elementJson, String key) {
		JsonNode valueJson = elementJson.get(key);
		boolean isText = valueJson != null && valueJson.isString();
		if (!isText) {
			return null;
		}
		return valueJson.stringValue();
	}

	private boolean isGuid(String text) {
		if (text == null) {
			return false;
		}
		try {
			UUID.fromString(text);
			return true;
		} catch (IllegalArgumentException illegalArgumentException) {
			return false;
		}
	}
}
