import { useEffect, useRef } from 'react'
import { createSeededRandom } from '../components/seededRandom.ts'

/** Eine Farbe als Rot, Grün, Blau. */
type Rgb = [number, number, number]

/** Ein Punkt des Musters. */
type Point = [number, number]

/**
 * Ein Eckpunkt des Musters: wo er ruht und wie er driftet. Je Achse zwei überlagerte Schwingungen mit eigenen,
 * zufälligen Frequenzen und Phasen: So wandert der Punkt scheinbar frei umher und wiederholt sich praktisch nie.
 */
type DriftingPoint = {
  restX: number
  restY: number
  driftPixels: number
  frequenciesX: [number, number]
  frequenciesY: [number, number]
  phasesX: [number, number]
  phasesY: [number, number]
}

/** Alles, was ein Bild des Musters braucht; einmal je Größe und Seed gerechnet, dann nur noch bewegt. */
type CoverScene = {
  width: number
  height: number
  points: DriftingPoint[][]
  /** Je Dreieck ein fester Helligkeitsfaktor, damit beim Driften nichts flackert. */
  lightFactors: number[]
  fromColor: Rgb
  toColor: Rgb
  glowColor: Rgb
  glowX: number
  glowY: number
  /** So viele Sekunden braucht ein Punkt für eine Runde seiner Drift; 0: das Muster steht. */
  driftSeconds: number
}

/** Ohne Angabe im Theme: Kantenlänge eines Dreieck-Paars in Pixeln. */
const DEFAULT_CELL_PIXELS = 58

/** Ohne Angabe im Theme: so weit driftet ein Punkt höchstens aus seiner Ruhelage, in Pixeln. */
const DEFAULT_DRIFT_PIXELS = 24

/** Anteile der beiden Schwingungen je Achse: die langsame trägt mehr, die schnelle macht den Weg unruhig. */
const PRIMARY_WAVE_SHARE = 0.65
const SECONDARY_WAVE_SHARE = 0.35

/** Ohne Angabe im Theme: so viele Sekunden dauert eine Runde der Drift. */
const DEFAULT_DRIFT_SECONDS = 14

/** Höchstens so oft je Sekunde wird neu gezeichnet: Die Drift ist langsam, mehr sähe niemand, es kostete nur Akku. */
const FRAMES_PER_SECOND = 30

/** Liest eine Farbe (#rrggbb) aus einer CSS-Variablen. Fehlt sie oder ist sie kein Hex, gilt `fallback`. */
function readHexColor(element: Element, variableName: string, fallback: Rgb): Rgb {
  const computedStyle = getComputedStyle(element)
  const hexColor = computedStyle.getPropertyValue(variableName).trim()
  const hexMatch = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hexColor)
  if (hexMatch === null) {
    return fallback
  }
  const red = parseInt(hexMatch[1], 16)
  const green = parseInt(hexMatch[2], 16)
  const blue = parseInt(hexMatch[3], 16)
  return [red, green, blue]
}

/** Liest eine Zahl aus einer CSS-Variablen des Themes. Fehlt sie oder ist sie keine Zahl ab 0, gilt `fallback`. */
function readNumber(element: Element, variableName: string, fallback: number): number {
  const computedStyle = getComputedStyle(element)
  const numberText = computedStyle.getPropertyValue(variableName).trim()
  const parsedNumber = Number.parseFloat(numberText)
  if (!Number.isFinite(parsedNumber) || parsedNumber < 0) {
    return fallback
  }
  return parsedNumber
}

function mixColors(fromColor: Rgb, toColor: Rgb, share: number): Rgb {
  const red = fromColor[0] + (toColor[0] - fromColor[0]) * share
  const green = fromColor[1] + (toColor[1] - fromColor[1]) * share
  const blue = fromColor[2] + (toColor[2] - fromColor[2]) * share
  return [red, green, blue]
}

/**
 * Rechnet das Muster für diese Größe: ein Raster von Punkten, jeder aus dem Seed leicht versetzt und mit eigener Drift.
 * Farben, Dichte und Drift kommen aus dem Theme (`--profile-cover-*`), so sieht das Banner je Theme anders aus.
 */
