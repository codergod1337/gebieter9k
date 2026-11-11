import { type ChangeEvent, type DragEvent, useRef, useState } from 'react'
import Button from 'react-bootstrap/Button'
import { DeleteButton } from './DeleteButton.tsx'
import { formatByteCount } from './formatByteCount.ts'
import { uploadMaxFilesPerList } from './uploadMaxFilesPerList.ts'

type FileDropzoneProps = {
  /** Die gewählten Dateien. Der Aufrufer hält sie und leert sie nach dem Hochladen. */
  selectedFiles: File[]
  onSelectedFilesChange: (changedFiles: File[]) => void
  /** `true`: eine Liste bis {@link uploadMaxFilesPerList} Dateien. `false`: genau eine, eine neue ersetzt die alte. */
  multiple: boolean
  /** z. B. während des Hochladens */
  disabled?: boolean
  /**
   * `false`: ohne die Liste der gewählten Dateien unter dem Feld, weil der Aufrufer sie selbst zeigt (die Upload-Liste
   * mit Stand, Feldern und Entfernen je Datei). Standard `true`.
   */
  showFileList?: boolean
}

/** Woran zwei Dateien als dieselbe gelten: Name, Größe und Änderungszeit. */
function getFileIdentity(file: File): string {
  return file.name + '|' + file.size + '|' + file.lastModified
}

/**
 * DAS Upload-Feld, für jeden Upload im Browser dasselbe: ein auffälliges Feld zum Ablegen, darin der Knopf zum
 * Durchsuchen. Darunter die gewählten Dateien, jede mit Mülleimer. Was beim Hochladen sonst noch mitgeht, baut der
 * Aufrufer daneben; das Feld selbst wählt nur Dateien. Das Aussehen bestimmt das Theme komplett (`file-dropzone*`).
 *
 * Als Liste nimmt es höchstens {@link uploadMaxFilesPerList} Dateien; ist die Liste voll, wird erst hochgeladen. Dieselbe
 * Datei kommt nicht zweimal in die Liste. Leere Dateien (0 Bytes) nimmt es gar nicht erst an: Hochladen lassen sie sich
 * nirgends, das Backend lehnt sie ab.
 */
