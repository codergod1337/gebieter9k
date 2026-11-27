/**
 * Der Inhalt einer Wissensseite lässt sich nicht lesen. Die Meldung nennt die Stelle im JSON, z. B.
 * „blocks[2].steps[1].equation.left: unbekannter Typ "FOO"“.
 */
export class KnowledgeContentError extends Error {}
