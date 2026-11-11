/**
 * Hasht einen Text mit SHA-256 und liefert den Wert als Hex-Text in Kleinbuchstaben (64 Zeichen),
 * genau wie `Helper.createSha256Hex` im Backend. So kommt ein Passwort nie im Klartext beim Server
 * an. Für Login und Registrierung.
 *
 * `crypto.subtle` gibt es im Browser nur in einem sicheren Kontext: über https oder auf localhost.
 */
export async function createSha256Hex(plainText: string): Promise<string> {
  const textEncoder = new TextEncoder()
  const plainTextBytes = textEncoder.encode(plainText)
  const sha256Buffer = await crypto.subtle.digest('SHA-256', plainTextBytes)
  const sha256Bytes = new Uint8Array(sha256Buffer)

  let sha256Hex = ''
  for (const sha256Byte of sha256Bytes) {
    const byteHex = sha256Byte.toString(16)
    const paddedByteHex = byteHex.padStart(2, '0')
    sha256Hex = sha256Hex + paddedByteHex
  }
  return sha256Hex
}
