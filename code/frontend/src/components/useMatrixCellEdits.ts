import { useEffect, useRef, useState } from 'react'
import { showToast, type ToastMessage } from './toastStore.ts'

/** So lange muss nach der letzten Bestätigung Ruhe sein, dann kommt der Toast. */
const SAVED_TOAST_DELAY_MILLISECONDS = 2000

/** Eine geänderte Zelle einer Matrix. */
export type MatrixCellChange<V> = {
  rowKey: string
  columnKey: string
  value: V
}

/** Nach dem Speichern: der Wert jeder Zelle, wie er jetzt im Backend steht. */
export type MatrixServerValue<V> = (rowKey: string, columnKey: string) => V

type MatrixCellEditsOptions<V> = {
  /** Wert einer Zelle laut Backend, mit dem neuesten Stand. Läuft nur in Handlern, darf also aus Refs lesen. */
  serverValue: MatrixServerValue<V>
  /**
   * Speichert die Zellen, die vom Backend abweichen. Übernimmt die Antwort als neuen Stand und liefert, was nun im
   * Backend steht: Daran wird jede Zelle einzeln bestätigt. Scheitert es, wirft es einen `Error` mit der Meldung.
   */
  save: (changes: MatrixCellChange<V>[]) => Promise<MatrixServerValue<V>>
  /** der Toast, wenn alles bestätigt ist und zwei Sekunden Ruhe war */
  savedToast: (cellCount: number, rowCount: number) => ToastMessage
}

function getCellKey(rowKey: string, columnKey: string): string {
  return rowKey + '|' + columnKey
}

/**
 * Zellen einer Matrix bearbeiten, ohne dass etwas stockt, wie in der Vorlage. Beim Malen wird nur lokal markiert,
 * höchstens einmal pro Bildschirmframe gezeichnet und erst beim Loslassen gespeichert. Wird währenddessen
 * weitergemalt, folgt danach das nächste Speichern.
 *
 * Bis das Backend eine Zelle bestätigt hat, liefert `pendingChange` sie, die Matrix schraffiert sie. Bestätigt heißt:
 * Die Antwort enthält für diese Zelle genau den gesetzten Wert. Ist alles bestätigt und zwei Sekunden Ruhe, kommt zur
 * Sicherheit noch ein Toast.
 */
