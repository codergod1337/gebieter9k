import { readTrackingKey, TRACKED_TERM_SELECTOR } from '../math/trackedTerm.ts'

/**
 * Nur markierte Terme in einem solchen Bereich wandern: die beiden Seiten der Gleichung. Die Notiz der Umformung am
 * Zeilenende (z. B. „| · r“) zeigt denselben Term, gehört aber nicht dazu.
 */
const FLIGHT_SCOPE_SELECTOR = '[data-flight-scope]'

/** Die Notiz der Umformung an der alten Zeile: Sie erscheint zuerst, dann wandern die Terme. */
const FLIGHT_CAUSE_SELECTOR = '[data-flight-cause]'

/**
 * Der Ablauf eines Flugs als Anteile seiner Dauer (die Dauer selbst nennt das Theme): erst erscheint die Notiz der
 * Umformung, dann die neue Zeile ohne die wandernden Terme; währenddessen gleiten die Terme los, kommen an und gehen
 * in die Terme der neuen Zeile über.
 */
const CAUSE_APPEARED_SHARE = 0.18
const ROW_APPEARED_SHARE = 0.5
const TERM_LANDED_SHARE = 0.86

/**
 * Zeigt, wohin die Terme einer Formel bei einer Umformung wandern: Jeder markierte Term der alten Zeile, den es in der
 * neuen Zeile mit derselben Kennung wieder gibt, gleitet als Kopie von seiner alten an seine neue Stelle und geht dort
 * in den neuen Term über. Sieht der Term am Ziel anders aus (aus dem Quadrat wird die Wurzel), blendet die Kopie beim
 * Ankommen in das neue Aussehen über.
 *
 * Reines DOM, kein React: Der Animator misst die fertig gezeichneten Zeilen aus und legt die Kopien in die Ebene, die
 * er bekommt (ein Element mit `position: relative`, in dem beide Zeilen stehen). Für einen Flug ein Animator.
 */
export class TermFlightAnimator {
  private readonly flightLayer: HTMLElement

  private readonly runningAnimations: Animation[] = []

  private readonly ghostElements: HTMLElement[] = []

  constructor(flightLayer: HTMLElement) {
    this.flightLayer = flightLayer
  }

  /** Startet den Flug von der alten Zeile zur neuen. Die neue Zeile muss schon im Dokument stehen. */
  startFlight(sourceRow: HTMLElement, targetRow: HTMLElement, durationMilliseconds: number) {
    const sourceElementsByTrackingKey = this.collectTrackedElements(sourceRow)
    const targetElementsByTrackingKey = this.collectTrackedElements(targetRow)

    const causeElement = sourceRow.querySelector<HTMLElement>(FLIGHT_CAUSE_SELECTOR)
    if (causeElement !== null) {
      this.fadeIn(causeElement, 0, CAUSE_APPEARED_SHARE, durationMilliseconds)
    }
    this.fadeIn(targetRow, CAUSE_APPEARED_SHARE, ROW_APPEARED_SHARE, durationMilliseconds)

    for (const [trackingKey, targetElement] of targetElementsByTrackingKey) {
      const sourceElement = sourceElementsByTrackingKey.get(trackingKey)
      if (sourceElement === undefined) {
        continue
      }
      this.flyTerm(sourceElement, targetElement, durationMilliseconds)
    }
  }

  /** Bricht den Flug ab und räumt auf: Die Zeilen stehen danach so da, als wäre er fertig. */
  cancelFlight() {
    for (const runningAnimation of this.runningAnimations) {
      runningAnimation.cancel()
    }
    this.runningAnimations.length = 0
    for (const ghostElement of this.ghostElements) {
      ghostElement.remove()
    }
    this.ghostElements.length = 0
  }

  /** Die Elemente der markierten Terme einer Zeile, je Kennung das erste. */
  private collectTrackedElements(row: HTMLElement): Map<string, HTMLElement> {
    const trackedElementsByTrackingKey = new Map<string, HTMLElement>()
    const flightScopes = row.querySelectorAll<HTMLElement>(FLIGHT_SCOPE_SELECTOR)
    for (const flightScope of flightScopes) {
      const trackedElements = flightScope.querySelectorAll<HTMLElement>(TRACKED_TERM_SELECTOR)
      for (const trackedElement of trackedElements) {
        const trackingKey = readTrackingKey(trackedElement)
        if (trackingKey === null || trackedElementsByTrackingKey.has(trackingKey)) {
          continue
        }
        trackedElementsByTrackingKey.set(trackingKey, trackedElement)
      }
    }
    return trackedElementsByTrackingKey
  }

