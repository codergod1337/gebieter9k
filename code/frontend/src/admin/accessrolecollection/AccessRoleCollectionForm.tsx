import { useState } from 'react'
import type { AccessRoleCollection } from '../../auth/access/AccessRoleCollection.ts'
import { type BadgeLook, EMPTY_BADGE_LOOK } from '../../badge/BadgeLook.ts'
import { BadgeLookFields } from '../../badge/BadgeLookFields.tsx'
import { BadgeLookPreview } from '../../badge/BadgeLookPreview.tsx'
import { LookBadge } from '../../badge/LookBadge.tsx'
import { type KeyAndDisplayName, KeyDisplayNameForm } from '../../components/KeyDisplayNameForm.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'

type AccessRoleCollectionFormProps = {
  title: string
  /** der gespeicherte Stand der Position */
  initialAccessRoleCollection: AccessRoleCollection
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  onSave: (accessRoleCollection: AccessRoleCollection) => void
  onCancel: () => void
}

/**
 * Das Formular einer Position: Anzeigename und das Aussehen der Pille, darunter die Live-Vorschau auf hellem und
 * dunklem Grund. Der Key ändert sich nie.
 */
export function AccessRoleCollectionForm({
  title,
  initialAccessRoleCollection,
  isSaving,
  errorMessage,
  onSave,
  onCancel,
}: AccessRoleCollectionFormProps) {
  const [badgeLook, setBadgeLook] = useState<BadgeLook>(initialAccessRoleCollection.badgeLook ?? EMPTY_BADGE_LOOK)

  function handleSave(enteredKeyAndDisplayName: KeyAndDisplayName) {
    const enteredAccessRoleCollection: AccessRoleCollection = {
      key: enteredKeyAndDisplayName.key,
      displayName: enteredKeyAndDisplayName.displayName,
      listingPosition: initialAccessRoleCollection.listingPosition,
      badgeLook,
    }
    onSave(enteredAccessRoleCollection)
  }

  function renderPreview(enteredKeyAndDisplayName: KeyAndDisplayName) {
    let previewText = getTextInCurrentLanguage(enteredKeyAndDisplayName.displayName)
    if (previewText.trim() === '') {
      previewText = 'Anzeigename'
    }
    return (
      <BadgeLookPreview>
        <LookBadge look={badgeLook} shape="pill">
          {previewText}
        </LookBadge>
      </BadgeLookPreview>
    )
  }

  const badgeLookFields = (
    <BadgeLookFields controlId="accessRoleCollectionBadgeLook" value={badgeLook} onChange={setBadgeLook} />
  )
  return (
    <KeyDisplayNameForm
      title={title}
      initialKey={initialAccessRoleCollection.key}
      initialDisplayName={initialAccessRoleCollection.displayName}
      isKeyEditable={false}
      isSaving={isSaving}
      errorMessage={errorMessage}
      extraFields={badgeLookFields}
      renderPreview={renderPreview}
      onSave={handleSave}
      onCancel={onCancel}
    />
  )
}
