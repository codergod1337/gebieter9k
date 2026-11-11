import { type ChangeEvent, type FormEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { RangeSlider } from '../components/RangeSlider.tsx'
import { SubmitButton } from '../components/SubmitButton.tsx'
import { UsersAvatar } from '../components/UsersAvatar.tsx'
import {
  BANNER_DRIFT_SPEED_DEFAULT_PERCENT,
  BANNER_DRIFT_SPEED_MAX_PERCENT,
  PROFILE_STATUS_TEXT_MAX_LENGTH,
} from '../users/UsersDetail.ts'

/** Was einer der Speicherwege des Popups bekommt: alles, was man darin einstellt. */
export type ProfileHeadSettings = {
  statusText: string
  bannerDriftSpeedPercent: number
  /** `null`: Standard (weiß). */
  avatarTextColor: string | null
  /** `null`: Standard (Verlauf aus der GUID). */
  avatarBackgroundColor: string | null
}

type ProfileHeadSettingsPopupProps = {
  /** Für die Vorschau des Avatars: GUID und Username des eigenen Profils. */
  usersGuid: string
  username: string
  /** Der gespeicherte Status-Text, `null` ohne. */
  statusText: string | null
  /** Das gespeicherte Tempo der Banner-Drift in Prozent. */
  bannerDriftSpeedPercent: number
  /** Die gespeicherten Farben des Avatars ohne Profilbild, `null`: Standard. */
  avatarTextColor: string | null
  avatarBackgroundColor: string | null
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  /** Bei jedem Schieben: Der Aufrufer zeigt das Tempo gleich am Banner, `null` beim Schließen (zurück zum Gespeicherten). */
  onBannerDriftSpeedPreview: (previewPercent: number | null) => void
  /** Speichert alles; liefert, ob es geklappt hat. Dann schließt das Popup. */
  onSave: (profileHeadSettings: ProfileHeadSettings) => Promise<boolean>
  onClose: () => void
}

/** Schrittweite des Reglers in Prozent. */
const BANNER_DRIFT_SPEED_STEP_PERCENT = 10

/** Was der Farbwähler zeigt, solange eine Farbe auf Standard steht (ein Farbwähler braucht immer einen Wert). */
const DEFAULT_TEXT_COLOR_SHOWN = '#ffffff'
const DEFAULT_BACKGROUND_COLOR_SHOWN = '#8c1b3d'

/** Was ein Tempo bedeutet, unter dem Regler. */
function describeBannerDriftSpeed(percent: number) {
  if (percent === 0) {
    return 'Das Banner steht still.'
  }
  if (percent === BANNER_DRIFT_SPEED_DEFAULT_PERCENT) {
    return 'So schnell, wie das Theme es vorgibt.'
  }
  if (percent < BANNER_DRIFT_SPEED_DEFAULT_PERCENT) {
    return percent + ' % des Tempos aus dem Theme, langsamer.'
  }
  const fasterPercent = percent - BANNER_DRIFT_SPEED_DEFAULT_PERCENT
  return fasterPercent + ' % schneller als im Theme.'
}

/**
 * Das Popup hinter dem Zahnrad im Profilkopf: der Status-Text (was man gerade macht), wie schnell das Banner driftet
 * und die Farben des Avatars ohne Profilbild (Schrift und Hintergrund, Nutzer 2026-11-09). Alles gehört zum Profil
 * (`UsersDetail`), jeder Besucher sieht es so. Das Banner zeigt das Tempo schon beim Schieben, der Avatar daneben die
 * Farben; gespeichert wird erst mit „Speichern“, Abbrechen nimmt die Vorschau zurück.
 */
export function ProfileHeadSettingsPopup({
  usersGuid,
  username,
  statusText,
  bannerDriftSpeedPercent,
  avatarTextColor,
  avatarBackgroundColor,
  isSaving,
  errorMessage,
  onBannerDriftSpeedPreview,
  onSave,
  onClose,
}: ProfileHeadSettingsPopupProps) {
  const [enteredStatusText, setEnteredStatusText] = useState<string>(statusText ?? '')
  const [chosenDriftPercent, setChosenDriftPercent] = useState<number>(bannerDriftSpeedPercent)
  const [chosenTextColor, setChosenTextColor] = useState<string | null>(avatarTextColor)
  const [chosenBackgroundColor, setChosenBackgroundColor] = useState<string | null>(avatarBackgroundColor)
  const textColorShown = chosenTextColor ?? DEFAULT_TEXT_COLOR_SHOWN
  const backgroundColorShown = chosenBackgroundColor ?? DEFAULT_BACKGROUND_COLOR_SHOWN
  const statusTextLength = enteredStatusText.length
  const statusTextCountText = statusTextLength + ' / ' + PROFILE_STATUS_TEXT_MAX_LENGTH

  function handleStatusTextChange(event: ChangeEvent<HTMLInputElement>) {
    const changedStatusText = event.target.value
    setEnteredStatusText(changedStatusText)
  }

  function handleTextColorChange(event: ChangeEvent<HTMLInputElement>) {
    const changedTextColor = event.target.value
    setChosenTextColor(changedTextColor)
  }

  function handleBackgroundColorChange(event: ChangeEvent<HTMLInputElement>) {
    const changedBackgroundColor = event.target.value
    setChosenBackgroundColor(changedBackgroundColor)
  }

  function handleDriftPercentChange(changedPercent: number) {
    setChosenDriftPercent(changedPercent)
    onBannerDriftSpeedPreview(changedPercent)
  }

  function handleClose() {
    onBannerDriftSpeedPreview(null)
    onClose()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const profileHeadSettings: ProfileHeadSettings = {
      statusText: enteredStatusText,
      bannerDriftSpeedPercent: chosenDriftPercent,
      avatarTextColor: chosenTextColor,
      avatarBackgroundColor: chosenBackgroundColor,
    }
    const saved = await onSave(profileHeadSettings)
    if (saved) {
      onBannerDriftSpeedPreview(null)
      onClose()
    }
  }

  return (
    <Modal show onHide={handleClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Profilkopf einstellen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ErrorAlert message={errorMessage} />
          <Form.Group className="mb-4" controlId="profileHeadStatusText">
            <Form.Label>Status</Form.Label>
            <Form.Control
              type="text"
              maxLength={PROFILE_STATUS_TEXT_MAX_LENGTH}
              placeholder="Was machst du gerade?"
              value={enteredStatusText}
              disabled={isSaving}
              onChange={handleStatusTextChange}
            />
            <Form.Text>{statusTextCountText} Zeichen, leer: kein Status.</Form.Text>
          </Form.Group>
          <div className="mb-4">
            <div className="form-label">Farben deines Avatars ohne Profilbild</div>
            <div className="profile-head-avatar-colors">
              <UsersAvatar
                usersGuid={usersGuid}
                username={username}
                profileImageBase64Png={null}
                size="medium"
                textColor={chosenTextColor}
                backgroundColor={chosenBackgroundColor}
              />
              <Form.Group controlId="profileHeadAvatarTextColor">
                <Form.Label className="small mb-1">Schrift</Form.Label>
                <div className="profile-head-color-field">
                  <Form.Control
                    type="color"
                    className="form-control-color"
                    value={textColorShown}
                    disabled={isSaving}
                    onChange={handleTextColorChange}
                  />
                  <Button
                    variant="link"
                    size="sm"
                    disabled={isSaving || chosenTextColor === null}
                    onClick={() => setChosenTextColor(null)}>
                    Standard
                  </Button>
                </div>
              </Form.Group>
              <Form.Group controlId="profileHeadAvatarBackgroundColor">
                <Form.Label className="small mb-1">Hintergrund</Form.Label>
                <div className="profile-head-color-field">
                  <Form.Control
                    type="color"
                    className="form-control-color"
                    value={backgroundColorShown}
                    disabled={isSaving}
                    onChange={handleBackgroundColorChange}
                  />
                  <Button
                    variant="link"
                    size="sm"
                    disabled={isSaving || chosenBackgroundColor === null}
                    onClick={() => setChosenBackgroundColor(null)}>
                    Standard
                  </Button>
                </div>
              </Form.Group>
            </div>
            <Form.Text>
              Standard: weiße Schrift auf einem Verlauf aus deiner GUID. Mit Profilbild sieht man die Farben nicht.
            </Form.Text>
          </div>
          <RangeSlider
            id="profileHeadBannerDriftSpeed"
            label="Drift des Banners in Prozent"
            value={chosenDriftPercent}
            min={0}
            max={BANNER_DRIFT_SPEED_MAX_PERCENT}
            step={BANNER_DRIFT_SPEED_STEP_PERCENT}
            onChange={handleDriftPercentChange}
            describeValue={describeBannerDriftSpeed}
            disabled={isSaving}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            Abbrechen
          </Button>
          <SubmitButton isSubmitting={isSaving} fullWidth={false}>
            Speichern
          </SubmitButton>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
