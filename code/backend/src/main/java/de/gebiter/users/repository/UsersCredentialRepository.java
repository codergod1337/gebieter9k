package de.gebiter.users.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.users.model.UsersCredential;

/**
 * Datenzugriff auf {@link UsersCredential}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.users.service.UsersCredentialService}.
 * <p>
 * Hier kommt nie eine Abfrage dazu, die den Passwort-Hash liefert.
 */
public interface UsersCredentialRepository extends JpaRepository<UsersCredential, UUID> {
}
