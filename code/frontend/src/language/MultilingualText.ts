/** Die Sprachkürzel, die das Frontend kennt. Vorerst nur Deutsch, weitere kommen hier und in `activeLanguages.ts` dazu. */
export type LanguageCode = 'de'

/**
 * Ein mehrsprachiger Text, so wie das Backend ihn als JSON liefert: je Sprachkürzel der Text, z. B. `{"de": "Admin"}`.
 * Pflicht ist im Backend nur die Standardsprache (`gebiter.language.default-code`), andere Sprachen dürfen fehlen.
 */
export type MultilingualText = Partial<Record<LanguageCode, string>>
