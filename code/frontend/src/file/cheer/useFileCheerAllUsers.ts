import { useCallback, useEffect, useRef, useState } from 'react'
import { useUsersAvatarsPreload } from '../../users/useUsersAvatarForClient.ts'
import type { FileCheerDirection } from '../FileCheer.ts'
import { useFileCheer } from '../useFileCheer.ts'

/** Wie weit „Alle laden“ für eine Richtung ist. */
export type FileCheerAllUsersLoad = {
  /** Alle User dieser Richtung, der neueste zuerst; `null`, solange nicht alle geladen sind. */
  usersGuids: string[] | null
  /** Läuft das Nachladen gerade? */
  isLoading: boolean
  /** So viele User sind schon da, für „120 von 5.000 geladen“. */
  loadedCount: number
  /** Für so viele Stimmen gilt die fertige Liste; ändert sich die Zahl (jemand stimmt), ist sie überholt. */
  totalCount: number
}

type FileCheerAllUsersLoads = Record<FileCheerDirection, FileCheerAllUsersLoad>

/** Was {@link useFileCheerAllUsers} liefert. */
export type FileCheerAllUsersHook = {
  allUsersLoads: FileCheerAllUsersLoads
  /** Lädt alle User einer Richtung nach, Seite für Seite; läuft es schon, passiert nichts. */
  loadAllUsers: (direction: FileCheerDirection) => void
  errorMessage: string | null
}

const NOT_LOADED: FileCheerAllUsersLoad = { usersGuids: null, isLoading: false, loadedCount: 0, totalCount: 0 }

/**
 * „Alle laden“ in der Sprechblase der Stimmen (Nutzer 2026-11-11): Standard sind die 15 neuesten User je Richtung; auf
 * Wunsch holt dieser Hook alle nach, gemütlich eine Seite nach der anderen (`POST /api/file-cheer/users/resolve`), und zu
 * jeder Seite gleich die Namen (eine Sammel-Anfrage je Seite). Erst wenn alles da ist, gibt er die ganze Liste heraus;
 * bis dahin zeigt die Sprechblase den Spinner mit dem Fortschritt.
 *
 * Der Stand hängt an der Leiste der Stimmen, nicht an der Sprechblase: Geht sie zwischendurch zu, läuft das Nachladen
 * weiter. Wechselt die Datei (das nächste Bild im großen Bild), beginnt alles von vorn.
 */
export function useFileCheerAllUsers(fileDocumentId: string): FileCheerAllUsersHook {
  const fileCheerHook = useFileCheer()
  const resolveFileCheerUsersGuids = fileCheerHook.resolveFileCheerUsersGuids
  const preloadUsersAvatars = useUsersAvatarsPreload()
  const [loadsOfFile, setLoadsOfFile] = useState<{ fileDocumentId: string; loads: FileCheerAllUsersLoads }>({
    fileDocumentId,
    loads: { UP: NOT_LOADED, DOWN: NOT_LOADED },
  })
  /** Die Datei, für die gerade geladen werden darf: Ein Lauf für eine andere Datei hört auf. */
  const wantedFileDocumentIdRef = useRef<string | null>(fileDocumentId)

  useEffect(() => {
    wantedFileDocumentIdRef.current = fileDocumentId
    return () => {
      wantedFileDocumentIdRef.current = null
    }
  }, [fileDocumentId])

  /** Setzt den Stand einer Richtung, nur solange es noch um dieselbe Datei geht. */
  const applyLoad = useCallback((loadedFileDocumentId: string, direction: FileCheerDirection, load: FileCheerAllUsersLoad) => {
    setLoadsOfFile((currentLoadsOfFile) => {
      let currentLoads = currentLoadsOfFile.loads
      if (currentLoadsOfFile.fileDocumentId !== loadedFileDocumentId) {
        currentLoads = { UP: NOT_LOADED, DOWN: NOT_LOADED }
      }
      const nextLoads: FileCheerAllUsersLoads = { ...currentLoads, [direction]: load }
      return { fileDocumentId: loadedFileDocumentId, loads: nextLoads }
    })
  }, [])

  const loadAllUsersOfDirection = useCallback(
    async (loadedFileDocumentId: string, direction: FileCheerDirection) => {
      applyLoad(loadedFileDocumentId, direction, { usersGuids: null, isLoading: true, loadedCount: 0, totalCount: 0 })
      const collectedUsersGuids: string[] = []
      let totalCount = Number.MAX_SAFE_INTEGER
      let page = 0
      while (collectedUsersGuids.length < totalCount) {
        const usersPage = await resolveFileCheerUsersGuids(loadedFileDocumentId, direction, page)
        const stillWanted = wantedFileDocumentIdRef.current === loadedFileDocumentId
        if (!stillWanted) {
          return
        }
        if (usersPage === null) {
          // gescheitert: Der Fehler steht im Hook, die Sprechblase zeigt wieder den Knopf
          applyLoad(loadedFileDocumentId, direction, NOT_LOADED)
          return
        }
        totalCount = usersPage.totalCount
        if (usersPage.usersGuids.length === 0) {
          break
        }
        // die Namen dieser Seite gleich dazu, damit am Ende alles auf einmal dasteht
        await preloadUsersAvatars(usersPage.usersGuids)
        collectedUsersGuids.push(...usersPage.usersGuids)
        applyLoad(loadedFileDocumentId, direction, {
          usersGuids: null,
          isLoading: true,
          loadedCount: collectedUsersGuids.length,
          totalCount,
        })
        page = page + 1
      }
      // stimmt jemand, während geladen wird, verschieben sich die Seiten: Jeder User steht trotzdem nur einmal da
      const uniqueUsersGuids = [...new Set(collectedUsersGuids)]
      applyLoad(loadedFileDocumentId, direction, {
        usersGuids: uniqueUsersGuids,
        isLoading: false,
        loadedCount: uniqueUsersGuids.length,
        totalCount,
      })
    },
    [applyLoad, resolveFileCheerUsersGuids, preloadUsersAvatars],
  )

  let allUsersLoads: FileCheerAllUsersLoads = { UP: NOT_LOADED, DOWN: NOT_LOADED }
  if (loadsOfFile.fileDocumentId === fileDocumentId) {
    allUsersLoads = loadsOfFile.loads
  }

  const upIsLoading = allUsersLoads.UP.isLoading
  const downIsLoading = allUsersLoads.DOWN.isLoading
  const loadAllUsers = useCallback(
    (direction: FileCheerDirection) => {
      let alreadyLoading = upIsLoading
      if (direction === 'DOWN') {
        alreadyLoading = downIsLoading
      }
      if (alreadyLoading) {
        return
      }
      void loadAllUsersOfDirection(fileDocumentId, direction)
    },
    [fileDocumentId, upIsLoading, downIsLoading, loadAllUsersOfDirection],
  )

  let errorMessage: string | null = null
  if (fileCheerHook.error !== null) {
    errorMessage = fileCheerHook.error.detail
  }
  return { allUsersLoads, loadAllUsers, errorMessage }
}
