package de.gebiter.gallery.dto;

import java.util.List;

/** Die eigenen Galerien in neuer Reihenfolge (Drag and Drop): alle ids, die erste kommt nach vorn. */
public record GalleryListingOrder(List<Long> galleryIdsInOrder) {
}
