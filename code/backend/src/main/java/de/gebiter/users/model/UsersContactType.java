package de.gebiter.users.model;

/**
 * Die Arten von Kontaktdaten eines Users ({@link UsersContact}), je Art höchstens ein Eintrag mit eigener Sichtbarkeit
 * (Nutzer 2026-11-09). Die Reihenfolge hier ist die Reihenfolge der Anzeige.
 * <p>
 * Bei den Social-Media-Konten steht nur die Kennung im Eintrag, nie eine URL. Den Link baut das Frontend aus einer
 * festen Vorlage je Plattform; so kann niemand einen beliebigen Link (Phishing, {@code javascript:}) ins Profil
 * schreiben. Eine neue Art kommt hier und im Frontend in {@code users/usersContactTypes.ts} dazu.
 */
public enum UsersContactType {

	// --- Telefon und Anschrift ---
	MOBILE_NUMBER,
	STREET,
	HOUSE_NUMBER,
	POSTAL_CODE,
	CITY,
	COUNTRY,

	// --- Social-Media-Konten ---
	/** Benutzername → {@code https://www.instagram.com/<Kennung>/} */
	INSTAGRAM,
	/** Benutzername ohne @ → {@code https://www.tiktok.com/@<Kennung>} */
	TIKTOK,
	/** Handle ohne @ → {@code https://www.youtube.com/@<Kennung>} */
	YOUTUBE,
	/** Benutzername → {@code https://www.twitch.tv/<Kennung>} */
	TWITCH,
	/** Eigener Profilname → {@code https://steamcommunity.com/id/<Kennung>} */
	STEAM,
	/** Benutzername, ohne Link: Über ihn lässt sich bei Discord nicht verlinken. */
	DISCORD,
	/** X (ehemals Twitter), Benutzername ohne @ → {@code https://x.com/<Kennung>} */
	TWITTER,
	/** Benutzername → {@code https://www.facebook.com/<Kennung>} */
	FACEBOOK,
	/** Benutzername → {@code https://www.reddit.com/user/<Kennung>} */
	REDDIT,
	/** Benutzername → {@code https://www.snapchat.com/add/<Kennung>} */
	SNAPCHAT
}