function createCoverScene(canvas: HTMLCanvasElement, width: number, height: number, seed: string): CoverScene {
  const random = createSeededRandom(seed)
  const fromColor = readHexColor(canvas, '--profile-cover-from', [30, 41, 59])
  const toColor = readHexColor(canvas, '--profile-cover-to', [49, 46, 129])
  const glowColor = readHexColor(canvas, '--profile-cover-glow', [99, 102, 241])
  const cellPixels = Math.max(16, readNumber(canvas, '--profile-cover-cell-pixels', DEFAULT_CELL_PIXELS))
  const maximumDriftPixels = readNumber(canvas, '--profile-cover-drift-pixels', DEFAULT_DRIFT_PIXELS)
  const driftSeconds = readNumber(canvas, '--profile-cover-drift-seconds', DEFAULT_DRIFT_SECONDS)
  const glowX = width * (0.55 + random() * 0.35)
  const glowY = height * (0.15 + random() * 0.5)
  const columnCount = Math.ceil(width / cellPixels) + 3
  const rowCount = Math.ceil(height / cellPixels) + 3

  const points: DriftingPoint[][] = []
  for (let row = 0; row < rowCount; row++) {
    const rowPoints: DriftingPoint[] = []
    for (let column = 0; column < columnCount; column++) {
      const restX = (column - 1) * cellPixels + (random() - 0.5) * cellPixels * 0.85
      const restY = (row - 1) * cellPixels + (random() - 0.5) * cellPixels * 0.85
      const driftPixels = maximumDriftPixels * (0.5 + random() * 0.5)
      // die langsame Schwingung um das Tempo des Themes, die schnelle etwa doppelt so schnell, beide je Punkt verschieden
      const frequenciesX: [number, number] = [0.6 + random() * 0.8, 1.4 + random() * 1.2]
      const frequenciesY: [number, number] = [0.6 + random() * 0.8, 1.4 + random() * 1.2]
      const phasesX: [number, number] = [random() * Math.PI * 2, random() * Math.PI * 2]
      const phasesY: [number, number] = [random() * Math.PI * 2, random() * Math.PI * 2]
      rowPoints.push({ restX, restY, driftPixels, frequenciesX, frequenciesY, phasesX, phasesY })
    }
    points.push(rowPoints)
  }

  const triangleCount = (rowCount - 1) * (columnCount - 1) * 2
  const lightFactors: number[] = []
  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex++) {
    const lightFactor = 1 + (random() - 0.5) * 0.22
    lightFactors.push(lightFactor)
  }

  return { width, height, points, lightFactors, fromColor, toColor, glowColor, glowX, glowY, driftSeconds }
}

/** Ein Versatz auf einer Achse: zwei überlagerte Schwingungen, zusammen höchstens 1 (mal die Weite des Punkts). */
function getWaveOffset(angle: number, frequencies: [number, number], phases: [number, number]): number {
  const primaryWave = Math.sin(angle * frequencies[0] + phases[0])
  const secondaryWave = Math.sin(angle * frequencies[1] + phases[1])
  return primaryWave * PRIMARY_WAVE_SHARE + secondaryWave * SECONDARY_WAVE_SHARE
}

/** Wo ein Punkt zu dieser Zeit steht: frei umher um seine Ruhelage, höchstens seine Drift-Weite entfernt. */
function getDriftedPoint(driftingPoint: DriftingPoint, angle: number): Point {
  const offsetShareX = getWaveOffset(angle, driftingPoint.frequenciesX, driftingPoint.phasesX)
  const offsetShareY = getWaveOffset(angle, driftingPoint.frequenciesY, driftingPoint.phasesY)
  const offsetX = offsetShareX * driftingPoint.driftPixels
  const offsetY = offsetShareY * driftingPoint.driftPixels
  return [driftingPoint.restX + offsetX, driftingPoint.restY + offsetY]
}

/**
 * Zeichnet ein Bild des Musters beim Drift-Winkel `angle`: Low-Poly-Dreiecke in den Farben des Themes, wie in der
 * Vorlage, mit einem Leuchtpunkt. Die Farbe eines Dreiecks folgt seiner Mitte, beim Driften schimmert es deshalb leicht.
 */
