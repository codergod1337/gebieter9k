/**
 * Ein Inhalt aus Bausteinen lässt sich nicht lesen. Die Meldung nennt die Stelle im JSON, z. B.
 * „elements[2].elements[1].type: unbekanntes Element "FOO"“.
 */
export class BlockContentError extends Error {}
