/**
 * Ein Tag in seiner einheitlichen Form, wie `Helper.normalizeTag` im Backend: ohne Leerzeichen außen und ohne führende
 * Raute (`#sky` wird `sky`). Leer, wenn nichts übrig bleibt.
 */
export function normalizeTag(tag: string): string {
  const trimmedTag = tag.trim()
  const tagWithoutHash = trimmedTag.replace(/^#+/, '')
  return tagWithoutHash.trim()
}
