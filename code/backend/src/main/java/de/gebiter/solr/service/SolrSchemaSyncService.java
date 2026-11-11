package de.gebiter.solr.service;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.apache.solr.client.api.model.CoreStatusResponse;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.request.CoreAdminRequest;
import org.apache.solr.client.solrj.request.schema.SchemaRequest;
import org.apache.solr.client.solrj.response.CoreAdminResponse;
import org.apache.solr.client.solrj.response.schema.SchemaResponse;
import org.apache.solr.common.SolrException;
import org.apache.solr.common.params.ModifiableSolrParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import de.gebiter.solr.SolrConfig;
import de.gebiter.solr.dto.SolrCoreSyncReport;
import de.gebiter.solr.dto.SolrDefinitionChangedEvent;
import de.gebiter.solr.model.SolrField;
import de.gebiter.solr.model.SolrFieldType;
import jakarta.annotation.PreDestroy;

/**
 * Der Schema-Abgleich wie in der Vorlage: Postgres ist die Wahrheit, Solr wird nachgezogen. Je Kern liest der Abgleich
 * das Schema über die Schema-API, vergleicht es mit den Zeilen des Kerns in {@code solr_field} (Felder und Referenzen,
 * aus der Kopie im Speicher) und schickt die Differenz in EINER Anfrage:
 * <ol>
 * <li>{@code add-field} für ein fehlendes Feld,</li>
 * <li>{@code replace-field}, wenn ein Schalter abweicht (indexed, stored, multiValued, docValues, required),</li>
 * <li>für jeden Zwilling ({@code <name>Suggest}, {@code <name>Ngram}) das Feld und sein {@code add-copy-field}.</li>
 * </ol>
 * Solr schreibt danach die {@code managed-schema.xml} des Kerns selbst neu und lädt ihn einmal nach.
 * <p>
 * Was der Abgleich nie tut: löschen (ein Feld nur in Solr wird gemeldet) und einen Typ ändern (gemeldet, ein Typwechsel
 * heißt Neuaufbau des Kerns). Den Kern selbst legt der Container an ({@code SOLR_CORES} in der {@code .env} des Pi), ein
 * fehlender Kern wird gemeldet.
 * <p>
 * Läuft beim Start für alle Kerne und nach jeder Änderung im SolrManager ({@link SolrDefinitionChangedEvent}), auf einem
 * eigenen Thread, damit kein Request auf Solr wartet. Lädt ein Kern noch, wartet er und versucht es erneut
 * ({@code gebiter.solr.sync.*}). Ist Solr nicht erreichbar, steht das im Bericht, das Backend läuft trotzdem.
 */
@Service
public class SolrSchemaSyncService {

	private static final Logger LOGGER = LoggerFactory.getLogger(SolrSchemaSyncService.class);

	private final SolrClientRegistry solrClientRegistry;

	private final SolrCoreService solrCoreService;

	private final SolrFieldService solrFieldService;

	/** Für die Endungen der Zwillinge. */
	private final SolrConfig solrConfig;

	/** So oft versucht es der Abgleich, solange der Kern noch lädt. */
	private final int coreLoadingAttempts;

	/** So lange wartet er zwischen zwei Versuchen. */
	private final Duration coreLoadingWait;

	/** Ein einziger Thread, damit zwei Abgleiche nie gleichzeitig laufen. */
	private final ExecutorService solrSyncExecutor = Executors.newSingleThreadExecutor(this::createSolrSyncThread);

	/** Der letzte Bericht je Kern. */
	private final Map<String, SolrCoreSyncReport> solrCoreSyncReportsBySolrCoreKey = new ConcurrentHashMap<>();

	public SolrSchemaSyncService(SolrClientRegistry solrClientRegistry, SolrCoreService solrCoreService,
			SolrFieldService solrFieldService, SolrConfig solrConfig,
			@Value("${gebiter.solr.sync.core-loading-attempts}") int coreLoadingAttempts,
			@Value("${gebiter.solr.sync.core-loading-wait}") Duration coreLoadingWait) {
		this.solrClientRegistry = solrClientRegistry;
		this.solrCoreService = solrCoreService;
		this.solrFieldService = solrFieldService;
		this.solrConfig = solrConfig;
		this.coreLoadingAttempts = coreLoadingAttempts;
		this.coreLoadingWait = coreLoadingWait;
	}

