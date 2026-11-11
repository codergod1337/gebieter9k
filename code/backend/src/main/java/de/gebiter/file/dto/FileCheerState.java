package de.gebiter.file.dto;

import java.util.List;
import java.util.UUID;

import de.gebiter.file.model.FileCheerDirection;

/**
 * Der Stand der Stimmen zu einer Datei, für die Anzeige: wie viele begeistert (cheerUp) und wie viele angewidert
 * (cheerDown) gestimmt haben, wer zuletzt so gestimmt hat (nicht anonym) und wie der angemeldete User selbst gestimmt
 * hat. Die Listen nennen nie alle User, nur die neuesten ({@code gebiter.file.cheer-shown-users-max} je Richtung): So
 * bleibt die Antwort klein, auch bei Tausenden Stimmen.
 *
 * @param fileDocumentId die Datei
 * @param cheerUpCount so viele Stimmen „begeistert“ insgesamt
 * @param cheerDownCount so viele Stimmen „angewidert“ insgesamt
 * @param cheerUpUsersGuids die User, die zuletzt „begeistert“ gestimmt haben, der neueste zuerst
 * @param cheerDownUsersGuids die User, die zuletzt „angewidert“ gestimmt haben, der neueste zuerst
 * @param directionOfCurrentUsers die Stimme des angemeldeten Users, {@code null} wenn er nicht gestimmt hat
 */
public record FileCheerState(String fileDocumentId, long cheerUpCount, long cheerDownCount,
		List<UUID> cheerUpUsersGuids, List<UUID> cheerDownUsersGuids, FileCheerDirection directionOfCurrentUsers) {
}
