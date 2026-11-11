import { type ChangeEvent, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { type KeyAndDisplayName, KeyDisplayNameForm } from '../../components/KeyDisplayNameForm.tsx'
import { MultilingualTextInput } from '../../components/MultilingualTextInput.tsx'
import { getFilledMultilingualTextOrNull } from '../../language/getFilledMultilingualTextOrNull.ts'
import type { MultilingualText } from '../../language/MultilingualText.ts'
import type { PointActivity } from '../../point/PointActivity.ts'

type PointActivityFormProps = {
  title: string
  /** Der Startstand: beim Anlegen leer, beim Bearbeiten die gespeicherte Tätigkeit. */
  initialPointActivity: PointActivity
  /** Nur beim Anlegen: Der Key einer bestehenden Tätigkeit ändert sich nie. */
  isKeyEditable: boolean
  isSaving: boolean
  errorMessage: string | null
  onSave: (pointActivity: PointActivity) => void
  onCancel: () => void
}

/**
 * Das Formular einer Tätigkeit für Anlegen und Bearbeiten: Key, Anzeigename (so steht sie im Kontoauszug), wann es die
 * Punkte gibt, und wie viele. Neue Punkte gelten nur für künftige Buchungen.
 */
export function PointActivityForm({
  title,
  initialPointActivity,
  isKeyEditable,
  isSaving,
  errorMessage,
  onSave,
  onCancel,
}: PointActivityFormProps) {
  const [description, setDescription] = useState<MultilingualText>(initialPointActivity.description ?? {})
  const [rewardPointsText, setRewardPointsText] = useState<string>(initialPointActivity.rewardPoints.toString())

  function handleSave(enteredKeyAndDisplayName: KeyAndDisplayName) {
    const enteredDescription = getFilledMultilingualTextOrNull(description)
    const parsedRewardPoints = Number(rewardPointsText.trim())
    let enteredRewardPoints = 0
    if (Number.isInteger(parsedRewardPoints)) {
      enteredRewardPoints = parsedRewardPoints
    }
    onSave({
      key: enteredKeyAndDisplayName.key,
      displayName: enteredKeyAndDisplayName.displayName,
      description: enteredDescription,
      rewardPoints: enteredRewardPoints,
      listingPosition: initialPointActivity.listingPosition,
    })
  }

  const extraFields = (
    <>
      <MultilingualTextInput
        controlId="pointActivityFormDescription"
        label="Wann gibt es die Punkte?"
        value={description}
        onChange={setDescription}
        required={false}
      />
      <Form.Group className="mb-3" controlId="pointActivityFormRewardPoints">
        <Form.Label>Punkte je Tätigkeit</Form.Label>
        <Form.Control
          type="number"
          min={0}
          step={1}
          value={rewardPointsText}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setRewardPointsText(event.target.value)}
        />
        <Form.Text>0 heißt: gibt keine Punkte. Gilt nur für künftige Buchungen, nie rückwirkend.</Form.Text>
      </Form.Group>
    </>
  )
  return (
    <KeyDisplayNameForm
      title={title}
      initialKey={initialPointActivity.key}
      initialDisplayName={initialPointActivity.displayName}
      isKeyEditable={isKeyEditable}
      isSaving={isSaving}
      errorMessage={errorMessage}
      extraFields={extraFields}
      onSave={handleSave}
      onCancel={onCancel}
    />
  )
}
