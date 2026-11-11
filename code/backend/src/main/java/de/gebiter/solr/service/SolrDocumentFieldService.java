package de.gebiter.solr.service;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import de.gebiter.solr.model.SolrField;
import de.gebiter.solr.model.SolrFieldType;

/**
 * Was ein Client an den Feldern eines Kerns schreiben und lesen darf, aus den Felddefinitionen (Kopie im Speicher des
 * {@link SolrFieldService}). Kernunabhängig: Jeder Kern-Service fragt hier, statt die Regeln selbst nachzubauen.
 * <p>
 * Schreiben: Felder, die das Backend nicht vom Client übernimmt ({@link SolrField#isClientValueAccepted()}), und unbekannte Felder fallen still weg.
 * Die übrigen werden gegen Typ und multiValued geprüft und umgewandelt, Beanstandungen kommen gesammelt als eine 400.
 * Lesen: Ein Feld bekommt, wer sein Recht für „Wer liest“ hat ({@code readerAccessRoleKey}); ohne Recht kein User.
 */
@Service
public class SolrDocumentFieldService {

	private final SolrFieldService solrFieldService;

	public SolrDocumentFieldService(SolrFieldService solrFieldService) {
		this.solrFieldService = solrFieldService;
	}

	/**
	 * READ: Die Werte, die das Backend vom Client übernimmt, geprüft und in Solr-Typen umgewandelt (Text, Long, Double,
	 * Boolean, Date; mehrwertig als Liste). Leere Texte und leere Listen fallen weg, Felder ohne „vom Client“ ebenso.
	 *
	 * @param rawClientFieldValuesByFieldName das JSON des Clients, jedes Feld unter seinem Solr-Namen
	 * @throws IllegalArgumentException mit allen Beanstandungen, wenn ein Wert nicht zum Feld passt
	 */
	public Map<String, Object> convertClientFieldValues(String solrCoreKey,
			Map<String, Object> rawClientFieldValuesByFieldName) {
		Map<String, SolrField> clientWritableSolrFieldsByName = getClientValueAcceptedSolrFieldsByName(solrCoreKey);
		Map<String, Object> convertedFieldValuesByFieldName = new LinkedHashMap<>();
		List<String> problems = new ArrayList<>();
		for (Map.Entry<String, Object> rawFieldValueEntry : rawClientFieldValuesByFieldName.entrySet()) {
			String fieldName = rawFieldValueEntry.getKey();
			SolrField solrField = clientWritableSolrFieldsByName.get(fieldName);
			if (solrField == null) {
				// unbekannt oder nicht für den Client: fällt still weg
				continue;
			}
			Object rawFieldValue = rawFieldValueEntry.getValue();
			Object convertedFieldValue = convertFieldValue(solrField, rawFieldValue, problems);
			if (convertedFieldValue != null) {
				convertedFieldValuesByFieldName.put(fieldName, convertedFieldValue);
			}
		}
		if (!problems.isEmpty()) {
			String joinedProblems = String.join(" ", problems);
			throw new IllegalArgumentException(joinedProblems);
		}
		return convertedFieldValuesByFieldName;
	}

	/** READ: Die Namen der Felder des Kerns, die ein User mit diesen Rechten lesen darf, in der Reihenfolge der Feldtabelle. */
	public List<String> getReadableSolrFieldNames(String solrCoreKey, Collection<String> accessRoleKeys) {
		List<SolrField> solrFieldsOfCore = solrFieldService.getSolrFieldBySolrCoreKey(solrCoreKey);
		List<String> readableSolrFieldNames = new ArrayList<>();
		for (SolrField solrField : solrFieldsOfCore) {
			String readerAccessRoleKey = solrField.getReaderAccessRoleKey();
			boolean readable = readerAccessRoleKey != null && accessRoleKeys.contains(readerAccessRoleKey);
			if (readable) {
				String solrFieldName = solrField.getName();
				readableSolrFieldNames.add(solrFieldName);
			}
		}
		return readableSolrFieldNames;
	}

	/** READ: Die Namen der Felder, deren Wert das Backend vom Client übernimmt („vom Client“). */
	public Set<String> getSolrReferenceFieldNames(String solrCoreKey) {
		List<SolrField> solrFields = solrFieldService.getSolrFieldBySolrCoreKey(solrCoreKey);
		Set<String> solrReferenceFieldNames = new java.util.LinkedHashSet<>();
		for (SolrField solrField : solrFields) {
			if (solrField.isSolrReferenceField()) {
				String fieldName = solrField.getName();
				solrReferenceFieldNames.add(fieldName);
			}
		}
		return solrReferenceFieldNames;
	}

	public Set<String> getClientValueAcceptedSolrFieldNames(String solrCoreKey) {
		Map<String, SolrField> clientValueAcceptedSolrFieldsByName = getClientValueAcceptedSolrFieldsByName(solrCoreKey);
		Set<String> clientValueAcceptedSolrFieldNames = clientValueAcceptedSolrFieldsByName.keySet();
		return Set.copyOf(clientValueAcceptedSolrFieldNames);
	}