function drawCoverScene(context: CanvasRenderingContext2D, scene: CoverScene, angle: number) {
  const driftedPoints: Point[][] = scene.points.map((rowPoints) =>
    rowPoints.map((driftingPoint) => getDriftedPoint(driftingPoint, angle)),
  )

  function drawTriangle(firstPoint: Point, secondPoint: Point, thirdPoint: Point, lightFactor: number) {
    const centerX = (firstPoint[0] + secondPoint[0] + thirdPoint[0]) / 3
    const centerY = (firstPoint[1] + secondPoint[1] + thirdPoint[1]) / 3
    const gradientShare = Math.min(1, Math.max(0, (centerX / scene.width) * 0.75 + (centerY / scene.height) * 0.25))
    const baseColor = mixColors(scene.fromColor, scene.toColor, gradientShare)
    const glowDistance = Math.hypot(centerX - scene.glowX, centerY - scene.glowY) / (scene.width * 0.55)
    const glowShare = Math.pow(Math.max(0, 1 - glowDistance), 2) * 0.6
    const glowingColor = mixColors(baseColor, scene.glowColor, glowShare)
    const red = Math.round(Math.min(255, glowingColor[0] * lightFactor))
    const green = Math.round(Math.min(255, glowingColor[1] * lightFactor))
    const blue = Math.round(Math.min(255, glowingColor[2] * lightFactor))
    const fillColor = 'rgb(' + red + ' ' + green + ' ' + blue + ')'

    context.beginPath()
    context.moveTo(firstPoint[0], firstPoint[1])
    context.lineTo(secondPoint[0], secondPoint[1])
    context.lineTo(thirdPoint[0], thirdPoint[1])
    context.closePath()
    context.fillStyle = fillColor
    // in derselben Farbe nachziehen, sonst bleiben zwischen den Dreiecken helle Haarlinien
    context.strokeStyle = fillColor
    context.lineWidth = 1
    context.fill()
    context.stroke()
    context.strokeStyle = 'rgb(255 255 255 / 0.05)'
    context.lineWidth = 0.6
    context.stroke()
  }

  let triangleIndex = 0
  const rowCount = driftedPoints.length
  for (let row = 0; row < rowCount - 1; row++) {
    const columnCount = driftedPoints[row].length
    for (let column = 0; column < columnCount - 1; column++) {
      const upperLeft = driftedPoints[row][column]
      const upperRight = driftedPoints[row][column + 1]
      const lowerLeft = driftedPoints[row + 1][column]
      const lowerRight = driftedPoints[row + 1][column + 1]
      drawTriangle(upperLeft, upperRight, lowerRight, scene.lightFactors[triangleIndex])
      drawTriangle(upperLeft, lowerRight, lowerLeft, scene.lightFactors[triangleIndex + 1])
      triangleIndex = triangleIndex + 2
    }
  }

  // unten leicht abdunkeln, damit der Streifen mit dem Profilbild ruhig steht
  const bottomShade = context.createLinearGradient(0, scene.height * 0.55, 0, scene.height)
  bottomShade.addColorStop(0, 'rgb(15 23 42 / 0)')
  bottomShade.addColorStop(1, 'rgb(15 23 42 / 0.35)')
  context.fillStyle = bottomShade
  context.fillRect(0, 0, scene.width, scene.height)
}

type ProfileCoverProps = {
  /** Woraus das Muster entsteht, z. B. die GUID des Users. */
  seed: string
  /** Wie schnell es driftet, als Faktor auf das Tempo des Themes: 1 wie im Theme, 0 steht still, 1.5 um die Hälfte schneller. */
  driftSpeedFactor: number
}

/**
 * Das Titelbild des Profils, solange es kein Banner gibt: ein gerechnetes Low-Poly-Muster auf einem Canvas, aus dem Seed
 * (dasselbe Profil sieht immer gleich aus) und den Variablen des Themes (Farben, Dichte, Drift). Die Eckpunkte driften
 * langsam (Nutzer 2026-11-09), so schnell, wie der Besitzer des Profils es eingestellt hat (`driftSpeedFactor`).
 * Gezeichnet wird höchstens {@link FRAMES_PER_SECOND} mal je Sekunde und nur, solange der Tab sichtbar ist. Wer im
 * System „Bewegung reduzieren“ eingestellt hat, ein Theme mit Drift 0 nutzt oder den Faktor 0 hat, sieht es still. Das
 * Tempo wird über die Zeit aufaddiert: Ändert es sich, läuft das Muster weich weiter, statt zu springen. Bei jeder
 * Größenänderung wird das Muster neu gerechnet.
 */
