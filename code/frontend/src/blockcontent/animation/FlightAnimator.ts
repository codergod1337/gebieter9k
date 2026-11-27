/** So lange vor dem Loswandern (als Anteil der Dauer) blendet sich die Kopie eines Teils über ihrer Quelle ein. */
const CARRIER_FADE_IN_SHARE = 0.05

/** Wird gekürzt, dauert das Abspielen um diesen Faktor länger: Das Durchstreichen bekommt seine eigene Zeit. */
const CANCELLATION_DURATION_FACTOR = 1.4

/**
 * Der Bogen eines Teils, der die Seite wechselt: So viele Pixel hebt er sich mindestens über die gerade Linie, je
 * Pixel Weg zur Seite kommt etwas dazu, höchstens bis zur Obergrenze.
 */
const ARC_MIN_LIFT_PIXELS = 22
const ARC_LIFT_PER_PIXEL = 0.18
const ARC_MAX_LIFT_PIXELS = 80

/** Die Klasse des Rahmens, in dem die Bibliothek MathLive ihre Formeln setzt; ihr CSS gilt nur darin. */
const TYPESETTING_FRAME_CLASS_NAME = 'ML__latex'

/** An diesen Attributen hängt, was nur am Original stehen darf; die wandernde Kopie trägt sie nicht. */
const ORIGINAL_ONLY_ATTRIBUTES = ['data-id', 'data-cancelled']

/** Ein Teil, der wandert: von seiner Quelle an die Stelle seines Ziels, gerade oder auf einem Bogen. */
export type Flight = {
  sourceElement: HTMLElement
  targetElement: HTMLElement
  onArc: boolean
}

/** Alles, was beim Abspielen EINES Übergangs geschieht; die Elemente stehen schon im Dokument. */
export type FlightPlan = {
  /** Was zuerst aufleuchtet (die Notiz der Umformung); `null` ohne. */
  causeElement: HTMLElement | null
  /** Die Teile, durch die der Strich gezogen wird. */
  cancelledElements: HTMLElement[]
  /** Was danach erscheint (die Zeile der nächsten Gleichung). */
  appearingElement: HTMLElement
  flights: Flight[]
}

/**
 * Der Ablauf eines Abspielens als Anteile seiner Dauer: Erst leuchtet die Notiz der Umformung auf, dann wird
 * durchgestrichen, was sie kürzt, dann erscheint die neue Zeile, und die Teile wandern los, kommen an und gehen in die
 * Teile der neuen Zeile über.
 */
type FlightTimeline = {
  totalMilliseconds: number
  causeAppeared: number
  strikeDrawn: number
  rowAppeared: number
  termLanded: number
}

/**
 * Zeigt, was bei einem Übergang mit den Teilen geschieht (Nutzer 2026-11-27: Die Bewegung soll die Rechenregel
 * einprägen, nicht bloß etwas bewegen): Erst leuchtet auf, was den Übergang auslöst; was gekürzt wird, wird
 * durchgestrichen; dann erscheint das Neue, und jeder wandernde Teil gleitet als Kopie von seiner Quelle an sein Ziel,
 * gerade oder auf einem Bogen. Sieht er am Ziel anders aus, blendet die Kopie beim Ankommen in das neue Aussehen über.
 *
 * Reines DOM, kein React, und ohne Wissen über Gleichungen: Der Animator bekommt die fertigen Elemente ({@link
 * FlightPlan}) und legt die Kopien in die Ebene, die er bekommt (ein Element mit `position: relative`, in dem alle
 * Beteiligten stehen). Für ein Abspielen ein Animator.
 */
export class FlightAnimator {
  private readonly flightLayer: HTMLElement

  private readonly runningAnimations: Animation[] = []

  private readonly carrierElements: HTMLElement[] = []

  constructor(flightLayer: HTMLElement) {
    this.flightLayer = flightLayer
  }

