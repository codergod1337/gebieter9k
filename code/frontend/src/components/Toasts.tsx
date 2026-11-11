import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { registerToastHandler, type ToastKind, type ToastMessage } from './toastStore.ts'

/** So lange steht ein Toast, solange die Maus nicht darauf ruht. */
const TOAST_DURATION_MILLISECONDS = 5000

/** So lange hat das Theme zum Ausblenden, dann ist der Toast weg. */
const TOAST_LEAVE_MILLISECONDS = 300

/** Je Art das Symbol. */
const TOAST_ICON_CLASS_NAME_BY_KIND: Record<ToastKind, string> = {
  success: 'bi bi-check-lg',
  error: 'bi bi-exclamation-lg',
  info: 'bi bi-info-lg',
}

/** Ein Toast, der gerade steht. */
type ShownToast = {
  id: number
  toast: ToastMessage
  /** wird gerade ausgeblendet */
  leaving: boolean
}

/**
 * Die Toasts unten rechts (`showToast` aus `toastStore.ts`), einmal im Grundgerüst. Selbst gebaut wie in der Vorlage,
 * kein Paket. Die Klassen heißen `signal-toast*`, weil `.toast` Bootstrap gehört. Das Aussehen gestaltet das Theme
 * komplett, base.css stellt nur die Leiste an den Rand.
 */
export function Toasts() {
  const [shownToasts, setShownToasts] = useState<ShownToast[]>([])

  const dismissToast = useCallback((dismissedToastId: number) => {
    setShownToasts((currentToasts) =>
      currentToasts.map((shownToast) => {
        if (shownToast.id !== dismissedToastId) {
          return shownToast
        }
        return { ...shownToast, leaving: true }
      }),
    )
    setTimeout(() => {
      setShownToasts((currentToasts) => currentToasts.filter((shownToast) => shownToast.id !== dismissedToastId))
    }, TOAST_LEAVE_MILLISECONDS)
  }, [])

  useEffect(() => {
    registerToastHandler((id, toast) => {
      setShownToasts((currentToasts) => [...currentToasts, { id, toast, leaving: false }])
    })
    return () => registerToastHandler(null)
  }, [])

  return (
    <div className="signal-toast-stack" role="status" aria-live="polite">
      {shownToasts.map((shownToast) => (
        <SignalToast key={shownToast.id} shownToast={shownToast} onDismiss={dismissToast} />
      ))}
    </div>
  )
}

type SignalToastProps = {
  shownToast: ShownToast
  onDismiss: (toastId: number) => void
}

/**
 * Ein Toast. Ruht die Maus darauf oder steht der Fokus darin, hält die Zeit an, der Balken unten auch; danach läuft
 * die Restzeit weiter.
 */
function SignalToast({ shownToast, onDismiss }: SignalToastProps) {
  const [paused, setPaused] = useState<boolean>(false)
  const remainingMillisecondsRef = useRef<number>(TOAST_DURATION_MILLISECONDS)
  const toastId = shownToast.id
  const leaving = shownToast.leaving

  useEffect(() => {
    if (paused || leaving) {
      return
    }
    const startedAtMilliseconds = Date.now()
    const dismissTimer = setTimeout(() => onDismiss(toastId), remainingMillisecondsRef.current)
    return () => {
      clearTimeout(dismissTimer)
      const elapsedMilliseconds = Date.now() - startedAtMilliseconds
      remainingMillisecondsRef.current = remainingMillisecondsRef.current - elapsedMilliseconds
    }
  }, [paused, leaving, toastId, onDismiss])

  const kind = shownToast.toast.kind
  const classNames = ['signal-toast', 'signal-toast-' + kind]
  if (paused) {
    classNames.push('signal-toast-paused')
  }
  if (leaving) {
    classNames.push('signal-toast-leaving')
  }
  const toastClassName = classNames.join(' ')
  const toastStyle = { '--signal-toast-duration': TOAST_DURATION_MILLISECONDS + 'ms' } as CSSProperties
  const iconClassName = TOAST_ICON_CLASS_NAME_BY_KIND[kind]
  const text = shownToast.toast.text

  return (
    <div
      className={toastClassName}
      style={toastStyle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}>
      <span className="signal-toast-icon" aria-hidden="true">
        <i className={iconClassName}></i>
      </span>
      <div className="signal-toast-content">
        <div className="signal-toast-title">{shownToast.toast.title}</div>
        {text !== undefined && <div className="signal-toast-text">{text}</div>}
      </div>
      <button type="button" className="signal-toast-close" aria-label="Schließen" onClick={() => onDismiss(toastId)}>
        <i className="bi bi-x-lg" aria-hidden="true"></i>
      </button>
      <span className="signal-toast-timer" aria-hidden="true" />
    </div>
  )
}