export function useMatrixCellEdits<V>(options: MatrixCellEditsOptions<V>) {
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })
  // Die Map ist der Stand für die Logik, der State nur fürs Zeichnen
  const pendingRef = useRef(new Map<string, MatrixCellChange<V>>())
  const [pending, setPending] = useState<Map<string, MatrixCellChange<V>>>(() => new Map())
  const frameRef = useRef<number>(0)
  const isSavingRef = useRef<boolean>(false)
  const saveAgainRef = useRef<boolean>(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null)
  // Für den Toast: was seit dem letzten bestätigt wurde und ob dabei etwas schiefging
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const confirmedCellKeysRef = useRef(new Set<string>())
  const confirmedRowKeysRef = useRef(new Set<string>())
  const failedSinceToastRef = useRef<boolean>(false)

  /** Den State sofort auf den Stand der Map bringen. */
  function flushPending() {
    if (frameRef.current !== 0) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
    }
    const pendingCopy = new Map(pendingRef.current)
    setPending(pendingCopy)
  }

  /** Den State beim nächsten Bildschirmframe nachziehen, beim Malen nicht öfter. */
  function schedulePendingFlush() {
    if (frameRef.current !== 0) {
      return
    }
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0
      const pendingCopy = new Map(pendingRef.current)
      setPending(pendingCopy)
    })
  }

  /** Der Wert einer Zelle für die Logik, nur in Handlern: noch nicht bestätigt, sonst laut Backend. */
  function currentValue(rowKey: string, columnKey: string): V {
    const cellKey = getCellKey(rowKey, columnKey)
    const pendingChange = pendingRef.current.get(cellKey)
    if (pendingChange !== undefined) {
      return pendingChange.value
    }
    return optionsRef.current.serverValue(rowKey, columnKey)
  }

  /** Beim Malen: nur merken und zeichnen, gespeichert wird beim Loslassen (`endPaint`). */
  function paintCell(rowKey: string, columnKey: string, value: V) {
    clearTimeout(toastTimerRef.current)
    const cellKey = getCellKey(rowKey, columnKey)
    pendingRef.current.set(cellKey, { rowKey, columnKey, value })
    schedulePendingFlush()
  }

  /** Ein Klick: sofort zeichnen und speichern. */
  function changeCell(rowKey: string, columnKey: string, value: V) {
    clearTimeout(toastTimerRef.current)
    const cellKey = getCellKey(rowKey, columnKey)
    pendingRef.current.set(cellKey, { rowKey, columnKey, value })
    flushPending()
    saveCells()
  }

  /** Mehrere Zellen auf einmal, z. B. alle Endungen einer Gruppe: sofort zeichnen und gemeinsam speichern. */
  function changeCells(changes: MatrixCellChange<V>[]) {
    clearTimeout(toastTimerRef.current)
    for (const change of changes) {
      const cellKey = getCellKey(change.rowKey, change.columnKey)
      pendingRef.current.set(cellKey, change)
    }
    flushPending()
    saveCells()
  }

  /** Nach dem Loslassen eines Malstrichs. */
  function endPaint() {
    flushPending()
    saveCells()
  }

  /** Abgeschickte Zellen fallen weg, außer sie wurden seit dem Abschicken noch einmal anders gesetzt. */
  function removeSent(sentChanges: Map<string, MatrixCellChange<V>>) {
    for (const [cellKey, sentChange] of sentChanges) {
      const currentPendingChange = pendingRef.current.get(cellKey)
      const unchangedSinceSending = currentPendingChange !== undefined && currentPendingChange.value === sentChange.value
      if (unchangedSinceSending) {
        pendingRef.current.delete(cellKey)
      }
    }
    flushPending()
  }

  /**
   * Ist nichts mehr offen, kein Speichern unterwegs und keine Zelle unbestätigt, kommt nach zwei Sekunden Ruhe der
   * Toast. Jede neue Zelle hält ihn auf. Ging seit dem letzten Toast etwas schief, steht das schon an der Matrix, dann
   * kein Toast „alles gespeichert“.
   */
  function scheduleSavedToast() {
    clearTimeout(toastTimerRef.current)
    if (isSavingRef.current || pendingRef.current.size > 0) {
      return
    }
    if (failedSinceToastRef.current) {
      failedSinceToastRef.current = false
      confirmedCellKeysRef.current.clear()
      confirmedRowKeysRef.current.clear()
      return
    }
    if (confirmedCellKeysRef.current.size === 0) {
      return
    }
    toastTimerRef.current = setTimeout(() => {
      const confirmedCellCount = confirmedCellKeysRef.current.size
      const confirmedRowCount = confirmedRowKeysRef.current.size
      const savedToast = optionsRef.current.savedToast(confirmedCellCount, confirmedRowCount)
      confirmedCellKeysRef.current.clear()
      confirmedRowKeysRef.current.clear()
      showToast(savedToast)
    }, SAVED_TOAST_DELAY_MILLISECONDS)
  }

  /** Speichert alle Zellen, die vom Backend abweichen. Läuft schon ein Speichern, folgt dieses danach. */
  function saveCells() {
    if (isSavingRef.current) {
      saveAgainRef.current = true
      return
    }
    const serverValue = optionsRef.current.serverValue
    const save = optionsRef.current.save
    const sentChanges = new Map(pendingRef.current)
    const changes: MatrixCellChange<V>[] = []
    for (const sentChange of sentChanges.values()) {
      const valueInBackend = serverValue(sentChange.rowKey, sentChange.columnKey)
      const differsFromBackend = !Object.is(sentChange.value, valueInBackend)
      if (differsFromBackend) {
        changes.push(sentChange)
      }
    }

    // Alles Gesetzte entspricht schon dem Backend, z. B. über Gesetztes gemalt
    if (changes.length === 0) {
      removeSent(sentChanges)
      scheduleSavedToast()
      return
    }

    isSavingRef.current = true
    setSaveErrorMessage(null)
    save(changes)
      .then((valueAfterSaving) => {
        // Jede Zelle gegen die Antwort: Steht dort genau der gesetzte Wert, ist sie bestätigt
        let notTakenCount = 0
        for (const change of changes) {
          const savedValue = valueAfterSaving(change.rowKey, change.columnKey)
          if (Object.is(savedValue, change.value)) {
            const cellKey = getCellKey(change.rowKey, change.columnKey)
            confirmedCellKeysRef.current.add(cellKey)
            confirmedRowKeysRef.current.add(change.rowKey)
          } else {
            notTakenCount = notTakenCount + 1
          }
        }
        if (notTakenCount > 0) {
          failedSinceToastRef.current = true
          let notTakenText = notTakenCount + ' Zellen haben'
          if (notTakenCount === 1) {
            notTakenText = '1 Zelle hat'
          }
          setSaveErrorMessage(notTakenText + ' das Backend nicht übernommen, die Matrix zeigt den gespeicherten Stand.')
        }
        removeSent(sentChanges)
      })
      .catch((caughtError: unknown) => {
        failedSinceToastRef.current = true
        let errorMessage = 'Unbekannter Fehler'
        if (caughtError instanceof Error) {
          errorMessage = caughtError.message
        }
        setSaveErrorMessage(errorMessage)
        // nicht gespeichert: zurück auf den Stand des Backends
        removeSent(sentChanges)
      })
      .finally(() => {
        isSavingRef.current = false
        if (saveAgainRef.current) {
          saveAgainRef.current = false
          saveCells()
        } else {
          scheduleSavedToast()
        }
      })
  }

  /** Fürs Zeichnen: die noch nicht bestätigte Änderung einer Zelle, `undefined` wenn es keine gibt. */
  function pendingChange(rowKey: string, columnKey: string): MatrixCellChange<V> | undefined {
    const cellKey = getCellKey(rowKey, columnKey)
    return pending.get(cellKey)
  }

  return {
    pendingChange,
    currentValue,
    paintCell,
    changeCell,
    changeCells,
    endPaint,
    saveErrorMessage,
  }
}
