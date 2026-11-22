package de.gebiter.users.dto;

/** User beim Tippen suchen (Vervollständigung): {@code {"searchText": "bob"}}. */
public record UsersSearchRequest(String searchText) {
}
