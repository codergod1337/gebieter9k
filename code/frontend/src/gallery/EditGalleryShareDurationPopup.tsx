import { useState } from 'react'
import { EditValuePopup } from '../components/EditValuePopup.tsx'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import type { GalleryShare } from './GalleryShare.ts'
import { GalleryShareDurationFields } from './GalleryShareDurationFields.tsx'
import {
  createGalleryShareDurationInput,
  createGalleryShareLimitsOfInput,
  type GalleryShareDurationInput,
  type GalleryShareLimits,
} from './galleryShareDurationInput.ts'
import { GALLERY_SHARE_TEXTS } from './galleryShareTexts.ts'

type EditGalleryShareDurationPopupProps = {
  /** z. B. „Laufzeit von „für Oma““ */
  title: string
  /** Die Freigabe mit ihrer Laufzeit und der Zahl der bisherigen Aufrufe. */
  galleryShare: GalleryShare
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. Das Popup bleibt dann offen. */
  errorMessage: string | null
  /** Die geänderten Grenzen; der Aufrufer speichert und schließt bei Erfolg. */
  onSave: (changedLimits: GalleryShareLimits) => void
  onClose: () => void
}

/**
 * Das kleine Popup, in dem die Laufzeit einer Galerie-Freigabe direkt aus der Tabellenzeile geändert wird: dieselben
 * Eingaben wie beim Anlegen ({@link GalleryShareDurationFields}), vorbelegt mit dem, was die Freigabe gerade hat.
 * Darunter steht, wie viele Aufrufe schon gezählt sind: Eine Zahl darunter verbraucht den Link sofort.
 */
export function EditGalleryShareDurationPopup({
  title,
  galleryShare,
  isSaving,
  errorMessage,
  onSave,
  onClose,
}: EditGalleryShareDurationPopupProps) {
  const knownLimits: GalleryShareLimits = {
    expiresAt: galleryShare.expiresAt,
    maxAccessCount: galleryShare.maxAccessCount,
  }
  const startDurationInput = createGalleryShareDurationInput(knownLimits)
  const [durationInput, setDurationInput] = useState<GalleryShareDurationInput>(startDurationInput)
  /** Was an der Eingabe noch nicht passt; erscheint erst nach „Speichern“. */
  const [inputErrorMessage, setInputErrorMessage] = useState<string | null>(null)

  function handleDurationInputChange(changedDurationInput: GalleryShareDurationInput) {
    setDurationInput(changedDurationInput)
    setInputErrorMessage(null)
  }

  function handleSave() {
    const limitsResult = createGalleryShareLimitsOfInput(durationInput, galleryShare.expiresAt)
    if (limitsResult.limits === null) {
      setInputErrorMessage(limitsResult.errorMessage)
      return
    }
    setInputErrorMessage(null)
    onSave(limitsResult.limits)
  }

  let shownErrorMessage: string | null = inputErrorMessage
  if (shownErrorMessage === null) {
    shownErrorMessage = errorMessage
  }
  const accessCountText = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.editDurationAccessCount, {
    accessCount: String(galleryShare.accessCount),
  })

  return (
    <EditValuePopup title={title} isSaving={isSaving} errorMessage={shownErrorMessage} onSave={handleSave} onClose={onClose}>
      <GalleryShareDurationFields
        durationInput={durationInput}
        onDurationInputChange={handleDurationInputChange}
        disabled={isSaving}
      />
      <p className="small text-body-secondary mt-3 mb-0">{accessCountText}</p>
    </EditValuePopup>
  )
}
