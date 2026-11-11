package de.gebiter.users.dto;

import java.util.List;
import java.util.UUID;

/**
 * Name und Avatar mehrerer User auflösen: {@code {"usersGuids": ["…", "…"]}}, höchstens
 * {@code gebiter.users.avatar-resolve-max-guids} auf einmal.
 */
public record UsersAvatarResolveRequest(List<UUID> usersGuids) {
}
