import type { ReactNode } from 'react'
import Alert from 'react-bootstrap/Alert'
import { ContentBox } from '../components/ContentBox.tsx'
import { EquationView } from './math/EquationView.tsx'
import type { BoxBlock, BoxPart, EquationsPart } from './BlockContent.ts'
import { InlineTextView } from './inline/InlineTextView.tsx'
import { SketchContentView } from './SketchContentView.tsx'

type BoxBlockViewProps = {
  boxBlock: BoxBlock
}

/**
 * Ein Kasten eines Inhalts aus Bausteinen: seine Teile untereinander. Absätze und Listen, die aufeinander folgen, bilden
 * einen Textblock; Gleichungsgruppen, die aufeinander folgen, stehen nebeneinander (z. B. „von polar nach kartesisch“
 * neben „von kartesisch nach polar“); ein Hinweis steht für sich. Hat der Kasten eine Skizze, steht sie neben den
 * Teilen, in einer schmalen Spalte darunter. Text trägt seine Auszeichnung (fett, kursiv, Links, Formeln im Satz).
 */
export function BoxBlockView({ boxBlock }: BoxBlockViewProps) {
  function renderEquationsPart(equationsPart: EquationsPart, partIndex: number): ReactNode {
    return (
      <section key={partIndex} className="blockcontent-equations-group">
        {equationsPart.heading !== null && <h3 className="blockcontent-equations-heading">{equationsPart.heading}</h3>}
        {equationsPart.equations.map((equation, equationIndex) => (
          <div key={equationIndex} className="blockcontent-equation">
            <EquationView equation={equation} />
          </div>
        ))}
      </section>
    )
  }

  // Teile derselben Art, die aufeinander folgen, kommen in einen gemeinsamen Rahmen
  const partGroups: ReactNode[] = []
  let textRun: ReactNode[] = []
  let equationsRun: ReactNode[] = []

  function closeRuns(groupKey: string) {
    if (textRun.length > 0) {
      partGroups.push(
        <div key={groupKey + '-text'} className="blockcontent-text">
          {textRun}
        </div>,
      )
      textRun = []
    }
    if (equationsRun.length > 0) {
      partGroups.push(
        <div key={groupKey + '-equations'} className="blockcontent-equations">
          {equationsRun}
        </div>,
      )
      equationsRun = []
    }
  }

  boxBlock.parts.forEach((part: BoxPart, partIndex) => {
    const groupKey = String(partIndex)
    // ein leerer Absatz oder Hinweis (im Editor noch nicht gefüllt) wird nicht gezeichnet
    const emptyText = (part.type === 'PARAGRAPH' || part.type === 'HINT') && part.text.trim() === ''
    if (emptyText) {
      return
    }
    if (part.type === 'PARAGRAPH') {
      if (equationsRun.length > 0) {
        closeRuns(groupKey)
      }
      textRun.push(
        <p key={partIndex}>
          <InlineTextView nodes={part.inlines} />
        </p>,
      )
      return
    }
    if (part.type === 'LIST') {
      if (equationsRun.length > 0) {
        closeRuns(groupKey)
      }
      const listItems = part.items.map((itemInlines, itemIndex) => (
        <li key={itemIndex}>
          <InlineTextView nodes={itemInlines} />
        </li>
      ))
      if (part.ordered) {
        textRun.push(<ol key={partIndex}>{listItems}</ol>)
      } else {
        textRun.push(<ul key={partIndex}>{listItems}</ul>)
      }
      return
    }
    if (part.type === 'EQUATIONS') {
      if (textRun.length > 0) {
        closeRuns(groupKey)
      }
      const equationsNode = renderEquationsPart(part, partIndex)
      equationsRun.push(equationsNode)
      return
    }
    closeRuns(groupKey)
    partGroups.push(
      <Alert key={groupKey + '-hint'} variant="warning" className="blockcontent-hint">
        <InlineTextView nodes={part.inlines} />
      </Alert>,
    )
  })
  closeRuns('end')

  if (boxBlock.sketch === null) {
    return (
      <ContentBox title={boxBlock.title}>
        <div className="blockcontent-parts">{partGroups}</div>
      </ContentBox>
    )
  }
  return (
    <ContentBox title={boxBlock.title}>
      <div className="blockcontent-box-with-sketch">
        <div className="blockcontent-parts">{partGroups}</div>
        <SketchContentView sketch={boxBlock.sketch} />
      </div>
    </ContentBox>
  )
}
