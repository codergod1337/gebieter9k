import { useUrlParam } from '../../navigation/useUrlParam.ts'
import type { Derivation } from './Derivation.ts'

/** Rückmeldung von {@link useDerivationPathVisibility}: ob der Rechenweg einer Herleitung zu sehen ist. */
export type DerivationPathVisibility = {
  /** `false`: Zu sehen sind nur Ausgang und Ergebnis. `true`: der ganze Rechenweg mit allen Umformungen. */
  pathShown: boolean
  showPath: () => void
  hidePath: () => void
}

/** Die Endung des Parameters in der Adresse und sein Wert, z. B. `xCoordinatePath=shown`. */
const PATH_URL_PARAM_SUFFIX = 'Path'
const PATH_SHOWN_URL_VALUE = 'shown'

/**
 * Ob der Rechenweg einer Herleitung eingeblendet ist. Der Zustand steht in der Adresse (`<Kennung>Path=shown`), damit
 * Neuladen und ein weitergegebener Link dieselbe Ansicht zeigen; ausgeblendet lässt den Parameter weg. Ein- und
 * Ausblenden ersetzen den Eintrag im Verlauf (REPLACE): Es ist ein Aufklappen innerhalb der Seite, „Zurück“ im Browser
 * soll die Seite verlassen und nicht Kasten für Kasten zuklappen.
 */
export function useDerivationPathVisibility(derivation: Derivation): DerivationPathVisibility {
  const pathUrlParamName = derivation.key + PATH_URL_PARAM_SUFFIX
  const pathUrlParam = useUrlParam(pathUrlParamName)
  const pathShown = pathUrlParam.value === PATH_SHOWN_URL_VALUE

  function showPath() {
    pathUrlParam.changeValue(PATH_SHOWN_URL_VALUE, 'REPLACE')
  }

  function hidePath() {
    pathUrlParam.changeValue(null, 'REPLACE')
  }

  return { pathShown, showPath, hidePath }
}
