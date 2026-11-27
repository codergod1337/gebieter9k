import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { FormulaView } from '../formula/FormulaView.tsx'
import type { InlineNode } from './InlineNode.ts'

type InlineTextViewProps = {
  nodes: InlineNode[]
}

/** Nur solche Adressen werden zu einem Link; alles andere bleibt Text. Innerhalb der App beginnt eine Adresse mit `/`. */
const EXTERNAL_ADDRESS_PREFIXES = ['https://', 'http://', 'mailto:']
const INTERNAL_ADDRESS_PREFIX = '/'

/** Ein Satzzeichen direkt hinter einer Formel bleibt an ihr hängen: Die Zeile bricht nicht dazwischen um. */
const TRAILING_PUNCTUATION_PATTERN = /^[.,;:!?)]+/

/**
 * Zeichnet einen Text mit Auszeichnung: fett, kursiv, Links und Formeln mitten im Satz. Kein HTML wird eingesetzt, jedes
 * Stück ist ein eigenes Element. Ein Link innerhalb der App bleibt in der App, ein Link nach außen öffnet ein neues
 * Fenster und gibt die Herkunft nicht weiter.
 */
export function InlineTextView({ nodes }: InlineTextViewProps) {
  function renderNode(node: InlineNode, nodeIndex: number, siblingNodes: InlineNode[]): ReactNode {
    switch (node.type) {
      case 'TEXT': {
        // das Satzzeichen am Anfang hat die Formel davor schon mitgenommen
        const previousNode = nodeIndex > 0 ? siblingNodes[nodeIndex - 1] : null
        if (previousNode !== null && previousNode.type === 'FORMULA') {
          return node.text.replace(TRAILING_PUNCTUATION_PATTERN, '')
        }
        return node.text
      }
      case 'BOLD':
        return <strong key={nodeIndex}>{node.children.map(renderNode)}</strong>
      case 'ITALIC':
        return <em key={nodeIndex}>{node.children.map(renderNode)}</em>
      case 'LINK': {
        const label = node.children.map(renderNode)
        const isInternal = node.address.startsWith(INTERNAL_ADDRESS_PREFIX) && !node.address.startsWith('//')
        if (isInternal) {
          return (
            <Link key={nodeIndex} to={node.address}>
              {label}
            </Link>
          )
        }
        const isExternal = EXTERNAL_ADDRESS_PREFIXES.some((prefix) => node.address.toLowerCase().startsWith(prefix))
        if (isExternal) {
          return (
            <a key={nodeIndex} href={node.address} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          )
        }
        return <span key={nodeIndex}>{label}</span>
      }
      case 'FORMULA': {
        let trailingPunctuation = ''
        const followingNode = nodeIndex + 1 < siblingNodes.length ? siblingNodes[nodeIndex + 1] : null
        if (followingNode !== null && followingNode.type === 'TEXT') {
          const punctuationMatch = TRAILING_PUNCTUATION_PATTERN.exec(followingNode.text)
          if (punctuationMatch !== null) {
            trailingPunctuation = punctuationMatch[0]
          }
        }
        return (
          <span key={nodeIndex} className="blockcontent-inline-formula">
            <FormulaView latex={node.latex} displayMode="INLINE" />
            {trailingPunctuation}
          </span>
        )
      }
    }
  }

  return <>{nodes.map(renderNode)}</>
}
