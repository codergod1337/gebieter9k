import { useState } from 'react'
import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ContentBox } from '../../components/ContentBox.tsx'
import { EditableCellButton } from '../../components/EditableCellButton.tsx'
import { EditDisplayNamePopup } from '../../components/EditDisplayNamePopup.tsx'
import type { KeyAndDisplayName } from '../../components/KeyDisplayNameForm.tsx'
import { NewEntityButton } from '../../components/NewEntityButton.tsx'
import { NewKeyDisplayNamePopup } from '../../components/NewKeyDisplayNamePopup.tsx'
import { Table, type TableColumn } from '../../components/Table.tsx'
import { useListingOrder } from '../../components/useListingOrder.ts'
import { FileClassBadge } from '../../file/FileClassBadge.tsx'
import { FileClassPicker } from '../../file/FileClassPicker.tsx'
import type { MultilingualText } from '../../language/MultilingualText.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import type { ShopCategory } from '../../shop/ShopCategory.ts'
import { useShopCategory } from '../../shop/useShopCategory.ts'
import { EditShopCategoryFileClassPopup } from './EditShopCategoryFileClassPopup.tsx'
import { SHOP_CATEGORY_TEXTS } from './shopCategoryTexts.ts'

/** Die Kennung der Tabelle für die Spalteneinstellungen des Users (`TABLE_SHOP_CATEGORY`). */
const SHOP_CATEGORY_TABLE_SETTING_KEY = 'SHOP_CATEGORY'

function getShopCategoryKey(shopCategory: ShopCategory): string {
  return shopCategory.key
}

/**
 * Tab „Rubriken“ im Modul „Achievements & Markt“ (Nutzer 2026-11-10: ein Shop-Manager, darin Rubriken, in den Rubriken
 * die Bilder zum Kauf): alle Rubriken des Gebietermarkts in der zentralen Tabelle, oben rechts „neue Rubrik“. Alles
 * direkt in der Zeile wie im Tab „AR“: Klick auf den Namen oder auf die FileClass öffnet ein kleines Popup, die
 * Reihenfolge ändert sich am Griff links, angelegt wird im Popup. Jede Rubrik hat genau eine FileClass (Nutzer
 * 2026-11-11): Beim Anlegen ist sie Pflicht, der Upload im Markt wählt sie nicht mehr. Löschen gibt es noch nicht.
 */