	/** Beim Start alle Kerne, im Hintergrund: Der Start wartet nicht auf Solr. */
	@EventListener(ApplicationReadyEvent.class)
	void syncAllSolrCoresAtStart() {
		solrSyncExecutor.submit(this::syncAllSolrCores);
	}

	/** Nach einer Änderung im SolrManager: der betroffene Kern, bei einer Referenz alle. */
	@EventListener
	void syncAfterSolrDefinitionChanged(SolrDefinitionChangedEvent solrDefinitionChangedEvent) {
		String solrCoreKey = solrDefinitionChangedEvent.solrCoreKey();
		if (solrCoreKey == null) {
			solrSyncExecutor.submit(this::syncAllSolrCores);
			return;
		}
		solrSyncExecutor.submit(() -> syncSolrCore(solrCoreKey));
	}

	@PreDestroy
	void stopSolrSyncExecutor() {
		solrSyncExecutor.shutdownNow();
	}

	/** READ: Die letzten Berichte in der Reihenfolge der Kerne. Ein Kern fehlt, bis sein erster Abgleich lief. */
	@PreAuthorize("hasRole('ADMIN')")
	public List<SolrCoreSyncReport> getAllSolrCoreSyncReport() {
		List<SolrCoreSyncReport> allSolrCoreSyncReports = new ArrayList<>();
		List<String> allSolrCoreKeys = solrCoreService.getAllSolrCoreKey();
		for (String solrCoreKey : allSolrCoreKeys) {
			SolrCoreSyncReport solrCoreSyncReport = solrCoreSyncReportsBySolrCoreKey.get(solrCoreKey);
			if (solrCoreSyncReport != null) {
				allSolrCoreSyncReports.add(solrCoreSyncReport);
			}
		}
		return allSolrCoreSyncReports;
	}

	/**
	 * UPDATE: Jetzt abgleichen, im Thread der Anfrage, und alle Berichte liefern.
	 *
	 * @param solrCoreKey der Kern; {@code null}: alle Kerne
	 * @throws IllegalArgumentException wenn es den Kern nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	public List<SolrCoreSyncReport> syncSolrCoresNow(String solrCoreKey) {
		if (solrCoreKey == null) {
			syncAllSolrCores();
			return getAllSolrCoreSyncReport();
		}
		boolean solrCoreExists = solrCoreService.existsSolrCore(solrCoreKey);
		if (!solrCoreExists) {
			throw new IllegalArgumentException("Den Kern " + solrCoreKey + " gibt es nicht.");
		}
		syncSolrCore(solrCoreKey);
		return getAllSolrCoreSyncReport();
	}

	private void syncAllSolrCores() {
		List<String> allSolrCoreKeys = solrCoreService.getAllSolrCoreKey();
		for (String solrCoreKey : allSolrCoreKeys) {
			syncSolrCore(solrCoreKey);
		}
	}

	/**
	 * Ein Kern. Wirft nie, jeder Fehler steht im Bericht. {@code synchronized}, damit Hintergrund und Admin sich nicht
	 * kreuzen. Lädt der Kern noch, wartet der Abgleich und versucht es noch einmal.
	 */
	private synchronized SolrCoreSyncReport syncSolrCore(String solrCoreKey) {
		long startNanos = System.nanoTime();
		SolrCoreSyncReport solrCoreSyncReport = null;
		int attempt = 1;
		while (solrCoreSyncReport == null) {
			try {
				solrCoreSyncReport = doSyncSolrCore(solrCoreKey, startNanos);
				logSolrCoreSyncReport(solrCoreSyncReport);
			} catch (Exception syncException) {
				boolean solrCoreStillLoading = isSolrCoreStillLoading(syncException);
				boolean attemptsLeft = attempt < coreLoadingAttempts;
				if (solrCoreStillLoading && attemptsLeft) {
					boolean waited = waitForLoadingSolrCore(solrCoreKey, attempt);
					if (waited) {
						attempt = attempt + 1;
						continue;
					}
				}
				String exceptionName = syncException.getClass().getSimpleName();
				String errorText = exceptionName + ": " + syncException.getMessage();
				LOGGER.warn("Solr-Abgleich {} fehlgeschlagen: {}", solrCoreKey, errorText);
				long durationMillis = millisSince(startNanos);
				solrCoreSyncReport = SolrCoreSyncReport.createFailedSolrCoreSyncReport(solrCoreKey, errorText,
						durationMillis);
			}
		}
		solrCoreSyncReportsBySolrCoreKey.put(solrCoreKey, solrCoreSyncReport);
		return solrCoreSyncReport;
	}

