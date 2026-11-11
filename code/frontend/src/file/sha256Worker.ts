import { createSHA256 } from 'hash-wasm'
import type { Sha256WorkerMessage, Sha256WorkerRequest } from './sha256WorkerMessages.ts'

/** So viel wird je Schritt von der Platte gelesen: groß genug für Tempo, klein genug für den Speicher. */
const HASH_CHUNK_BYTES = 8 * 1024 * 1024

function postWorkerMessage(message: Sha256WorkerMessage) {
  self.postMessage(message)
}

/**
 * Der Worker für den SHA-256 einer Datei: rechnet in einem eigenen Thread, damit mehrere Dateien gleichzeitig auf allen
 * Kernen laufen und die Seite flüssig bleibt. Liest die Datei in Stücken, deshalb ohne Größengrenze und ohne die ganze
 * Datei im Speicher. Meldet nach jedem Stück den Fortschritt; abbrechen heißt, den Worker zu beenden
 * (`createFileSha256Hex`).
 */
self.onmessage = async (event: MessageEvent<Sha256WorkerRequest>) => {
  const file = event.data.file
  try {
    const sha256Hasher = await createSHA256()
    sha256Hasher.init()
    const totalBytes = file.size
    let hashedBytes = 0
    while (hashedBytes < totalBytes) {
      const chunkEnd = Math.min(hashedBytes + HASH_CHUNK_BYTES, totalBytes)
      const fileChunk = file.slice(hashedBytes, chunkEnd)
      const chunkBuffer = await fileChunk.arrayBuffer()
      const chunkBytes = new Uint8Array(chunkBuffer)
      sha256Hasher.update(chunkBytes)
      hashedBytes = chunkEnd
      postWorkerMessage({ kind: 'PROGRESS', hashedBytes, totalBytes })
    }
    const sha256Hex = sha256Hasher.digest('hex')
    postWorkerMessage({ kind: 'DONE', sha256Hex })
  } catch (error) {
    let failureMessage = 'Die Datei ließ sich nicht lesen.'
    if (error instanceof Error) {
      failureMessage = error.message
    }
    postWorkerMessage({ kind: 'FAILED', message: failureMessage })
  }
}