  /** Spielt den Übergang ab. */
  startFlight(flightPlan: FlightPlan, durationMilliseconds: number) {
    const cancellationShown = flightPlan.cancelledElements.length > 0
    const timeline = this.createTimeline(durationMilliseconds, cancellationShown)
    if (flightPlan.causeElement !== null) {
      this.fadeIn(flightPlan.causeElement, 0, timeline.causeAppeared, timeline)
    }
    for (const cancelledElement of flightPlan.cancelledElements) {
      this.drawStrike(cancelledElement, timeline)
    }
    this.fadeIn(flightPlan.appearingElement, timeline.strikeDrawn, timeline.rowAppeared, timeline)
    for (const flight of flightPlan.flights) {
      this.flyPart(flight.sourceElement, flight.targetElement, flight.onArc, timeline)
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
    // ohne Kürzen: Das Durchstreichen hat keine eigene Zeit, die Teile wandern los, sobald die Notiz aufgeleuchtet ist
    return { totalMilliseconds: durationMilliseconds, causeAppeared: 0.18, strikeDrawn: 0.18, rowAppeared: 0.5, termLanded: 0.86 }
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
   * Zieht den Strich durch einen gekürzten Teil: Der Strich (das `::after` des Elements, animation.css) ist erst verdeckt
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
   * Lässt eine Kopie des Teils von der Quelle an die Stelle des Ziels wandern; das Ziel erscheint erst, wenn sie
   * ankommt. Die Kopie steckt in einem Träger: Der Träger bewegt sie zur Seite, die Kopie selbst bewegt sich in der
   * Höhe. So entsteht für einen Seitenwechsel ein Bogen (erst hoch, dann hinunter), sonst eine gerade Linie.
   */
  private flyPart(sourceElement: HTMLElement, targetElement: HTMLElement, onArc: boolean, timeline: FlightTimeline) {
    const layerRect = this.flightLayer.getBoundingClientRect()
    const sourceRect = sourceElement.getBoundingClientRect()
    const targetRect = targetElement.getBoundingClientRect()
    const sourceStyle = window.getComputedStyle(sourceElement)

    // Der Träger liegt genau über der Quelle
    const carrierLeft = sourceRect.left - layerRect.left - this.flightLayer.clientLeft + this.flightLayer.scrollLeft
    const carrierTop = sourceRect.top - layerRect.top - this.flightLayer.clientTop + this.flightLayer.scrollTop
    const carrierElement = document.createElement('span')
    carrierElement.className = 'animation-flight-carrier'
    carrierElement.style.left = carrierLeft + 'px'
    carrierElement.style.top = carrierTop + 'px'
    carrierElement.style.width = sourceRect.width + 'px'
    carrierElement.style.height = sourceRect.height + 'px'

    // Die Kopie in Schrift und Größe der Quelle (in einem Exponenten ist sie kleiner)
    const ghostElement = document.createElement('span')
    ghostElement.className = 'animation-flight-ghost'
    ghostElement.style.fontFamily = sourceStyle.fontFamily
    ghostElement.style.fontSize = sourceStyle.fontSize
    ghostElement.style.color = sourceStyle.color
    // Der Satz der Bibliothek gilt nur innerhalb ihres Rahmens (`ML__latex`): Ohne ihn zerfiele z. B. ein Bruch
    const typesettingElement = document.createElement('span')
    typesettingElement.className = TYPESETTING_FRAME_CLASS_NAME
    const copyElement = sourceElement.cloneNode(true) as HTMLElement
    this.removeOriginalOnlyAttributes(copyElement)
    copyElement.classList.add('animation-flight-copy')
    typesettingElement.append(copyElement)
    ghostElement.append(typesettingElement)
    carrierElement.append(ghostElement)
    this.flightLayer.append(carrierElement)
    this.carrierElements.push(carrierElement)

    // Eine gesetzte Formel sitzt nicht von selbst an derselben Stelle wie ihr Original (Brüche, Indizes haben ihre
    // eigene Grundlinie): nachmessen und die Kopie genau über das Original schieben
    const copyRect = copyElement.getBoundingClientRect()
    const copyShiftX = sourceRect.left - copyRect.left
    const copyShiftY = sourceRect.top - copyRect.top
    copyElement.style.left = copyShiftX + 'px'
    copyElement.style.top = copyShiftY + 'px'

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

  /** Nimmt der Kopie alles, was nur das Original tragen darf (ihre id, den Strich), auch in ihrem Inneren. */
  private removeOriginalOnlyAttributes(copyElement: HTMLElement) {
    for (const attributeName of ORIGINAL_ONLY_ATTRIBUTES) {
      copyElement.removeAttribute(attributeName)
      const innerElements = copyElement.querySelectorAll('[' + attributeName + ']')
      for (const innerElement of innerElements) {
        innerElement.removeAttribute(attributeName)
      }
    }
  }
}
