import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'
import { getUsersShownName } from '../users/getUsersShownName.ts'
import { useUsersAvatarsForClient } from '../users/useUsersAvatarForClient.ts'
import { SearchableList } from './SearchableList.tsx'
import { UsersGuidName } from './UsersGuidName.tsx'

type UsersGuidListProps = {
  usersGuids: string[]
  /** Der Name der Seite, von der aus man ein Profil öffnet, für „Zurück zu …“. */
  originLabel: string
}

/** Die Texte der Liste, mehrsprachig angelegt: je Sprachkürzel der Text, eine weitere Sprache kommt hier dazu. */
const USERS_GUID_LIST_TEXTS = {
  searchPlaceholder: { de: 'User suchen …' },
  noMatch: { de: 'Kein User passt.' },
} satisfies Record<string, MultilingualText>

/**
 * Eine Liste von Usern aus ihren GUIDs, mit Suchfeld ({@link SearchableList}), z. B. wer für eine Datei gestimmt hat: je
 * User Avatar und Name ({@link UsersGuidName}), beide führen auf sein Profil. Gesucht wird im Namen, so wie er dasteht
 * (privat „Anonym“). Die Namen fragt die Liste je GUID beim Backend ab, erst wenn sie angezeigt wird (in einem Hoverlay
 * also erst, wenn es aufgeht); ein Name, der noch lädt, passt auf keine Suche.
 */
export function UsersGuidList({ usersGuids, originLabel }: UsersGuidListProps) {
  const usersAvatarsByGuid = useUsersAvatarsForClient(usersGuids)

  function getUsersSearchText(usersGuid: string): string {
    const usersAvatar = usersAvatarsByGuid.get(usersGuid)
    if (usersAvatar === undefined) {
      return ''
    }
    return getUsersShownName(usersAvatar)
  }

  return (
    <SearchableList
      entries={usersGuids}
      getEntryKey={(usersGuid) => usersGuid}
      getEntrySearchText={getUsersSearchText}
      renderEntry={(usersGuid, activeSearchText) => (
        <UsersGuidName usersGuid={usersGuid} originLabel={originLabel} searchText={activeSearchText} />
      )}
      searchPlaceholder={getTextInCurrentLanguage(USERS_GUID_LIST_TEXTS.searchPlaceholder)}
      noMatchText={getTextInCurrentLanguage(USERS_GUID_LIST_TEXTS.noMatch)}
    />
  )
}
