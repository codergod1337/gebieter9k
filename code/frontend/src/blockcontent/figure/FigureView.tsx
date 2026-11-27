import { useEffect, useRef, useState } from 'react'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import type { FigureBoundingBox } from './FigureBoundingBox.ts'
import { FIGURE_TEXTS } from './figureTexts.ts'

type FigureViewProps = {
  /** Die Figur als Text in der Sprache der Zeichenbibliothek (JessieCode). */
  code: string
  boundingBox: FigureBoundingBox
  /** Breite geteilt durch Höhe des Felds, z. B. 2 für doppelt so breit wie hoch. */
  aspectRatio: number
}

/**
 * Die Bibliothek schreibt die spitzen Klammern und das Und-Zeichen in ihren Fehlermeldungen so, wie HTML sie braucht
 * (`&lt;`, `&gt;`, `&amp;`). Die Meldung wird hier als reiner Text gezeigt, also wieder als die Zeichen selbst.
 */
function readPlainMessage(libraryMessage: string): string {
  const withLessThan = libraryMessage.replaceAll('&lt;', '<')
  const withGreaterThan = withLessThan.replaceAll('&gt;', '>')
  return withGreaterThan.replaceAll('&amp;', '&')
}

/** Das Stück der App mit der Zeichenbibliothek; es wird erst geladen, wenn die erste Figur erscheint. */
type FigureModule = typeof import('./JsxGraphFigureModule.ts')

/**
 * Zeigt eine Figur: DIE Anzeige jeder Skizze und jedes Plots der App (Nutzer 2026-11-27: „spektrallinien einzeichnen
 * … bolzmannverteilung plotten … efeld … ortskurve eines pendels … doppelspaltexperiment“). Gezeichnet wird mit der
 * Bibliothek JSXGraph; die Figur ist ein Text in deren eigener Sprache (JessieCode), z. B.
 * `functiongraph(function (x) { return sin(x); });`. Diese Sprache kennt Punkte, Strecken, Winkel, Kurven,
 * Funktionsgraphen, Vektorfelder, Regler, Schleifen und Bedingungen, aber weder das Dokument noch das Fenster: Ein Text
 * aus dem Inhalt kann die Seite nicht verändern.
 *
 * Das Mausrad und das Ziehen verschieben die Figur nicht: Über einer Figur rollt weiter die Seite. Lässt sich der Text
 * nicht lesen, steht unter dem (dann leeren) Feld der Grund; der Rest des Inhalts bleibt, wie er ist.
 */
export function FigureView({ code, boundingBox, aspectRatio }: FigureViewProps) {
  const [figureModule, setFigureModule] = useState<FigureModule | null>(null)
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null)
  const [codeProblem, setCodeProblem] = useState<string | null>(null)
  const boardContainerRef = useRef<HTMLDivElement>(null)
  const left = boundingBox.left
  const top = boundingBox.top
  const right = boundingBox.right
  const bottom = boundingBox.bottom

  // das Stück mit der Zeichenbibliothek nachladen
  useEffect(() => {
    let stillShown = true
    import('./JsxGraphFigureModule.ts')
      .then((loadedModule) => {
        if (stillShown) {
          setFigureModule(loadedModule)
        }
      })
      .catch((caughtError: unknown) => {
        if (stillShown) {
          setLoadErrorMessage(String(caughtError))
        }
      })
    return () => {
      stillShown = false
    }
  }, [])

  // die Figur zeichnen; ändert sich ihr Text oder ihr Ausschnitt, entsteht sie neu
  useEffect(() => {
    const boardContainer = boardContainerRef.current
    if (figureModule === null || boardContainer === null) {
      return
    }
    const JXG = figureModule.JXG
    const board = JXG.JSXGraph.initBoard(boardContainer, {
      boundingbox: [left, top, right, bottom],
      axis: false,
      showCopyright: false,
      showNavigation: false,
      keepAspectRatio: false,
      // über einer Figur rollt die Seite; nichts verschiebt oder vergrößert den Ausschnitt
      zoom: { wheel: false, pinchHorizontal: false, pinchVertical: false },
      pan: { enabled: false, needShift: true, needTwoFingers: true },
    })
    let problem: string | null = null
    try {
      board.jc.parse(code)
    } catch (caughtError) {
      problem = String(caughtError)
      if (caughtError instanceof Error) {
        problem = caughtError.message
      }
    }
    if (problem !== null) {
      problem = readPlainMessage(problem)
    }
    setCodeProblem(problem)
    return () => {
      JXG.JSXGraph.freeBoard(board)
    }
  }, [figureModule, code, left, top, right, bottom])

  let problemText: string | null = null
  if (loadErrorMessage !== null) {
    problemText = getTextInCurrentLanguageWithValues(FIGURE_TEXTS.loadFailed, { reason: loadErrorMessage })
  } else if (codeProblem !== null) {
    problemText = getTextInCurrentLanguageWithValues(FIGURE_TEXTS.codeProblem, { reason: codeProblem })
  }
  return (
    <div className="figure">
      <div ref={boardContainerRef} className="figure-board jxgbox" style={{ aspectRatio: String(aspectRatio) }}></div>
      {problemText !== null && <pre className="figure-problem">{problemText}</pre>}
    </div>
  )
}
