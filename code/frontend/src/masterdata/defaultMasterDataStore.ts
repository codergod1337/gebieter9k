import { defaultApiClient } from '../api/defaultApiClient.ts'
import { MasterDataStore } from './MasterDataStore.ts'

/** Der eine Stammdaten-Cache der Anwendung. Alle Komponenten teilen ihn. */
export const defaultMasterDataStore = new MasterDataStore(defaultApiClient)
