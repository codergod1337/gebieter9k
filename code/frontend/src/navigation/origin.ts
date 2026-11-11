/**
 * Woher man kam, nach dem Origin der Vorlage: die Seite, von der aus man eine Unterseite geöffnet hat. Er reist als
 * Router-State mit (nicht in der URL); solange er da ist, zeigt der Header „Zurück zu <label>“.
 *
 * Die Kette wie in der Vorlage: `state` ist der Router-State der Seite, zu der „zurück“ führt, samt ihrem eigenen
 * Origin. So kommt man Schritt für Schritt bis zum Anfang zurück, z. B. Datei bearbeiten → Datei → Dateien.
 *
 * Besser als in der Vorlage:
 * - `path` trägt immer auch die Parameter der Adresse (`?fileClass=…&page=…`), nicht nur den Pfad.
 * - `historyIndex` merkt sich den Platz der Seite im Verlauf des Browsers. „Zurück“ springt dann wirklich im Verlauf
 *   dorthin, statt einen neuen Eintrag anzulegen: Der Zurück-Knopf des Browsers und der im Header sind dasselbe.
 */
export type Origin = {
  /** Die Adresse samt Parametern, z. B. `/file-manager/files?fileClass=FOTO&page=2`. */
  path: string
  /** Der Name der Seite für den Knopf, z. B. „Dateien“. */
  label: string
  /** Der Platz der Seite im Verlauf des Browsers (`idx` von React Router), `null` wenn unbekannt. */
  historyIndex: number | null
  /** Der Router-State der Seite, den „zurück“ wiederherstellt; fehlt, wenn sie keinen hatte. */
  state?: unknown
}

/** Der Router-State beim Öffnen einer Unterseite: `navigate(to, { state: originState })`. */
export type OriginState = {
  origin: Origin
}

/** So viele Stufen hält die Kette höchstens; wer zwischen zwei Seiten hin und her springt, hängt sonst endlos an. */
const ORIGIN_CHAIN_MAX_DEPTH = 10

/** Liest einen Origin aus einem Router-State; `null`, wenn keiner darin steht. */
export function readOrigin(routerState: unknown): Origin | null {
  if (typeof routerState !== 'object' || routerState === null || !('origin' in routerState)) {
    return null
  }
  const candidate: unknown = routerState.origin
  if (typeof candidate !== 'object' || candidate === null) {
    return null
  }
  if (!('path' in candidate) || !('label' in candidate)) {
    return null
  }
  if (typeof candidate.path !== 'string' || typeof candidate.label !== 'string') {
    return null
  }
  let historyIndex: number | null = null
  if ('historyIndex' in candidate && typeof candidate.historyIndex === 'number') {
    historyIndex = candidate.historyIndex
  }
  const origin: Origin = { path: candidate.path, label: candidate.label, historyIndex }
  if ('state' in candidate && candidate.state !== undefined && candidate.state !== null) {
    origin.state = candidate.state
  }
  return origin
}

/** Der Platz des aktuellen Eintrags im Verlauf des Browsers, wie ihn React Router führt; `null` wenn unbekannt. */
export function readHistoryIndex(): number | null {
  const historyState: unknown = window.history.state
  if (typeof historyState !== 'object' || historyState === null || !('idx' in historyState)) {
    return null
  }
  const historyIndex = historyState.idx
  if (typeof historyIndex !== 'number') {
    return null
  }
  return historyIndex
}

/**
 * Der Router-State mit höchstens `depth` Stufen Origin darin, wie in der Vorlage: Die tiefste Stufe verliert ihren
 * State, sonst bleibt alles.
 */
function trimOriginChain(routerState: unknown, depth: number): unknown {
  if (routerState === null || routerState === undefined) {
    return undefined
  }
  const origin = readOrigin(routerState)
  if (origin === null || origin.state === undefined) {
    return routerState
  }
  let trimmedInnerState: unknown = undefined
  if (depth > 1) {
    trimmedInnerState = trimOriginChain(origin.state, depth - 1)
  }
  const trimmedOrigin: Origin = { path: origin.path, label: origin.label, historyIndex: origin.historyIndex }
  if (trimmedInnerState !== undefined) {
    trimmedOrigin.state = trimmedInnerState
  }
  return { ...(routerState as object), origin: trimmedOrigin }
}

/**
 * Der State für eine Unterseite, die man von hier aus öffnet: diese Seite als Origin (Adresse samt Parametern, Platz
 * im Verlauf) mit ihrem eigenen Router-State, damit „zurück“ hierher auch ihren Origin wiederherstellt.
 *
 * @param path die Adresse dieser Seite samt Parametern
 * @param label der Name dieser Seite für den Knopf
 * @param currentRouterState `useLocation().state` dieser Seite
 */
export function createOriginState(path: string, label: string, currentRouterState: unknown): OriginState {
  const historyIndex = readHistoryIndex()
  const trimmedState = trimOriginChain(currentRouterState, ORIGIN_CHAIN_MAX_DEPTH - 1)
  const origin: Origin = { path, label, historyIndex }
  if (trimmedState !== undefined) {
    origin.state = trimmedState
  }
  return { origin }
}
