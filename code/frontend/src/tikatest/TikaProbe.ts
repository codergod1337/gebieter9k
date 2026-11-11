/** Ein Dokument, das Tika gelesen hat: die Datei selbst oder ein darin eingebettetes (`TikaProbeDocument` im Backend). */
export type TikaProbeDocument = {
  /** Der Pfad in der Datei, z. B. `/bild.png`; `null` bei der Datei selbst. */
  embeddedResourcePath: string | null
  /** Der erkannte Text, vollständig; `null`, wenn Tika keinen liefert. */
  content: string | null
  /** Alle übrigen Metadaten, so wie Tika sie nennt, je Schlüssel alle Werte. */
  metadata: Record<string, string[]>
}

/** Alles, was Tika in einer Datei gefunden hat (`TikaProbeResult` im Backend). */
export type TikaProbeResult = {
  receivedBytes: number
  durationMillis: number
  /** Der Fehler, an dem Tika abgebrochen hat, `null` wenn keiner. Was Tika bis dahin fand, steht trotzdem da. */
  parseErrorText: string | null
  /** Das erste ist die Datei selbst, danach jedes eingebettete. */
  documents: TikaProbeDocument[]
}
