import { type ChangeEvent, useState } from 'react'
import Form from 'react-bootstrap/Form'
import type { Achievement } from '../../achievement/Achievement.ts'
import {
  ACHIEVEMENT_TRACKING_KEY_LOOKS,
  ACHIEVEMENT_TRACKING_KEYS,
  type AchievementTrackingKey,
} from '../../achievement/achievementTrackingKeys.ts'
import { AchievementBadge } from '../../achievement/AchievementBadge.tsx'
import { type BadgeLook, EMPTY_BADGE_LOOK } from '../../badge/BadgeLook.ts'
import { BadgeLookFields } from '../../badge/BadgeLookFields.tsx'
import { BadgeLookPreview } from '../../badge/BadgeLookPreview.tsx'
import { type KeyAndDisplayName, KeyDisplayNameForm } from '../../components/KeyDisplayNameForm.tsx'
import { MultilingualTextInput } from '../../components/MultilingualTextInput.tsx'
import { DEFAULT_LANGUAGE } from '../../language/activeLanguages.ts'
import { getFilledMultilingualTextOrNull } from '../../language/getFilledMultilingualTextOrNull.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { MultilingualText } from '../../language/MultilingualText.ts'

type AchievementFormProps = {
  title: string
  /** Der Startstand: beim Anlegen leer, beim Bearbeiten das gespeicherte Achievement. */
  initialAchievement: Achievement
  /** Nur beim Anlegen: Der Key eines bestehenden Achievements ändert sich nie. */
  isKeyEditable: boolean
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  onSave: (achievement: Achievement) => void
  onCancel: () => void
}

/**
 * Das Formular eines Achievements für Anlegen und Bearbeiten: Key, Anzeigename, Beschreibung (wofür es das gibt), die
 * Bedingung (Tracking-Art, Schwelle, wiederholbar, Punkte je Abschluss) und das Aussehen des Medaillons, darunter die
 * Live-Vorschau. Ohne Tracking-Art wird es nur von Hand vergeben.
 */
