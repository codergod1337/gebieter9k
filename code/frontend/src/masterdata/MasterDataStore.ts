import type { ApiClient } from '../api/ApiClient.ts'
import { ApiError } from '../api/ApiError.ts'
import type { Achievement } from '../achievement/Achievement.ts'
import type { PointActivity } from '../point/PointActivity.ts'
import type { AccessRole } from '../auth/access/AccessRole.ts'
import type { AccessRoleCollection } from '../auth/access/AccessRoleCollection.ts'
import type { AccessRoleCollectionRole } from '../auth/access/AccessRoleCollectionRole.ts'
import type { FileClass } from '../file/FileClass.ts'
import type { FileClassAccessRole } from '../file/FileClassAccessRole.ts'
import type { FileClassFileExtension } from '../file/FileClassFileExtension.ts'
import type { FileExtension } from '../file/FileExtension.ts'
import type { FileExtensionGroup } from '../file/FileExtensionGroup.ts'
import type { FileAnalysisStatusValueSet } from '../file/FileAnalysisStatusValueSet.ts'
import type { FileStatusValueSet } from '../file/FileStatusValueSet.ts'
import type { FileSolrFieldNameSet } from '../file/FileSolrFieldNameSet.ts'

/** Die Stammdaten: Dinge, die das Frontend einmal lädt und danach nur noch aus dem Cache nimmt. */
export type MasterData = {
  accessRoles: AccessRole[]
  accessRoleCollections: AccessRoleCollection[]
  /** welche Rechte eine Position verleiht (Hoverlay der Position) */
  accessRoleCollectionRoles: AccessRoleCollectionRole[]
  fileClasses: FileClass[]
  fileExtensions: FileExtension[]
  /** die Übergruppen der Endungen (Katalog und Matrix) */
  fileExtensionGroups: FileExtensionGroup[]
  /** wer an welcher FileClass lesen bzw. schreiben darf (Upload-Auswahl, Matrix) */
  fileClassAccessRoles: FileClassAccessRole[]
  /** welche FileClass welche Endung annimmt (Prüfung beim Ablegen, Matrix) */
  fileClassFileExtensions: FileClassFileExtension[]
  /** die Namen der Felder im File-Kern, aus der application.yaml des Backends */
  fileSolrFieldNameSet: FileSolrFieldNameSet
  /** die Werte des Auswertungs-Stands (PENDING, DONE, FAILED), aus der application.yaml des Backends */
  fileAnalysisStatusValueSet: FileAnalysisStatusValueSet
  fileStatusValueSet: FileStatusValueSet
  /** alle Achievements (Box im Profil) */
  achievements: Achievement[]
  /** alle Tätigkeiten mit Punkten (Namen im Kontoauszug) */
  pointActivities: PointActivity[]
}

/** Der Stand des Caches, so wie React ihn sieht. Ein neues Objekt gibt es nur bei einer Änderung. */
export type MasterDataSnapshot = {
  masterData: MasterData | null
  isLoading: boolean
  error: ApiError | null
}

/**
 * Der Cache der Stammdaten. Er liegt außerhalb von React, alle Komponenten teilen ihn.
 *
 * - `load()` holt die Stammdaten nur, wenn sie noch nicht da sind. Läuft schon ein Laden, hängt
 *   sich jeder weitere Aufruf daran, es geht also nie ein Request doppelt hinaus.
 * - Ist das Laden fehlgeschlagen, versucht `load()` es nicht von selbst wieder, sonst würde jede
 *   neue Komponente einen Request auslösen. Neu versucht wird nur mit `reload()`.
 * - `reload()` holt alles frisch, z. B. nach dem Login oder wenn ein Admin ein Recht angelegt hat.
 *   Bis die neuen Daten da sind, bleiben die alten im Cache.
 */
export class MasterDataStore {
  private readonly apiClient: ApiClient

  private snapshot: MasterDataSnapshot = { masterData: null, isLoading: false, error: null }

  private readonly listeners = new Set<() => void>()

