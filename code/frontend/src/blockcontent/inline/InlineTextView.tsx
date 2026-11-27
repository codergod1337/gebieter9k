import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Hoverlay } from '../../components/Hoverlay.tsx'
import { MathTermView } from '../math/MathTermView.tsx'
import type { InlineNode } from './InlineNode.ts'

type InlineTextViewProps = {
  nodes: InlineNode[]
}

/** Nur solche Adressen werden zu einem Link; alles andere bleibt Text. Innerhalb der App beginnt eine Adresse mit `/`. */
const EXTERNAL_ADDRESS_PREFIXES = ['https://', 'http://', 'mailto:']
const INTERNAL_ADDRESS_PREFIX = '/'

/**
 * Zeichnet einen Text mit Auszeichnung: fett, kursiv, Links und Formeln mitten im Satz. Kein HTML wird eingesetzt, jedes
 * Stück ist ein eigenes Element. Ein Link innerhalb der App bleibt in der App, ein Link nach außen öffnet ein neues
 * Fenster und gibt die Herkunft nicht weiter.
 */
export function InlineTextView({ nodes }: InlineTextViewProps) {
  function renderNode(node: InlineNode, nodeIndex: number): ReactNode {
    switch (node.type) {
      case 'TEXT':
        return node.text
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
      case 'FORMULA':
        return (
          <span key={nodeIndex} className="math blockcontent-inline-formula">
            <MathTermView term={node.term} />
          </span>
        )
      case 'PROBLEM':
        return (
          <Hoverlay key={nodeIndex} text={node.message}>
            <span className="blockcontent-inline-problem">{node.text}</span>
          </Hoverlay>
        )
    }
  }

  return <>{nodes.map(renderNode)}</>
}
