import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useUrlParamsChanger } from './useUrlParam.ts'

/** So lange nach der letzten Taste schreibt das Feld seinen Text in die Adresse, wie die Tipp-Pause der Vorlage. */
const URL_TEXT_WRITE_DELAY_MILLISECONDS = 250

/** Rückmeldung von {@link useUrlTextParam}. */
export type UrlTextParam = {
  /** Der Text im Feld, sofort bei jeder Taste. Danach filtern, was im Browser gefiltert wird. */
  text: string
  /** Der Text in der Adresse, erst nach der Tipp-Pause. Danach fragen, was das Backend fragt. */
  urlText: string
  changeText: (changedText: string) => void
}

/**
 * Ein Suchfeld, dessen Text in der Adresse steht (z. B. `?q=drache`): Das Feld reagiert sofort, die Adresse folgt nach
 * der Tipp-Pause und ersetzt dabei den Eintrag im Verlauf (Zurück führt nicht durch jede Taste). Ändert sich die Adresse
 * von außen (Zurück, Vor, ein Link), übernimmt das Feld ihren Text.
 */
export function useUrlTextParam(name: string): UrlTextParam {
  const [searchParams] = useSearchParams()
  const changeUrlParams = useUrlParamsChanger()
  const urlText = searchParams.get(name) ?? ''
  const [text, setText] = useState<string>(urlText)
  /** Was zuletzt in der Adresse stand oder von hier hineingeschrieben wurde. */
  const knownUrlTextRef = useRef<string>(urlText)

  // Die Adresse hat sich von außen geändert: Das Feld übernimmt ihren Text
  useEffect(() => {
    if (urlText === knownUrlTextRef.current) {
      return
    }
    knownUrlTextRef.current = urlText
    setText(urlText)
  }, [urlText])

  // Getippt: nach der Pause in die Adresse, als Ersatz des Eintrags
  useEffect(() => {
    if (text === knownUrlTextRef.current) {
      return
    }
    const writeTimer = window.setTimeout(() => {
      knownUrlTextRef.current = text
      changeUrlParams({ [name]: text }, 'REPLACE')
    }, URL_TEXT_WRITE_DELAY_MILLISECONDS)
    return () => window.clearTimeout(writeTimer)
  }, [text, name, changeUrlParams])

  return { text, urlText, changeText: setText }
}
