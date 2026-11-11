import { type FocusEvent, type ReactElement, type ReactNode, useEffect, useRef, useState } from 'react'
import Overlay from 'react-bootstrap/Overlay'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

/** Wohin die Sprechblase zuerst aufgeht; passt sie dort nicht hin, weicht sie aus. */
export type HoverlayPlacement = 'top' | 'right' | 'bottom' | 'left'

type HoverlayProps = {
  /** Der Hinweis. `null`: kein Hinweis, das Kind steht allein. */
  text: ReactNode | null
  /** Ein einzelnes Element, das einen ref annimmt, z. B. ein `span` oder ein Knopf. */
  children: ReactElement
  /** Standard oben; hohe Inhalte (z. B. eine Legende) besser rechts oder unten, im festen Kopf der Seite immer unten. */
  placement?: HoverlayPlacement
  /**
   * `true`: Die Sprechblase bleibt offen, solange der Zeiger auf ihr oder ihrem Element steht oder in ihr getippt wird;
   * man kann in ihr klicken und tippen, z. B. eine Liste mit Suchfeld und Links. Standard: ein reiner Hinweis, der
   * verschwindet, sobald der Zeiger das Element verlässt.
   */
  interactive?: boolean
}

/** Die Reihenfolge, in der eine Sprechblase ausweicht, je nach erster Richtung. */
const FALLBACK_PLACEMENTS: Record<HoverlayPlacement, HoverlayPlacement[]> = {
  top: ['bottom', 'right', 'left'],
  right: ['bottom', 'left', 'top'],
  bottom: ['top', 'right', 'left'],
  left: ['bottom', 'right', 'top'],
}

/**
 * So lange bleibt eine Sprechblase zum Hineinklicken noch offen, nachdem der Zeiger sie oder ihr Element verlassen hat:
 * genug, um über die Lücke zwischen Element und Sprechblase zu kommen.
 */
const INTERACTIVE_CLOSE_DELAY_MILLISECONDS = 250

/**
 * Wie hoch der feste Kopf der Seite ist (Header und Subheader, Variablen aus base.css), in Pixeln: So weit oben gilt der
 * Platz als belegt, eine Sprechblase klappt vorher um, statt darunter zu verschwinden.
 */
function getStickyTopPixels(): number {
  const rootStyle = getComputedStyle(document.documentElement)
  const rootFontSizePixels = Number.parseFloat(rootStyle.fontSize) || 16
  const headerHeightRem = Number.parseFloat(rootStyle.getPropertyValue('--header-height')) || 0
  const subheaderHeightRem = Number.parseFloat(rootStyle.getPropertyValue('--subheader-height')) || 0
  return (headerHeightRem + subheaderHeightRem) * rootFontSizePixels
}

/** Wie die Sprechblase ausweicht: nie unter den festen Kopf, nie über den Rand. Für beide Arten gleich. */
function createPopperConfig(placement: HoverlayPlacement) {
  const stickyTopPixels = getStickyTopPixels()
  // Der feste Kopf zählt als Rand: Oben ist erst darunter Platz
  const overflowPadding = { top: stickyTopPixels + 8, right: 8, bottom: 8, left: 8 }
  return {
    modifiers: [
      { name: 'flip', options: { padding: overflowPadding, fallbackPlacements: FALLBACK_PLACEMENTS[placement] } },
      { name: 'preventOverflow', options: { padding: overflowPadding } },
    ],
  }
}

/**
 * Ein Hinweis, der beim Zeigen aufpoppt (Hoverlay der Vorlage), gebaut auf dem Tooltip von Bootstrap. Überall derselbe:
 * Das Aussehen bestimmt allein das Theme über die Klasse `hoverlay` (Abschnitt „Hoverlay“), der Inhalt darf mehr als
 * Text sein, z. B. Badges. Ein Hoverlay im Hoverlay geht nicht: Badges darin ohne eigenes Hoverlay zeigen. Passt die
 * Sprechblase nicht in die gewünschte Richtung (auch nicht unter den festen Kopf der Seite), weicht sie aus; dafür muss
 * `flip` am OverlayTrigger an sein, react-bootstrap schaltet es sonst nur bei `auto` ein.
 *
 * Mit `interactive` ist es eine Sprechblase zum Hineinklicken (Nutzer 2026-11-11), z. B. eine Liste von Usern mit
 * Suchfeld und Links aufs Profil (`UsersGuidList`): siehe {@link InteractiveHoverlay}.
 */