	/**
	 * READ: Die Namen der Felder, nach denen ein User mit diesen Rechten auflösen darf: Er darf sie lesen, und sie sind
	 * indexiert (sonst findet Solr nichts).
	 */
	public Set<String> getResolvableSolrFieldNames(String solrCoreKey, Collection<String> accessRoleKeys) {
		List<String> readableSolrFieldNames = getReadableSolrFieldNames(solrCoreKey, accessRoleKeys);
		List<SolrField> solrFieldsOfCore = solrFieldService.getSolrFieldBySolrCoreKey(solrCoreKey);
		Set<String> resolvableSolrFieldNames = new LinkedHashSet<>();
		for (SolrField solrField : solrFieldsOfCore) {
			String solrFieldName = solrField.getName();
			boolean readable = readableSolrFieldNames.contains(solrFieldName);
			if (readable && solrField.isIndexed()) {
				resolvableSolrFieldNames.add(solrFieldName);
			}
		}
		return resolvableSolrFieldNames;
	}

	private Map<String, SolrField> getClientValueAcceptedSolrFieldsByName(String solrCoreKey) {
		List<SolrField> solrFieldsOfCore = solrFieldService.getSolrFieldBySolrCoreKey(solrCoreKey);
		Map<String, SolrField> clientValueAcceptedSolrFieldsByName = new LinkedHashMap<>();
		for (SolrField solrField : solrFieldsOfCore) {
			boolean clientValueAccepted = solrField.isClientValueAccepted();
			if (clientValueAccepted) {
				String solrFieldName = solrField.getName();
				clientValueAcceptedSolrFieldsByName.put(solrFieldName, solrField);
			}
		}
		return clientValueAcceptedSolrFieldsByName;
	}

	/** Ein Wert nach Typ und multiValued des Feldes; {@code null}, wenn er leer ist oder nicht passt (dann mit Beanstandung). */
	private Object convertFieldValue(SolrField solrField, Object rawFieldValue, List<String> problems) {
		String fieldName = solrField.getName();
		if (rawFieldValue == null) {
			return null;
		}
		boolean rawFieldValueIsList = rawFieldValue instanceof List<?>;
		if (!solrField.isMultiValued()) {
			if (rawFieldValueIsList) {
				problems.add(fieldName + ": erwartet ist ein einzelner Wert, keine Liste.");
				return null;
			}
			return convertSingleValue(solrField, rawFieldValue, problems);
		}
		List<Object> rawValues = new ArrayList<>();
		if (rawFieldValue instanceof List<?> rawValueList) {
			rawValues.addAll(rawValueList);
		} else {
			// ein einzelner Wert für ein mehrwertiges Feld zählt als Liste mit einem Eintrag
			rawValues.add(rawFieldValue);
		}
		List<Object> convertedValues = new ArrayList<>();
		for (Object rawValue : rawValues) {
			Object convertedValue = convertSingleValue(solrField, rawValue, problems);
			boolean alreadyContained = convertedValues.contains(convertedValue);
			if (convertedValue != null && !alreadyContained) {
				convertedValues.add(convertedValue);
			}
		}
		if (convertedValues.isEmpty()) {
			return null;
		}
		return convertedValues;
	}

	private Object convertSingleValue(SolrField solrField, Object rawValue, List<String> problems) {
		String fieldName = solrField.getName();
		SolrFieldType solrFieldType = solrField.getType();
		if (rawValue == null) {
			return null;
		}
		switch (solrFieldType) {
		case STRING, TEXT_EDGE, TEXT_SUCHE -> {
			if (!(rawValue instanceof String textValue)) {
				problems.add(fieldName + ": erwartet ist ein Text.");
				return null;
			}
			String trimmedTextValue = textValue.trim();
			if (trimmedTextValue.isEmpty()) {
				return null;
			}
			return trimmedTextValue;
		}
		case LONG -> {
			boolean wholeNumber = rawValue instanceof Integer || rawValue instanceof Long;
			if (!wholeNumber) {
				problems.add(fieldName + ": erwartet ist eine ganze Zahl.");
				return null;
			}
			Number numberValue = (Number) rawValue;
			return numberValue.longValue();
		}
		case DOUBLE -> {
			if (!(rawValue instanceof Number numberValue)) {
				problems.add(fieldName + ": erwartet ist eine Zahl.");
				return null;
			}
			return numberValue.doubleValue();
		}
		case BOOLEAN -> {
			if (!(rawValue instanceof Boolean booleanValue)) {
				problems.add(fieldName + ": erwartet ist true oder false.");
				return null;
			}
			return booleanValue;
		}
		case DATE -> {
			if (!(rawValue instanceof String dateText)) {
				problems.add(fieldName + ": erwartet ist ein Zeitpunkt als Text (ISO 8601, z. B. 2026-11-08T12:00:00Z).");
				return null;
			}
			try {
				Instant instantValue = Instant.parse(dateText);
				return Date.from(instantValue);
			} catch (DateTimeParseException exception) {
				problems.add(fieldName + ": \"" + dateText + "\" ist kein Zeitpunkt nach ISO 8601.");
				return null;
			}
		}
		}
		return null;
	}
}
