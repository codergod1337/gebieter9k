import { useCallback, useEffect, useSyncExternalStore } from 'react'
import type { Achievement } from '../achievement/Achievement.ts'
import type { PointActivity } from '../point/PointActivity.ts'
import type { ApiHookState } from '../api/ApiHookState.ts'
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
import { defaultMasterDataStore } from './defaultMasterDataStore.ts'

/**
 * Was {@link useMasterData} anbietet: den einheitlichen {@link ApiHookState}, die Stammdaten und
 * `reload`. Die Listen sind `null`, solange sie noch nicht geladen sind.
 */
export type MasterDataHook = ApiHookState & {
  accessRoles: AccessRole[] | null
  accessRoleCollections: AccessRoleCollection[] | null
  accessRoleCollectionRoles: AccessRoleCollectionRole[] | null
  fileClasses: FileClass[] | null
  fileExtensions: FileExtension[] | null
  fileExtensionGroups: FileExtensionGroup[] | null
  fileClassAccessRoles: FileClassAccessRole[] | null
  fileClassFileExtensions: FileClassFileExtension[] | null
  fileSolrFieldNameSet: FileSolrFieldNameSet | null
  fileAnalysisStatusValueSet: FileAnalysisStatusValueSet | null
  fileStatusValueSet: FileStatusValueSet | null
  achievements: Achievement[] | null
  pointActivities: PointActivity[] | null
  reload: () => Promise<void>
}

/**
 * Die Stammdaten aus dem gemeinsamen Cache. Der erste Aufruf auf der Seite lädt sie, jeder weitere
 * bekommt sie sofort aus dem Cache, ohne neuen Request.
 */
export function useMasterData(): MasterDataHook {
  const masterDataSnapshot = useSyncExternalStore(
    defaultMasterDataStore.subscribe,
    defaultMasterDataStore.getSnapshot,
  )

  useEffect(() => {
    void defaultMasterDataStore.load()
  }, [])

  const reload = useCallback(() => {
    return defaultMasterDataStore.reload()
  }, [])

  const masterData = masterDataSnapshot.masterData
  let accessRoles: AccessRole[] | null = null
  let accessRoleCollections: AccessRoleCollection[] | null = null
  let accessRoleCollectionRoles: AccessRoleCollectionRole[] | null = null
  let fileClasses: FileClass[] | null = null
  let fileExtensions: FileExtension[] | null = null
  let fileExtensionGroups: FileExtensionGroup[] | null = null
  let fileClassAccessRoles: FileClassAccessRole[] | null = null
  let fileClassFileExtensions: FileClassFileExtension[] | null = null
  let fileSolrFieldNameSet: FileSolrFieldNameSet | null = null
  let fileAnalysisStatusValueSet: FileAnalysisStatusValueSet | null = null
  let fileStatusValueSet: FileStatusValueSet | null = null
  let achievements: Achievement[] | null = null
  let pointActivities: PointActivity[] | null = null
  if (masterData !== null) {
    accessRoles = masterData.accessRoles
    accessRoleCollections = masterData.accessRoleCollections
    accessRoleCollectionRoles = masterData.accessRoleCollectionRoles
    fileClasses = masterData.fileClasses
    fileExtensions = masterData.fileExtensions
    fileExtensionGroups = masterData.fileExtensionGroups
    fileClassAccessRoles = masterData.fileClassAccessRoles
    fileClassFileExtensions = masterData.fileClassFileExtensions
    fileSolrFieldNameSet = masterData.fileSolrFieldNameSet
    fileAnalysisStatusValueSet = masterData.fileAnalysisStatusValueSet
    fileStatusValueSet = masterData.fileStatusValueSet
    achievements = masterData.achievements
    pointActivities = masterData.pointActivities
  }

  return {
    isLoading: masterDataSnapshot.isLoading,
    error: masterDataSnapshot.error,
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
    reload,
  }
}
