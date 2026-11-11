import { useCallback, useEffect, useState } from 'react'

/** Rückmeldung von {@link useLoadedData}: die geladenen Daten und `reload`. */
export type LoadedData<T> = {
  /** Die Daten, `null` solange nichts da ist oder nach einem Fehler. */
  data: T | null
  /** Lädt noch einmal, z. B. nach dem Speichern. */
  reload: () => Promise<void>
}

/**
 * Lädt beim Anzeigen einmal über eine Lese-Funktion eines Entity-Hooks, z. B.
 * `useLoadedData(usersHook.getAllUsers)`. So steht das Laden beim Anzeigen nicht in jeder Komponente
 * neu. `isLoading` und `error` liefert weiter der Entity-Hook selbst.
 *
 * @param loadData eine stabile Lese-Funktion (die Funktionen der Entity-Hooks sind es)
 */
export function useLoadedData<T>(loadData: () => Promise<T | null>): LoadedData<T> {
  const [data, setData] = useState<T | null>(null)

  const reload = useCallback(async () => {
    const loadedData = await loadData()
    setData(loadedData)
  }, [loadData])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, reload }
}
