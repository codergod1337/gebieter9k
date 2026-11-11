package de.gebiter.file.dto;

import java.util.Map;

/**
 * Der Teil {@code data} beim Hochladen in eine Rubrik des Gebietermarkts, ein JSON-Objekt: die Rubrik und die Felder des
 * Clients wie beim normalen Upload, aber ohne FileClass: Die steht durch die Rubrik fest und kommt im Backend dazu. Z. B.
 * {@code {"shopCategoryKey": "MEMES", "fieldValuesByFieldName": {"tags": ["katze"]}}}. Das Angebot kommt danach in
 * einem eigenen Schritt ({@code POST /api/shop-offer}).
 */
public record FileUploadIntoShopCategoryData(String shopCategoryKey, Map<String, Object> fieldValuesByFieldName) {
}
