import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import { getFirstErrorDetail } from '../../api/getFirstErrorDetail.ts'
import { ContentBox } from '../../components/ContentBox.tsx'
import { EditableCellButton } from '../../components/EditableCellButton.tsx'
import { EditDisplayNamePopup } from '../../components/EditDisplayNamePopup.tsx'
import { EditTextPopup } from '../../components/EditTextPopup.tsx'
import type { KeyAndDisplayName } from '../../components/KeyDisplayNameForm.tsx'
import { LoadStatus } from '../../components/LoadStatus.tsx'
import { NewEntityButton } from '../../components/NewEntityButton.tsx'
import { NewKeyDisplayNamePopup } from '../../components/NewKeyDisplayNamePopup.tsx'
import { Table, type TableColumn } from '../../components/Table.tsx'
import { useListingOrder } from '../../components/useListingOrder.ts'
import type { KnowledgeSection, KnowledgeSectionLevel, NewKnowledgeSection } from '../../knowledge/section/KnowledgeSection.ts'
import { useKnowledgeSection } from '../../knowledge/section/useKnowledgeSection.ts'
import type { MultilingualText } from '../../language/MultilingualText.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import { KNOWLEDGE_SECTION_TEXTS, type KnowledgeSectionLevelTexts } from './knowledgeSectionTexts.ts'

type KnowledgeSectionLevelBoxProps = {
  /** Welche Ebene die Box zeigt: Rubriken, Kapitel oder Unterkapitel. */
  level: KnowledgeSectionLevel
  levelTexts: KnowledgeSectionLevelTexts
  /** Die Kennung der Tabelle für die Spalteneinstellungen des Users, z. B. `KNOWLEDGE_RUBRIC`. */
  settingKey: string
  /** Der gewählte Punkt darüber, unter dem diese Ebene hängt; `null` bei den Rubriken und solange keiner gewählt ist. */
  parentKnowledgeSection: KnowledgeSection | null
  /** Die Punkte dieser Ebene unter dem Punkt darüber, in ihrer Reihenfolge; `null`, solange die Stammdaten laden. */
  knowledgeSections: KnowledgeSection[] | null
  /** Fehler beim Laden der Stammdaten, `null` wenn keiner. */
  loadErrorMessage: string | null
  /** Wie viele Punkte unter einem Punkt dieser Ebene hängen; `null` auf der untersten Ebene: Dort gibt es nichts darunter. */
  countChildren: ((knowledgeSection: KnowledgeSection) => number) | null
  /** Die id des Punkts dieser Ebene, dessen Inhalt gerade in der Box darunter steht; `null` wenn keiner. */
  selectedKnowledgeSectionId: number | null
  /** Zeigt die Punkte unter einem Punkt dieser Ebene; `null` auf der untersten Ebene. */
  onSelect: ((knowledgeSection: KnowledgeSection) => void) | null
  /** Nach jedem Anlegen, Umbenennen und Umsortieren: die Gliederung neu laden. */
  onChanged: () => Promise<void>
  /**
   * Nachdem der Key eines Punkts dieser Ebene geändert und die Gliederung neu geladen ist: der Punkt, wie er vorher
   * war, und sein neuer Key. So führt der Reiter eine Wahl nach, die noch den alten Key nennt.
   */
  onKeyChanged: (knowledgeSectionBefore: KnowledgeSection, changedKey: string) => void
}

function getKnowledgeSectionRowKey(knowledgeSection: KnowledgeSection): string {
  return String(knowledgeSection.id)
}

/**
 * Eine Ebene der Gliederung im Wissensmanager als ContentBox mit der zentralen Tabelle: die Rubriken, die Kapitel der
 * gewählten Rubrik oder die Unterkapitel des gewählten Kapitels. Alles direkt in der Zeile: Klick auf den Namen öffnet
 * das kleine Popup zum Umbenennen, Klick auf den Key das zum Ändern des Keys (alles darunter bekommt ihn mit), die
 * Reihenfolge ändert sich am Griff links, angelegt wird über den Knopf oben
 * rechts im Popup (Key und Anzeigename; die Keys der Ebenen darüber kommen vom gewählten Punkt). Der Knopf „Darin“
 * zeigt in der Box darunter die Punkte unter einer Zeile. Dieselbe Box für alle drei Ebenen, eingestellt über `level` und die Texte.
 */
