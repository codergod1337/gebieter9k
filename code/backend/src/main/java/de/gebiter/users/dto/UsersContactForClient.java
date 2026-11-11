package de.gebiter.users.dto;

import de.gebiter.users.model.UsersContactType;

/**
 * Eine Kontaktangabe, wie ein anderer User sie sieht: nur Art und Wert. Wie sie eingestellt ist, erfährt er nicht, und
 * Angaben, die er nicht sehen darf, kommen gar nicht erst mit.
 */
public record UsersContactForClient(UsersContactType contactType, String contactValue) {
}