  private runningLoad: Promise<void> | null = null

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient
  }

  /** Für `useSyncExternalStore`: meldet eine Komponente für Änderungen an und wieder ab. */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Für `useSyncExternalStore`: der aktuelle Stand. */
  readonly getSnapshot = (): MasterDataSnapshot => {
    return this.snapshot
  }

  /** Lädt die Stammdaten, aber nur, wenn sie noch fehlen und das letzte Laden nicht gescheitert ist. */
  load(): Promise<void> {
    if (this.runningLoad !== null) {
      return this.runningLoad
    }
    const masterDataLoaded = this.snapshot.masterData !== null
    const lastLoadFailed = this.snapshot.error !== null
    if (masterDataLoaded || lastLoadFailed) {
      return Promise.resolve()
    }
    return this.startLoad()
  }

  /** Lädt die Stammdaten frisch, auch wenn sie schon da sind oder das letzte Laden gescheitert ist. */
  reload(): Promise<void> {
    if (this.runningLoad !== null) {
      return this.runningLoad
    }
    return this.startLoad()
  }

  private startLoad(): Promise<void> {
    const currentMasterData = this.snapshot.masterData
    this.updateSnapshot({ masterData: currentMasterData, isLoading: true, error: null })
    const loadPromise = this.fetchMasterData()
    this.runningLoad = loadPromise
    return loadPromise
  }

  private async fetchMasterData(): Promise<void> {
    try {
      const accessRolesPromise = this.apiClient.send<AccessRole[]>({ method: 'GET', path: '/api/access-role' })
      const accessRoleCollectionsPromise = this.apiClient.send<AccessRoleCollection[]>({
        method: 'GET',
        path: '/api/access-role-collection',
      })
      const accessRoleCollectionRolesPromise = this.apiClient.send<AccessRoleCollectionRole[]>({
        method: 'GET',
        path: '/api/access-role-collection-role',
      })
      const fileClassesPromise = this.apiClient.send<FileClass[]>({ method: 'GET', path: '/api/file-class' })
      const fileExtensionsPromise = this.apiClient.send<FileExtension[]>({ method: 'GET', path: '/api/file-extension' })
      const fileExtensionGroupsPromise = this.apiClient.send<FileExtensionGroup[]>({
        method: 'GET',
        path: '/api/file-extension-group',
      })
      const fileClassAccessRolesPromise = this.apiClient.send<FileClassAccessRole[]>({
        method: 'GET',
        path: '/api/file-class-access-role',
      })
      const fileClassFileExtensionsPromise = this.apiClient.send<FileClassFileExtension[]>({
        method: 'GET',
        path: '/api/file-class-file-extension',
      })
      const fileSolrFieldNameSetPromise = this.apiClient.send<FileSolrFieldNameSet>({
        method: 'GET',
        path: '/api/file-document/field-name-set',
      })
      const fileAnalysisStatusValueSetPromise = this.apiClient.send<FileAnalysisStatusValueSet>({
        method: 'GET',
        path: '/api/file-document/analysis-status-value-set',
      })
      const fileStatusValueSetPromise = this.apiClient.send<FileStatusValueSet>({
        method: 'GET',
        path: '/api/file-document/status-value-set',
      })
      const achievementsPromise = this.apiClient.send<Achievement[]>({ method: 'GET', path: '/api/achievement' })
      const pointActivitiesPromise = this.apiClient.send<PointActivity[]>({ method: 'GET', path: '/api/point-activity' })
      // Alle Requests laufen gleichzeitig.
      const allPromises = [
        accessRolesPromise,
        accessRoleCollectionsPromise,
        accessRoleCollectionRolesPromise,
        fileClassesPromise,
        fileExtensionsPromise,
        fileExtensionGroupsPromise,
        fileClassAccessRolesPromise,
        fileClassFileExtensionsPromise,
        fileSolrFieldNameSetPromise,
        fileAnalysisStatusValueSetPromise,
        fileStatusValueSetPromise,
        achievementsPromise,
        pointActivitiesPromise,
      ] as const
      const [
        accessRoles,
        accessRoleCollections,
        accessRoleCollectionRoles,
        fileClasses,
        fileExtensions,
        fileExtensionGroups,
        fileClassAccessRoles,
        fileClassFileExtensions,
        fileSolrFieldNameSet,
        fileAnalysisStatusValueSet,
        fileStatusValueSet,
        achievements,
        pointActivities,
      ] = await Promise.all(allPromises)

      const loadedMasterData: MasterData = {
        accessRoles,
        accessRoleCollections,
        accessRoleCollectionRoles,
        fileClasses,
        fileExtensions,
        fileExtensionGroups,
        fileClassAccessRoles,
        fileClassFileExtensions,
        fileSolrFieldNameSet,
        fileAnalysisStatusValueSet,
        fileStatusValueSet,
        achievements,
        pointActivities,
      }
      this.updateSnapshot({ masterData: loadedMasterData, isLoading: false, error: null })
    } catch (caughtError) {
      const apiError = ApiError.from(caughtError)
      const currentMasterData = this.snapshot.masterData
      this.updateSnapshot({ masterData: currentMasterData, isLoading: false, error: apiError })
    } finally {
      this.runningLoad = null
    }
  }

  private updateSnapshot(newSnapshot: MasterDataSnapshot): void {
    this.snapshot = newSnapshot
    for (const listener of this.listeners) {
      listener()
    }
  }
}
