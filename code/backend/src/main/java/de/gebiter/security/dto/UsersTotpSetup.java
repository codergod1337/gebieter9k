package de.gebiter.security.dto;

/**
 * Was das Einrichten der Authenticator-App braucht, nur in diesem einen Moment: die {@code otpauth://}-Adresse für den
 * QR-Code (gilt für Google, Microsoft und jede andere TOTP-App) und dasselbe Geheimnis als Base32-Text zum Abtippen.
 */
public record UsersTotpSetup(String otpauthUri, String secretBase32, String issuer, String accountName) {
}
