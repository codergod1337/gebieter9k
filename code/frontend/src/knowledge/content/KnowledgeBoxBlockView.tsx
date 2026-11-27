import type { ReactNode } from 'react'
import Alert from 'react-bootstrap/Alert'
import { ContentBox } from '../../components/ContentBox.tsx'
import { EquationView } from '../math/EquationView.tsx'
import type { KnowledgeBoxBlock, KnowledgeBoxPart, KnowledgeEquationsPart } from './KnowledgeContent.ts'
import { KnowledgeSketchView } from './KnowledgeSketchView.tsx'

type KnowledgeBoxBlockViewProps = {
  boxBlock: KnowledgeBoxBlock
}

/**
 * Ein Kasten einer Wissensseite: seine Teile untereinander. Absätze, die aufeinander folgen, bilden einen Textblock;
 * Gleichungsgruppen, die aufeinander folgen, stehen nebeneinander (z. B. „von polar nach kartesisch“ neben „von
 * kartesisch nach polar“); ein Hinweis steht für sich. Hat der Kasten eine Skizze, steht sie neben den Teilen, auf
 * schmalen Schirmen darunter.
 */
export function KnowledgeBoxBlockView({ boxBlock }: KnowledgeBoxBlockViewProps) {
  function renderEquationsPart(equationsPart: KnowledgeEquationsPart, partIndex: number): ReactNode {
    return (
      <section key={partIndex} className="knowledge-summary-group">
        {equationsPart.heading !== null && <h3 className="knowledge-summary-heading">{equationsPart.heading}</h3>}
        {equationsPart.equations.map((equation, equationIndex) => (
          <div key={equationIndex} className="knowledge-summary-equation">
            <EquationView equation={equation} />
          </div>
        ))}
      </section>
    )
  }

  // Teile derselben Art, die aufeinander folgen, kommen in einen gemeinsamen Rahmen
  const partGroups: ReactNode[] = []
  let paragraphRun: ReactNode[] = []
  let equationsRun: ReactNode[] = []

  function closeRuns(groupKey: string) {
    if (paragraphRun.length > 0) {
      partGroups.push(
        <div key={groupKey + '-text'} className="knowledge-text">
          {paragraphRun}
        </div>,
      )
      paragraphRun = []
    }
    if (equationsRun.length > 0) {
      partGroups.push(
        <div key={groupKey + '-equations'} className="knowledge-summary">
          {equationsRun}
        </div>,
      )
      equationsRun = []
    }
  }

  boxBlock.parts.forEach((part: KnowledgeBoxPart, partIndex) => {
    const groupKey = String(partIndex)
    if (part.type === 'PARAGRAPH') {
      if (equationsRun.length > 0) {
        closeRuns(groupKey)
      }
      paragraphRun.push(<p key={partIndex}>{part.text}</p>)
      return
    }
    if (part.type === 'EQUATIONS') {
      if (paragraphRun.length > 0) {
        closeRuns(groupKey)
      }
      const equationsNode = renderEquationsPart(part, partIndex)
      equationsRun.push(equationsNode)
      return
    }
    closeRuns(groupKey)
    partGroups.push(
      <Alert key={groupKey + '-hint'} variant="warning" className="knowledge-hint">
        {part.text}
      </Alert>,
    )
  })
  closeRuns('end')

  if (boxBlock.sketch === null) {
    return (
      <ContentBox title={boxBlock.title}>
        <div className="knowledge-parts">{partGroups}</div>
      </ContentBox>
    )
  }
  return (
    <ContentBox title={boxBlock.title}>
      <div className="knowledge-intro">
        <div className="knowledge-parts">{partGroups}</div>
        <KnowledgeSketchView sketch={boxBlock.sketch} />
      </div>
    </ContentBox>
  )
}
