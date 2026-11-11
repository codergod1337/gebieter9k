import { useCallback, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import { useNavigate, useParams } from 'react-router'
import { adminAccessRoleKey } from '../auth/access/adminAccessRoleKey.ts'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { ContentBox } from '../components/ContentBox.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { NewEntityButton } from '../components/NewEntityButton.tsx'
import { SortableArea } from '../components/SortableArea.tsx'
import { getUploadableFileClassKeys } from '../file/FileClassAccessRole.ts'
import { FileClassBadge } from '../file/FileClassBadge.tsx'
import { getFileDocumentText } from '../file/FileDocument.ts'
import { getFileDocumentPath } from '../file/fileDocumentPaths.ts'
import { getFileDocumentHeading } from '../file/getFileDocumentHeading.ts'
import { isFileDocumentChangeableByCurrentUsers } from '../file/isFileDocumentChangeableByCurrentUsers.ts'
import { useFileManagerOrAdmin } from '../file/useFileManagerOrAdmin.ts'
import { GalleryImageTile } from '../gallery/GalleryImageTile.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import { useMasterData } from '../masterdata/useMasterData.ts'
import { useCachedLoadedData } from '../navigation/useCachedLoadedData.ts'
import { useOrigin } from '../navigation/useOrigin.ts'
import type { ShopItemForClient } from '../shop/ShopItem.ts'
import type { ShopOffer } from '../shop/ShopOffer.ts'
import { SHOP_ITEM_VIEW_CACHE_SCOPE } from '../shop/shopItemViewCacheScope.ts'
import { useShopItem } from '../shop/useShopItem.ts'
import { BuyShopOfferPopup } from './BuyShopOfferPopup.tsx'
import { useMarketContext } from './Market.tsx'
import { MARKET_TEXTS } from './marketTexts.ts'
import { NewShopOfferPopup } from './NewShopOfferPopup.tsx'
import { getShopOfferSummary } from './shopOfferSummary.ts'

/** Ein Angebot, das der User kaufen will, mit seinem Artikel. */
type ShopOfferToBuy = {
  shopItemForClient: ShopItemForClient
  shopOffer: ShopOffer
}

function getShopItemKey(shopItemForClient: ShopItemForClient): string {
  return shopItemForClient.shopItem.fileDocumentId
}

/** Die Artikel einer Rubrik lassen sich nicht verschieben; die Kacheln stehen nur wie in der Galerie im Raster. */
function ignoreReorder() {
  // nichts zu tun: Im Markt gibt es keine Reihenfolge von Hand
}

/**
 * Der Tab einer Rubrik des Gebietermarkts (`/market/category/<Key>`), Nutzer 2026-11-11:
 * - oben rechts der Knopf „neues Angebot“ (nur für User, die die FileClass der Rubrik hochladen dürfen): Er öffnet den
 *   geführten Ablauf ({@link NewShopOfferPopup}: Datei hochladen, Laufzeit, Nutzung, Preis). Im Tab selbst stehen
 *   keine Eingabefelder;
 * - die Artikel der Rubrik als Bildkacheln, der neueste zuerst, dieselbe Kachel wie in der Galerie
 *   ({@link GalleryImageTile}: Vorschau, Stimmen, Info, Download), im Fuß der Kachel das laufende Angebot mit dem
 *   Knopf „Kaufen“ (nicht am eigenen Artikel und nicht, wenn man ihn schon dauerhaft hat); er öffnet die Bestätigung
 *   ({@link BuyShopOfferPopup}). Darüber steht, was man von dem Artikel schon hat. Hat ein eigener Artikel noch kein
 *   Angebot (Ablauf nach dem Hochladen abgebrochen), steht dort „Angebot erstellen“ und beginnt den Ablauf bei der
 *   Laufzeit. Ein Klick auf das Bild öffnet die Seite der Datei mit „Zurück zu <Rubrik>“;
 * - im Fuß die FileClass der Rubrik (jede Rubrik hat genau eine, der Admin legt sie im Tab „Rubriken“ fest).
 * Die Rubrik steht in der Adresse, die Artikel kommen aus dem Zwischenspeicher der Ansichten.
 */
export function MarketCategoryTab() {
  const { shopCategoryKey } = useParams()
  const navigate = useNavigate()
  const { session, hasAccessRole } = useCurrentSession()
  const originNavigation = useOrigin()
  const fileManagerOrAdmin = useFileManagerOrAdmin()
  const { shopCategories, errorMessage } = useMarketContext()
  const { fileClasses, fileClassAccessRoles, fileSolrFieldNameSet } = useMasterData()
  const shopItemHook = useShopItem()
  const resolveShopItems = shopItemHook.resolveShopItems
  const shownShopCategoryKey = shopCategoryKey ?? ''
  const loadShopItems = useCallback(() => resolveShopItems(shownShopCategoryKey), [resolveShopItems, shownShopCategoryKey])
  const loadedShopItems = useCachedLoadedData(
    SHOP_ITEM_VIEW_CACHE_SCOPE,
    { shopCategoryKey: shownShopCategoryKey },
    loadShopItems,
  )
  const reloadShopItems = loadedShopItems.reload
  /** Ob der geführte Ablauf „neues Angebot“ offen ist. */
  const [newShopOfferOpen, setNewShopOfferOpen] = useState<boolean>(false)
  /** Mit welchen schon hochgeladenen Dateien er beginnt; `null`: mit dem Hochladen. */
  const [newShopOfferStartFileDocumentIds, setNewShopOfferStartFileDocumentIds] = useState<string[] | null>(null)
  /** Das Angebot, dessen Kauf gerade im Popup bestätigt wird; `null`: keins. */
  const [shopOfferToBuy, setShopOfferToBuy] = useState<ShopOfferToBuy | null>(null)

  if (errorMessage !== null) {
    return <ErrorAlert message={errorMessage} />
  }
  if (shopCategories === null || fileClasses === null || fileClassAccessRoles === null || fileSolrFieldNameSet === null) {
    return <Spinner animation="border" />
  }
  const shopCategory = shopCategories.find((candidate) => candidate.key === shownShopCategoryKey)
  if (shopCategory === undefined) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(MARKET_TEXTS.unknownShopCategory)}</p>
  }
  const shopCategoryTitle = getTextInCurrentLanguage(shopCategory.displayName)

  // Die FileClass der Rubrik: Jede Rubrik hat genau eine, alles Hochgeladene bekommt sie
  const fileClassOfShopCategory = fileClasses.find((fileClass) => fileClass.key === shopCategory.fileClassKey)
  // Hochladen darf, wer diese FileClass hochladen darf (Schalter „Hochladen“ der FileClass)
  const uploadableFileClassKeys = getUploadableFileClassKeys(fileClassAccessRoles, hasAccessRole)
  const currentUsersMayUpload = uploadableFileClassKeys.has(shopCategory.fileClassKey)

  let currentUsersGuid = ''
  if (session !== null) {
    currentUsersGuid = session.users.guid
  }
  // Die Seite einer Datei öffnet sich mit der Rubrik als Origin („Zurück zu <Rubrik>“)
  const shopItemOriginState = originNavigation.createOriginStateHere(shopCategoryTitle)
  const idFieldName = fileSolrFieldNameSet.id
  const fileNameFieldName = fileSolrFieldNameSet.fileName
  const previewFieldName = fileSolrFieldNameSet.previewBase64Png
  const shopItems = loadedShopItems.data

  function openFileDocument(fileDocumentId: string) {
    const fileDocumentPath = getFileDocumentPath(fileDocumentId)
    navigate(fileDocumentPath, { state: shopItemOriginState })
  }

  function handleShopItemsChanged() {
    void reloadShopItems()
  }

  /** Öffnet „neues Angebot“: ohne Dateien mit dem Hochladen, mit Dateien gleich bei der Laufzeit. */
  function openNewShopOffer(startFileDocumentIds: string[] | null) {
    setNewShopOfferStartFileDocumentIds(startFileDocumentIds)
    setNewShopOfferOpen(true)
  }

  function closeNewShopOffer() {
    setNewShopOfferOpen(false)
    void reloadShopItems()
  }

  let footer = undefined
  if (fileClassOfShopCategory !== undefined) {
    footer = (
      <span className="d-flex flex-wrap align-items-center gap-2">
        <span>{getTextInCurrentLanguage(MARKET_TEXTS.fileClassLabel)}</span>
        <FileClassBadge fileClass={fileClassOfShopCategory} showDescription />
      </span>
    )
  }
  let shopItemsErrorMessage: string | null = null
  if (shopItemHook.error !== null) {
    shopItemsErrorMessage = shopItemHook.error.detail
  }
  const currentUsersIsAdmin = hasAccessRole(adminAccessRoleKey)
  // Der Knopf „neues Angebot“: nur, wer die FileClass der Rubrik hochladen darf
  let newShopOfferButton = undefined
  if (currentUsersMayUpload && fileClassOfShopCategory !== undefined) {
    newShopOfferButton = (
      <NewEntityButton label={getTextInCurrentLanguage(MARKET_TEXTS.newShopOffer)} onClick={() => openNewShopOffer(null)} />
    )
  }

  /**
   * Der Fuß einer Kachel: was der Betrachter von dem Artikel schon hat, dann je laufendem Angebot eine Zeile mit dem
   * Knopf „Kaufen“, sonst der Hinweis, dass keins läuft. Der Verkäufer (und der Admin) bekommt dann den Knopf „Angebot
   * erstellen“. Kaufen kann, wer nicht der Verkäufer ist und den Artikel noch nicht dauerhaft hat.
   */
  function renderShopOffers(shopItemForClient: ShopItemForClient, heading: string) {
    const runningShopOffers = shopItemForClient.runningShopOffers
    const shopItem = shopItemForClient.shopItem
    const currentUsersIsSeller = shopItem.sellerUsersGuid === currentUsersGuid
    const ownUsersShopItem = shopItemForClient.ownUsersShopItem
    const ownedPermanently = ownUsersShopItem !== null && ownUsersShopItem.permanent
    let ownedText: string | null = null
    if (ownedPermanently) {
      ownedText = getTextInCurrentLanguage(MARKET_TEXTS.ownedPermanently)
    } else if (ownUsersShopItem !== null && ownUsersShopItem.remainingUsageCount > 0) {
      ownedText = getTextInCurrentLanguageWithValues(MARKET_TEXTS.ownedUsages, {
        count: ownUsersShopItem.remainingUsageCount.toLocaleString('de-DE'),
      })
    }
    const ownedLine = ownedText !== null && <div className="text-success fw-semibold mb-1">{ownedText}</div>
    if (runningShopOffers.length === 0) {
      const mayCreateShopOffer = currentUsersIsSeller || currentUsersIsAdmin
      return (
        <>
          {ownedLine}
          <span className="text-body-secondary d-block">{getTextInCurrentLanguage(MARKET_TEXTS.noRunningShopOffer)}</span>
          {mayCreateShopOffer && (
            <Button variant="link" size="sm" className="p-0" onClick={() => openNewShopOffer([shopItem.fileDocumentId])}>
              {getTextInCurrentLanguage(MARKET_TEXTS.createShopOfferForItem)}
            </Button>
          )}
        </>
      )
    }
    const mayBuy = !currentUsersIsSeller && !ownedPermanently
    return (
      <>
        {ownedLine}
        {runningShopOffers.map((shopOffer) => {
          const shopOfferSummary = getShopOfferSummary(shopOffer)
          const buyLabel = getTextInCurrentLanguageWithValues(MARKET_TEXTS.buyLabel, {
            heading,
            summary: shopOfferSummary,
          })
          return (
            <div key={shopOffer.id} className="d-flex flex-column align-items-center gap-1 mb-2">
              <span className="fw-semibold">{shopOfferSummary}</span>
              {mayBuy && (
                <Button
                  variant="primary"
                  size="sm"
                  aria-label={buyLabel}
                  onClick={() => setShopOfferToBuy({ shopItemForClient, shopOffer })}>
                  {getTextInCurrentLanguage(MARKET_TEXTS.buy)}
                </Button>
              )}
            </div>
          )
        })}
      </>
    )
  }

  // Das Popup zur Bestätigung eines Kaufs, mit Überschrift und Vorschau des Artikels wie an der Kachel
  let buyShopOfferPopup = null
  if (shopOfferToBuy !== null) {
    const fileDocumentToBuy = shopOfferToBuy.shopItemForClient.fileDocument
    buyShopOfferPopup = (
      <BuyShopOfferPopup
        shopOffer={shopOfferToBuy.shopOffer}
        heading={getFileDocumentHeading(fileDocumentToBuy, fileSolrFieldNameSet)}
        fileName={getFileDocumentText(fileDocumentToBuy, fileNameFieldName)}
        previewBase64Png={fileDocumentToBuy[previewFieldName]}
        ownUsersShopItem={shopOfferToBuy.shopItemForClient.ownUsersShopItem}
        onBought={handleShopItemsChanged}
        onClose={() => setShopOfferToBuy(null)}
      />
    )
  }

  return (
    <>
      <ContentBox title={shopCategoryTitle} actions={newShopOfferButton} footer={footer}>
        <ErrorAlert message={shopItemsErrorMessage} />
        {shopItems === null && shopItemsErrorMessage === null && <Spinner animation="border" />}
        {shopItems !== null && shopItems.length === 0 && (
          <p className="text-body-secondary mb-0">{getTextInCurrentLanguage(MARKET_TEXTS.noShopItems)}</p>
        )}
        {shopItems !== null && shopItems.length > 0 && (
          <SortableArea items={shopItems} itemKey={getShopItemKey} onReorder={ignoreReorder} layout="grid">
            <div className="gallery-images">
              {shopItems.map((shopItemForClient) => {
                const fileDocument = shopItemForClient.fileDocument
                const fileDocumentId = getFileDocumentText(fileDocument, idFieldName)
                const fileName = getFileDocumentText(fileDocument, fileNameFieldName)
                const heading = getFileDocumentHeading(fileDocument, fileSolrFieldNameSet)
                const previewBase64Png = fileDocument[previewFieldName]
                const changeable = isFileDocumentChangeableByCurrentUsers(
                  fileDocument,
                  fileSolrFieldNameSet,
                  currentUsersGuid,
                  fileManagerOrAdmin,
                  hasAccessRole,
                )
                return (
                  <GalleryImageTile
                    key={fileDocumentId}
                    fileDocumentId={fileDocumentId}
                    fileName={fileName}
                    heading={heading}
                    previewBase64Png={previewBase64Png}
                    sortable={false}
                    sortingDisabled
                    changeable={changeable}
                    originState={shopItemOriginState}
                    onOpen={openFileDocument}
                    footer={renderShopOffers(shopItemForClient, heading)}
                  />
                )
              })}
            </div>
          </SortableArea>
        )}
      </ContentBox>
      {newShopOfferOpen && fileClassOfShopCategory !== undefined && (
        <NewShopOfferPopup
          shopCategoryKey={shopCategory.key}
          shopCategoryTitle={shopCategoryTitle}
          fileClass={fileClassOfShopCategory}
          startFileDocumentIds={newShopOfferStartFileDocumentIds}
          onShopItemsChanged={handleShopItemsChanged}
          onClose={closeNewShopOffer}
        />
      )}
      {buyShopOfferPopup}
    </>
  )
}