	private SolrCoreSyncReport doSyncSolrCore(String solrCoreKey, long startNanos)
			throws SolrServerException, IOException {
		SolrClient adminSolrClient = solrClientRegistry.getAdminSolrClient();
		CoreAdminResponse coreAdminResponse = CoreAdminRequest.getStatus(solrCoreKey, adminSolrClient);
		// Einen fehlenden Kern meldet Solr nicht als Fehler, sondern als leeren Eintrag ohne Namen.
		CoreStatusResponse.SingleCoreData solrCoreStatus = coreAdminResponse.getCoreStatus(solrCoreKey);
		boolean solrCoreMissing = solrCoreStatus == null || solrCoreStatus.name == null;
		if (solrCoreMissing) {
			long durationMillis = millisSince(startNanos);
			return SolrCoreSyncReport.createMissingSolrCoreSyncReport(solrCoreKey, durationMillis);
		}

		SolrClient solrClient = solrClientRegistry.getSolrClient(solrCoreKey);
		Map<String, Map<String, Object>> solrFieldAttributesByName = readSolrFieldAttributes(solrClient);
		Set<String> solrCopyFields = readSolrCopyFields(solrClient);

		SolrSchemaChangePlan solrSchemaChangePlan = new SolrSchemaChangePlan();
		List<SolrField> expectedSolrFields = solrFieldService.getSolrFieldBySolrCoreKey(solrCoreKey);
		for (SolrField expectedSolrField : expectedSolrFields) {
			planExpectedSolrField(expectedSolrField, solrFieldAttributesByName, solrCopyFields, solrSchemaChangePlan);
		}

		List<String> fieldNamesOnlyInSolr = new ArrayList<>();
		for (String solrFieldName : solrFieldAttributesByName.keySet()) {
			// Systemfelder von Solr beginnen mit _, unsere Feldnamen nie (Feldnamen-Regel).
			boolean solrSystemField = solrFieldName.startsWith("_");
			boolean expected = solrSchemaChangePlan.expectedFieldNames.contains(solrFieldName);
			if (!solrSystemField && !expected) {
				fieldNamesOnlyInSolr.add(solrFieldName);
			}
		}
		fieldNamesOnlyInSolr.sort(null);

		List<SchemaRequest.Update> schemaUpdates = solrSchemaChangePlan.schemaUpdates;
		if (!schemaUpdates.isEmpty()) {
			SchemaRequest.MultiUpdate schemaMultiUpdate = new SchemaRequest.MultiUpdate(schemaUpdates);
			SchemaResponse.UpdateResponse schemaUpdateResponse = schemaMultiUpdate.process(solrClient);
			Object schemaErrors = schemaUpdateResponse.getResponse().get("errors");
			if (schemaErrors != null) {
				throw new IllegalStateException("Die Schema-API lehnt ab: " + schemaErrors);
			}
		}

		int solrFieldCountBefore = 0;
		for (String solrFieldName : solrFieldAttributesByName.keySet()) {
			boolean solrSystemField = solrFieldName.startsWith("_");
			if (!solrSystemField) {
				solrFieldCountBefore = solrFieldCountBefore + 1;
			}
		}
		int fieldCountInSolr = solrFieldCountBefore + solrSchemaChangePlan.addedFieldNames.size();
		Instant syncedAt = Instant.now();
		long durationMillis = millisSince(startNanos);
		return new SolrCoreSyncReport(solrCoreKey, true, true, fieldCountInSolr, solrSchemaChangePlan.addedFieldNames,
				solrSchemaChangePlan.replacedFieldNames, solrSchemaChangePlan.addedCopyFields, fieldNamesOnlyInSolr,
				solrSchemaChangePlan.typeConflicts, null, syncedAt, durationMillis);
	}

