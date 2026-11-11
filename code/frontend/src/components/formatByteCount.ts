/** Eine Bytezahl lesbar und gerundet, z. B. `13,6 MB` (Nutzer 2026-11-09: die genaue Bytezahl braucht niemand). */
export function formatByteCount(byteCount: number): string {
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  let scaledValue = byteCount
  let unitIndex = 0
  while (scaledValue >= 1024 && unitIndex < units.length - 1) {
    scaledValue = scaledValue / 1024
    unitIndex = unitIndex + 1
  }
  if (unitIndex === 0) {
    const byteCountText = byteCount.toLocaleString('de-DE')
    return byteCountText + ' Bytes'
  }
  const scaledValueText = scaledValue.toLocaleString('de-DE', { maximumFractionDigits: 1 })
  return scaledValueText + ' ' + units[unitIndex]
}
