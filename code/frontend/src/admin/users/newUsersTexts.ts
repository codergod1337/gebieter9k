import type { MultilingualText } from '../../language/MultilingualText.ts'

/**
 * Alle Texte zum Anlegen eines Users durch den Admin (Tab „User“, Knopf „neuer User“ und sein Popup), mehrsprachig
 * angelegt (Nutzer 2026-11-11): je Sprachkürzel der Text, vorerst nur Deutsch. Eine weitere Sprache kommt hier dazu, je
 * Text ein Eintrag; die Oberfläche nimmt den der eingestellten Sprache (`getTextInCurrentLanguage`).
 */
export const NEW_USERS_TEXTS = {
  /** Der Knopf oben rechts im Tab „User“. */
  newUsers: { de: 'neuer User' },
  /** Titel des Popups. */
  popupTitle: { de: 'Neuer User' },
  usernameLabel: { de: 'Username' },
  emailLabel: { de: 'E-Mail-Adresse' },
  /** Hinweis unter der E-Mail-Adresse. */
  emailHint: { de: 'Mit ihr meldet sich der User an.' },
  passwordLabel: { de: 'Passwort' },
  repeatedPasswordLabel: { de: 'Passwort wiederholen' },
  /** Hinweis unter dem Passwort: Es darf leer bleiben. */
  passwordHint: {
    de: 'Darf leer bleiben: Dann bekommt der User das Startpasswort. Die Authenticator-App richtet er bei seiner ersten Anmeldung selbst ein.',
  },
  guidLabel: { de: 'GUID' },
  /** Hinweis unter der GUID: Sie darf leer bleiben. */
  guidHint: { de: 'Darf leer bleiben: Dann vergibt das Backend eine neue GUID.' },
  /** Meldung, wenn die beiden Passwörter verschieden sind. */
  passwordMismatch: { de: 'Die beiden Passwörter stimmen nicht überein.' },
  /** Meldung, wenn die GUID nicht die Form einer GUID hat. */
  guidInvalid: { de: 'Die GUID hat nicht die Form 8-4-4-4-12 Hex-Zeichen, z. B. 019a6b2c-3d4e-7f80-9a1b-2c3d4e5f6a7b.' },
} satisfies Record<string, MultilingualText>
