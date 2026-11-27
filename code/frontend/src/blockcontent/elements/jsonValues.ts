import { BlockContentError } from '../BlockContentError.ts'

/** Ein JSON-Objekt, dessen Felder noch nicht geprüft sind. */
export type JsonObject = Record<string, unknown>

/**
 * Kleine Helfer für alle Leser eines Inhalts: Jeder holt einen Wert aus dem JSON und prüft dabei seine Art. Passt sie
 * nicht, kommt ein {@link BlockContentError} mit der Stelle im JSON (`path`), z. B. `elements[2].title`.
 */

export function requireObject(value: unknown, path: string): JsonObject {
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value)
  if (!isObject) {
    throw new BlockContentError(path + ': erwartet ist ein Objekt.')
  }
  return value as JsonObject
}

export function requireList(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new BlockContentError(path + ': erwartet ist eine Liste.')
  }
  return value
}

/** Ein Text, der nicht leer sein darf. */
export function requireText(value: unknown, path: string): string {
  if (typeof value !== 'string' || value === '') {
    throw new BlockContentError(path + ': erwartet ist ein Text.')
  }
  return value
}

/** Ein Text, der auch leer sein darf: Im Editor entsteht ein Element, bevor man es füllt. */
export function requireTextOrEmpty(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new BlockContentError(path + ': erwartet ist ein Text.')
  }
  return value
}

/** Ein freiwilliger Text: `null`, wenn er fehlt oder leer ist. */
export function readOptionalText(value: unknown, path: string): string | null {
  if (value === undefined || value === null || value === '') {
    return null
  }
  if (typeof value !== 'string') {
    throw new BlockContentError(path + ': erwartet ist ein Text.')
  }
  return value
}

export function requireNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new BlockContentError(path + ': erwartet ist eine Zahl.')
  }
  return value
}
