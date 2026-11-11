/**
 * Zufall aus einem Text, wie in der Vorlage: derselbe Text ergibt immer dieselbe Folge. So sieht jedes Profil anders,
 * aber immer gleich aus (Titelbild, Farbe des Avatars, Platzhalter).
 */
export function createSeededRandom(seed: string): () => number {
  let hash = 1779033703 ^ seed.length
  for (let index = 0; index < seed.length; index++) {
    const characterCode = seed.charCodeAt(index)
    hash = Math.imul(hash ^ characterCode, 3432918353)
    hash = (hash << 13) | (hash >>> 19)
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507)
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909)
    hash ^= hash >>> 16
    const unsignedHash = hash >>> 0
    return unsignedHash / 4294967296
  }
}
