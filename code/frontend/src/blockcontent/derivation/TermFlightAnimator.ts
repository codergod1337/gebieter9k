import { readTrackingKey, TRACKED_TERM_SELECTOR } from '../math/trackedTerm.ts'

/**
 * Nur markierte Terme in einem solchen Bereich wandern: die beiden Seiten der Gleichung. Der Wert des Attributs nennt
 * die Seite (`left`, `right`); wechselt ein Term die Seite, wandert er auf einem Bogen.
 */
const FLIGHT_SCOPE_SELECTOR = '[data-flight-scope]'

/** Die Notiz der Umformung an der alten Zeile: Sie leuchtet zuerst auf. */
const FLIGHT_CAUSE_SELECTOR = '[data-flight-cause]'

/** Das Stück der Notiz, aus dem die Terme kommen, die die Umformung bringt, z. B. das `r` in „· r“. */
const FLIGHT_CAUSE_SOURCE_SELECTOR = '[data-flight-cause-source]'

/** Ein Term der alten Zeile, den die Umformung kürzt: Er steht durchgestrichen da und wandert nicht mit. */
const CANCELLED_TERM_SELECTOR = '[data-cancelled]'

/** So steht am Element eines Terms der neuen Zeile, dass ihn die Umformung gebracht hat. */
const FLIGHT_ORIGIN_CAUSE = 'cause'

/** Die „Seite“ eines Terms, der aus der Notiz der Umformung kommt. */
const CAUSE_SIDE = 'cause'

/** So lange vor dem Loswandern (als Anteil der Dauer) blendet sich die Kopie eines Terms über ihrer Quelle ein. */
const CARRIER_FADE_IN_SHARE = 0.05

/** Wird gekürzt, dauert das Abspielen um diesen Faktor länger: Das Durchstreichen bekommt seine eigene Zeit. */
const CANCELLATION_DURATION_FACTOR = 1.4

/**
 * Der Bogen eines Terms, der die Seite wechselt: So viele Pixel hebt er sich mindestens über die gerade Linie, je
 * Pixel Weg zur Seite kommt etwas dazu, höchstens bis zur Obergrenze.
 */
const ARC_MIN_LIFT_PIXELS = 22
const ARC_LIFT_PER_PIXEL = 0.18
const ARC_MAX_LIFT_PIXELS = 80

/**
 * Der Ablauf eines Abspielens als Anteile seiner Dauer: Erst leuchtet die Notiz der Umformung auf, dann wird
 * durchgestrichen, was sie kürzt, dann erscheint die neue Zeile, und die Terme wandern los, kommen an und gehen in die
 * Terme der neuen Zeile über.
 */
type FlightTimeline = {
  totalMilliseconds: number
  causeAppeared: number
  strikeDrawn: number
  rowAppeared: number
  termLanded: number
}

/**
 * Zeigt, was bei einer Umformung mit den Termen geschieht (Nutzer 2026-11-27: Die Bewegung soll die Rechenregel
 * einprägen, nicht bloß etwas bewegen):
 * - Was die Umformung auf beiden Seiten dazubringt, kommt sichtbar aus ihrer Notiz, z. B. das `r` aus „· r“.
 * - Was sie kürzt, wird in der alten Zeile durchgestrichen, bevor die neue Zeile entsteht.
 * - Jeder markierte Term, den es in der neuen Zeile wieder gibt, gleitet als Kopie von seiner alten an seine neue
 *   Stelle. Wechselt er dabei die Seite der Gleichung, wandert er auf einem Bogen hinüber.
 * - Sieht der Term am Ziel anders aus, blendet die Kopie beim Ankommen in das neue Aussehen über.
 *
 * Reines DOM, kein React: Der Animator misst die fertig gezeichneten Zeilen aus und legt die Kopien in die Ebene, die
 * er bekommt (ein Element mit `position: relative`, in dem beide Zeilen stehen). Was mit einem Term geschieht, liest er
 * an den Attributen ab, die der Zeichner der Formeln und die Zeile der Herleitung schreiben. Für ein Abspielen ein
 * Animator.
 */
