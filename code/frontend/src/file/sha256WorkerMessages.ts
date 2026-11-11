/** An den Worker: diese Datei hashen. Ein `File` lässt sich an einen Worker schicken, ohne seine Bytes zu kopieren. */
export type Sha256WorkerRequest = {
  file: File
}

/** Vom Worker: Fortschritt nach jedem Stück, am Ende der Hash oder der Grund des Scheiterns. */
export type Sha256WorkerMessage =
  | { kind: 'PROGRESS'; hashedBytes: number; totalBytes: number }
  | { kind: 'DONE'; sha256Hex: string }
  | { kind: 'FAILED'; message: string }
