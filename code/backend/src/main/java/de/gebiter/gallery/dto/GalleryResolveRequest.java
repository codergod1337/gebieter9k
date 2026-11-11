package de.gebiter.gallery.dto;

import java.util.UUID;

/** Die Galerien eines Profils, die der Betrachter sehen darf. */
public record GalleryResolveRequest(UUID ownerUsersGuid) {
}
