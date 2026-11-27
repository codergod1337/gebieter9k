import { Link, useLocation } from 'react-router'
import { Hoverlay } from '../../components/Hoverlay.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getEquationHash } from '../equationAnchor.ts'
import { useInlineReferences } from './InlineReferenceContext.ts'
import { INLINE_TEXTS } from './inlineTexts.ts'

type EquationReferenceLinkProps = {
  /** Die feste Kennung der Gleichung, auf die der Text verweist. */
  equationGuid: string
}

/**
 * Ein Verweis im Text auf eine Gleichung desselben Inhalts (Nutzer 2026-11-27: „gleichungen referenzieren BENÖTIGEN
 * WIR“): Gezeigt wird ihre Nummer in Klammern, so wie sie gerade ist, auch wenn weiter oben eine Gleichung dazukommt.
 * Ein Klick führt zu ihr (der Anker `#eq-<guid>` in der Adresse); „Zurück“ im Browser bringt einen wieder an die
 * Stelle, an der man gelesen hat. Steht die Gleichung nicht in diesem Inhalt, führt der Verweis als „(↗)“ über ihre
 * GUID zu der Seite, auf der sie steht, sofern der Ort des Inhalts so einen Sprung kennt; sonst steht „(?)“ da und sagt
 * beim Zeigen, warum.
 */
export function EquationReferenceLink({ equationGuid }: EquationReferenceLinkProps) {
  const inlineReferences = useInlineReferences()
  const location = useLocation()
  const equationNumber = inlineReferences.getEquationNumber(equationGuid)
  if (equationNumber === null) {
    // nicht in diesem Inhalt: Wo es geht, führt der Verweis über die GUID zur Seite, auf der die Gleichung steht
    const foreignEquationPath = inlineReferences.getForeignEquationPath(equationGuid)
    if (foreignEquationPath !== null) {
      return (
        <Hoverlay text={getTextInCurrentLanguage(INLINE_TEXTS.equationReferenceForeign)}>
          <Link className="blockcontent-equation-reference" to={foreignEquationPath}>
            (↗)
          </Link>
        </Hoverlay>
      )
    }
    return (
      <Hoverlay text={getTextInCurrentLanguage(INLINE_TEXTS.equationReferenceMissing)}>
        <span className="blockcontent-equation-reference-missing">(?)</span>
      </Hoverlay>
    )
  }
  const equationHash = getEquationHash(equationGuid)
  return (
    <Link className="blockcontent-equation-reference" to={{ search: location.search, hash: equationHash }} state={location.state}>
      ({equationNumber})
    </Link>
  )
}