export function FileDropzone({
  selectedFiles,
  onSelectedFilesChange,
  multiple,
  disabled = false,
  showFileList = true,
}: FileDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  /** Zählt dragenter und dragleave: Über Kindelementen feuert der Browser beide, das Feld soll trotzdem leuchten. */
  const dragDepthRef = useRef<number>(0)
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const [noticeText, setNoticeText] = useState<string | null>(null)

  const listFull = multiple && selectedFiles.length >= uploadMaxFilesPerList
  const acceptingFiles = !disabled && !listFull

  function addFiles(droppedFiles: File[]) {
    if (droppedFiles.length === 0) {
      return
    }
    const incomingFiles = droppedFiles.filter((droppedFile) => droppedFile.size > 0)
    const emptyFileCount = droppedFiles.length - incomingFiles.length
    let emptyFileNotice: string | null = null
    if (emptyFileCount === 1) {
      emptyFileNotice = '1 leere Datei nicht übernommen: Sie lässt sich nicht hochladen.'
    } else if (emptyFileCount > 1) {
      emptyFileNotice = emptyFileCount + ' leere Dateien nicht übernommen: Sie lassen sich nicht hochladen.'
    }
    if (incomingFiles.length === 0) {
      setNoticeText(emptyFileNotice)
      return
    }
    if (!multiple) {
      onSelectedFilesChange([incomingFiles[0]])
      const singleFileNoticeParts: string[] = []
      if (emptyFileNotice !== null) {
        singleFileNoticeParts.push(emptyFileNotice)
      }
      if (incomingFiles.length > 1) {
        singleFileNoticeParts.push('Hier geht nur eine Datei, übernommen ist die erste.')
      }
      let singleFileNotice: string | null = null
      if (singleFileNoticeParts.length > 0) {
        singleFileNotice = singleFileNoticeParts.join(' ')
      }
      setNoticeText(singleFileNotice)
      return
    }
    const knownFileIdentities = new Set<string>()
    for (const selectedFile of selectedFiles) {
      const selectedFileIdentity = getFileIdentity(selectedFile)
      knownFileIdentities.add(selectedFileIdentity)
    }
    const acceptedFiles: File[] = [...selectedFiles]
    let duplicateFileCount = 0
    let overLimitFileCount = 0
    for (const incomingFile of incomingFiles) {
      const incomingFileIdentity = getFileIdentity(incomingFile)
      if (knownFileIdentities.has(incomingFileIdentity)) {
        duplicateFileCount = duplicateFileCount + 1
        continue
      }
      if (acceptedFiles.length >= uploadMaxFilesPerList) {
        overLimitFileCount = overLimitFileCount + 1
        continue
      }
      acceptedFiles.push(incomingFile)
      knownFileIdentities.add(incomingFileIdentity)
    }
    onSelectedFilesChange(acceptedFiles)
    const noticeParts: string[] = []
    if (emptyFileNotice !== null) {
      noticeParts.push(emptyFileNotice)
    }
    if (duplicateFileCount > 0) {
      noticeParts.push(duplicateFileCount + ' schon in der Liste, nicht doppelt übernommen.')
    }
    if (overLimitFileCount > 0) {
      noticeParts.push(overLimitFileCount + ' über der Grenze von ' + uploadMaxFilesPerList + ' nicht übernommen: erst hochladen.')
    }
    let listNotice: string | null = null
    if (noticeParts.length > 0) {
      listNotice = noticeParts.join(' ')
    }
    setNoticeText(listNotice)
  }

  function handleBrowseClick() {
    fileInputRef.current?.click()
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const chosenFileList = event.target.files
    let chosenFiles: File[] = []
    if (chosenFileList !== null) {
      chosenFiles = Array.from(chosenFileList)
    }
    // Leeren, damit dieselbe Datei nach dem Entfernen wieder gewählt werden kann.
    event.target.value = ''
    addFiles(chosenFiles)
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    dragDepthRef.current = dragDepthRef.current + 1
    setIsDragOver(true)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    // Ohne preventDefault erlaubt der Browser kein Ablegen und öffnet die Datei selbst.
    event.preventDefault()
    if (acceptingFiles) {
      event.dataTransfer.dropEffect = 'copy'
    } else {
      event.dataTransfer.dropEffect = 'none'
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) {
      setIsDragOver(false)
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    dragDepthRef.current = 0
    setIsDragOver(false)
    if (!acceptingFiles) {
      return
    }
    const droppedFiles = Array.from(event.dataTransfer.files)
    addFiles(droppedFiles)
  }

  function handleRemoveFile(fileToRemove: File) {
    const remainingFiles = selectedFiles.filter((selectedFile) => selectedFile !== fileToRemove)
    onSelectedFilesChange(remainingFiles)
    setNoticeText(null)
  }

  const dropzoneClassNames = ['file-dropzone']
  if (isDragOver && acceptingFiles) {
    dropzoneClassNames.push('file-dropzone-drag-over')
  }
  if (!acceptingFiles) {
    dropzoneClassNames.push('file-dropzone-disabled')
  }
  const dropzoneClassName = dropzoneClassNames.join(' ')

  let dropText = 'Datei hierher ziehen'
  let browseText = 'Datei durchsuchen'
  let hintText = 'oder durchsuchen. Eine Datei.'
  if (multiple) {
    dropText = 'Dateien hierher ziehen'
    browseText = 'Dateien durchsuchen'
    const freeSlotCount = uploadMaxFilesPerList - selectedFiles.length
    hintText = 'oder durchsuchen. Bis zu ' + uploadMaxFilesPerList + ' Dateien, noch ' + freeSlotCount + ' frei.'
  }
  if (listFull) {
    dropText = 'Liste voll'
    hintText = uploadMaxFilesPerList + ' von ' + uploadMaxFilesPerList + ' Dateien: erst hochladen, dann geht es weiter.'
  }

  return (
    <div className="mb-3">
      <div
        className={dropzoneClassName}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}>
        <i className="bi bi-cloud-arrow-up file-dropzone-icon" aria-hidden="true"></i>
        <div className="file-dropzone-text">{dropText}</div>
        <Button type="button" className="file-dropzone-browse" onClick={handleBrowseClick} disabled={!acceptingFiles}>
          <i className="bi bi-folder2-open me-2" aria-hidden="true"></i>
          {browseText}
        </Button>
        <div className="file-dropzone-hint">{hintText}</div>
        <input ref={fileInputRef} type="file" multiple={multiple} hidden onChange={handleFileInputChange} />
      </div>
      {noticeText !== null && <div className="small text-danger mt-2">{noticeText}</div>}
      {showFileList && selectedFiles.length > 0 && (
        <ul className="list-group mt-2">
          {selectedFiles.map((selectedFile) => {
            const selectedFileIdentity = getFileIdentity(selectedFile)
            const selectedFileSizeText = formatByteCount(selectedFile.size)
            const removeLabel = selectedFile.name + ' entfernen'
            return (
              <li key={selectedFileIdentity} className="list-group-item d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark" aria-hidden="true"></i>
                <span className="text-break flex-grow-1">{selectedFile.name}</span>
                <span className="small text-body-secondary text-nowrap">{selectedFileSizeText}</span>
                {!disabled && <DeleteButton label={removeLabel} onClick={() => handleRemoveFile(selectedFile)} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
