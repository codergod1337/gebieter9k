/** Die Icon-Pakete. Ein Symbol ist immer Paket plus Name, z. B. `{ pack: 'gameicons', name: '3d-glasses' }`. */
export type SymbolPack = 'bootstrap' | 'tabler' | 'lucide' | 'gameicons' | 'pixelart'

/** Ein Symbol als SVG (Iconify-Sets): der Inhalt des `<svg>` und seine viewBox. */
export type SymbolSvg = {
  body: string
  viewBox: string
}

/** Ein Symbol im Katalog. */
export type SymbolEntry = {
  pack: SymbolPack
  name: string
  /** Stichwörter des Pakets, nur Lucide liefert welche (englisch). */
  tags: string[]
  /** Name und Stichwörter klein, zum Filtern. */
  searchText: string
  /** Bei SVG-Paketen das Bild, bei Schrift-Paketen `null`: dann zeichnet die CSS-Klasse. */
  svg: SymbolSvg | null
}

/** Die Pakete in ihrer Reihenfolge, mit Namen und Lizenz für die Anzeige. */
export const SYMBOL_PACK_OPTIONS: { pack: SymbolPack; label: string }[] = [
  { pack: 'bootstrap', label: 'Bootstrap Icons (MIT)' },
  { pack: 'tabler', label: 'Tabler, Umriss (MIT)' },
  { pack: 'lucide', label: 'Lucide (ISC)' },
  { pack: 'gameicons', label: 'Game-icons.net (CC BY 3.0)' },
  { pack: 'pixelart', label: 'Pixelarticons (MIT)' },
]

/**
 * Die Schrift-Pakete: Ihre Schriften lädt base.css ohnehin, ein Symbol daraus kostet nichts extra. Nur sie taugen für
 * Badges, die überall erscheinen. Die SVG-Pakete (Game-icons allein 2,7 MB gezippt) bleiben dem Icon-Manager.
 */
export const FONT_SYMBOL_PACKS: SymbolPack[] = ['bootstrap', 'tabler', 'lucide']

/**
 * Die CSS-Klasse eines Schrift-Symbols aus Paket und Name, z. B. `bi bi-house`, `ti ti-home`, `icon-house`; `null` bei
 * SVG-Paketen und unbekannten Paketen.
 */
export function getSymbolClassNameByPackAndName(pack: string, name: string): string | null {
  if (pack === 'bootstrap') {
    return 'bi bi-' + name
  }
  if (pack === 'tabler') {
    return 'ti ti-' + name
  }
  if (pack === 'lucide') {
    return 'icon-' + name
  }
  return null
}

/** Die CSS-Klasse eines Schrift-Symbols, z. B. `bi bi-house`, `ti ti-home`, `icon-house`; `null` bei SVG-Symbolen. */
export function getSymbolClassName(symbolEntry: SymbolEntry): string | null {
  return getSymbolClassNameByPackAndName(symbolEntry.pack, symbolEntry.name)
}

/** Der eindeutige Schlüssel eines Symbols, z. B. `gameicons:3d-glasses`; so speichert ihn auch das Backend. */
export function getSymbolKey(symbolEntry: SymbolEntry): string {
  return symbolEntry.pack + ':' + symbolEntry.name
}

function createSymbolEntry(pack: SymbolPack, name: string, tags: string[], svg: SymbolSvg | null): SymbolEntry {
  const searchParts = [name, ...tags]
  const searchText = searchParts.join(' ').toLowerCase()
  return { pack, name, tags, searchText, svg }
}

/** Bootstrap Icons: die Namen aus `bootstrap-icons.json` (Name → Codepoint). */
function readBootstrapSymbolEntries(bootstrapIconsJson: string): SymbolEntry[] {
  const codepointsByName = JSON.parse(bootstrapIconsJson) as Record<string, number>
  const names = Object.keys(codepointsByName)
  names.sort()
  return names.map((name) => createSymbolEntry('bootstrap', name, [], null))
}

/**
 * Tabler: die Namen aus der CSS-Datei der Schrift, genau die Klassen, die es gibt. Die `icons.json` mit den
 * Stichwörtern gibt das Paket nicht frei (`exports`).
 */