	/** Ein Feld aus Postgres samt seinen Zwillingen gegen Solr. */
	private void planExpectedSolrField(SolrField expectedSolrField,
			Map<String, Map<String, Object>> solrFieldAttributesByName, Set<String> solrCopyFields,
			SolrSchemaChangePlan solrSchemaChangePlan) {
		String name = expectedSolrField.getName();
		SolrFieldType type = expectedSolrField.getType();
		String solrTypeName = type.getSolrTypeName();
		boolean indexed = expectedSolrField.isIndexed();
		boolean stored = expectedSolrField.isStored();
		boolean multiValued = expectedSolrField.isMultiValued();
		boolean docValues = expectedSolrField.isDocValues();
		boolean required = expectedSolrField.isRequired();
		Map<String, Object> expectedAttributes = createSolrFieldAttributes(name, solrTypeName, indexed, stored,
				multiValued, docValues, required);
		solrSchemaChangePlan.expectedFieldNames.add(name);
		planSolrField(expectedAttributes, solrFieldAttributesByName, solrSchemaChangePlan);

		boolean suggestTwinWanted = expectedSolrField.isSuggestTwin() && type.isSuggestTwinAllowed();
		if (suggestTwinWanted) {
			String suggestTwinName = name + solrConfig.suggestTwinSuffix();
			String suggestTwinSolrTypeName = type.getSuggestTwinSolrTypeName();
			planSolrFieldTwin(name, suggestTwinName, suggestTwinSolrTypeName, solrFieldAttributesByName, solrCopyFields,
					solrSchemaChangePlan);
		}
		boolean ngramTwinWanted = expectedSolrField.isNgramTwin() && type.isNgramTwinAllowed();
		if (ngramTwinWanted) {
			String ngramTwinName = name + solrConfig.ngramTwinSuffix();
			String ngramTwinSolrTypeName = type.getNgramTwinSolrTypeName();
			planSolrFieldTwin(name, ngramTwinName, ngramTwinSolrTypeName, solrFieldAttributesByName, solrCopyFields,
					solrSchemaChangePlan);
		}
	}

	/**
	 * Ein Zwilling: indexed, nie stored (sonst verdoppelte jedes Atomic Update seine Werte), immer multiValued, kein
	 * docValues; dazu das copyField von der Quelle, wenn es fehlt.
	 */
	private void planSolrFieldTwin(String sourceFieldName, String twinFieldName, String twinSolrTypeName,
			Map<String, Map<String, Object>> solrFieldAttributesByName, Set<String> solrCopyFields,
			SolrSchemaChangePlan solrSchemaChangePlan) {
		solrSchemaChangePlan.expectedFieldNames.add(twinFieldName);
		Map<String, Object> twinAttributes = createSolrFieldAttributes(twinFieldName, twinSolrTypeName, true, false,
				true, false, false);
		planSolrField(twinAttributes, solrFieldAttributesByName, solrSchemaChangePlan);
		String copyFieldPair = sourceFieldName + " → " + twinFieldName;
		boolean copyFieldExists = solrCopyFields.contains(copyFieldPair);
		if (!copyFieldExists) {
			List<String> copyFieldDestinations = List.of(twinFieldName);
			SchemaRequest.AddCopyField addCopyField = new SchemaRequest.AddCopyField(sourceFieldName,
					copyFieldDestinations);
			solrSchemaChangePlan.schemaUpdates.add(addCopyField);
			solrSchemaChangePlan.addedCopyFields.add(copyFieldPair);
		}
	}