export function KnowledgeSectionLevelBox({
  level,
  levelTexts,
  settingKey,
  parentKnowledgeSection,
  knowledgeSections,
  loadErrorMessage,
  countChildren,
  selectedKnowledgeSectionId,
  onSelect,
  onChanged,
  onKeyChanged,
}: KnowledgeSectionLevelBoxProps) {
  const createKnowledgeSectionHook = useKnowledgeSection()
  const changeKnowledgeSectionHook = useKnowledgeSection()
  const changeKeyKnowledgeSectionHook = useKnowledgeSection()
  const orderKnowledgeSectionHook = useKnowledgeSection()
  const changeKnowledgeSectionListingPositions = orderKnowledgeSectionHook.changeKnowledgeSectionListingPositions
  const [newKnowledgeSectionOpen, setNewKnowledgeSectionOpen] = useState<boolean>(false)
  /** Der Punkt, dessen Anzeigename gerade im Popup geändert wird, `null` wenn keiner. */
  const [knowledgeSectionToRename, setKnowledgeSectionToRename] = useState<KnowledgeSection | null>(null)
  /** Der Punkt, dessen Key gerade im Popup geändert wird, `null` wenn keiner. */
  const [knowledgeSectionToChangeKey, setKnowledgeSectionToChangeKey] = useState<KnowledgeSection | null>(null)

  async function saveKnowledgeSectionOrder(rowKeysInOrder: string[]): Promise<boolean> {
    const knowledgeSectionIdsInOrder = rowKeysInOrder.map(Number)
    const reorderedKnowledgeSections = await changeKnowledgeSectionListingPositions(knowledgeSectionIdsInOrder)
    await onChanged()
    return reorderedKnowledgeSections !== null
  }

  const listLabel = getTextInCurrentLanguage(levelTexts.listLabel)
  const listingOrder = useListingOrder(knowledgeSections, getKnowledgeSectionRowKey, saveKnowledgeSectionOrder, listLabel)
  const shownKnowledgeSections = listingOrder.shownItems

  // Rubriken hängen unter nichts; Kapitel und Unterkapitel brauchen den gewählten Punkt darüber
  const parentRequired = level !== 'RUBRIC'
  const parentMissing = parentRequired && parentKnowledgeSection === null
  let parentDisplayNameText = ''
  if (parentKnowledgeSection !== null) {
    parentDisplayNameText = getTextInCurrentLanguage(parentKnowledgeSection.displayName)
  }
  let boxTitle = getTextInCurrentLanguageWithValues(levelTexts.boxTitle, { parent: parentDisplayNameText })
  if (parentMissing) {
    boxTitle = getTextInCurrentLanguage(levelTexts.boxTitleWithoutParent)
  }

  /** Der Key, den ein Punkt auf dieser Ebene selbst trägt. */
  function getOwnKey(knowledgeSection: KnowledgeSection): string {
    if (level === 'RUBRIC') {
      return knowledgeSection.rubricKey
    }
    if (level === 'CHAPTER') {
      return knowledgeSection.chapterKey ?? ''
    }
    return knowledgeSection.subChapterKey ?? ''
  }

  /** Der neue Punkt: sein eigener Key ist der eingegebene, die Keys der Ebenen darüber kommen vom Punkt darüber. */
  function createNewKnowledgeSection(enteredKeyAndDisplayName: KeyAndDisplayName): NewKnowledgeSection | null {
    const enteredKey = enteredKeyAndDisplayName.key
    const displayName = enteredKeyAndDisplayName.displayName
    if (level === 'RUBRIC') {
      return { rubricKey: enteredKey, chapterKey: null, subChapterKey: null, displayName }
    }
    if (parentKnowledgeSection === null) {
      return null
    }
    if (level === 'CHAPTER') {
      return { rubricKey: parentKnowledgeSection.rubricKey, chapterKey: enteredKey, subChapterKey: null, displayName }
    }
    return {
      rubricKey: parentKnowledgeSection.rubricKey,
      chapterKey: parentKnowledgeSection.chapterKey,
      subChapterKey: enteredKey,
      displayName,
    }
  }

  async function handleCreateKnowledgeSection(enteredKeyAndDisplayName: KeyAndDisplayName) {
    const newKnowledgeSection = createNewKnowledgeSection(enteredKeyAndDisplayName)
    if (newKnowledgeSection === null) {
      return
    }
    const createdKnowledgeSection = await createKnowledgeSectionHook.createKnowledgeSection(newKnowledgeSection)
    if (createdKnowledgeSection === null) {
      return
    }
    setNewKnowledgeSectionOpen(false)
    await onChanged()
  }

  async function handleSaveDisplayName(changedDisplayName: MultilingualText) {
    if (knowledgeSectionToRename === null) {
      return
    }
    const changedKnowledgeSection: KnowledgeSection = { ...knowledgeSectionToRename, displayName: changedDisplayName }
    const savedKnowledgeSection = await changeKnowledgeSectionHook.changeKnowledgeSection(changedKnowledgeSection)
    if (savedKnowledgeSection === null) {
      return
    }
    setKnowledgeSectionToRename(null)
    await onChanged()
  }

  /** Den Key ändern: groß geschrieben wie beim Anlegen, geprüft wird im Backend. */
  async function handleSaveKey(enteredKey: string) {
    if (knowledgeSectionToChangeKey === null) {
      return
    }
    const changedKey = enteredKey.toUpperCase()
    const knowledgeSectionBefore = knowledgeSectionToChangeKey
    const changedKnowledgeSections = await changeKeyKnowledgeSectionHook.changeKnowledgeSectionKey(
      knowledgeSectionBefore.id,
      changedKey,
    )
    if (changedKnowledgeSections === null) {
      return
    }
    setKnowledgeSectionToChangeKey(null)
    await onChanged()
    onKeyChanged(knowledgeSectionBefore, changedKey)
  }

  function renderKeyCell(knowledgeSection: KnowledgeSection) {
    const ownKey = getOwnKey(knowledgeSection)
    const changeKeyLabel = getTextInCurrentLanguageWithValues(KNOWLEDGE_SECTION_TEXTS.changeKeyLabel, { key: ownKey })
    return (
      <EditableCellButton label={changeKeyLabel} onClick={() => setKnowledgeSectionToChangeKey(knowledgeSection)}>
        <code>{ownKey}</code>
      </EditableCellButton>
    )
  }

  function renderDisplayNameCell(knowledgeSection: KnowledgeSection) {
    const displayNameText = getTextInCurrentLanguage(knowledgeSection.displayName)
    const ownKey = getOwnKey(knowledgeSection)
    const renameLabel = getTextInCurrentLanguageWithValues(KNOWLEDGE_SECTION_TEXTS.renameLabel, { key: ownKey })
    return (
      <EditableCellButton label={renameLabel} onClick={() => setKnowledgeSectionToRename(knowledgeSection)}>
        <span className="fw-semibold">{displayNameText}</span>
      </EditableCellButton>
    )
  }

  const columns: TableColumn<KnowledgeSection>[] = [
    {
      header: getTextInCurrentLanguage(levelTexts.displayNameHeader),
      key: 'DISPLAY_NAME',
      headerHint: getTextInCurrentLanguage(levelTexts.displayNameHeaderHint),
      cell: renderDisplayNameCell,
    },
  ]
  if (countChildren !== null && onSelect !== null) {
    columns.push({
      header: getTextInCurrentLanguage(levelTexts.childrenHeader),
      key: 'CHILDREN',
      headerHint: getTextInCurrentLanguage(levelTexts.childrenHeaderHint),
      width: '14rem',
      cell: (knowledgeSection) => {
        const childCount = countChildren(knowledgeSection)
        const childrenButtonText = getTextInCurrentLanguageWithValues(levelTexts.childrenButton, { count: String(childCount) })
        const selected = knowledgeSection.id === selectedKnowledgeSectionId
        let buttonVariant = 'outline-secondary'
        if (selected) {
          buttonVariant = 'primary'
        }
        return (
          <Button size="sm" variant={buttonVariant} className="text-nowrap" onClick={() => onSelect(knowledgeSection)}>
            {childrenButtonText}
            <i className="bi bi-chevron-right ms-1" aria-hidden="true"></i>
          </Button>
        )
      },
    })
  }
  columns.push({
    header: getTextInCurrentLanguage(KNOWLEDGE_SECTION_TEXTS.keyHeader),
    key: 'KEY',
    headerHint: getTextInCurrentLanguage(KNOWLEDGE_SECTION_TEXTS.keyHeaderHint),
    width: '18rem',
    cell: renderKeyCell,
  })

  function getRowClassName(knowledgeSection: KnowledgeSection): string | undefined {
    if (knowledgeSection.id === selectedKnowledgeSectionId) {
      return 'knowledge-section-row-selected'
    }
    return undefined
  }

  let createErrorMessage: string | null = null
  if (createKnowledgeSectionHook.error !== null) {
    createErrorMessage = createKnowledgeSectionHook.error.detail
  }
  let changeErrorMessage: string | null = null
  if (changeKnowledgeSectionHook.error !== null) {
    changeErrorMessage = changeKnowledgeSectionHook.error.detail
  }
  let changeKeyErrorMessage: string | null = null
  if (changeKeyKnowledgeSectionHook.error !== null) {
    changeKeyErrorMessage = changeKeyKnowledgeSectionHook.error.detail
  }
  const orderErrorMessage = getFirstErrorDetail([orderKnowledgeSectionHook.error])
  let footerErrorMessage = loadErrorMessage
  if (footerErrorMessage === null) {
    footerErrorMessage = orderErrorMessage
  }
  let footerCountText = ''
  if (shownKnowledgeSections !== null && !parentMissing) {
    const knowledgeSectionsCount = shownKnowledgeSections.length.toLocaleString('de-DE')
    footerCountText = getTextInCurrentLanguageWithValues(levelTexts.footerCount, { count: knowledgeSectionsCount })
  }
  const footer = (
    <LoadStatus errorMessage={footerErrorMessage} isLoading={shownKnowledgeSections === null}>
      {footerCountText}
    </LoadStatus>
  )

  let newKnowledgeSectionButton = null
  if (!parentMissing) {
    const newButtonLabel = getTextInCurrentLanguage(levelTexts.newButton)
    newKnowledgeSectionButton = <NewEntityButton label={newButtonLabel} onClick={() => setNewKnowledgeSectionOpen(true)} />
  }
  const newPopupTitle = getTextInCurrentLanguageWithValues(levelTexts.newPopupTitle, { parent: parentDisplayNameText })
  let renamePopupTitle = ''
  if (knowledgeSectionToRename !== null) {
    const keyToRename = getOwnKey(knowledgeSectionToRename)
    renamePopupTitle = getTextInCurrentLanguageWithValues(KNOWLEDGE_SECTION_TEXTS.renamePopupTitle, { key: keyToRename })
  }

  let changeKeyPopupTitle = ''
  let keyToChange = ''
  if (knowledgeSectionToChangeKey !== null) {
    keyToChange = getOwnKey(knowledgeSectionToChangeKey)
    changeKeyPopupTitle = getTextInCurrentLanguageWithValues(KNOWLEDGE_SECTION_TEXTS.changeKeyPopupTitle, { key: keyToChange })
  }

  return (
    <>
      <ContentBox title={boxTitle} actions={newKnowledgeSectionButton} footer={footer}>
        {parentMissing && <p className="text-body-secondary mb-0">{getTextInCurrentLanguage(levelTexts.parentMissing)}</p>}
        {!parentMissing && shownKnowledgeSections !== null && (
          <Table
            columns={columns}
            rows={shownKnowledgeSections}
            rowKey={getKnowledgeSectionRowKey}
            detailTitle={(knowledgeSection) => getTextInCurrentLanguage(knowledgeSection.displayName)}
            emptyText={getTextInCurrentLanguage(levelTexts.emptyText)}
            onReorder={listingOrder.reorder}
            reorderDisabled={listingOrder.isSaving}
            rowClassName={getRowClassName}
            settingKey={settingKey}
          />
        )}
      </ContentBox>
      {newKnowledgeSectionOpen && (
        <NewKeyDisplayNamePopup
          title={newPopupTitle}
          isSaving={createKnowledgeSectionHook.isLoading}
          errorMessage={createErrorMessage}
          onCreate={handleCreateKnowledgeSection}
          onClose={() => setNewKnowledgeSectionOpen(false)}
          keyHint={getTextInCurrentLanguage(levelTexts.newKeyHint)}
        />
      )}
      {knowledgeSectionToRename !== null && (
        <EditDisplayNamePopup
          title={renamePopupTitle}
          initialDisplayName={knowledgeSectionToRename.displayName}
          isSaving={changeKnowledgeSectionHook.isLoading}
          errorMessage={changeErrorMessage}
          onSave={handleSaveDisplayName}
          onClose={() => setKnowledgeSectionToRename(null)}
        />
      )}
      {knowledgeSectionToChangeKey !== null && (
        <EditTextPopup
          title={changeKeyPopupTitle}
          inputLabel={getTextInCurrentLanguage(KNOWLEDGE_SECTION_TEXTS.changeKeyInputLabel)}
          initialText={keyToChange}
          hint={getTextInCurrentLanguage(KNOWLEDGE_SECTION_TEXTS.changeKeyHint)}
          isSaving={changeKeyKnowledgeSectionHook.isLoading}
          errorMessage={changeKeyErrorMessage}
          onSave={(enteredKey) => void handleSaveKey(enteredKey)}
          onClose={() => setKnowledgeSectionToChangeKey(null)}
        />
      )}
    </>
  )
}