function readTablerSymbolEntries(tablerIconsCss: string): SymbolEntry[] {
  const classNamePattern = /\.ti-([a-z0-9-]+):before/g
  const names = new Set<string>()
  for (const classNameMatch of tablerIconsCss.matchAll(classNamePattern)) {
    const name = classNameMatch[1]
    names.add(name)
  }
  const sortedNames = Array.from(names)
  sortedNames.sort()
  return sortedNames.map((name) => createSymbolEntry('tabler', name, [], null))
}

/** Lucide: die Namen aus `codepoints.json`, die Stichwörter aus `tags.json`. */
function readLucideSymbolEntries(lucideCodepointsJson: string, lucideTagsJson: string): SymbolEntry[] {
  const codepointsByName = JSON.parse(lucideCodepointsJson) as Record<string, number>
  const tagsByName = JSON.parse(lucideTagsJson) as Record<string, string[]>
  const names = Object.keys(codepointsByName)
  names.sort()
  return names.map((name) => {
    const tags = tagsByName[name] ?? []
    return createSymbolEntry('lucide', name, tags, null)
  })
}

/** Ein Iconify-Set (`@iconify-json/*`): je Name der SVG-Inhalt, Maße je Symbol oder für das ganze Set. */
type IconifyIconSet = {
  icons: Record<string, { body: string; width?: number; height?: number; left?: number; top?: number; hidden?: boolean }>
  width?: number
  height?: number
}

/** Ein Iconify-Set als Symbole; als veraltet versteckte (`hidden`) bleiben draußen. */
function readIconifySymbolEntries(pack: SymbolPack, iconSetJson: string): SymbolEntry[] {
  const iconSet = JSON.parse(iconSetJson) as IconifyIconSet
  const defaultWidth = iconSet.width ?? 16
  const defaultHeight = iconSet.height ?? 16
  const names = Object.keys(iconSet.icons)
  names.sort()
  const symbolEntries: SymbolEntry[] = []
  for (const name of names) {
    const icon = iconSet.icons[name]
    if (icon.hidden === true) {
      continue
    }
    const left = icon.left ?? 0
    const top = icon.top ?? 0
    const width = icon.width ?? defaultWidth
    const height = icon.height ?? defaultHeight
    const viewBox = left + ' ' + top + ' ' + width + ' ' + height
    const symbolEntry = createSymbolEntry(pack, name, [], { body: icon.body, viewBox })
    symbolEntries.push(symbolEntry)
  }
  return symbolEntries
}

/**
 * Lädt nur die Schrift-Pakete (Bootstrap, Tabler, Lucide), z. B. für die Symbolwahl eines Badges. Die Listen kommen als
 * Text aus den Paketen (`?raw`) und landen in eigenen Stücken des Builds: Geladen wird erst, wenn jemand sie braucht.
 */
export async function loadFontSymbolCatalog(): Promise<SymbolEntry[]> {
  const [bootstrapIconsModule, tablerIconsCssModule, lucideCodepointsModule, lucideTagsModule] = await Promise.all([
    import('bootstrap-icons/font/bootstrap-icons.json?raw'),
    import('@tabler/icons-webfont/dist/tabler-icons.css?raw'),
    import('lucide-static/font/codepoints.json?raw'),
    import('lucide-static/tags.json?raw'),
  ])
  const bootstrapSymbolEntries = readBootstrapSymbolEntries(bootstrapIconsModule.default)
  const tablerSymbolEntries = readTablerSymbolEntries(tablerIconsCssModule.default)
  const lucideSymbolEntries = readLucideSymbolEntries(lucideCodepointsModule.default, lucideTagsModule.default)
  return [...bootstrapSymbolEntries, ...tablerSymbolEntries, ...lucideSymbolEntries]
}

/** Lädt den ganzen Katalog, alle Pakete in ihrer Reihenfolge, z. B. für den Icon-Manager. */
export async function loadSymbolCatalog(): Promise<SymbolEntry[]> {
  const [fontSymbolEntries, gameIconsModule, pixelartIconsModule] = await Promise.all([
    loadFontSymbolCatalog(),
    import('@iconify-json/game-icons/icons.json?raw'),
    import('@iconify-json/pixelarticons/icons.json?raw'),
  ])
  const gameSymbolEntries = readIconifySymbolEntries('gameicons', gameIconsModule.default)
  const pixelartSymbolEntries = readIconifySymbolEntries('pixelart', pixelartIconsModule.default)
  return [...fontSymbolEntries, ...gameSymbolEntries, ...pixelartSymbolEntries]
}
