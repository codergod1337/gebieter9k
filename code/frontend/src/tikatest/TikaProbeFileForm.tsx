import { type FormEvent, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { ContentBox } from '../components/ContentBox.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { FileDropzone } from '../components/FileDropzone.tsx'
import { SubmitButton } from '../components/SubmitButton.tsx'

type TikaProbeFileFormProps = {
  isSending: boolean
  /** Fehler des Requests, `null` wenn keiner. */
  errorMessage: string | null
  onSend: (file: File) => void
}

/**
 * Eine Datei wählen (über das gemeinsame Upload-Feld) und an Tika schicken. Das Formular schickt nichts selbst, das
 * macht der Aufrufer in `onSend`.
 */
export function TikaProbeFileForm({ isSending, errorMessage, onSend }: TikaProbeFileFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selectedFiles.length === 0) {
      return
    }
    onSend(selectedFiles[0])
  }

  const footer = (
    <div className="d-flex justify-content-end">
      <SubmitButton isSubmitting={isSending} fullWidth={false} disabled={selectedFiles.length === 0}>
        An Tika schicken
      </SubmitButton>
    </div>
  )

  return (
    <Form onSubmit={handleSubmit}>
      <ContentBox title="Datei an Tika schicken" footer={footer}>
        <ErrorAlert message={errorMessage} />
        <FileDropzone
          selectedFiles={selectedFiles}
          onSelectedFilesChange={setSelectedFiles}
          multiple={false}
          disabled={isSending}
        />
        <Form.Text className="d-block">
          Die Datei geht roh an Tika, ohne Namen und ohne Typ: Tika erkennt alles allein aus den Bytes. Danach wird sie
          verworfen. Ohne Grenzen, auch sehr große Dateien.
        </Form.Text>
      </ContentBox>
    </Form>
  )
}
