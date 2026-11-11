package de.gebiter.solr;

/**
 * Solr ist nicht erreichbar oder hat die Anfrage nicht beantwortet. Wird zu 503: Das liegt an uns, nicht an der Eingabe. Die
 * Ursache steht im Log, nicht in der Antwort.
 */
public class SolrUnavailableException extends RuntimeException {

	public SolrUnavailableException(String message, Throwable cause) {
		super(message, cause);
	}
}
