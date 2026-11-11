/** Der Verlauf unter einem Badge (`BadgeGradient` im Backend). Wie jede Art aussieht, steht in base.css. */
export type BadgeGradient =
  | 'FLAT'
  | 'LINEAR'
  | 'DIAGONAL'
  | 'SPLIT'
  | 'BEVEL'
  | 'RADIAL'
  | 'METAL'
  | 'CHROME'
  | 'CONIC'
  | 'GEM'
  | 'AURORA'
  | 'PRISM'

/** Die Struktur über dem Verlauf (`BadgeStructure` im Backend). */
export type BadgeStructure =
  | 'DOTS'
  | 'STRIPES'
  | 'PINSTRIPES'
  | 'GRID'
  | 'CHECKER'
  | 'GRAIN'
  | 'BRUSHED'
  | 'CARBON'
  | 'DIAMOND'
  | 'HONEYCOMB'
  | 'WAVES'
  | 'SCALES'
  | 'CIRCUIT'
  | 'STARS'
  | 'DAMASK'

/** Ein Effekt auf dem Badge (`BadgeEffect` im Backend), beliebig kombinierbar. */
export type BadgeEffect = 'GLOSS' | 'EMBOSS' | 'FRAME' | 'RIVETS' | 'DEEP' | 'SHINE' | 'GLOW' | 'SPARKLE' | 'HOLO' | 'RING'

/**
 * Das Aussehen eines Badges, wie das Backend es liefert (`BadgeLook`): gleich für Position, Rang und Achievement. Jeder
 * Wert darf `null` sein, dann gilt der Standard aus base.css. Farben immer `#rrggbb`.
 */
export type BadgeLook = {
  gradient: BadgeGradient | null
  structure: BadgeStructure | null
  effects: BadgeEffect[] | null
  /** nur Schrift-Pakete: `bootstrap`, `tabler`, `lucide` */
  symbolPack: string | null
  symbolName: string | null
  gradientStartColor: string | null
  gradientEndColor: string | null
  textColor: string | null
  textShadowColor: string | null
  borderColor: string | null
  shadowColor: string | null
  structureColor: string | null
}

/** Die Farbfelder eines {@link BadgeLook}. */
export type BadgeLookColorField =
  | 'gradientStartColor'
  | 'gradientEndColor'
  | 'textColor'
  | 'textShadowColor'
  | 'borderColor'
  | 'shadowColor'
  | 'structureColor'

/** Alles auf Standard. */
export const EMPTY_BADGE_LOOK: BadgeLook = {
  gradient: null,
  structure: null,
  effects: null,
  symbolPack: null,
  symbolName: null,
  gradientStartColor: null,
  gradientEndColor: null,
  textColor: null,
  textShadowColor: null,
  borderColor: null,
  shadowColor: null,
  structureColor: null,
}

/** Die Verläufe zur Auswahl, grob von schlicht nach edel. */
export const BADGE_GRADIENT_OPTIONS: { value: BadgeGradient; label: string }[] = [
  { value: 'FLAT', label: 'einfarbig' },
  { value: 'LINEAR', label: 'Verlauf oben → unten' },
  { value: 'DIAGONAL', label: 'Verlauf schräg' },
  { value: 'SPLIT', label: 'Wappen, hart geteilt' },
  { value: 'BEVEL', label: '3D gewölbt' },
  { value: 'RADIAL', label: 'von der Mitte nach außen' },
  { value: 'METAL', label: 'Metall' },
  { value: 'CHROME', label: 'Chrom-Spiegel' },
  { value: 'CONIC', label: 'Fächer' },
  { value: 'GEM', label: 'Edelstein mit Facetten' },
  { value: 'AURORA', label: 'Polarlicht' },
  { value: 'PRISM', label: 'Prisma (Regenbogen)' },
]

/** Die Strukturen zur Auswahl, grob von schlicht nach edel. */
export const BADGE_STRUCTURE_OPTIONS: { value: BadgeStructure; label: string }[] = [
  { value: 'DOTS', label: 'Punkte' },
  { value: 'STRIPES', label: 'Streifen' },
  { value: 'PINSTRIPES', label: 'Nadelstreifen' },
  { value: 'GRID', label: 'Karo' },
  { value: 'CHECKER', label: 'Schachbrett' },
  { value: 'GRAIN', label: 'Körnung' },
  { value: 'BRUSHED', label: 'gebürstet' },
  { value: 'CARBON', label: 'Karbon' },
  { value: 'DIAMOND', label: 'Rauten' },
  { value: 'HONEYCOMB', label: 'Waben' },
  { value: 'WAVES', label: 'Wellen' },
  { value: 'SCALES', label: 'Drachenschuppen' },
  { value: 'CIRCUIT', label: 'Platine' },
  { value: 'STARS', label: 'Sterne' },
  { value: 'DAMASK', label: 'Damast' },
]

/** Die Effekte zur Auswahl; die letzten fünf sind animiert. */
export const BADGE_EFFECT_OPTIONS: { value: BadgeEffect; label: string }[] = [
  { value: 'GLOSS', label: 'Glanzkante' },
  { value: 'EMBOSS', label: 'Prägung' },
  { value: 'FRAME', label: 'Zierrahmen' },
  { value: 'RIVETS', label: 'Nieten' },
  { value: 'DEEP', label: 'schwebend' },
  { value: 'SHINE', label: 'Lichtstreifen' },
  { value: 'GLOW', label: 'Leuchten' },
  { value: 'SPARKLE', label: 'Funkeln' },
  { value: 'HOLO', label: 'Holo-Schimmer' },
  { value: 'RING', label: 'Regenbogenrand' },
]

/** Die Farben zur Auswahl, mit ihrer Bedeutung. */
export const BADGE_LOOK_COLOR_OPTIONS: { field: BadgeLookColorField; label: string }[] = [
  { field: 'gradientStartColor', label: 'Verlauf Anfang' },
  { field: 'gradientEndColor', label: 'Verlauf Ende' },
  { field: 'textColor', label: 'Schrift' },
  { field: 'textShadowColor', label: 'Schriftschein' },
  { field: 'borderColor', label: 'Rand' },
  { field: 'shadowColor', label: 'Schatten / Leuchten' },
  { field: 'structureColor', label: 'Struktur' },
]
