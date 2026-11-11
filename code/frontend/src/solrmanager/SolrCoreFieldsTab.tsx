import { type ChangeEvent, useCallback, useState } from 'react'
import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'
import { useParams } from 'react-router'
import { useLoadedData } from '../api/useLoadedData.ts'
import type { AccessRole } from '../auth/access/AccessRole.ts'
import { AccessRoleBadge } from '../auth/access/AccessRoleBadge.tsx'
import { AccessRolePickerPopup } from '../auth/access/AccessRolePickerPopup.tsx'
import { ConfirmDeletePopup } from '../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../components/ContentBox.tsx'
import { DeleteButton } from '../components/DeleteButton.tsx'
import { EditableCellButton } from '../components/EditableCellButton.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { Hoverlay } from '../components/Hoverlay.tsx'
import { NewEntityButton } from '../components/NewEntityButton.tsx'
import { Table, type TableColumn } from '../components/Table.tsx'
import { useListingOrder } from '../components/useListingOrder.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../masterdata/useMasterData.ts'
import {
  isSolrFieldSwitchAllowed,
  type NewSolrField,
  SOLR_FIELD_NO_READER_TEXT,
  SOLR_FIELD_SWITCH_COLUMNS,
  type SolrField,
  type SolrFieldSwitchName,
} from '../solr/SolrField.ts'
import { useSolrField } from '../solr/useSolrField.ts'
import { getSolrCoreExportUrl } from '../solr/solrCoreExportUrl.ts'
import { NewSolrFieldPopup } from './NewSolrFieldPopup.tsx'
import { type SolrFieldEditableCell, SolrFieldCellEditPopup } from './SolrFieldCellEditPopup.tsx'
import {
  getSolrFieldSwitchHint,
  SOLR_FIELD_CLIENT_VALUE_ACCEPTED_HINT,
  SOLR_FIELD_DESCRIPTION_HINT,
  SOLR_FIELD_DISPLAY_NAME_HINT,
  SOLR_FIELD_NAME_HINT,
  SOLR_FIELD_POSITION_HINT,
  SOLR_FIELD_READER_HINT,
  SOLR_FIELD_SEARCH_WEIGHT_HINT,
  SOLR_FIELD_TYPE_HINT,
} from './solrFieldColumnHints.tsx'

/** Die Kennung der Feldtabelle für die Spalteneinstellungen des Users (`TABLE_SOLR_FIELD`), in jedem Kern dieselbe. */
const SOLR_FIELD_TABLE_SETTING_KEY = 'SOLR_FIELD'

/** Welche Zelle welches Feldes gerade im Popup geändert wird. */
type EditingSolrFieldCell = {
  solrFieldId: number
  editableCell: SolrFieldEditableCell
}

/** Der Key einer Zeile für Drag and Drop: Der Name ist je Kern eindeutig. */
function getSolrFieldName(solrField: SolrField): string {
  return solrField.name
}

/**
 * Tab eines Kerns unter `/solrmanager/core/<key>`: alle Felder des Kerns in der zentralen Tabelle, wie das Feld-Sheet der
 * Vorlage. Alles wird direkt in der Zeile geändert, eine eigene Bearbeiten-Seite gibt es nicht:
 * - Name, Anzeigename, Typ, Suche und Beschreibung: Klick auf den Wert öffnet ein kleines Popup, das Suchgewicht mit
 *   Schieberegler.
 * - Die Schalter und „vom Client“ sind Checkboxen und speichern sofort.
 * - „Wer liest“ öffnet die Auswahl des einen Rechts wie die Hook-Suche der Vorlage.
 * - Die Reihenfolge ändert sich am Griff links per Drag and Drop.
 * An jedem Spaltenkopf erklärt ein Hoverlay, wofür die Spalte da ist. Breiten und ausgeblendete Spalten merkt sich die
 * Tabelle je User (`TABLE_SOLR_FIELD`). Ein neues Feld entsteht über „neues Feld“ im kleinen Popup. Löschen nimmt das
 * Feld nur aus der Definition in Postgres. An der Zeile einer Referenz sind nur „Wer liest“, Suche und Platz änderbar.
 */