  /** Blendet ein Element ein: unsichtbar bis `fromShare` der Dauer, ganz da ab `untilShare`. */
  private fadeIn(element: HTMLElement, fromShare: number, untilShare: number, durationMilliseconds: number) {
    const fadeKeyframes: Keyframe[] = [
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: fromShare },
      { opacity: 1, offset: untilShare },
      { opacity: 1, offset: 1 },
    ]
    const fadeAnimation = element.animate(fadeKeyframes, { duration: durationMilliseconds })
    this.runningAnimations.push(fadeAnimation)
  }

  /** Lässt eine Kopie des alten Terms an die Stelle des neuen gleiten; der neue erscheint erst, wenn sie ankommt. */
  private flyTerm(sourceElement: HTMLElement, targetElement: HTMLElement, durationMilliseconds: number) {
    const layerRect = this.flightLayer.getBoundingClientRect()
    const sourceRect = sourceElement.getBoundingClientRect()
    const targetRect = targetElement.getBoundingClientRect()
    const sourceStyle = window.getComputedStyle(sourceElement)

    // Die Kopie liegt genau über dem alten Term, in dessen Schriftgröße (im Exponenten ist sie kleiner)
    const ghostLeft = sourceRect.left - layerRect.left - this.flightLayer.clientLeft + this.flightLayer.scrollLeft
    const ghostTop = sourceRect.top - layerRect.top - this.flightLayer.clientTop + this.flightLayer.scrollTop
    const ghostElement = sourceElement.cloneNode(true) as HTMLElement
    ghostElement.removeAttribute('data-tracking-key')
    ghostElement.classList.add('math', 'math-flight-ghost')
    ghostElement.style.fontSize = sourceStyle.fontSize
    // Zeilenhöhe = Höhe des alten Terms: so sitzt die Schrift in der Kopie auf derselben Grundlinie wie im Original
    ghostElement.style.lineHeight = sourceRect.height + 'px'
    ghostElement.style.left = ghostLeft + 'px'
    ghostElement.style.top = ghostTop + 'px'
    ghostElement.style.width = sourceRect.width + 'px'
    ghostElement.style.height = sourceRect.height + 'px'
    this.flightLayer.append(ghostElement)
    this.ghostElements.push(ghostElement)

    // Von Mitte zu Mitte: so stimmt das Ziel auch, wenn der Term dort anders aussieht oder größer ist
    const sourceCenterX = sourceRect.left + sourceRect.width / 2
    const sourceCenterY = sourceRect.top + sourceRect.height / 2
    const targetCenterX = targetRect.left + targetRect.width / 2
    const targetCenterY = targetRect.top + targetRect.height / 2
    const horizontalShift = targetCenterX - sourceCenterX
    const verticalShift = targetCenterY - sourceCenterY
    const startTransform = 'translate(0px, 0px)'
    const landedTransform = 'translate(' + horizontalShift + 'px, ' + verticalShift + 'px)'

    const ghostKeyframes: Keyframe[] = [
      { transform: startTransform, opacity: 1, offset: 0 },
      { transform: startTransform, opacity: 1, offset: CAUSE_APPEARED_SHARE, easing: 'ease-in-out' },
      { transform: landedTransform, opacity: 1, offset: TERM_LANDED_SHARE },
      { transform: landedTransform, opacity: 0, offset: 1 },
    ]
    const ghostAnimation = ghostElement.animate(ghostKeyframes, { duration: durationMilliseconds, fill: 'forwards' })
    ghostAnimation.addEventListener('finish', () => {
      ghostElement.remove()
    })
    this.runningAnimations.push(ghostAnimation)

    const targetKeyframes: Keyframe[] = [
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: TERM_LANDED_SHARE },
      { opacity: 1, offset: 1 },
    ]
    const targetAnimation = targetElement.animate(targetKeyframes, { duration: durationMilliseconds })
    this.runningAnimations.push(targetAnimation)
  }
}