	/** Ein erwartetes Feld gegen Solr: fehlt es, add-field; anderer Typ, nur melden; andere Schalter, replace-field. */
	private void planSolrField(Map<String, Object> expectedAttributes,
			Map<String, Map<String, Object>> solrFieldAttributesByName, SolrSchemaChangePlan solrSchemaChangePlan) {
		String name = (String) expectedAttributes.get("name");
		Map<String, Object> attributesInSolr = solrFieldAttributesByName.get(name);
		if (attributesInSolr == null) {
			SchemaRequest.AddField addField = new SchemaRequest.AddField(expectedAttributes);
			solrSchemaChangePlan.schemaUpdates.add(addField);
			solrSchemaChangePlan.addedFieldNames.add(name);
			return;
		}
		Object typeInSolr = attributesInSolr.get("type");
		Object expectedType = expectedAttributes.get("type");
		boolean sameType = Objects.equals(typeInSolr, expectedType);
		if (!sameType) {
			String typeConflict = name + ": Solr " + typeInSolr + ", Postgres " + expectedType;
			solrSchemaChangePlan.typeConflicts.add(typeConflict);
			return;
		}
		boolean flagsDiffer = !sameSolrFlag(attributesInSolr, expectedAttributes, "indexed")
				|| !sameSolrFlag(attributesInSolr, expectedAttributes, "stored")
				|| !sameSolrFlag(attributesInSolr, expectedAttributes, "multiValued")
				|| !sameSolrFlag(attributesInSolr, expectedAttributes, "docValues")
				|| !sameSolrFlag(attributesInSolr, expectedAttributes, "required");
		if (flagsDiffer) {
			SchemaRequest.ReplaceField replaceField = new SchemaRequest.ReplaceField(expectedAttributes);
			solrSchemaChangePlan.schemaUpdates.add(replaceField);
			solrSchemaChangePlan.replacedFieldNames.add(name);
		}
	}

	/** Ein Schalter in Solr gegen den erwarteten; ein fehlender Schalter in Solr gilt als {@code false}. */
	private boolean sameSolrFlag(Map<String, Object> attributesInSolr, Map<String, Object> expectedAttributes,
			String flagName) {
		Object flagInSolr = attributesInSolr.get(flagName);
		boolean flagSetInSolr = Boolean.TRUE.equals(flagInSolr);
		Object expectedFlag = expectedAttributes.get(flagName);
		return Objects.equals(flagSetInSolr, expectedFlag);
	}

	/** Die Attribute eines Feldes, wie die Schema-API sie nimmt. */
	private Map<String, Object> createSolrFieldAttributes(String name, String solrTypeName, boolean indexed,
			boolean stored, boolean multiValued, boolean docValues, boolean required) {
		Map<String, Object> solrFieldAttributes = new LinkedHashMap<>();
		solrFieldAttributes.put("name", name);
		solrFieldAttributes.put("type", solrTypeName);
		solrFieldAttributes.put("indexed", indexed);
		solrFieldAttributes.put("stored", stored);
		solrFieldAttributes.put("multiValued", multiValued);
		solrFieldAttributes.put("docValues", docValues);
		solrFieldAttributes.put("required", required);
		return solrFieldAttributes;
	}

	/** Alle Felder des Kerns nach Name, mit den Vorgaben des Feldtyps, damit jeder Schalter einen Wert hat. */
	private Map<String, Map<String, Object>> readSolrFieldAttributes(SolrClient solrClient)
			throws SolrServerException, IOException {
		ModifiableSolrParams solrFieldsParams = new ModifiableSolrParams();
		solrFieldsParams.set("showDefaults", true);
		SchemaRequest.Fields solrFieldsRequest = new SchemaRequest.Fields(solrFieldsParams);
		SchemaResponse.FieldsResponse solrFieldsResponse = solrFieldsRequest.process(solrClient);
		Map<String, Map<String, Object>> solrFieldAttributesByName = new LinkedHashMap<>();
		for (Map<String, Object> solrFieldAttributes : solrFieldsResponse.getFields()) {
			String solrFieldName = (String) solrFieldAttributes.get("name");
			solrFieldAttributesByName.put(solrFieldName, solrFieldAttributes);
		}
		return solrFieldAttributesByName;
	}

	/** Alle copyFields des Kerns als „quelle → ziel“. */
	private Set<String> readSolrCopyFields(SolrClient solrClient) throws SolrServerException, IOException {
		SchemaRequest.CopyFields solrCopyFieldsRequest = new SchemaRequest.CopyFields();
		SchemaResponse.CopyFieldsResponse solrCopyFieldsResponse = solrCopyFieldsRequest.process(solrClient);
		Set<String> solrCopyFields = new HashSet<>();
		for (Map<String, Object> solrCopyField : solrCopyFieldsResponse.getCopyFields()) {
			String copyFieldPair = solrCopyField.get("source") + " → " + solrCopyField.get("dest");
			solrCopyFields.add(copyFieldPair);
		}
		return solrCopyFields;
	}