export function SolrCoreFieldsTab() {
  const { solrCoreKey } = useParams()
  const requestedSolrCoreKey = solrCoreKey ?? ''
  const solrFieldHook = useSolrField()
  const changeSolrFieldHook = useSolrField()
  const createSolrFieldHook = useSolrField()
  const orderSolrFieldHook = useSolrField()
  const deleteSolrFieldHook = useSolrField()
  const { accessRoles } = useMasterData()
  const [solrFieldToDelete, setSolrFieldToDelete] = useState<SolrField | null>(null)
  /** Der Stand je id, der vor dem geladenen gilt: sofort nach dem Klick die Änderung, nach dem Speichern die Antwort. */
  const [shownSolrFieldsById, setShownSolrFieldsById] = useState<Map<number, SolrField>>(() => new Map())
  /** Die Felder, die gerade gespeichert werden: Ihre Schalter sind so lange gesperrt. */
  const [savingSolrFieldIds, setSavingSolrFieldIds] = useState<Set<number>>(() => new Set())
  /** Das Feld, dessen „Wer liest“ gerade offen ist, `null` wenn keins. */
  const [readersSolrFieldId, setReadersSolrFieldId] = useState<number | null>(null)
  /** Die Zelle, die gerade im Popup geändert wird, `null` wenn keine. */
  const [editingSolrFieldCell, setEditingSolrFieldCell] = useState<EditingSolrFieldCell | null>(null)
  const [newSolrFieldOpen, setNewSolrFieldOpen] = useState<boolean>(false)

  const getSolrFieldBySolrCoreKey = solrFieldHook.getSolrFieldBySolrCoreKey
  const loadSolrFields = useCallback(
    () => getSolrFieldBySolrCoreKey(requestedSolrCoreKey),
    [getSolrFieldBySolrCoreKey, requestedSolrCoreKey],
  )
  const loadedSolrFields = useLoadedData(loadSolrFields)

  /** Ein geladenes Feld so, wie es gerade gilt: mit der letzten Änderung, sonst wie geladen. */
  function getShownSolrField(loadedSolrField: SolrField): SolrField {
    const shownSolrField = shownSolrFieldsById.get(loadedSolrField.id)
    if (shownSolrField === undefined) {
      return loadedSolrField
    }
    return shownSolrField
  }

  /** Alle Felder des Kerns, wie sie gerade gelten; `null` solange nichts geladen ist. */
  function getShownSolrFields(): SolrField[] | null {
    const loadedSolrFieldList = loadedSolrFields.data
    if (loadedSolrFieldList === null) {
      return null
    }
    return loadedSolrFieldList.map(getShownSolrField)
  }

  const shownSolrFields = getShownSolrFields()
  const changeSolrFieldListingPositions = orderSolrFieldHook.changeSolrFieldListingPositions

  /** Speichert die Reihenfolge nach Drag and Drop und lädt die Felder neu, dann stimmt auch die Spalte „Pos.“. */
  async function saveSolrFieldOrder(solrFieldNamesInOrder: string[]): Promise<boolean> {
    const reorderedSolrFields = await changeSolrFieldListingPositions(requestedSolrCoreKey, solrFieldNamesInOrder)
    // Die neu geladenen Felder tragen alles Gespeicherte; die gemerkten Stände hätten noch die alten Positionen
    setShownSolrFieldsById(new Map())
    await loadedSolrFields.reload()
    return reorderedSolrFields !== null
  }

  const listingOrder = useListingOrder(shownSolrFields, getSolrFieldName, saveSolrFieldOrder, 'Felder')
  const solrFields = listingOrder.shownItems

  /** Das Feld mit dieser id, wie es gerade gilt; `null` wenn es es nicht gibt. */
  function findShownSolrField(solrFieldId: number | null): SolrField | null {
    if (solrFields === null || solrFieldId === null) {
      return null
    }
    const foundSolrField = solrFields.find((solrField) => solrField.id === solrFieldId)
    if (foundSolrField === undefined) {
      return null
    }
    return foundSolrField
  }

  /** Das Recht für „Wer liest“ aus den Stammdaten, `null` für niemand. */
  function getReaderAccessRole(solrField: SolrField): AccessRole | null {
    if (accessRoles === null) {
      return null
    }
    const foundAccessRole = accessRoles.find((accessRole) => accessRole.key === solrField.readerAccessRoleKey)
    if (foundAccessRole === undefined) {
      return null
    }
    return foundAccessRole
  }

  function putShownSolrField(shownSolrField: SolrField) {
    setShownSolrFieldsById((currentSolrFieldsById) => {
      const changedSolrFieldsById = new Map(currentSolrFieldsById)
      changedSolrFieldsById.set(shownSolrField.id, shownSolrField)
      return changedSolrFieldsById
    })
  }

  function markSolrFieldSaving(id: number, saving: boolean) {
    setSavingSolrFieldIds((currentSolrFieldIds) => {
      const changedSolrFieldIds = new Set(currentSolrFieldIds)
      if (saving) {
        changedSolrFieldIds.add(id)
      } else {
        changedSolrFieldIds.delete(id)
      }
      return changedSolrFieldIds
    })
  }

  /**
   * Zeigt die Änderung sofort und speichert sie. Scheitert es, gilt wieder der alte Stand, der Fehler steht oben bzw. im
   * offenen Popup. Liefert, ob es geklappt hat.
   */
  async function saveChangedSolrField(previousSolrField: SolrField, changedSolrField: SolrField): Promise<boolean> {
    putShownSolrField(changedSolrField)
    markSolrFieldSaving(changedSolrField.id, true)
    const savedSolrField = await changeSolrFieldHook.changeSolrField(changedSolrField)
    markSolrFieldSaving(changedSolrField.id, false)
    if (savedSolrField === null) {
      putShownSolrField(previousSolrField)
      return false
    }
    putShownSolrField(savedSolrField)
    return true
  }

  /** Eine Checkbox in der Zeile. Ohne indexed hat Solr nichts zum Durchsuchen: Das Suchgewicht fällt auf -1. */
  function handleSwitchChange(solrField: SolrField, switchName: SolrFieldSwitchName, event: ChangeEvent<HTMLInputElement>) {
    const checked = event.target.checked
    const changedSolrField: SolrField = { ...solrField, [switchName]: checked }
    const searchedWithoutIndex = !changedSolrField.indexed && changedSolrField.searchWeight >= 0
    if (searchedWithoutIndex) {
      changedSolrField.searchWeight = -1
    }
    void saveChangedSolrField(solrField, changedSolrField)
  }

  /** Die Checkbox „vom Client“: speichert sofort. */
  function handleClientValueAcceptedChange(solrField: SolrField, event: ChangeEvent<HTMLInputElement>) {
    const checked = event.target.checked
    const changedSolrField: SolrField = { ...solrField, clientValueAccepted: checked }
    void saveChangedSolrField(solrField, changedSolrField)
  }

  function openCellEditPopup(solrField: SolrField, editableCell: SolrFieldEditableCell) {
    setEditingSolrFieldCell({ solrFieldId: solrField.id, editableCell })
  }

  function handleCloseCellEditPopup() {
    setEditingSolrFieldCell(null)
  }

  let editingSolrField: SolrField | null = null
  let editingSolrFieldSaving = false
  if (editingSolrFieldCell !== null) {
    editingSolrField = findShownSolrField(editingSolrFieldCell.solrFieldId)
    editingSolrFieldSaving = savingSolrFieldIds.has(editingSolrFieldCell.solrFieldId)
  }

  async function handleSaveCell(changedSolrField: SolrField) {
    if (editingSolrField === null) {
      return
    }
    const saved = await saveChangedSolrField(editingSolrField, changedSolrField)
    if (saved) {
      setEditingSolrFieldCell(null)
    }
  }

  const readersSolrField = findShownSolrField(readersSolrFieldId)
  let readersSolrFieldSaving = false
  let readersSolrFieldAccessRole: AccessRole | null = null
  let readersPopupTitle = ''
  if (readersSolrField !== null) {
    readersSolrFieldSaving = savingSolrFieldIds.has(readersSolrField.id)
    readersSolrFieldAccessRole = getReaderAccessRole(readersSolrField)
    readersPopupTitle = 'Wer liest ' + readersSolrField.name + '?'
  }

  /** Ein Recht für „Wer liest“ gewählt (`null`: niemand): speichern, Popup zu wie bei der Hook-Suche der Vorlage. */
  function handleReaderAccessRolePick(pickedAccessRoleKey: string | null) {
    if (readersSolrField === null) {
      return
    }
    const changedSolrField: SolrField = { ...readersSolrField, readerAccessRoleKey: pickedAccessRoleKey }
    void saveChangedSolrField(readersSolrField, changedSolrField)
    setReadersSolrFieldId(null)
  }

  function handleCloseReadersPopup() {
    setReadersSolrFieldId(null)
  }

  function handleNewSolrFieldOpen() {
    setNewSolrFieldOpen(true)
  }

  function handleNewSolrFieldClose() {
    setNewSolrFieldOpen(false)
  }

  async function handleCreateSolrField(newSolrField: NewSolrField) {
    const createdSolrField = await createSolrFieldHook.createSolrField(newSolrField)
    if (createdSolrField === null) {
      return
    }
    setNewSolrFieldOpen(false)
    await loadedSolrFields.reload()
  }

  async function handleConfirmDelete() {
    if (solrFieldToDelete === null) {
      return
    }
    const deleted = await deleteSolrFieldHook.deleteSolrField(solrFieldToDelete.id)
    if (deleted) {
      setSolrFieldToDelete(null)
      await loadedSolrFields.reload()
    }
  }

  function handleCloseDeletePopup() {
    setSolrFieldToDelete(null)
  }

  /** Ein Wert, der per Klick sein Popup öffnet; an der Zeile einer Referenz nur Text, dort steht er fest. */
  function renderEditableCell(solrField: SolrField, editableCell: SolrFieldEditableCell, shownValue: string, lockedAtReference: boolean) {
    const solrReferenceField = solrField.solrReferenceKey !== null
    if (lockedAtReference && solrReferenceField) {
      return <span>{shownValue}</span>
    }
    const cellLabel = shownValue + ' ändern'
    return (
      <EditableCellButton label={cellLabel} onClick={() => openCellEditPopup(solrField, editableCell)}>
        {shownValue}
      </EditableCellButton>
    )
  }

  function renderNameCell(solrField: SolrField) {
    const solrReferenceField = solrField.solrReferenceKey !== null
    if (solrReferenceField) {
      return (
        <Hoverlay text="Zeile einer Referenz: Typ, Schalter und Schreibregel stehen fest.">
          <code tabIndex={0}>{solrField.name}</code>
        </Hoverlay>
      )
    }
    const nameLabel = 'Name von ' + solrField.name + ' ändern'
    return (
      <EditableCellButton label={nameLabel} onClick={() => openCellEditPopup(solrField, 'name')}>
        <code>{solrField.name}</code>
      </EditableCellButton>
    )
  }

  function renderSwitchCell(solrField: SolrField, switchName: SolrFieldSwitchName, columnHead: string) {
    const switchAllowed = isSolrFieldSwitchAllowed(solrField.type, switchName)
    const solrReferenceField = solrField.solrReferenceKey !== null
    const solrFieldSaving = savingSolrFieldIds.has(solrField.id)
    const switchDisabled = solrFieldSaving || solrReferenceField || !switchAllowed
    const switchId = 'solrField-' + solrField.id + '-' + switchName
    const switchLabel = columnHead + ' für ' + solrField.name
    return (
      <Form.Check.Input
        type="checkbox"
        id={switchId}
        aria-label={switchLabel}
        checked={solrField[switchName]}
        disabled={switchDisabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => handleSwitchChange(solrField, switchName, event)}
      />
    )
  }

  function renderClientValueAcceptedCell(solrField: SolrField) {
    const solrReferenceField = solrField.solrReferenceKey !== null
    const solrFieldSaving = savingSolrFieldIds.has(solrField.id)
    const checkboxDisabled = solrFieldSaving || solrReferenceField
    const checkboxId = 'solrField-' + solrField.id + '-clientValueAccepted'
    const checkboxLabel = 'vom Client für ' + solrField.name
    return (
      <Form.Check.Input
        type="checkbox"
        id={checkboxId}
        aria-label={checkboxLabel}
        checked={solrField.clientValueAccepted}
        disabled={checkboxDisabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => handleClientValueAcceptedChange(solrField, event)}
      />
    )
  }

  function renderSearchWeightCell(solrField: SolrField) {
    let searchWeightText = String(solrField.searchWeight)
    if (solrField.searchWeight < 0) {
      searchWeightText = '–'
    }
    return renderEditableCell(solrField, 'searchWeight', searchWeightText, false)
  }

  function renderReaderCell(solrField: SolrField) {
    const readerAccessRole = getReaderAccessRole(solrField)
    const readerLabel = 'Wer liest ' + solrField.name + ': Recht wählen'
    return (
      <EditableCellButton label={readerLabel} onClick={() => setReadersSolrFieldId(solrField.id)}>
        {readerAccessRole !== null && <AccessRoleBadge accessRole={readerAccessRole} />}
        {readerAccessRole === null && <span>niemand</span>}
      </EditableCellButton>
    )
  }

  function renderDescriptionCell(solrField: SolrField) {
    let descriptionText = ''
    if (solrField.description !== null) {
      descriptionText = getTextInCurrentLanguage(solrField.description)
    }
    if (descriptionText.trim() === '') {
      descriptionText = '–'
    }
    return renderEditableCell(solrField, 'description', descriptionText, false)
  }

  function renderActions(solrField: SolrField) {
    const solrReferenceField = solrField.solrReferenceKey !== null
    if (solrReferenceField) {
      // die Zeile einer Referenz verschwindet nur mit der Referenz
      return null
    }
    const deleteLabel = solrField.name + ' löschen'
    return <DeleteButton label={deleteLabel} onClick={() => setSolrFieldToDelete(solrField)} />
  }

  const switchColumns: TableColumn<SolrField>[] = SOLR_FIELD_SWITCH_COLUMNS.map((switchColumn) => ({
    header: switchColumn.columnHead,
    key: switchColumn.switchName,
    headerHint: getSolrFieldSwitchHint(switchColumn.switchName),
    width: '2.5rem',
    verticalHeader: true,
    unimportant: true,
    cellClassName: 'text-center',
    cell: (solrField: SolrField) => renderSwitchCell(solrField, switchColumn.switchName, switchColumn.columnHead),
  }))

  const columns: TableColumn<SolrField>[] = [
    {
      header: 'Pos.',
      key: 'listingPosition',
      headerHint: SOLR_FIELD_POSITION_HINT,
      width: '5rem',
      cell: (solrField) => solrField.listingPosition,
    },
    { header: 'Name', key: 'name', headerHint: SOLR_FIELD_NAME_HINT, width: '12rem', cell: renderNameCell },
    {
      header: 'Anzeigename',
      key: 'displayName',
      headerHint: SOLR_FIELD_DISPLAY_NAME_HINT,
      width: '10rem',
      cell: (solrField) => {
        const displayNameText = getTextInCurrentLanguage(solrField.displayName)
        return renderEditableCell(solrField, 'displayName', displayNameText, false)
      },
    },
    {
      header: 'Typ',
      key: 'type',
      headerHint: SOLR_FIELD_TYPE_HINT,
      width: '7.5rem',
      cell: (solrField) => renderEditableCell(solrField, 'type', solrField.type, true),
    },
    ...switchColumns,
    {
      header: 'vom Client',
      key: 'clientValueAccepted',
      headerHint: SOLR_FIELD_CLIENT_VALUE_ACCEPTED_HINT,
      width: '2.5rem',
      verticalHeader: true,
      unimportant: true,
      cellClassName: 'text-center',
      cell: renderClientValueAcceptedCell,
    },
    {
      header: 'Suche',
      key: 'searchWeight',
      headerHint: SOLR_FIELD_SEARCH_WEIGHT_HINT,
      width: '4.5rem',
      unimportant: true,
      cell: renderSearchWeightCell,
    },
    { header: 'Wer liest', key: 'reader', headerHint: SOLR_FIELD_READER_HINT, width: '8rem', cell: renderReaderCell },
    {
      header: 'Beschreibung',
      key: 'description',
      headerHint: SOLR_FIELD_DESCRIPTION_HINT,
      unimportant: true,
      cell: renderDescriptionCell,
    },
  ]

  const contentBoxTitle = 'Felder von ' + requestedSolrCoreKey

  let changeErrorMessage: string | null = null
  if (changeSolrFieldHook.error !== null) {
    changeErrorMessage = changeSolrFieldHook.error.detail
  }
  let createErrorMessage: string | null = null
  if (createSolrFieldHook.error !== null) {
    createErrorMessage = createSolrFieldHook.error.detail
  }
  let deleteErrorMessage: string | null = null
  if (deleteSolrFieldHook.error !== null) {
    deleteErrorMessage = deleteSolrFieldHook.error.detail
  }
  const loaded = solrFields !== null && accessRoles !== null
  let footer
  if (solrFieldHook.error !== null) {
    footer = <span className="text-danger">{solrFieldHook.error.detail}</span>
  } else if (!loaded) {
    footer = <Spinner animation="border" size="sm" />
  } else {
    const solrFieldsCountText = solrFields.length + ' Felder.'
    footer = <span>{solrFieldsCountText}</span>
  }
  const solrCoreExportUrl = getSolrCoreExportUrl(requestedSolrCoreKey)
  const contentBoxActions = (
    <span className="d-inline-flex align-items-center gap-2">
      <Hoverlay text="Den ganzen Kern als JSON herunterladen (Backup): Felder, Referenzen und alle Dokumente">
        <a href={solrCoreExportUrl} className="btn btn-sm btn-outline-secondary" download>
          <i className="bi bi-box-arrow-down me-1" aria-hidden="true"></i>
          Exportieren
        </a>
      </Hoverlay>
      <NewEntityButton label="neues Feld" onClick={handleNewSolrFieldOpen} />
    </span>
  )
  // Solange ein Popup offen ist, steht der Fehler dort, nicht zusätzlich über der Tabelle
  const popupOpen = editingSolrFieldCell !== null || readersSolrField !== null
  let tableErrorMessage: string | null = null
  if (!popupOpen) {
    tableErrorMessage = changeErrorMessage
  }

  return (
    <>
      <ContentBox title={contentBoxTitle} actions={contentBoxActions} footer={footer}>
        <ErrorAlert message={tableErrorMessage} />
        {loaded && (
          <Table
            columns={columns}
            rows={solrFields}
            rowKey={getSolrFieldName}
            actions={renderActions}
            actionsWidth="3.5rem"
            detailTitle={getSolrFieldName}
            emptyText="Der Kern hat noch keine Felder."
            onReorder={listingOrder.reorder}
            reorderDisabled={listingOrder.isSaving}
            settingKey={SOLR_FIELD_TABLE_SETTING_KEY}
          />
        )}
      </ContentBox>
      {editingSolrField !== null && editingSolrFieldCell !== null && (
        <SolrFieldCellEditPopup
          // neu aufbauen, sobald eine andere Zelle offen ist, damit der Entwurf von vorn beginnt
          key={editingSolrField.id + '-' + editingSolrFieldCell.editableCell}
          solrField={editingSolrField}
          editableCell={editingSolrFieldCell.editableCell}
          isSaving={editingSolrFieldSaving}
          errorMessage={changeErrorMessage}
          onSave={handleSaveCell}
          onClose={handleCloseCellEditPopup}
        />
      )}
      {readersSolrField !== null && accessRoles !== null && (
        <AccessRolePickerPopup
          title={readersPopupTitle}
          selectedAccessRole={readersSolrFieldAccessRole}
          accessRoles={accessRoles}
          noAccessRoleText={SOLR_FIELD_NO_READER_TEXT}
          isSaving={readersSolrFieldSaving}
          errorMessage={changeErrorMessage}
          onPick={handleReaderAccessRolePick}
          onClose={handleCloseReadersPopup}
        />
      )}
      {newSolrFieldOpen && (
        <NewSolrFieldPopup
          solrCoreKey={requestedSolrCoreKey}
          isSaving={createSolrFieldHook.isLoading}
          errorMessage={createErrorMessage}
          onCreate={handleCreateSolrField}
          onClose={handleNewSolrFieldClose}
        />
      )}
      {solrFieldToDelete !== null && (
        <ConfirmDeletePopup
          title="Feld löschen"
          isDeleting={deleteSolrFieldHook.isLoading}
          errorMessage={deleteErrorMessage}
          onConfirm={handleConfirmDelete}
          onClose={handleCloseDeletePopup}>
          Soll das Feld <strong>{solrFieldToDelete.name}</strong> wirklich aus der Definition gelöscht werden? In Solr
          ändert sich dadurch nichts.
        </ConfirmDeletePopup>
      )}
    </>
  )
}
