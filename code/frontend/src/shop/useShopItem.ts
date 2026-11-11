import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import type { UploadProgressListener } from '../api/ApiRequest.ts'
import { type ApiDataOrError, useApiRequest } from '../api/useApiRequest.ts'
import type { FileUploadResult } from '../file/FileDocument.ts'
import { FILE_DOCUMENT_VIEW_CACHE_SCOPE } from '../file/fileDocumentViewCacheScope.ts'
import { clearViewCacheScope } from '../navigation/viewCache.ts'
import type { ShopItemForClient } from './ShopItem.ts'
import { SHOP_ITEM_VIEW_CACHE_SCOPE } from './shopItemViewCacheScope.ts'

/**
 * Was {@link useShopItem} anbietet: je Endpunkt von `/api/shop-item` eine Funktion, benannt wie die Methode im Backend
 * (`FileUploadService.uploadFileIntoShopCategory`, `ShopItemService.resolveShopItems`). Auflösen liefert die Liste oder
 * `null` (der Fehler steht dann in `error`); Hochladen liefert die Daten oder den Fehler genau dieses Uploads.
 */
export type ShopItemHook = ApiHookState & {
  uploadFileIntoShopCategory: (
    file: File,
    shopCategoryKey: string,
    clientFieldValues: Record<string, unknown>,
    onUploadProgress: UploadProgressListener,
    abortSignal: AbortSignal,
  ) => Promise<ApiDataOrError<FileUploadResult>>
  resolveShopItems: (shopCategoryKey: string) => Promise<ShopItemForClient[] | null>
}

/**
 * Alle Endpunkte von `/api/shop-item`. Nach dem Hochladen leert er die Bereiche der Dateien und der Artikel im
 * Zwischenspeicher der Ansichten.
 */
export function useShopItem(): ShopItemHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForDataOrError = apiRequestHook.sendForDataOrError

  /**
   * CREATE: Eine Datei in eine Rubrik des Gebietermarkts hochladen, wie jeder Upload: zuerst `data` als JSON (Rubrik und
   * Felder der Datei), dann die Datei. Eine FileClass geht nicht mit: Das Backend nimmt immer die der Rubrik. Danach ist
   * die Datei dort ein Artikel; sein Angebot kommt im nächsten Schritt (`useShopOffer`). `abortSignal` bricht ab, z. B.
   * beim Schließen des Popups.
   */
  const uploadFileIntoShopCategory = useCallback(
    async (
      file: File,
      shopCategoryKey: string,
      clientFieldValues: Record<string, unknown>,
      onUploadProgress: UploadProgressListener,
      abortSignal: AbortSignal,
    ) => {
      const shopCategoryUploadData = { shopCategoryKey, fieldValuesByFieldName: clientFieldValues }
      const shopCategoryUploadDataJson = JSON.stringify(shopCategoryUploadData)
      const dataPart = new Blob([shopCategoryUploadDataJson], { type: 'application/json' })
      const multipartBody = new FormData()
      multipartBody.append('data', dataPart)
      multipartBody.append('file', file, file.name)
      const uploadOutcome = await sendForDataOrError<FileUploadResult>({
        method: 'POST',
        path: '/api/shop-item/upload',
        multipartBody,
        onUploadProgress,
        abortSignal,
      })
      if (uploadOutcome.succeeded) {
        clearViewCacheScope(FILE_DOCUMENT_VIEW_CACHE_SCOPE)
        clearViewCacheScope(SHOP_ITEM_VIEW_CACHE_SCOPE)
      }
      return uploadOutcome
    },
    [sendForDataOrError],
  )

  /** READ: Die Artikel einer Rubrik, der neueste zuerst, je mit dem Dokument der Datei. */
  const resolveShopItems = useCallback((shopCategoryKey: string) => {
    const resolveRequest = { shopCategoryKey }
    return sendForData<ShopItemForClient[]>({ method: 'POST', path: '/api/shop-item/resolve', body: resolveRequest })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    uploadFileIntoShopCategory,
    resolveShopItems,
  }
}