export function ProfileCover({ seed, driftSpeedFactor }: ProfileCoverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  /** Der aktuelle Faktor für die laufende Schleife, ohne sie bei jeder Änderung neu aufzubauen. */
  const driftSpeedFactorRef = useRef<number>(driftSpeedFactor)
  /** Startet die Schleife, wenn sie steht, aber laufen soll (z. B. der Faktor wechselt von 0 auf mehr). */
  const ensureRunningRef = useRef<() => void>(() => {})

  useEffect(() => {
    driftSpeedFactorRef.current = driftSpeedFactor
    ensureRunningRef.current()
  }, [driftSpeedFactor])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }
    const context = canvas.getContext('2d')
    if (context === null) {
      return
    }
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let scene: CoverScene | null = null
    let animationFrame = 0
    let running = false
    let lastDrawnMilliseconds = -Infinity
    /** Der aufaddierte Winkel der Drift und wann er zuletzt weitergezählt wurde. */
    let driftAngle = 0
    let lastAdvancedMilliseconds: number | null = null
    const frameMilliseconds = 1000 / FRAMES_PER_SECOND

    /** Rechnet das Muster für die aktuelle Größe und richtet das Canvas scharf für hochauflösende Bildschirme ein. */
    function prepareScene(drawingCanvas: HTMLCanvasElement, drawingContext: CanvasRenderingContext2D) {
      const canvasBox = drawingCanvas.getBoundingClientRect()
      const width = Math.max(1, Math.round(canvasBox.width))
      const height = Math.max(1, Math.round(canvasBox.height))
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      drawingCanvas.width = width * pixelRatio
      drawingCanvas.height = height * pixelRatio
      drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      scene = createCoverScene(drawingCanvas, width, height, seed)
    }

    function isMoving(): boolean {
      return scene !== null && scene.driftSeconds > 0 && driftSpeedFactorRef.current > 0 && !reducedMotionQuery.matches
    }

    /** Zählt den Winkel um die vergangene Zeit weiter, mit dem aktuellen Tempo. */
    function advanceDrift(nowMilliseconds: number) {
      if (scene === null || lastAdvancedMilliseconds === null || !isMoving()) {
        lastAdvancedMilliseconds = nowMilliseconds
        return
      }
      const elapsedSeconds = (nowMilliseconds - lastAdvancedMilliseconds) / 1000
      const turnsPerSecond = driftSpeedFactorRef.current / scene.driftSeconds
      driftAngle = driftAngle + elapsedSeconds * turnsPerSecond * Math.PI * 2
      lastAdvancedMilliseconds = nowMilliseconds
    }

    function drawFrame(nowMilliseconds: number) {
      if (scene === null || context === null) {
        return
      }
      drawCoverScene(context, scene, driftAngle)
      lastDrawnMilliseconds = nowMilliseconds
    }

    // Die Schleife: Der Browser ruft sie je Bild auf und hält sie in unsichtbaren Tabs selbst an
    function animate(nowMilliseconds: number) {
      if (nowMilliseconds - lastDrawnMilliseconds >= frameMilliseconds) {
        advanceDrift(nowMilliseconds)
        drawFrame(nowMilliseconds)
      }
      if (isMoving()) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        running = false
      }
    }

    function ensureRunning() {
      if (running || !isMoving()) {
        return
      }
      running = true
      lastAdvancedMilliseconds = performance.now()
      animationFrame = requestAnimationFrame(animate)
    }

    function restart() {
      if (canvas === null || context === null) {
        return
      }
      cancelAnimationFrame(animationFrame)
      running = false
      prepareScene(canvas, context)
      const nowMilliseconds = performance.now()
      drawFrame(nowMilliseconds)
      ensureRunning()
    }

    ensureRunningRef.current = ensureRunning

    const resizeObserver = new ResizeObserver(() => {
      restart()
    })
    resizeObserver.observe(canvas)
    reducedMotionQuery.addEventListener('change', restart)
    return () => {
      resizeObserver.disconnect()
      reducedMotionQuery.removeEventListener('change', restart)
      cancelAnimationFrame(animationFrame)
      ensureRunningRef.current = () => {}
    }
  }, [seed])

  return <canvas ref={canvasRef} className="profile-cover-canvas" aria-hidden="true" />
}