export class TermFlightAnimator {
  private readonly flightLayer: HTMLElement

  private readonly runningAnimations: Animation[] = []

  private readonly carrierElements: HTMLElement[] = []

  constructor(flightLayer: HTMLElement) {
    this.flightLayer = flightLayer
  }

  /** Spielt die Umformung von der alten Zeile zur neuen ab. Beide Zeilen müssen schon im Dokument stehen. */
  startFlight(sourceRow: HTMLElement, targetRow: HTMLElement, durationMilliseconds: number) {
    const sourceElementsByTrackingKey = this.collectTrackedElements(sourceRow)
    const targetElementsByTrackingKey = this.collectTrackedElements(targetRow)
    const cancelledElements = this.collectCancelledElements(sourceRow)
    const cancellationShown = cancelledElements.length > 0
    const timeline = this.createTimeline(durationMilliseconds, cancellationShown)

    const causeElement = sourceRow.querySelector<HTMLElement>(FLIGHT_CAUSE_SELECTOR)
    if (causeElement !== null) {
      this.fadeIn(causeElement, 0, timeline.causeAppeared, timeline)
    }
    for (const cancelledElement of cancelledElements) {
      this.drawStrike(cancelledElement, timeline)
    }
    this.fadeIn(targetRow, timeline.strikeDrawn, timeline.rowAppeared, timeline)

    const causeSourceElement = sourceRow.querySelector<HTMLElement>(FLIGHT_CAUSE_SOURCE_SELECTOR)
    for (const [trackingKey, targetElement] of targetElementsByTrackingKey) {
      // Woher der Term kommt: aus der Notiz der Umformung oder von seiner Stelle in der alten Zeile
      let sourceElement: HTMLElement | null = null
      let sourceSide: string | null = null
      const broughtByCause = targetElement.dataset.flightOrigin === FLIGHT_ORIGIN_CAUSE
      if (broughtByCause) {
        sourceElement = causeSourceElement
        sourceSide = CAUSE_SIDE
      } else {
        const trackedSourceElement = sourceElementsByTrackingKey.get(trackingKey)
        if (trackedSourceElement !== undefined) {
          sourceElement = trackedSourceElement
          sourceSide = this.getFlightSide(trackedSourceElement)
        }
      }
      if (sourceElement === null) {
        continue
      }
      const targetSide = this.getFlightSide(targetElement)
      const changesSide = sourceSide !== targetSide
      this.flyTerm(sourceElement, targetElement, changesSide, timeline)
    }
  }

  /** Bricht das Abspielen ab und räumt auf: Die Zeilen stehen danach so da, als wäre es fertig. */
  cancelFlight() {
    for (const runningAnimation of this.runningAnimations) {
      runningAnimation.cancel()
    }
    this.runningAnimations.length = 0
    for (const carrierElement of this.carrierElements) {
      carrierElement.remove()
    }
    this.carrierElements.length = 0
  }

