import { EquationAnimationReader } from './animation/EquationAnimationReader.ts'
import { ElementReader } from './elements/ElementReader.ts'
import { requireObject } from './elements/jsonValues.ts'
import type { BlockContent } from './BlockContent.ts'
import { BlockContentError } from './BlockContentError.ts'

/**
 * Liest einen Inhalt: Aus dem gespeicherten JSON-Text (bei einer Wissensseite das Feld `content` ihres Solr-Dokuments)
 * wird der Inhalt zum Zeichnen ({@link BlockContent}). Das Format (Fassung 2) steht in `docu/blockcontent.md`. Der Leser
 * setzt nur zusammen: Die Elemente liest der {@link ElementReader}, die Animationen der {@link EquationAnimationReader}.
 * Passt etwas nicht, kommt ein {@link BlockContentError} mit der Stelle im JSON.
 */
export class BlockContentReader {
  /**
   * Liest den ganzen Inhalt.
   *
   * @throws BlockContentError wenn der Text kein JSON ist oder nicht dem Format entspricht
   */
  readContent(contentText: string): BlockContent {
    let parsedContent: unknown
    try {
      parsedContent = JSON.parse(contentText)
    } catch {
      throw new BlockContentError('Der Inhalt ist kein gültiges JSON.')
    }
    const contentObject = requireObject(parsedContent, 'content')
    const elementReader = new ElementReader()
    const elements = elementReader.readTopLevelElements(contentObject.elements, 'elements')
    const equations = elementReader.getEquations()
    const equationAnimationReader = new EquationAnimationReader()
    const animations = equationAnimationReader.readAnimations(contentObject.animations, 'animations')
    return { elements, equations, animations }
  }
}
