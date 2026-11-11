import type { Sha256WorkerMessage, Sha256WorkerRequest } from './sha256WorkerMessages.ts'

/**
 * Der SHA-256 einer Datei als Hex, klein, wie im Backend (die id jedes Dokuments). Rechnet in einem eigenen Worker
 * (`sha256Worker.ts`): Mehrere Aufrufe laufen so wirklich gleichzeitig, auf allen Kernen. Jede Größe (geprüft
 * 2026-11-08: 5 GiB, gleiches Ergebnis wie Node). `onProgress` meldet die gelesenen Bytes. Liefert `shouldContinue`
 * `false` (z. B. weil der Upload schon läuft), wird der Worker beendet und das Ergebnis ist `null`.
 */
export function createFileSha256Hex(
  file: File,
  onProgress?: (hashedBytes: number, totalBytes: number) => void,
  shouldContinue?: () => boolean,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (shouldContinue !== undefined && !shouldContinue()) {
      resolve(null)
      return
    }
    // Vite erkennt einen Worker nur, wenn new URL(…) direkt im new Worker(…) steht: deshalb ausnahmsweise verschachtelt
    const sha256Worker = new Worker(new URL('./sha256Worker.ts', import.meta.url), { type: 'module' })
    sha256Worker.onmessage = (event: MessageEvent<Sha256WorkerMessage>) => {
      const workerMessage = event.data
      if (workerMessage.kind === 'PROGRESS') {
        if (shouldContinue !== undefined && !shouldContinue()) {
          sha256Worker.terminate()
          resolve(null)
          return
        }
        if (onProgress !== undefined) {
          onProgress(workerMessage.hashedBytes, workerMessage.totalBytes)
        }
        return
      }
      sha256Worker.terminate()
      if (workerMessage.kind === 'DONE') {
        resolve(workerMessage.sha256Hex)
        return
      }
      const failure = new Error(workerMessage.message)
      reject(failure)
    }
    sha256Worker.onerror = (errorEvent) => {
      sha256Worker.terminate()
      const failure = new Error(errorEvent.message)
      reject(failure)
    }
    const workerRequest: Sha256WorkerRequest = { file }
    sha256Worker.postMessage(workerRequest)
  })
}
