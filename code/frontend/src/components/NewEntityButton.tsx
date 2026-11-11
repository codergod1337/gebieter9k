type NewEntityButtonProps = {
  /** Der Name im aufgeklappten Knopf, z. B. „neue FileClass“; auch für Screenreader. */
  label: string
  onClick: () => void
  disabled?: boolean
}

/**
 * Der Knopf zum Anlegen einer neuen Entity, immer rechts im Kopf einer ContentBox, wie der NewEntityButton der
 * Vorlage: Im Ruhezustand steht nur das Plus. Beim Zeigen darauf oder mit der Tastatur dreht sich das Plus, und der
 * Knopf fährt auseinander und zeigt den Namen (Nutzer 2026-11-09). Ein Eyecatcher, der zum Theme passen muss: Form,
 * Farben und Effekt bestimmt allein das Theme (`.new-entity-button` in `public/themes/<name>.css`), base.css enthält
 * dafür nichts. So kann ein anderes Theme ihn rund oder ganz anders gestalten. Global: für jeden Tab mit einer Tabelle.
 */
export function NewEntityButton({ label, onClick, disabled = false }: NewEntityButtonProps) {
  return (
    <button type="button" className="new-entity-button" onClick={onClick} disabled={disabled} aria-label={label}>
      <i className="bi bi-plus-lg" aria-hidden="true"></i>
      <span className="new-entity-button-text" aria-hidden="true">
        {label}
      </span>
    </button>
  )
}