export function ShopCategoryTab() {
  const shopCategoryHook = useShopCategory()
  const orderShopCategoryHook = useShopCategory()
  const createShopCategoryHook = useShopCategory()
  const changeShopCategoryHook = useShopCategory()
  const { fileClasses } = useMasterData()
  const loadedShopCategories = useLoadedData(shopCategoryHook.getAllShopCategory)
  const reloadShopCategories = loadedShopCategories.reload
  const changeShopCategoryListingPositions = orderShopCategoryHook.changeShopCategoryListingPositions
  const [newShopCategoryOpen, setNewShopCategoryOpen] = useState<boolean>(false)
  /** Die FileClass, die im Popup zum Anlegen gewählt ist, `null` solange keine. */
  const [newShopCategoryFileClassKey, setNewShopCategoryFileClassKey] = useState<string | null>(null)
  /** Die Rubrik, deren Anzeigename gerade im Popup geändert wird, `null` wenn keine. */
  const [shopCategoryToRename, setShopCategoryToRename] = useState<ShopCategory | null>(null)
  /** Die Rubrik, deren FileClass gerade im Popup geändert wird, `null` wenn keine. */
  const [shopCategoryToChangeFileClass, setShopCategoryToChangeFileClass] = useState<ShopCategory | null>(null)

  async function saveShopCategoryOrder(shopCategoryKeysInOrder: string[]): Promise<boolean> {
    const reorderedShopCategories = await changeShopCategoryListingPositions(shopCategoryKeysInOrder)
    await reloadShopCategories()
    return reorderedShopCategories !== null
  }

  const listLabel = getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.listLabel)
  const listingOrder = useListingOrder(loadedShopCategories.data, getShopCategoryKey, saveShopCategoryOrder, listLabel)
  const shopCategories = listingOrder.shownItems

  function openNewShopCategory() {
    setNewShopCategoryFileClassKey(null)
    setNewShopCategoryOpen(true)
  }

  async function handleCreateShopCategory(enteredKeyAndDisplayName: KeyAndDisplayName) {
    if (newShopCategoryFileClassKey === null) {
      return
    }
    const newShopCategory: ShopCategory = {
      ...enteredKeyAndDisplayName,
      fileClassKey: newShopCategoryFileClassKey,
      listingPosition: 0,
    }
    const createdShopCategory = await createShopCategoryHook.createShopCategory(newShopCategory)
    if (createdShopCategory === null) {
      return
    }
    setNewShopCategoryOpen(false)
    await reloadShopCategories()
  }

  async function handleSaveDisplayName(changedDisplayName: MultilingualText) {
    if (shopCategoryToRename === null) {
      return
    }
    const changedShopCategory: ShopCategory = { ...shopCategoryToRename, displayName: changedDisplayName }
    const savedShopCategory = await changeShopCategoryHook.changeShopCategory(changedShopCategory)
    if (savedShopCategory === null) {
      return
    }
    setShopCategoryToRename(null)
    await reloadShopCategories()
  }

  async function handleSaveFileClass(changedFileClassKey: string) {
    if (shopCategoryToChangeFileClass === null) {
      return
    }
    const changedShopCategory: ShopCategory = { ...shopCategoryToChangeFileClass, fileClassKey: changedFileClassKey }
    const savedShopCategory = await changeShopCategoryHook.changeShopCategory(changedShopCategory)
    if (savedShopCategory === null) {
      return
    }
    setShopCategoryToChangeFileClass(null)
    await reloadShopCategories()
  }

  function renderDisplayNameCell(shopCategory: ShopCategory) {
    const displayNameText = getTextInCurrentLanguage(shopCategory.displayName)
    const renameLabel = getTextInCurrentLanguageWithValues(SHOP_CATEGORY_TEXTS.renameLabel, { key: shopCategory.key })
    return (
      <EditableCellButton label={renameLabel} onClick={() => setShopCategoryToRename(shopCategory)}>
        <span className="fw-semibold">{displayNameText}</span>
      </EditableCellButton>
    )
  }

  /** Die FileClass der Rubrik als ihre Kachel; solange die Stammdaten laden (oder sie dort fehlt), ihr Key. */
  function renderFileClassCell(shopCategory: ShopCategory) {
    const fileClassOfShopCategory = (fileClasses ?? []).find((fileClass) => fileClass.key === shopCategory.fileClassKey)
    const changeFileClassLabel = getTextInCurrentLanguageWithValues(SHOP_CATEGORY_TEXTS.changeFileClassLabel, {
      key: shopCategory.key,
    })
    return (
      <EditableCellButton label={changeFileClassLabel} onClick={() => setShopCategoryToChangeFileClass(shopCategory)}>
        {fileClassOfShopCategory !== undefined && <FileClassBadge fileClass={fileClassOfShopCategory} />}
        {fileClassOfShopCategory === undefined && <code>{shopCategory.fileClassKey}</code>}
      </EditableCellButton>
    )
  }

  const columns: TableColumn<ShopCategory>[] = [
    {
      header: getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.displayNameHeader),
      key: 'DISPLAY_NAME',
      headerHint: getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.displayNameHeaderHint),
      cell: renderDisplayNameCell,
    },
    {
      header: getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.fileClassHeader),
      key: 'FILE_CLASS',
      headerHint: getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.fileClassHeaderHint),
      width: '16rem',
      cell: renderFileClassCell,
    },
    {
      header: getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.keyHeader),
      key: 'KEY',
      headerHint: getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.keyHeaderHint),
      width: '16rem',
      cell: (shopCategory) => <code>{shopCategory.key}</code>,
    },
  ]

  let createErrorMessage: string | null = null
  if (createShopCategoryHook.error !== null) {
    createErrorMessage = createShopCategoryHook.error.detail
  }
  let changeErrorMessage: string | null = null
  if (changeShopCategoryHook.error !== null) {
    changeErrorMessage = changeShopCategoryHook.error.detail
  }
  let footer
  if (shopCategoryHook.error !== null) {
    footer = <span className="text-danger">{shopCategoryHook.error.detail}</span>
  } else if (orderShopCategoryHook.error !== null) {
    footer = <span className="text-danger">{orderShopCategoryHook.error.detail}</span>
  } else if (shopCategories === null) {
    footer = <Spinner animation="border" size="sm" />
  } else {
    const shopCategoriesCount = shopCategories.length.toLocaleString('de-DE')
    const footerCountText = getTextInCurrentLanguageWithValues(SHOP_CATEGORY_TEXTS.footerCount, {
      count: shopCategoriesCount,
    })
    footer = <span>{footerCountText}</span>
  }
  const newShopCategoryLabel = getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.newShopCategory)
  const newShopCategoryButton = <NewEntityButton label={newShopCategoryLabel} onClick={openNewShopCategory} />
  // Im Popup zum Anlegen: die FileClass der neuen Rubrik, Pflicht
  const newShopCategoryFileClassField = (
    <Form.Group className="mt-3">
      <Form.Label>{getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.newShopCategoryFileClassLabel)}</Form.Label>
      <FileClassPicker
        fileClasses={fileClasses ?? []}
        selectedFileClassKey={newShopCategoryFileClassKey}
        onSelectedFileClassKeyChange={setNewShopCategoryFileClassKey}
        disabled={createShopCategoryHook.isLoading}
      />
      <Form.Text>{getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.newShopCategoryFileClassHint)}</Form.Text>
    </Form.Group>
  )
  let renamePopupTitle = ''
  if (shopCategoryToRename !== null) {
    renamePopupTitle = getTextInCurrentLanguageWithValues(SHOP_CATEGORY_TEXTS.renamePopupTitle, {
      key: shopCategoryToRename.key,
    })
  }
  let fileClassPopupTitle = ''
  if (shopCategoryToChangeFileClass !== null) {
    fileClassPopupTitle = getTextInCurrentLanguageWithValues(SHOP_CATEGORY_TEXTS.fileClassPopupTitle, {
      key: shopCategoryToChangeFileClass.key,
    })
  }

  return (
    <>
      <ContentBox
        title={getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.boxTitle)}
        actions={newShopCategoryButton}
        footer={footer}>
        {shopCategories !== null && (
          <Table
            columns={columns}
            rows={shopCategories}
            rowKey={getShopCategoryKey}
            detailTitle={(shopCategory) => getTextInCurrentLanguage(shopCategory.displayName)}
            emptyText={getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.emptyText)}
            onReorder={listingOrder.reorder}
            reorderDisabled={listingOrder.isSaving}
            settingKey={SHOP_CATEGORY_TABLE_SETTING_KEY}
          />
        )}
      </ContentBox>
      {newShopCategoryOpen && (
        <NewKeyDisplayNamePopup
          title={getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.newShopCategoryPopupTitle)}
          isSaving={createShopCategoryHook.isLoading}
          errorMessage={createErrorMessage}
          onCreate={handleCreateShopCategory}
          onClose={() => setNewShopCategoryOpen(false)}
          keyHint={getTextInCurrentLanguage(SHOP_CATEGORY_TEXTS.newShopCategoryKeyHint)}
          extraFields={newShopCategoryFileClassField}
          extraFieldsIncomplete={newShopCategoryFileClassKey === null}
        />
      )}
      {shopCategoryToRename !== null && (
        <EditDisplayNamePopup
          title={renamePopupTitle}
          initialDisplayName={shopCategoryToRename.displayName}
          isSaving={changeShopCategoryHook.isLoading}
          errorMessage={changeErrorMessage}
          onSave={handleSaveDisplayName}
          onClose={() => setShopCategoryToRename(null)}
        />
      )}
      {shopCategoryToChangeFileClass !== null && (
        <EditShopCategoryFileClassPopup
          title={fileClassPopupTitle}
          fileClasses={fileClasses ?? []}
          initialFileClassKey={shopCategoryToChangeFileClass.fileClassKey}
          isSaving={changeShopCategoryHook.isLoading}
          errorMessage={changeErrorMessage}
          onSave={(changedFileClassKey) => void handleSaveFileClass(changedFileClassKey)}
          onClose={() => setShopCategoryToChangeFileClass(null)}
        />
      )}
    </>
  )
}
