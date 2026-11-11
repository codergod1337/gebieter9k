import Spinner from 'react-bootstrap/Spinner'
import Table from 'react-bootstrap/Table'
import { useNavigate } from 'react-router'
import type { AccessRole } from '../../auth/access/AccessRole.ts'
import { AccessRoleBadge } from '../../auth/access/AccessRoleBadge.tsx'
import { ContentBox } from '../../components/ContentBox.tsx'
import { EditButton } from '../../components/EditButton.tsx'
import { NewEntityButton } from '../../components/NewEntityButton.tsx'
import type { FileClass } from '../../file/FileClass.ts'
import { FileClassBadge } from '../../file/FileClassBadge.tsx'
import { type FileClassAccessRole, type FileClassGrant, hasFileClassGrant } from '../../file/FileClassAccessRole.ts'
import { getFileExtensionsOfFileClass } from '../../file/FileClassFileExtension.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { FILE_CLASS_ACCESS_TEXTS } from './fileClassAccessTexts.ts'
import { getEditFileClassPath, NEW_FILE_CLASS_PATH } from './fileClassPaths.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'

/** Die Rechte, bei denen an der FileClass dieser Schalter an ist, in der Reihenfolge der Rechte. */
function getAccessRolesWithFileClassGrant(
  accessRoles: AccessRole[],
  fileClassAccessRoles: FileClassAccessRole[],
  fileClassKey: string,
  grant: FileClassGrant,
): AccessRole[] {
  const accessRolesWithGrant: AccessRole[] = []
  for (const accessRole of accessRoles) {
    const hasGrant = fileClassAccessRoles.some(
      (fileClassAccessRole) =>
        fileClassAccessRole.fileClassKey === fileClassKey &&
        fileClassAccessRole.accessRoleKey === accessRole.key &&
        hasFileClassGrant(fileClassAccessRole, grant),
    )
    if (hasGrant) {
      accessRolesWithGrant.push(accessRole)
    }
  }
  return accessRolesWithGrant
}

/**
 * Tab „FileClass“ der Administration: alle Dateiarten in einer ContentBox, oben rechts „neue FileClass“, je Zeile
 * Bearbeiten. Endungen und Rechte stehen nur zur Ansicht da, geändert werden sie in den beiden Matrizen. Die Liste kommt
 * aus den Stammdaten.
 */
export function FileClassTab() {
  const navigate = useNavigate()
  const originNavigation = useOrigin()
  const masterDataHook = useMasterData()
  const fileClasses = masterDataHook.fileClasses
  const accessRoles = masterDataHook.accessRoles ?? []
  const fileClassAccessRoles = masterDataHook.fileClassAccessRoles ?? []
  const fileClassFileExtensions = masterDataHook.fileClassFileExtensions ?? []

  function handleNewFileClass() {
    const originState = originNavigation.createOriginStateHere('FileClass')
    navigate(NEW_FILE_CLASS_PATH, { state: originState })
  }

  function handleEdit(fileClass: FileClass) {
    const editFileClassPath = getEditFileClassPath(fileClass.key)
    const originState = originNavigation.createOriginStateHere('FileClass')
    navigate(editFileClassPath, { state: originState })
  }

  function renderAccessRoleBadges(fileClassKey: string, grant: FileClassGrant) {
    const accessRolesWithGrant = getAccessRolesWithFileClassGrant(accessRoles, fileClassAccessRoles, fileClassKey, grant)
    return (
      <span className="d-inline-flex flex-wrap gap-1">
        {accessRolesWithGrant.map((accessRole) => (
          <AccessRoleBadge key={accessRole.key} accessRole={accessRole} />
        ))}
      </span>
    )
  }

  function renderFileExtensionBadges(fileClassKey: string) {
    const fileExtensionsOfFileClass = getFileExtensionsOfFileClass(fileClassFileExtensions, fileClassKey)
    return (
      <span className="d-inline-flex flex-wrap gap-1">
        {fileExtensionsOfFileClass.map((fileExtension) => (
          <span key={fileExtension} className="badge text-bg-secondary">
            {fileExtension}
          </span>
        ))}
      </span>
    )
  }

  let footer
  if (masterDataHook.error !== null) {
    footer = <span className="text-danger">{masterDataHook.error.detail}</span>
  } else if (fileClasses === null) {
    footer = <Spinner animation="border" size="sm" />
  } else {
    const fileClassesCountText = fileClasses.length + ' FileClasses'
    footer = <span>{fileClassesCountText}</span>
  }
  const newFileClassButton = <NewEntityButton label="neue FileClass" onClick={handleNewFileClass} />

  return (
    <ContentBox title="FileClasses (Dateiarten)" actions={newFileClassButton} footer={footer}>
      {fileClasses !== null && (
        <Table striped hover responsive className="mb-0">
          <thead>
            <tr>
              <th>Kachel</th>
              <th>Key</th>
              <th>Endungen</th>
              <th>{getTextInCurrentLanguage(FILE_CLASS_ACCESS_TEXTS.readHeader)}</th>
              <th>{getTextInCurrentLanguage(FILE_CLASS_ACCESS_TEXTS.editHeader)}</th>
              <th>{getTextInCurrentLanguage(FILE_CLASS_ACCESS_TEXTS.uploadHeader)}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {fileClasses.map((fileClass) => {
              const editLabel = fileClass.key + ' bearbeiten'
              return (
                <tr key={fileClass.key}>
                  <td>
                    <FileClassBadge fileClass={fileClass} />
                  </td>
                  <td>
                    <code>{fileClass.key}</code>
                  </td>
                  <td>{renderFileExtensionBadges(fileClass.key)}</td>
                  <td>{renderAccessRoleBadges(fileClass.key, 'READ')}</td>
                  <td>{renderAccessRoleBadges(fileClass.key, 'EDIT')}</td>
                  <td>{renderAccessRoleBadges(fileClass.key, 'UPLOAD')}</td>
                  <td className="text-end text-nowrap">
                    <EditButton label={editLabel} onClick={() => handleEdit(fileClass)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </ContentBox>
  )
}
