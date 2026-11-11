package de.gebiter.security.dto;

/** Ein 6-stelliger Code aus der Authenticator-App, Leerzeichen erlaubt (z. B. „492 039“). */
public record UsersTotpCodeRequest(String code) {
}
