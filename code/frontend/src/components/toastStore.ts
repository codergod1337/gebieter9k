/**
 * Vermittler zwischen „hier soll ein Toast erscheinen“ und der Komponente, die ihn zeigt (`Toasts` im Grundgerüst),
 * wie in der Vorlage. Die Komponente meldet sich beim Start an, danach ruft jede Stelle einfach `showToast(...)` auf,
 * auch Code außerhalb von React. Nicht für jeden Request, nur für Rückmeldungen, die man sonst verpassen würde.
 */

/** success: geschafft, error: schiefgegangen, info: nur zur Kenntnis */
export type ToastKind = 'success' | 'error' | 'info'

export type ToastMessage = {
  kind: ToastKind
  /** kurz, fett, z. B. „Verliehene AR gespeichert“ */
  title: string
  /** optional darunter, ein Satz */
  text?: string
}

/** Wer die Toasts zeigt, meldet hierüber seine Funktion an. */
export type ToastHandler = (id: number, toast: ToastMessage) => void

let toastHandler: ToastHandler | null = null
let nextToastId = 1

/** Nur für `Toasts`: meldet sich beim Start an und beim Abbauen mit `null` wieder ab. */
export function registerToastHandler(handler: ToastHandler | null): void {
  toastHandler = handler
}

/** Zeigt einen Toast unten rechts. Ohne angemeldete Komponente passiert nichts. */
export function showToast(toast: ToastMessage): void {
  const toastId = nextToastId
  nextToastId = nextToastId + 1
  if (toastHandler !== null) {
    toastHandler(toastId, toast)
  }
}