export function Hoverlay({ text, children, placement = 'top', interactive = false }: HoverlayProps) {
  if (text === null) {
    return children
  }
  if (interactive) {
    return (
      <InteractiveHoverlay text={text} placement={placement}>
        {children}
      </InteractiveHoverlay>
    )
  }
  const tooltip = <Tooltip className="hoverlay">{text}</Tooltip>
  const popperConfig = createPopperConfig(placement)
  return (
    <OverlayTrigger placement={placement} flip overlay={tooltip} popperConfig={popperConfig}>
      {children}
    </OverlayTrigger>
  )
}

type InteractiveHoverlayProps = {
  text: ReactNode
  children: ReactElement
  placement: HoverlayPlacement
}

/**
 * Die Sprechblase zum Hineinklicken: dasselbe Aussehen (`hoverlay`), aber sie bleibt offen, solange der Zeiger auf dem
 * Element oder auf ihr selbst steht oder der Fokus in ihr liegt (Tippen im Suchfeld). Verlässt der Zeiger beides, geht
 * sie nach einem Augenblick zu. Das Element steht in einer eigenen Hülle (`hoverlay-anchor`): So meldet auch ein
 * gesperrter Knopf das Zeigen. Mit der Tastatur geht sie auf, wenn das Element den sichtbaren Fokus bekommt, nicht
 * nach einem Mausklick: Sonst bliebe sie nach jedem Klick stehen.
 *
 * Ob der Fokus in ihr liegt, liest sie jedes Mal am Dokument ab (`document.activeElement`), nicht aus gemerkten
 * Ereignissen: Verschwindet ein Knopf in ihr nach dem Klick (z. B. „Alle laden“), meldet der Browser kein Verlassen,
 * und sie bliebe sonst für immer offen.
 */
function InteractiveHoverlay({ text, children, placement }: InteractiveHoverlayProps) {
  const anchorRef = useRef<HTMLSpanElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [shown, setShown] = useState<boolean>(false)
  const pointerInsideRef = useRef<boolean>(false)
  const anchorKeyboardFocusRef = useRef<boolean>(false)
  const closeTimerRef = useRef<number | null>(null)

  function cancelClose() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  /** Offen, solange Zeiger oder Fokus drin sind; sonst nach kurzer Frist zu. */
  function applyInside() {
    cancelClose()
    const content = contentRef.current
    const focusInsideContent = content !== null && content.contains(document.activeElement)
    const inside = pointerInsideRef.current || anchorKeyboardFocusRef.current || focusInsideContent
    if (inside) {
      setShown(true)
      return
    }
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      setShown(false)
    }, INTERACTIVE_CLOSE_DELAY_MILLISECONDS)
  }

  // Verschwindet die Komponente, läuft keine Frist weiter
  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  function handlePointerEnter() {
    pointerInsideRef.current = true
    applyInside()
  }

  function handlePointerLeave() {
    pointerInsideRef.current = false
    applyInside()
  }

  function handleAnchorFocus(event: FocusEvent<HTMLSpanElement>) {
    // nur der sichtbare Fokus der Tastatur, nicht der nach einem Mausklick
    const keyboardFocus = event.target.matches(':focus-visible')
    if (keyboardFocus) {
      anchorKeyboardFocusRef.current = true
      applyInside()
    }
  }

  function handleAnchorBlur() {
    anchorKeyboardFocusRef.current = false
    applyInside()
  }

  /** Der Fokus kommt in die Sprechblase oder verlässt sie: neu nachsehen, sobald der Browser ihn umgesetzt hat. */
  function handleContentFocusChange() {
    window.setTimeout(applyInside, 0)
  }

  const popperConfig = createPopperConfig(placement)
  return (
    <>
      <span
        ref={anchorRef}
        className="hoverlay-anchor"
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        onFocus={handleAnchorFocus}
        onBlur={handleAnchorBlur}>
        {children}
      </span>
      <Overlay target={anchorRef} show={shown} placement={placement} flip popperConfig={popperConfig}>
        {(overlayProps) => (
          <Tooltip
            {...overlayProps}
            className="hoverlay hoverlay-interactive"
            onMouseEnter={handlePointerEnter}
            onMouseLeave={handlePointerLeave}>
            <div ref={contentRef} onFocus={handleContentFocusChange} onBlur={handleContentFocusChange}>
              {text}
            </div>
          </Tooltip>
        )}
      </Overlay>
    </>
  )
}
