import type { ReactNode } from 'react'
import Button from 'react-bootstrap/Button'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'

type EditorCardProps = {
  /** Was die Karte ist, z. B. „ContentBox“ oder „Gleichung (3)“. */
  kindLabel: string
  /** Rechts neben der Art, z. B. das Feld für den Titel. */
  header?: ReactNode
  /** Verschieben und Entfernen; fehlen sie, steht die Karte fest (z. B. die Größen). */
  onMoveUp?: () => void
  onMoveDown?: () => void
  onRemove?: () => void
  children: ReactNode
}

/**
 * Der Rahmen einer Karte im Editor: oben, was sie ist, daneben ihr Kopf (z. B. der Titel) und rechts die Knöpfe zum
 * Verschieben und Entfernen; darunter ihre Felder. Für Bausteine wie für ihre Teile.
 */
export function EditorCard({ kindLabel, header, onMoveUp, onMoveDown, onRemove, children }: EditorCardProps) {
  return (
    <section className="blockcontent-editor-card">
      <div className="blockcontent-editor-card-header">
        <span className="blockcontent-editor-card-kind">{kindLabel}</span>
        <div className="blockcontent-editor-card-head">{header}</div>
        <EditorRowButtons onMoveUp={onMoveUp} onMoveDown={onMoveDown} onRemove={onRemove} />
      </div>
      <div className="blockcontent-editor-card-body">{children}</div>
    </section>
  )
}

type EditorRowButtonsProps = {
  onMoveUp?: () => void
  onMoveDown?: () => void
  onRemove?: () => void
}

/** Die kleinen Knöpfe einer Karte oder Zeile: nach oben, nach unten, entfernen; jeder nur, wenn es ihn gibt. */
export function EditorRowButtons({ onMoveUp, onMoveDown, onRemove }: EditorRowButtonsProps) {
  return (
    <span className="blockcontent-editor-row-buttons">
      {onMoveUp !== undefined && (
        <Button
          size="sm"
          variant="outline-secondary"
          className="control-button"
          aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.moveUp)}
          onClick={onMoveUp}>
          <i className="bi bi-arrow-up"></i>
        </Button>
      )}
      {onMoveDown !== undefined && (
        <Button
          size="sm"
          variant="outline-secondary"
          className="control-button"
          aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.moveDown)}
          onClick={onMoveDown}>
          <i className="bi bi-arrow-down"></i>
        </Button>
      )}
      {onRemove !== undefined && (
        <Button
          size="sm"
          variant="outline-danger"
          className="control-button"
          aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.remove)}
          onClick={onRemove}>
          <i className="bi bi-x-lg"></i>
        </Button>
      )}
    </span>
  )
}

type EditorAddButtonProps = {
  label: string
  onClick: () => void
}

/** Ein Knopf „+ Absatz“, „+ Zeile“ usw.: hängt ein neues Stück an. */
export function EditorAddButton({ label, onClick }: EditorAddButtonProps) {
  return (
    <Button size="sm" variant="outline-primary" className="blockcontent-editor-add" onClick={onClick}>
      <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
      {label}
    </Button>
  )
}
