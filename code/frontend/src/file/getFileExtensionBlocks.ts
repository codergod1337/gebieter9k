import type { FileExtension } from './FileExtension.ts'
import type { FileExtensionGroup } from './FileExtensionGroup.ts'

/** Eine Gruppe mit ihren Endungen. Ohne Gruppe: `fileExtensionGroup` ist `null`. */
export type FileExtensionBlock = {
  fileExtensionGroup: FileExtensionGroup | null
  fileExtensions: FileExtension[]
}

/** Der Key eines Blocks, z. B. für React: der Key der Gruppe, ohne Gruppe ein fester Text. */
export function getFileExtensionBlockKey(fileExtensionBlock: FileExtensionBlock): string {
  if (fileExtensionBlock.fileExtensionGroup === null) {
    return 'ohne-gruppe'
  }
  return fileExtensionBlock.fileExtensionGroup.key
}

/**
 * Die Endungen je Gruppe, wie in der Vorlage: in der Reihenfolge der Gruppen und darin in der Reihenfolge der Endungen
 * (so wie sie kommen, also nach Platz). Am Ende die Endungen ohne Gruppe oder mit einer unbekannten. Leere Gruppen
 * bleiben drin, eine neue Gruppe soll man sehen. Für den Tab „Endungen“ und die Matrix.
 */
export function getFileExtensionBlocks(
  fileExtensionGroups: FileExtensionGroup[],
  fileExtensions: FileExtension[],
): FileExtensionBlock[] {
  const knownFileExtensionGroupKeys = new Set<string>()
  const fileExtensionBlocks: FileExtensionBlock[] = []
  for (const fileExtensionGroup of fileExtensionGroups) {
    knownFileExtensionGroupKeys.add(fileExtensionGroup.key)
    const fileExtensionsOfGroup = fileExtensions.filter(
      (fileExtension) => fileExtension.fileExtensionGroupKey === fileExtensionGroup.key,
    )
    fileExtensionBlocks.push({ fileExtensionGroup, fileExtensions: fileExtensionsOfGroup })
  }
  const fileExtensionsWithoutGroup = fileExtensions.filter(
    (fileExtension) =>
      fileExtension.fileExtensionGroupKey === null || !knownFileExtensionGroupKeys.has(fileExtension.fileExtensionGroupKey),
  )
  if (fileExtensionsWithoutGroup.length > 0) {
    fileExtensionBlocks.push({ fileExtensionGroup: null, fileExtensions: fileExtensionsWithoutGroup })
  }
  return fileExtensionBlocks
}