export function AchievementForm({
  title,
  initialAchievement,
  isKeyEditable,
  isSaving,
  errorMessage,
  onSave,
  onCancel,
}: AchievementFormProps) {
  const [description, setDescription] = useState<MultilingualText>(initialAchievement.description ?? {})
  const [badgeLook, setBadgeLook] = useState<BadgeLook>(initialAchievement.badgeLook ?? EMPTY_BADGE_LOOK)
  const [trackingKey, setTrackingKey] = useState<AchievementTrackingKey | null>(initialAchievement.trackingKey)
  const [thresholdText, setThresholdText] = useState<string>(initialAchievement.thresholdValue?.toString() ?? '')
  const [repeatable, setRepeatable] = useState<boolean>(initialAchievement.repeatable)
  const [rewardPointsText, setRewardPointsText] = useState<string>(initialAchievement.rewardPoints.toString())

  function handleTrackingKeyChange(event: ChangeEvent<HTMLSelectElement>) {
    const selectedValue = event.target.value
    if (selectedValue === '') {
      setTrackingKey(null)
      setThresholdText('')
      return
    }
    setTrackingKey(selectedValue as AchievementTrackingKey)
  }

  /** Leer oder keine ganze Zahl wird `null` (Schwelle) bzw. 0 (Punkte); das Backend prüft die Grenzen. */
  function parseWholeNumberOrNull(text: string): number | null {
    const trimmedText = text.trim()
    if (trimmedText === '') {
      return null
    }
    const parsedNumber = Number(trimmedText)
    if (!Number.isInteger(parsedNumber)) {
      return null
    }
    return parsedNumber
  }

  function createEnteredAchievement(enteredKeyAndDisplayName: KeyAndDisplayName): Achievement {
    // Ohne Text in der Standardsprache gibt es keine Beschreibung.
    const enteredDescription = getFilledMultilingualTextOrNull(description)
    let enteredThresholdValue: number | null = null
    if (trackingKey !== null) {
      enteredThresholdValue = parseWholeNumberOrNull(thresholdText)
    }
    const enteredRewardPoints = parseWholeNumberOrNull(rewardPointsText) ?? 0
    return {
      key: enteredKeyAndDisplayName.key,
      displayName: enteredKeyAndDisplayName.displayName,
      description: enteredDescription,
      listingPosition: initialAchievement.listingPosition,
      badgeLook,
      trackingKey,
      thresholdValue: enteredThresholdValue,
      repeatable,
      rewardPoints: enteredRewardPoints,
    }
  }

  function handleSave(enteredKeyAndDisplayName: KeyAndDisplayName) {
    const enteredAchievement = createEnteredAchievement(enteredKeyAndDisplayName)
    onSave(enteredAchievement)
  }

  function renderPreview(enteredKeyAndDisplayName: KeyAndDisplayName) {
    const previewAchievement = createEnteredAchievement(enteredKeyAndDisplayName)
    let previewText = getTextInCurrentLanguage(previewAchievement.displayName)
    if (previewText.trim() === '') {
      previewText = 'Anzeigename'
      previewAchievement.displayName = { [DEFAULT_LANGUAGE.code]: previewText }
    }
    return (
      <BadgeLookPreview>
        <span className="achievement-showcase">
          <AchievementBadge achievement={previewAchievement} />
          <span className="achievement-showcase-name">{previewText}</span>
        </span>
      </BadgeLookPreview>
    )
  }

  const extraFields = (
    <>
      <MultilingualTextInput
        controlId="achievementFormDescription"
        label="Beschreibung: wofür gibt es das?"
        value={description}
        onChange={setDescription}
        required={false}
      />
      <Form.Group className="mb-3" controlId="achievementFormTrackingKey">
        <Form.Label>Erreicht durch</Form.Label>
        <Form.Select value={trackingKey ?? ''} onChange={handleTrackingKeyChange}>
          <option value="">nur von Hand vergeben</option>
          {ACHIEVEMENT_TRACKING_KEYS.map((achievementTrackingKey) => (
            <option key={achievementTrackingKey} value={achievementTrackingKey}>
              {ACHIEVEMENT_TRACKING_KEY_LOOKS[achievementTrackingKey].label}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      {trackingKey !== null && (
        <Form.Group className="mb-3" controlId="achievementFormThreshold">
          <Form.Label>Schwelle in {ACHIEVEMENT_TRACKING_KEY_LOOKS[trackingKey].unit}</Form.Label>
          <Form.Control
            type="number"
            min={1}
            step={1}
            value={thresholdText}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setThresholdText(event.target.value)}
          />
          <Form.Text>{ACHIEVEMENT_TRACKING_KEY_LOOKS[trackingKey].thresholdHint}</Form.Text>
        </Form.Group>
      )}
      <Form.Check
        type="switch"
        id="achievementFormRepeatable"
        className="mb-3"
        label="Wiederholbar: jedes weitere Vielfache der Schwelle ist ein weiterer Abschluss"
        checked={repeatable}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setRepeatable(event.target.checked)}
      />
      <Form.Group className="mb-3" controlId="achievementFormRewardPoints">
        <Form.Label>Punkte je Abschluss</Form.Label>
        <Form.Control
          type="number"
          min={0}
          step={1}
          value={rewardPointsText}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setRewardPointsText(event.target.value)}
        />
      </Form.Group>
      <BadgeLookFields controlId="achievementBadgeLook" value={badgeLook} onChange={setBadgeLook} />
    </>
  )
  return (
    <KeyDisplayNameForm
      title={title}
      initialKey={initialAchievement.key}
      initialDisplayName={initialAchievement.displayName}
      isKeyEditable={isKeyEditable}
      isSaving={isSaving}
      errorMessage={errorMessage}
      extraFields={extraFields}
      renderPreview={renderPreview}
      onSave={handleSave}
      onCancel={onCancel}
    />
  )
}
