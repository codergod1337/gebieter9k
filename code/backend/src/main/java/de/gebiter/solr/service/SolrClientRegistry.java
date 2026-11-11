package de.gebiter.solr.service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.jetty.HttpJettySolrClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;

/**
 * Die SolrJ-Clients wie in der Vorlage: einer je Kern plus einer für die Verwaltung (CoreAdmin, ohne Kern in der URL).
 * Ein Client entsteht beim ersten Zugriff und bleibt offen, er hält seinen Verbindungspool.
 * <p>
 * {@code HttpJettySolrClient}, nie {@code HttpJdkSolrClient}: Der JDK-Client hängt nach einem Verbindungsabbruch für
 * immer, ohne Fehler und ohne Log (SOLR-17707). Basic Auth mit den Zugangsdaten aus der {@code .env}, dieselben wie in
 * der {@code security.json} des Containers. Adresse und Zeiten aus {@code gebiter.solr.*}.
 */
@Service
public class SolrClientRegistry {

	private static final Logger LOGGER = LoggerFactory.getLogger(SolrClientRegistry.class);

	/** Basis-URL ohne Kern, z. B. {@code http://192.168.1.7:9009/solr}. */
	private final String solrBaseUrl;

	private final String solrUsername;

	private final String solrPassword;

	private final Duration connectionTimeout;

	private final Duration requestTimeout;

	private final Duration idleTimeout;

	private final Map<String, HttpJettySolrClient> solrClientsBySolrCoreKey = new ConcurrentHashMap<>();

	/** Der Client für die Verwaltung, entsteht beim ersten Zugriff. */
	private volatile HttpJettySolrClient adminSolrClient;

	public SolrClientRegistry(@Value("${gebiter.solr.url}") String solrUrl,
			@Value("${gebiter.solr.username}") String solrUsername,
			@Value("${gebiter.solr.password}") String solrPassword,
			@Value("${gebiter.solr.client.connection-timeout}") Duration connectionTimeout,
			@Value("${gebiter.solr.client.request-timeout}") Duration requestTimeout,
			@Value("${gebiter.solr.client.idle-timeout}") Duration idleTimeout) {
		String solrBaseUrl = solrUrl;
		if (solrBaseUrl.endsWith("/")) {
			int lengthWithoutSlash = solrBaseUrl.length() - 1;
			solrBaseUrl = solrBaseUrl.substring(0, lengthWithoutSlash);
		}
		this.solrBaseUrl = solrBaseUrl;
		this.solrUsername = solrUsername;
		this.solrPassword = solrPassword;
		this.connectionTimeout = connectionTimeout;
		this.requestTimeout = requestTimeout;
		this.idleTimeout = idleTimeout;
		LOGGER.info("Solr unter {} als {}.", solrBaseUrl, solrUsername);
	}

	/** Der Client für die Verwaltung (CoreAdmin): die Basis-URL ohne Kern. */
	public SolrClient getAdminSolrClient() {
		HttpJettySolrClient existingAdminSolrClient = adminSolrClient;
		if (existingAdminSolrClient != null) {
			return existingAdminSolrClient;
		}
		synchronized (this) {
			if (adminSolrClient == null) {
				adminSolrClient = createSolrClient(solrBaseUrl);
			}
			return adminSolrClient;
		}
	}

	/** Der Client eines Kerns: Basis-URL plus Key. Ob es den Kern gibt, prüft der Aufrufer. */
	public SolrClient getSolrClient(String solrCoreKey) {
		return solrClientsBySolrCoreKey.computeIfAbsent(solrCoreKey, this::createSolrClientForSolrCore);
	}

	private HttpJettySolrClient createSolrClientForSolrCore(String solrCoreKey) {
		String solrCoreUrl = solrBaseUrl + "/" + solrCoreKey;
		return createSolrClient(solrCoreUrl);
	}

	private HttpJettySolrClient createSolrClient(String url) {
		long connectionTimeoutMillis = connectionTimeout.toMillis();
		long requestTimeoutMillis = requestTimeout.toMillis();
		long idleTimeoutMillis = idleTimeout.toMillis();
		HttpJettySolrClient.Builder solrClientBuilder = new HttpJettySolrClient.Builder(url);
		solrClientBuilder.useHttp1_1(true);
		solrClientBuilder.withConnectionTimeout(connectionTimeoutMillis, TimeUnit.MILLISECONDS);
		solrClientBuilder.withRequestTimeout(requestTimeoutMillis, TimeUnit.MILLISECONDS);
		solrClientBuilder.withIdleTimeout(idleTimeoutMillis, TimeUnit.MILLISECONDS);
		boolean withBasicAuth = solrUsername != null && !solrUsername.isBlank();
		if (withBasicAuth) {
			solrClientBuilder.withBasicAuthCredentials(solrUsername, solrPassword);
		}
		return solrClientBuilder.build();
	}

	@PreDestroy
	void closeAllSolrClients() {
		for (HttpJettySolrClient solrClient : solrClientsBySolrCoreKey.values()) {
			closeSolrClient(solrClient);
		}
		solrClientsBySolrCoreKey.clear();
		if (adminSolrClient != null) {
			closeSolrClient(adminSolrClient);
			adminSolrClient = null;
		}
	}

	private void closeSolrClient(HttpJettySolrClient solrClient) {
		try {
			solrClient.close();
		} catch (RuntimeException closeException) {
			LOGGER.warn("Ein Solr-Client ließ sich nicht schließen: {}", closeException.getMessage());
		}
	}
}