  private createTimeline(durationMilliseconds: number, cancellationShown: boolean): FlightTimeline {
    if (cancellationShown) {
      const totalMilliseconds = durationMilliseconds * CANCELLATION_DURATION_FACTOR
      return { totalMilliseconds, causeAppeared: 0.13, strikeDrawn: 0.42, rowAppeared: 0.62, termLanded: 0.9 }
    }
    // ohne Kürzen: Das Durchstreichen hat keine eigene Zeit, die Terme wandern los, sobald die Notiz aufgeleuchtet ist
    return { totalMilliseconds: durationMilliseconds, causeAppeared: 0.18, strikeDrawn: 0.18, rowAppeared: 0.5, termLanded: 0.86 }
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

  /** Die Elemente der Terme einer Zeile, die die Umformung kürzt. */
  private collectCancelledElements(row: HTMLElement): HTMLElement[] {
    const cancelledElements: HTMLElement[] = []
    const flightScopes = row.querySelectorAll<HTMLElement>(FLIGHT_SCOPE_SELECTOR)
    for (const flightScope of flightScopes) {
      const cancelledElementsOfScope = flightScope.querySelectorAll<HTMLElement>(CANCELLED_TERM_SELECTOR)
      cancelledElements.push(...cancelledElementsOfScope)
    }
    return cancelledElements
  }

  /** Auf welcher Seite der Gleichung ein Term steht (`left`, `right`); `null`, wenn er in keinem Bereich steht. */
  private getFlightSide(termElement: HTMLElement): string | null {
    const flightScope = termElement.closest<HTMLElement>(FLIGHT_SCOPE_SELECTOR)
    if (flightScope === null) {
      return null
    }
    const flightSide = flightScope.dataset.flightScope
    if (flightSide === undefined) {
      return null
    }
    return flightSide
  }

  /** Blendet ein Element ein: unsichtbar bis `fromShare` der Dauer, ganz da ab `untilShare`. */
  private fadeIn(element: HTMLElement, fromShare: number, untilShare: number, timeline: FlightTimeline) {
    const fadeKeyframes: Keyframe[] = [
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: fromShare },
      { opacity: 1, offset: untilShare },
      { opacity: 1, offset: 1 },
    ]
    const fadeAnimation = element.animate(fadeKeyframes, { duration: timeline.totalMilliseconds })
    this.runningAnimations.push(fadeAnimation)
  }

  /**
   * Zieht den Strich durch einen gekürzten Term: Der Strich (das `::after` des Elements, base.css) ist erst verdeckt
   * und wird von links nach rechts aufgedeckt, sobald die Notiz der Umformung aufgeleuchtet ist.
   */
  private drawStrike(cancelledElement: HTMLElement, timeline: FlightTimeline) {
    const hiddenStrike = 'inset(0 100% 0 0)'
    const drawnStrike = 'inset(0 0 0 0)'
    const strikeKeyframes: Keyframe[] = [
      { clipPath: hiddenStrike, offset: 0 },
      { clipPath: hiddenStrike, offset: timeline.causeAppeared, easing: 'ease-in-out' },
      { clipPath: drawnStrike, offset: timeline.strikeDrawn },
      { clipPath: drawnStrike, offset: 1 },
    ]
    const strikeAnimation = cancelledElement.animate(strikeKeyframes, {
      duration: timeline.totalMilliseconds,
      pseudoElement: '::after',
    })
    this.runningAnimations.push(strikeAnimation)
  }

