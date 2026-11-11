import { type ChangeEvent, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { type BadgeLook, EMPTY_BADGE_LOOK } from '../../badge/BadgeLook.ts'
import { BadgeLookFields } from '../../badge/BadgeLookFields.tsx'
import { BadgeLookPreview } from '../../badge/BadgeLookPreview.tsx'
import { LookBadge } from '../../badge/LookBadge.tsx'
import { type KeyAndDisplayName, KeyDisplayNameForm } from '../../components/KeyDisplayNameForm.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { Rank } from '../../rank/Rank.ts'

type RankFormProps = {
  title: string
  /** Der Startstand: beim Anlegen leer, beim Bearbeiten der gespeicherte Rang. */
  initialRank: Rank
  /** Nur beim Anlegen: Der Key eines bestehenden Rangs ändert sich nie. */
  isKeyEditable: boolean
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  onSave: (rank: Rank) => void
  onCancel: () => void
}

/**
 * Das Formular eines Rangs für Anlegen und Bearbeiten: Key, Anzeigename, Mindestpunkte und das Aussehen des Schilds,
 * darunter die Live-Vorschau. Die Stufe steht nur in der Vorschau, geändert wird sie per Drag and Drop im Tab.
 */
export function RankForm({ title, initialRank, isKeyEditable, isSaving, errorMessage, onSave, onCancel }: RankFormProps) {
  const [minimumPointsText, setMinimumPointsText] = useState<string>(String(initialRank.minimumPoints))
  const [badgeLook, setBadgeLook] = useState<BadgeLook>(initialRank.badgeLook ?? EMPTY_BADGE_LOOK)

  function handleMinimumPointsChange(event: ChangeEvent<HTMLInputElement>) {
    const typedMinimumPoints = event.target.value
    setMinimumPointsText(typedMinimumPoints)
  }

  function handleSave(enteredKeyAndDisplayName: KeyAndDisplayName) {
    // Leer heißt 0; ob die Zahl passt, prüft das Backend.
    let minimumPoints = 0
    if (minimumPointsText.trim() !== '') {
      minimumPoints = Number(minimumPointsText)
    }
    const enteredRank: Rank = {
      key: enteredKeyAndDisplayName.key,
      displayName: enteredKeyAndDisplayName.displayName,
      level: initialRank.level,
      minimumPoints,
      badgeLook,
    }
    onSave(enteredRank)
  }

  function renderPreview(enteredKeyAndDisplayName: KeyAndDisplayName) {
    let previewText = getTextInCurrentLanguage(enteredKeyAndDisplayName.displayName)
    if (previewText.trim() === '') {
      previewText = 'Anzeigename'
    }
    return (
      <BadgeLookPreview>
        <LookBadge look={badgeLook} shape="tag" level={initialRank.level}>
          {previewText}
        </LookBadge>
      </BadgeLookPreview>
    )
  }

  const extraFields = (
    <>
      <Form.Group className="mb-3" controlId="rankFormMinimumPoints">
        <Form.Label>Mindestpunkte</Form.Label>
        <Form.Control
          type="number"
          min={0}
          step={1}
          value={minimumPointsText}
          onChange={handleMinimumPointsChange}
          required
        />
        <Form.Text>So viele Punkte braucht ein User mindestens für diesen Rang.</Form.Text>
      </Form.Group>
      <BadgeLookFields controlId="rankBadgeLook" value={badgeLook} onChange={setBadgeLook} />
    </>
  )
  return (
    <KeyDisplayNameForm
      title={title}
      initialKey={initialRank.key}
      initialDisplayName={initialRank.displayName}
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
