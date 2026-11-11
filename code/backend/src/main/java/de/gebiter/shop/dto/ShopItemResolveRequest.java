package de.gebiter.shop.dto;

/**
 * Request Body zum Auflösen der Artikel einer Rubrik: {@code POST /api/shop-item/resolve}, z. B.
 * {@code {"shopCategoryKey": "MEMES"}}.
 *
 * @param shopCategoryKey der Key der Rubrik
 */
public record ShopItemResolveRequest(String shopCategoryKey) {
}