	/** „SolrCore is loading“ oder ein 503: Solr steht, der Kern noch nicht. Alles andere ist ein echter Fehler. */
	private boolean isSolrCoreStillLoading(Throwable syncException) {
		Throwable cause = syncException;
		while (cause != null) {
			boolean serviceUnavailable = cause instanceof SolrException solrException && solrException.code() == 503;
			if (serviceUnavailable) {
				return true;
			}
			String message = cause.getMessage();
			boolean coreLoadingMessage = message != null && message.contains("SolrCore is loading");
			if (coreLoadingMessage) {
				return true;
			}
			Throwable nextCause = cause.getCause();
			if (nextCause == cause) {
				return false;
			}
			cause = nextCause;
		}
		return false;
	}

	/** Kurz warten, bevor der Kern noch einmal gefragt wird. {@code false}, wenn der Thread beendet wird. */
	private boolean waitForLoadingSolrCore(String solrCoreKey, int attempt) {
		int nextAttempt = attempt + 1;
		long waitSeconds = coreLoadingWait.toSeconds();
		LOGGER.info("Solr-Abgleich {}: Der Kern lädt noch, Versuch {} von {} in {} s.", solrCoreKey, nextAttempt,
				coreLoadingAttempts, waitSeconds);
		try {
			long waitMillis = coreLoadingWait.toMillis();
			Thread.sleep(waitMillis);
			return true;
		} catch (InterruptedException interruptedException) {
			Thread.currentThread().interrupt();
			return false;
		}
	}

	private void logSolrCoreSyncReport(SolrCoreSyncReport solrCoreSyncReport) {
		String solrCoreKey = solrCoreSyncReport.solrCoreKey();
		if (!solrCoreSyncReport.solrCoreExists()) {
			LOGGER.warn("Solr-Abgleich {}: Den Kern gibt es in Solr nicht (SOLR_CORES in der .env des Pi).",
					solrCoreKey);
			return;
		}
		int fieldCountInSolr = solrCoreSyncReport.fieldCountInSolr();
		int addedFieldCount = solrCoreSyncReport.addedFieldNames().size();
		int replacedFieldCount = solrCoreSyncReport.replacedFieldNames().size();
		int addedCopyFieldCount = solrCoreSyncReport.addedCopyFields().size();
		int fieldOnlyInSolrCount = solrCoreSyncReport.fieldNamesOnlyInSolr().size();
		int typeConflictCount = solrCoreSyncReport.typeConflicts().size();
		long durationMillis = solrCoreSyncReport.durationMillis();
		LOGGER.info("Solr-Abgleich {}: {} Felder in Solr, {} neu, {} angepasst, {} copyFields neu, {} nur in Solr, "
				+ "{} Typkonflikte, {} ms.", solrCoreKey, fieldCountInSolr, addedFieldCount, replacedFieldCount,
				addedCopyFieldCount, fieldOnlyInSolrCount, typeConflictCount, durationMillis);
	}

	private Thread createSolrSyncThread(Runnable solrSyncTask) {
		Thread solrSyncThread = new Thread(solrSyncTask, "solr-sync");
		solrSyncThread.setDaemon(true);
		return solrSyncThread;
	}

	private long millisSince(long startNanos) {
		long elapsedNanos = System.nanoTime() - startNanos;
		return elapsedNanos / 1_000_000;
	}

	/** Was ein Abgleich an Solr schicken will und was er meldet. Lebt nur während eines Abgleichs. */
	private static final class SolrSchemaChangePlan {

		private final List<SchemaRequest.Update> schemaUpdates = new ArrayList<>();

		private final List<String> addedFieldNames = new ArrayList<>();

		private final List<String> replacedFieldNames = new ArrayList<>();

		private final List<String> addedCopyFields = new ArrayList<>();

		private final List<String> typeConflicts = new ArrayList<>();

		/** Felder und Zwillinge, die es laut Postgres geben soll. */
		private final Set<String> expectedFieldNames = new HashSet<>();
	}
}