  /**
   * Lässt eine Kopie des Terms von der Quelle an die Stelle des neuen Terms wandern; der neue erscheint erst, wenn sie
   * ankommt. Die Kopie steckt in einem Träger: Der Träger bewegt sie zur Seite, die Kopie selbst bewegt sich in der
   * Höhe. So entsteht für einen Seitenwechsel ein Bogen (erst hoch, dann hinunter), sonst eine gerade Linie.
   */
  private flyTerm(sourceElement: HTMLElement, targetElement: HTMLElement, onArc: boolean, timeline: FlightTimeline) {
    const layerRect = this.flightLayer.getBoundingClientRect()
    const sourceRect = sourceElement.getBoundingClientRect()
    const targetRect = targetElement.getBoundingClientRect()
    const sourceStyle = window.getComputedStyle(sourceElement)

    // Der Träger liegt genau über der Quelle
    const carrierLeft = sourceRect.left - layerRect.left - this.flightLayer.clientLeft + this.flightLayer.scrollLeft
    const carrierTop = sourceRect.top - layerRect.top - this.flightLayer.clientTop + this.flightLayer.scrollTop
    const carrierElement = document.createElement('span')
    carrierElement.className = 'math-flight-carrier'
    carrierElement.style.left = carrierLeft + 'px'
    carrierElement.style.top = carrierTop + 'px'
    carrierElement.style.width = sourceRect.width + 'px'
    carrierElement.style.height = sourceRect.height + 'px'

    // Die Kopie in der Schriftgröße der Quelle (im Exponenten ist sie kleiner); Zeilenhöhe = Höhe der Quelle: so sitzt
    // die Schrift in der Kopie auf derselben Grundlinie wie im Original
    const ghostElement = sourceElement.cloneNode(true) as HTMLElement
    ghostElement.removeAttribute('data-tracking-key')
    ghostElement.classList.add('math', 'math-flight-ghost')
    ghostElement.style.fontSize = sourceStyle.fontSize
    ghostElement.style.lineHeight = sourceRect.height + 'px'
    carrierElement.append(ghostElement)
    this.flightLayer.append(carrierElement)
    this.carrierElements.push(carrierElement)

    // Von Mitte zu Mitte: so stimmt das Ziel auch, wenn der Term dort anders aussieht oder größer ist
    const sourceCenterX = sourceRect.left + sourceRect.width / 2
    const sourceCenterY = sourceRect.top + sourceRect.height / 2
    const targetCenterX = targetRect.left + targetRect.width / 2
    const targetCenterY = targetRect.top + targetRect.height / 2
    const horizontalShift = targetCenterX - sourceCenterX
    const verticalShift = targetCenterY - sourceCenterY

    // zur Seite: der Träger. Sichtbar wird er erst kurz bevor er loswandert: Vorher läge er nur als Plättchen über
    // seiner Quelle und lenkte vom Durchstreichen ab
    const stillAside = 'translateX(0px)'
    const landedAside = 'translateX(' + horizontalShift + 'px)'
    const carrierShownOffset = Math.max(0, timeline.strikeDrawn - CARRIER_FADE_IN_SHARE)
    const carrierKeyframes: Keyframe[] = [
      { transform: stillAside, opacity: 0, offset: 0 },
      { transform: stillAside, opacity: 0, offset: carrierShownOffset },
      { transform: stillAside, opacity: 1, offset: timeline.strikeDrawn, easing: 'ease-in-out' },
      { transform: landedAside, opacity: 1, offset: timeline.termLanded },
      { transform: landedAside, opacity: 0, offset: 1 },
    ]
    const carrierAnimation = carrierElement.animate(carrierKeyframes, { duration: timeline.totalMilliseconds, fill: 'forwards' })
    carrierAnimation.addEventListener('finish', () => {
      carrierElement.remove()
    })
    this.runningAnimations.push(carrierAnimation)

    // in der Höhe: die Kopie; auf einem Bogen erst über die gerade Linie hinaus, dann hinunter ans Ziel
    const stillInHeight = 'translateY(0px)'
    const landedInHeight = 'translateY(' + verticalShift + 'px)'
    let ghostKeyframes: Keyframe[] = [
      { transform: stillInHeight, offset: 0 },
      { transform: stillInHeight, offset: timeline.strikeDrawn, easing: 'ease-in-out' },
      { transform: landedInHeight, offset: timeline.termLanded },
      { transform: landedInHeight, offset: 1 },
    ]
    if (onArc) {
      const sidewaysDistance = Math.abs(horizontalShift)
      const arcLift = Math.min(ARC_MAX_LIFT_PIXELS, ARC_MIN_LIFT_PIXELS + sidewaysDistance * ARC_LIFT_PER_PIXEL)
      const peakShift = verticalShift / 2 - arcLift
      const peakInHeight = 'translateY(' + peakShift + 'px)'
      const peakOffset = (timeline.strikeDrawn + timeline.termLanded) / 2
      ghostKeyframes = [
        { transform: stillInHeight, offset: 0 },
        { transform: stillInHeight, offset: timeline.strikeDrawn, easing: 'ease-out' },
        { transform: peakInHeight, offset: peakOffset, easing: 'ease-in' },
        { transform: landedInHeight, offset: timeline.termLanded },
        { transform: landedInHeight, offset: 1 },
      ]
    }
    const ghostAnimation = ghostElement.animate(ghostKeyframes, { duration: timeline.totalMilliseconds, fill: 'forwards' })
    this.runningAnimations.push(ghostAnimation)

    const targetKeyframes: Keyframe[] = [
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: timeline.termLanded },
      { opacity: 1, offset: 1 },
    ]
    const targetAnimation = targetElement.animate(targetKeyframes, { duration: timeline.totalMilliseconds })
    this.runningAnimations.push(targetAnimation)
  }
}
