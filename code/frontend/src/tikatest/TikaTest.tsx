import { useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import { ContentBox } from '../components/ContentBox.tsx'
import { Subheader } from '../components/Subheader.tsx'
import { formatByteCount } from '../components/formatByteCount.ts'
import type { TikaProbeResult } from './TikaProbe.ts'
import { TikaProbeDocumentBox } from './TikaProbeDocumentBox.tsx'
import { TikaProbeFileForm } from './TikaProbeFileForm.tsx'
import { useTikaProbe } from './useTikaProbe.ts'

/**
 * Das Modul Tika-Test unter `/tika-test` (nur ADMIN): eine Datei an Tika schicken und sehen, was Tika alles findet,
 * auch in eingebetteten Dokumenten, der Text vollständig. Die Datei wird danach verworfen. Später kommen hier weitere
 * Tests dazu.
 */
export function TikaTest() {
  const tikaProbeHook = useTikaProbe()
  const [tikaProbeResult, setTikaProbeResult] = useState<TikaProbeResult | null>(null)

  async function handleSend(file: File) {
    setTikaProbeResult(null)
    const createdTikaProbeResult = await tikaProbeHook.createTikaProbe(file)
    setTikaProbeResult(createdTikaProbeResult)
  }

  let errorMessage: string | null = null
  if (tikaProbeHook.error !== null) {
    errorMessage = tikaProbeHook.error.detail
  }
  const subheaderStatus = (
    <>
      <i className="bi bi-file-earmark-binary me-2"></i>
      Tika-Test
    </>
  )

  return (
    <>
      <Subheader status={subheaderStatus} />
      <div className="main-content">
        <TikaProbeFileForm isSending={tikaProbeHook.isLoading} errorMessage={errorMessage} onSend={handleSend} />
        {tikaProbeResult !== null && <TikaProbeResultView tikaProbeResult={tikaProbeResult} />}
      </div>
    </>
  )
}

type TikaProbeResultViewProps = {
  tikaProbeResult: TikaProbeResult
}

/** Das Ergebnis: zuerst die Übersicht, dann je Dokument eine Box. */
function TikaProbeResultView({ tikaProbeResult }: TikaProbeResultViewProps) {
  const receivedBytesText = formatByteCount(tikaProbeResult.receivedBytes)
  const durationText = tikaProbeResult.durationMillis.toLocaleString('de-DE') + ' ms'
  const documentCount = tikaProbeResult.documents.length
  const documentCountText = documentCount + ' (die Datei selbst und ' + (documentCount - 1) + ' eingebettete)'

  return (
    <>
      <ContentBox title="Ergebnis" footer="Die Datei ist verworfen.">
        <dl className="row mb-0">
          <dt className="col-sm-3">Angekommen</dt>
          <dd className="col-sm-9">{receivedBytesText}</dd>
          <dt className="col-sm-3">Dauer</dt>
          <dd className="col-sm-9">{durationText}</dd>
          <dt className="col-sm-3">Dokumente</dt>
          <dd className="col-sm-9">{documentCountText}</dd>
        </dl>
        {tikaProbeResult.parseErrorText !== null && (
          <Alert variant="warning" className="mt-3 mb-0">
            Tika hat abgebrochen: {tikaProbeResult.parseErrorText}
          </Alert>
        )}
      </ContentBox>
      {tikaProbeResult.documents.map((document, documentIndex) => (
        <TikaProbeDocumentBox key={documentIndex} document={document} documentIndex={documentIndex} />
      ))}
    </>
  )
}
